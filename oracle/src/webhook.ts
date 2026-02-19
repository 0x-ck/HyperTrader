import express, { Request, Response } from 'express';
import { SolanaService } from './solana';
import { transformMessageToUpdateDto } from './transformer';
import type { WebhookPayload } from './types';
import { address, type Address } from '@solana/kit';

export class WebhookServer {
  private app: express.Application;
  private solanaService: SolanaService;
  private port: number;

  constructor(solanaService: SolanaService, port: number) {
    this.app = express();
    this.solanaService = solanaService;
    this.port = port;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        oracle: this.solanaService.getOracleAddress(),
        timestamp: new Date().toISOString(),
      });
    });

    // Webhook endpoint for challenge updates
    this.app.post('/webhook/challenge-update', async (req: Request, res: Response) => {
      try {
        const payload: WebhookPayload = req.body;
        
        console.log(`Received update for challenge: ${payload.challenge_id}`);
        
        // Validate payload
        if (!payload.challenge_id) {
          return res.status(400).json({ error: 'Missing challenge_id' });
        }

        // Transform webhook payload to update DTO
        const updateDto = transformMessageToUpdateDto(payload);
        
        // Find the challenge to get the user address
        // In a real implementation, you'd query all challenges and find the matching one
        const allChallenges = await this.solanaService.findActiveChallenges(
          await this.solanaService.findManagedTemplates()
        );
        
        const targetChallenge = allChallenges.find(
          (c) => c.challengeId === payload.challenge_id
        );

        if (!targetChallenge) {
          return res.status(404).json({ error: 'Challenge not found on-chain' });
        }

        const stageId = parseInt(payload.stage_id);

        // Submit update to Solana
        const txSignature = await this.solanaService.updateChallenge(
          payload.challenge_id,
          targetChallenge.user,
          stageId,
          updateDto
        );

        res.json({
          success: true,
          challengeId: payload.challenge_id,
          txSignature,
          status: payload.state_change_event?.new_status || 'updated',
        });
      } catch (error: any) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
          error: 'Failed to process webhook',
          message: error.message,
        });
      }
    });

    // List managed templates
    this.app.get('/templates', async (_req: Request, res: Response) => {
      try {
        const templates = await this.solanaService.findManagedTemplates();
        res.json({
          count: templates.length,
          templates: templates.map((t) => ({
            stageId: t.stageId,
            stageSequence: t.stageSequence,
            participants: t.participants,
            isActive: t.isActive,
          })),
        });
      } catch (error: any) {
        console.error('Failed to fetch templates:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // List active challenges
    this.app.get('/challenges', async (_req: Request, res: Response) => {
      try {
        const templates = await this.solanaService.findManagedTemplates();
        const challenges = await this.solanaService.findActiveChallenges(templates);
        res.json({
          count: challenges.length,
          challenges: challenges.map((c) => ({
            challengeId: c.challengeId,
            stageId: c.stageId,
            user: c.user,
            status: c.status, // ChallengeStatus enum (number)
            latestBalance: c.latestBalance.toString(),
          })),
        });
      } catch (error: any) {
        console.error('Failed to fetch challenges:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Webhook server listening on port ${this.port}`);
      console.log(`Health check: http://localhost:${this.port}/health`);
      console.log(`Webhook endpoint: http://localhost:${this.port}/webhook/challenge-update`);
    });
  }
}
