import * as dotenv from 'dotenv';
import { SolanaService } from './solana';
import { NatsService } from './nats-service';

// Load environment variables
dotenv.config();

let natsService: NatsService | null = null;

async function main() {
  console.log('Starting Hyro Challenge Oracle with NATS...');
  
  // Validate environment variables
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8899';
  const wsRpcUrl = process.env.WS_RPC_URL || 'ws://127.0.0.1:8900';
  const keypairPath = process.env.ORACLE_KEYPAIR_PATH || './oracle-keypair.json';
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  const programId = process.env.PROGRAM_ID || '9GbrovAKnWfbXuq5dXYiZgZob75qTBz9HFcZGFRjftcH';

  try {
    // Initialize Solana service
    const solanaService = await SolanaService.create(rpcUrl, wsRpcUrl, keypairPath, programId);
    
    // Find managed templates on startup
    console.log('\nDiscovering managed challenge templates...');
    const templates = await solanaService.findManagedTemplates();
    
    if (templates.length === 0) {
      console.warn('Warning: No challenge templates found for this oracle key');
    } else {
      console.log(`Managing ${templates.length} template(s):`);
      templates.forEach((t, i) => {
        console.log(`  ${i + 1}. Stage ${t.stageId} - Sequence ${t.stageSequence} - Active: ${t.isActive}`);
      });
    }
    
    // Find active challenges
    console.log('\nDiscovering active challenges...');
    const challenges = await solanaService.findActiveChallenges(templates);
    console.log(`Monitoring ${challenges.length} active challenge(s)\n`);
    
    // Initialize and start NATS service
    natsService = new NatsService(solanaService, natsUrl);
    await natsService.connect();
    await natsService.startListening();
    
  } catch (error) {
    console.error('Failed to start oracle:', error);
    await cleanup();
    process.exit(1);
  }
}

// Cleanup function
async function cleanup() {
  if (natsService) {
    await natsService.close();
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\nShutting down oracle...');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down oracle...');
  await cleanup();
  process.exit(0);
});

main();
