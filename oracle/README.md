# Hyro Challenge Oracle

A production-ready oracle service that receives challenge updates via NATS message queue and submits them to the Solana blockchain.

## Overview

The oracle service:
1. Loads a signing keypair on startup
2. Discovers all ChallengeTemplates where the admin matches the signing key
3. Monitors all active Challenges for those templates
4. Connects to NATS message queue and subscribes to challenge updates
5. Acknowledges and processes messages from the queue
6. Transforms queue data to match on-chain format
7. Submits updates to the Solana program
8. Responds with success/failure status

## Setup

### 1. Install Dependencies

```bash
bun i
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```
RPC_URL=http://127.0.0.1:8899
WS_RPC_URL=ws://127.0.0.1:8900
ORACLE_KEYPAIR_PATH=./oracle-keypair.json
NATS_URL=nats://localhost:4222
PROGRAM_ID=9GbrovAKnWfbXuq5dXYiZgZob75qTBz9HFcZGFRjftcH
```

### 3. Create Oracle Keypair

The oracle needs a keypair that matches the `admin` field of ChallengeTemplates. You can either:

- Use an existing keypair (copy it to `oracle-keypair.json`)
- Generate a new one:
  ```bash
  solana-keygen new --outfile oracle-keypair.json
  ```

**Important**: The oracle's public key must match the `admin` field of any ChallengeTemplate it manages.

### 4. Generate Codama Client

Generate type-safe client from IDL:
```bash
bun run generate-client
```

This creates `src/generated/` with all Solana program types and functions.

### 5. Build and Run

Development mode (auto-generates client):
```bash
bun run dev
```

Production:
```bash
bun run build
bun start
```

### 5. Docker Deployment (Optional)

Build and run with Docker:
```bash
docker-compose up -d
```

Check logs:
```bash
docker-compose logs -f oracle
```

Stop:
```bash
docker-compose down
```

## NATS Configuration

### Installing NATS Server

Install NATS server locally:

**macOS:**
```bash
brew install nats-server
```

**Linux:**
```bash
curl -L https://github.com/nats-io/nats-server/releases/download/v2.10.7/nats-server-v2.10.7-linux-amd64.zip -o nats-server.zip
unzip nats-server.zip
sudo cp nats-server-v2.10.7-linux-amd64/nats-server /usr/local/bin
```

### Running NATS Server

Start NATS with JetStream enabled:
```bash
nats-server -js
```

Or run in Docker:
```bash
docker run -p 4222:4222 nats:latest -js
```

## Message Format

### Challenge Update Message

The oracle listens to the NATS subject: `hyro.challenge.update`

Message payload format (JSON):

```json
{
  "challenge_id": "550e8400-e29b-41d4-a716-446655440002",
  "stage_id": "101",
  "stage_sequence": 1,
  "stage_type": "evaluation",
  "effective_from": "2024-01-15T10:30:00Z",
  "starting_balance": "25000.00",
  "current_balance": "23500.00",
  
  "profit_target": {
    "target_percentage": 8.0,
    "target_amount": "2000.00",
    "achieved_percentage": -6.0,
    "achieved_amount": "-1500.00",
    "target_met": false
  },
  
  "trading_days": {
    "required_days": 4,
    "completed_days": 3,
    "requirement_met": false,
    "remaining_days": 1
  },
  
  "max_loss": {
    "equity_loss_limit_percentage": 5.0,
    "equity_loss_limit_amount": "1250.00",
    "current_loss": "1500.00",
    "current_loss_percentage": 6.0,
    "violation_triggered": true
  },
  
  "drawdown_limit": {
    "drawdown_type": "static",
    "limit_percentage": 5.0,
    "limit_amount": "1250.00",
    "max_equity": "25000.00",
    "current_drawdown": "1500.00",
    "current_drawdown_percentage": 6.0,
    "violation_triggered": true
  },
  
  "state_change_event": {
    "event_type": "failed",
    "timestamp": "2024-01-25T14:30:00Z",
    "previous_status": "active",
    "new_status": "failed",
    "reason": "equity_loss_violation"
  }
}
```

### Response Messages

The oracle publishes processing results to: `hyro.challenge.response`

Success response:
```json
{
  "success": true,
  "challengeId": "550e8400-e29b-41d4-a716-446655440002",
  "txSignature": "5J8...",
  "status": "failed",
  "duration": 1234
}
```

Error response:
```json
{
  "success": false,
  "error": "Challenge not found on-chain",
  "duration": 500
}
```
```

## Testing

### Trading Simulator

Use the built-in trading simulator to test the oracle with realistic trading activity:

```bash
bun run simulate-trading
```

The simulator will:
1. Connect to NATS
2. Fetch challenge data from Solana
3. Simulate trades with realistic win/loss patterns
4. Publish updates to the NATS queue
5. Monitor for violations and profit targets

### Manual NATS Testing

You can also manually publish messages using the NATS CLI:

Install NATS CLI:
```bash
brew install nats-io/nats-tools/nats
```

Publish a test message:
```bash
nats pub hyro.challenge.update '{"challenge_id":"550e8400-e29b-41d4-a716-446655440002","stage_id":"101",...}'
```

Subscribe to responses:
```bash
nats sub hyro.challenge.response
```

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌──────────────┐
│  Trading        │         │   NATS       │         │   Oracle     │
│  Simulator /    │────────▶│   Queue      │────────▶│   Service    │
│  External       │         │  (JetStream) │         │              │
│  System         │         └──────────────┘         └──────┬───────┘
└─────────────────┘                │                        │
                                   │                        ▼
                                   │                 ┌──────────────┐
                                   │                 │   Solana     │
                                   └────────────────▶│   Program    │
                                     Responses       │ (On-chain)   │
                                                     └──────────────┘
```

### Key Features

- **Reliable Delivery**: NATS JetStream ensures messages are not lost
- **Acknowledgments**: Oracle acknowledges message receipt and processing
- **Retry Logic**: Failed messages are automatically requeued
- **Monitoring**: Response messages enable tracking and debugging
- **Scalability**: Multiple oracle instances can process messages in parallel

## Security Notes

- Keep your oracle keypair secure
- Use TLS for NATS connections in production (`nats://` → `tls://`)
- Implement NATS authentication with tokens or credentials
- Use NATS authorization for subject-level access control
- Validate all incoming message data thoroughly
- Monitor NATS for suspicious activity
- Consider using NATS account isolation for multi-tenancy

## Troubleshooting

### "Failed to connect to NATS"
- Ensure NATS server is running: `nats-server -js`
- Check the NATS_URL in your .env file
- Verify network connectivity to NATS server

### "No challenge templates found"
- Ensure the oracle keypair's public key matches the `admin` field of at least one ChallengeTemplate
- Check that you're connected to the correct RPC endpoint

### "Failed to update challenge"
- Verify the oracle has enough SOL for transaction fees
- Check that the challenge exists on-chain
- Ensure the challenge belongs to a template managed by this oracle

### "Challenge not found on-chain"
- The challenge_id in the message must exactly match an on-chain Challenge
- Verify the challenge hasn't been closed or completed

### Messages stuck in queue
- Check oracle logs for processing errors
- Verify the oracle is running and connected to NATS
- Use `nats stream info HYRO_CHALLENGES` to inspect the stream
- Check message delivery attempts: may need to increase max_deliver

