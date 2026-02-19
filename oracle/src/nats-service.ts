import { connect, NatsConnection, JetStreamClient, JsMsg, AckPolicy, RetentionPolicy, StorageType } from 'nats';
import { SolanaService } from './solana';
import { transformMessageToUpdateDto } from './transformer';
import type { WebhookPayload } from './types';

/**
 * NATS Service for queue-based oracle updates
 * 
 * Listens for challenge updates on NATS queue, processes them,
 * and responds with success or failure
 */
export class NatsService {
  private nc: NatsConnection | null = null;
  private js: JetStreamClient | null = null;
  private solanaService: SolanaService;
  private natsUrl: string;
  private streamName: string = 'HYRO_CHALLENGES';
  private consumerName: string = 'oracle-consumer';
  private subjectName: string = 'hyro.challenge.update';

  constructor(solanaService: SolanaService, natsUrl: string) {
    this.solanaService = solanaService;
    this.natsUrl = natsUrl;
  }

  /**
   * Connect to NATS server and setup JetStream
   */
  async connect(): Promise<void> {
    console.log(`Connecting to NATS at ${this.natsUrl}...`);
    
    try {
      this.nc = await connect({ 
        servers: this.natsUrl,
        name: 'hyro-oracle',
      });
      
      console.log(`✅ Connected to NATS: ${this.nc.getServer()}`);
      
      // Get JetStream client
      this.js = this.nc.jetstream();
      
      // Setup stream and consumer
      await this.setupStream();
      
    } catch (error) {
      console.error('Failed to connect to NATS:', error);
      throw error;
    }
  }

  /**
   * Setup JetStream stream and consumer
   */
  private async setupStream(): Promise<void> {
    if (!this.js || !this.nc) {
      throw new Error('NATS connection not established');
    }

    const jsm = await this.nc.jetstreamManager();
    
    try {
      // Try to get existing stream
      await jsm.streams.info(this.streamName);
      console.log(`✅ Stream '${this.streamName}' already exists`);
    } catch (error) {
      // Stream doesn't exist, create it
      console.log(`Creating stream '${this.streamName}'...`);
      await jsm.streams.add({
        name: this.streamName,
        subjects: [this.subjectName],
        retention: RetentionPolicy.Workqueue, // Messages are removed after ack
        max_age: 86400_000_000_000, // 24 hours in nanoseconds
        storage: StorageType.File,
      });
      console.log(`✅ Stream '${this.streamName}' created`);
    }

    try {
      // Try to get existing consumer
      await jsm.consumers.info(this.streamName, this.consumerName);
      console.log(`✅ Consumer '${this.consumerName}' already exists`);
    } catch (error) {
      // Consumer doesn't exist, create it
      console.log(`Creating consumer '${this.consumerName}'...`);
      await jsm.consumers.add(this.streamName, {
        durable_name: this.consumerName,
        ack_policy: AckPolicy.Explicit,
        ack_wait: 60_000_000_000, // 60 seconds in nanoseconds
        max_deliver: 3,
        filter_subject: this.subjectName,
      });
      console.log(`✅ Consumer '${this.consumerName}' created`);
    }
  }

  /**
   * Start listening for challenge updates
   */
  async startListening(): Promise<void> {
    if (!this.js) {
      throw new Error('JetStream not initialized');
    }

    console.log(`\n🔄 Listening for challenge updates on '${this.subjectName}'...\n`);

    const consumer = await this.js.consumers.get(this.streamName, this.consumerName);
    
    // Process messages
    const messages = await consumer.consume();
    
    for await (const msg of messages) {
      await this.processMessage(msg);
    }
  }

  /**
   * Process a single message from the queue
   */
  private async processMessage(msg: JsMsg): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Parse message payload
      const payload: WebhookPayload = JSON.parse(msg.data.toString());
      
      console.log(`📨 Received challenge update: ${payload.challenge_id}`);
      
      // Acknowledge that we're processing this message
      msg.working();
      
      // Validate payload
      if (!payload.challenge_id) {
        console.error('❌ Invalid payload: missing challenge_id');
        msg.nak(); // Negative acknowledge - requeue
        return;
      }

      // Transform webhook payload to update DTO
      const updateDto = transformMessageToUpdateDto(payload);
      
      // Find the challenge to get the user address
      const allChallenges = await this.solanaService.findActiveChallenges(
        await this.solanaService.findManagedTemplates()
      );
      
      const targetChallenge = allChallenges.find(
        (c) => c.challengeId === payload.challenge_id
      );

      if (!targetChallenge) {
        console.error(`❌ Challenge not found on-chain: ${payload.challenge_id}`);
        msg.term(); // Terminal error - don't requeue
        return;
      }

      const stageId = parseInt(payload.stage_id);

      // Submit update to Solana
      const txSignature = await this.solanaService.updateChallenge(
        payload.challenge_id,
        targetChallenge.user,
        stageId,
        updateDto
      );

      const duration = Date.now() - startTime;
      
      console.log(`✅ Challenge updated successfully`);
      console.log(`   Challenge ID: ${payload.challenge_id}`);
      console.log(`   Transaction: ${txSignature}`);
      console.log(`   Status: ${payload.state_change_event?.new_status || 'updated'}`);
      console.log(`   Duration: ${duration}ms\n`);
      
      // Acknowledge successful processing
      msg.ack();
      
      // Optionally publish response (for monitoring/logging)
      await this.publishResponse({
        success: true,
        challengeId: payload.challenge_id,
        txSignature,
        status: payload.state_change_event?.new_status || 'updated',
        duration,
      });
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      console.error(`❌ Failed to process message: ${error.message}`);
      console.error(`   Duration: ${duration}ms\n`);
      
      // Publish error response
      await this.publishResponse({
        success: false,
        error: error.message,
        duration,
      });
      
      // Negative acknowledge - will be redelivered
      msg.nak();
    }
  }

  /**
   * Publish processing response to NATS
   */
  private async publishResponse(response: any): Promise<void> {
    if (!this.nc) return;
    
    try {
      const responseSubject = 'hyro.challenge.response';
      this.nc.publish(responseSubject, JSON.stringify(response));
    } catch (error) {
      console.error('Failed to publish response:', error);
    }
  }

  /**
   * Gracefully close NATS connection
   */
  async close(): Promise<void> {
    if (this.nc) {
      console.log('\nClosing NATS connection...');
      await this.nc.drain();
      await this.nc.close();
      console.log('NATS connection closed');
    }
  }
}

