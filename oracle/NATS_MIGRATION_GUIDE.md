# NATS Migration Guide

This document outlines how to test the new NATS-based oracle system.

## Prerequisites

1. **NATS Server with JetStream**
2. **Solana Local Validator** (for testing)
3. **Oracle Keypair** configured as admin of at least one ChallengeTemplate
4. **Active Challenge** on-chain to test with

## Step-by-Step Testing

### 1. Install NATS Server

**macOS:**
```bash
brew install nats-server
```

**Docker:**
```bash
docker run -d --name nats -p 4222:4222 nats:latest -js
```

### 2. Start NATS Server

```bash
nats-server -js
```

You should see output indicating JetStream is enabled.

### 3. Install Dependencies

In the oracle directory:
```bash
cd oracle
bun install
```

This will install the `nats` npm package along with other dependencies.

### 4. Configure Environment

Create a `.env` file (if not exists):
```bash
# Solana Configuration
RPC_URL=http://127.0.0.1:8899
WS_RPC_URL=ws://127.0.0.1:8900
ORACLE_KEYPAIR_PATH=./oracle-keypair.json
PROGRAM_ID=9GbrovAKnWfbXuq5dXYiZgZob75qTBz9HFcZGFRjftcH

# NATS Configuration
NATS_URL=nats://localhost:4222
```

### 5. Start the Oracle

```bash
bun run dev
```

Expected output:
```
Starting Hyro Challenge Oracle with NATS...

Discovering managed challenge templates...
Managing 1 template(s):
  1. Stage 101 - Sequence 1 - Active: true

Discovering active challenges...
Monitoring 0 active challenge(s)

Connecting to NATS at nats://localhost:4222...
✅ Connected to NATS: nats://localhost:4222
✅ Stream 'HYRO_CHALLENGES' already exists
✅ Consumer 'oracle-consumer' already exists

🔄 Listening for challenge updates on 'hyro.challenge.update'...
```

### 6. Test with Trading Simulator

In a new terminal, run the trading simulator:

```bash
cd oracle
bun run simulate-trading
```

Follow the prompts:
- **Challenge Address**: Enter the address of an on-chain challenge
- **Starting Balance**: e.g., 25000.00
- **Number of Trades**: e.g., 10
- **Volatility**: e.g., 0.5
- **Update Interval**: e.g., 2000 (ms)

Expected output:
```
🎮 Starting Trading Simulation
═══════════════════════════════════════════════════

Connecting to NATS at nats://localhost:4222...
✅ Connected to NATS: nats://localhost:4222

Fetching challenge: ABC123...
✅ Challenge loaded:
   ID: 550e8400-e29b-41d4-a716-446655440002
   Stage: 101
   User: UserPubKeyXYZ
   Status: active
   Current Balance: 25000.00

🔄 Simulating trades...

📈 Trade #1
   P&L: +450.00 (+1.80%)
   Balance: 25450.00
   Drawdown: 0.00 (0.00%)
   Max Loss: 0.00 (0.00%)
✅ Update published to NATS (status: active)
```

In the oracle terminal, you should see:
```
📨 Received challenge update: 550e8400-e29b-41d4-a716-446655440002
✅ Challenge updated successfully
   Challenge ID: 550e8400-e29b-41d4-a716-446655440002
   Transaction: 5J8gKn...
   Status: active
   Duration: 1234ms
```

### 7. Monitor NATS (Optional)

Install NATS CLI:
```bash
brew install nats-io/nats-tools/nats
```

View stream info:
```bash
nats stream info HYRO_CHALLENGES
```

Subscribe to responses:
```bash
nats sub hyro.challenge.response
```

List consumers:
```bash
nats consumer list HYRO_CHALLENGES
```

## What Changed

### Architecture

**Before (Webhook-based):**
- Simulator sends HTTP POST to oracle
- Oracle receives and processes immediately
- No message persistence
- No retry mechanism
- Single point of failure

**After (NATS-based):**
- Simulator publishes to NATS queue
- Oracle subscribes and processes from queue
- Messages persisted in JetStream
- Automatic retry on failure
- Can scale with multiple oracle instances
- Message acknowledgments ensure reliability

### Key Benefits

1. **Reliability**: Messages aren't lost if oracle is down
2. **Acknowledgments**: Oracle explicitly acks processing
3. **Retry Logic**: Failed messages are requeued automatically
4. **Monitoring**: Response channel for observability
5. **Scalability**: Multiple oracles can process in parallel
6. **Decoupling**: Producer and consumer are independent

## Message Flow

1. **Producer (Simulator)** publishes message to `hyro.challenge.update`
2. **NATS JetStream** persists message in stream `HYRO_CHALLENGES`
3. **Consumer (Oracle)** receives message from queue
4. **Oracle** calls `msg.working()` to indicate processing started
5. **Oracle** processes update and submits to Solana
6. On success: **Oracle** calls `msg.ack()` to remove from queue
7. On failure: **Oracle** calls `msg.nak()` to requeue message
8. **Oracle** publishes result to `hyro.challenge.response`

## Troubleshooting

### NATS Connection Issues

**Error:** `Failed to connect to NATS`

**Solutions:**
- Ensure NATS server is running: `nats-server -js`
- Check NATS_URL in `.env` file
- Try: `nats-server -js -D` for debug output
- Verify port 4222 is not blocked

### Stream/Consumer Errors

**Error:** `Stream not found`

**Solutions:**
- Oracle will create stream automatically on first run
- Manually create: `nats stream add HYRO_CHALLENGES --subjects hyro.challenge.update`
- Check JetStream is enabled: `nats-server -js`

### Message Processing Errors

**Error:** `Challenge not found on-chain`

**Solutions:**
- Ensure challenge exists on Solana blockchain
- Verify challenge_id matches exactly
- Check oracle is connected to correct RPC endpoint
- Ensure challenge hasn't been closed

### Messages Stuck in Queue

**Issue:** Messages not being processed

**Solutions:**
- Check oracle is running and connected
- View pending messages: `nats consumer next HYRO_CHALLENGES oracle-consumer`
- Check consumer status: `nats consumer info HYRO_CHALLENGES oracle-consumer`
- Messages redelivered after ack_wait (60s) or max 3 times

## Testing Checklist

- [ ] NATS server running with JetStream enabled
- [ ] Oracle starts and connects to NATS successfully
- [ ] Oracle discovers managed templates
- [ ] Trading simulator connects to NATS
- [ ] Simulator publishes messages successfully
- [ ] Oracle receives and processes messages
- [ ] On-chain challenge data is updated
- [ ] Response messages published to response channel
- [ ] Failed messages are retried (test by stopping oracle)
- [ ] Multiple oracle instances can process in parallel (advanced)

## Next Steps

1. **Production Deployment**:
   - Use TLS for NATS connections
   - Add authentication tokens
   - Set up NATS cluster for high availability
   - Configure monitoring and alerting

2. **Monitoring**:
   - Track message processing latency
   - Monitor queue depth
   - Alert on failed message retries
   - Dashboard for oracle health

3. **Optimization**:
   - Tune ack_wait timeout
   - Adjust max_deliver attempts
   - Configure message TTL
   - Optimize batch processing

## References

- [NATS Documentation](https://docs.nats.io/)
- [NATS JetStream](https://docs.nats.io/nats-concepts/jetstream)
- [NATS CLI Tools](https://github.com/nats-io/natscli)

