# Oracle System

The HYRO Protocol oracle system provides reliable off-chain data processing and on-chain synchronization for challenge performance tracking. Built on NATS message queuing with JetStream, it ensures real-time updates and reliable data delivery for the challenge-based manager verification system.

## Architecture Overview

**NATS-Based Message Queue**
The oracle system uses NATS with JetStream for persistent message delivery and reliable processing:
- **JetStream**: Provides message persistence, durability, and delivery guarantees
- **Subject-Based Routing**: Uses `hyro.challenge.update` for challenge updates
- **Response Handling**: Publishes results to `hyro.challenge.response` for status tracking
- **Consumer Groups**: Supports multiple oracle instances for high availability

**Oracle Service Components**
The oracle service consists of several key components working together:
- **Solana Integration**: Direct blockchain interaction for on-chain updates
- **Template Discovery**: Automatic detection of managed challenge templates
- **Challenge Monitoring**: Continuous tracking of active challenges
- **Data Transformation**: Conversion of off-chain data to on-chain format
- **Transaction Management**: Automated blockchain transaction submission

## Challenge Update Flow

**Message Processing Pipeline**
The oracle processes challenge updates through a structured pipeline:

1. **Message Reception**: Oracle receives challenge update messages via NATS
2. **Data Validation**: Validates message format and required fields
3. **Template Verification**: Confirms the challenge belongs to a managed template
4. **Data Transformation**: Converts off-chain data to on-chain instruction format
5. **Transaction Creation**: Builds Solana transaction with challenge update instruction
6. **Blockchain Submission**: Submits transaction to Solana network
7. **Response Publishing**: Publishes success/failure status back to NATS

**Challenge Update Message Format**
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

## Oracle Service Implementation

**Template Discovery**
On startup, the oracle service automatically discovers challenge templates it manages:
- Scans on-chain challenge templates where the admin matches the oracle's public key
- Caches template information for efficient processing
- Monitors template changes and updates accordingly
- Supports multiple templates with different parameters and rules

**Challenge Monitoring**
The oracle continuously monitors active challenges across all managed templates:
- Tracks challenge status changes and progress updates
- Validates challenge parameters against template requirements
- Maintains real-time state for all active challenges
- Provides comprehensive audit trails for compliance

**Data Transformation**
The oracle converts off-chain trading data to on-chain format:
- **Balance Updates**: Converts floating-point balances to fixed-point representation
- **Percentage Calculations**: Handles profit/loss percentages with proper precision
- **Status Transitions**: Manages challenge state changes and rule violations
- **Timestamp Management**: Ensures proper chronological ordering of updates

## Deployment and Configuration

**Environment Setup**
The oracle service requires several configuration parameters:
```bash
RPC_URL=http://127.0.0.1:8899
WS_RPC_URL=ws://127.0.0.1:8900
ORACLE_KEYPAIR_PATH=./oracle-keypair.json
NATS_URL=nats://localhost:4222
PROGRAM_ID=9GbrovAKnWfbXuq5dXYiZgZob75qTBz9HFcZGFRjftcH
```

**Oracle Keypair Management**
The oracle requires a keypair that matches the admin field of challenge templates:
- Oracle public key must be set as admin for managed templates
- Secure key storage and rotation procedures
- Integration with hardware security modules for production
- Backup and recovery procedures for key management

**NATS Server Configuration**
The oracle requires a NATS server with JetStream enabled:
```bash
nats-server -js
```

JetStream provides:
- Message persistence and durability
- Consumer group support for scaling
- Dead letter queues for failed messages
- Stream management and monitoring

## Error Handling and Reliability

**Message Processing Errors**
The oracle implements comprehensive error handling:
- **Validation Errors**: Invalid message format or missing required fields
- **Template Errors**: Challenge doesn't belong to managed template
- **Blockchain Errors**: Transaction failures or network issues
- **Retry Logic**: Automatic retry with exponential backoff
- **Dead Letter Queue**: Failed messages for manual review

**Response Handling**
The oracle publishes processing results for monitoring and debugging:
```json
{
  "success": true,
  "challenge_id": "550e8400-e29b-41d4-a716-446655440002",
  "transaction_signature": "5J7X8...",
  "timestamp": "2024-01-25T14:30:00Z"
}
```

**Monitoring and Observability**
The oracle provides comprehensive monitoring capabilities:
- **Health Checks**: Regular health status reporting
- **Performance Metrics**: Processing times and success rates
- **Error Tracking**: Detailed error logging and categorization
- **Audit Logs**: Complete audit trail for compliance

## Security Considerations

**Message Authentication**
- Oracle keypair provides cryptographic authentication
- Template admin verification prevents unauthorized updates
- Message integrity validation before processing
- Secure communication channels with NATS

**Data Validation**
- Comprehensive input validation for all message fields
- Range checking for financial data and percentages
- Timestamp validation for chronological consistency
- Challenge state transition validation

**Access Control**
- Oracle keypair controls access to challenge updates
- Template admin verification ensures proper authorization
- Network-level security for NATS communication
- Secure key storage and management procedures

## Scaling and Performance

**Horizontal Scaling**
The oracle system supports horizontal scaling:
- Multiple oracle instances can process messages concurrently
- Consumer groups distribute load across instances
- NATS clustering for high availability
- Load balancing for optimal performance

**Performance Optimization**
The oracle implements several performance optimizations:
- **Batch Processing**: Groups multiple updates for efficiency
- **Connection Pooling**: Reuses Solana RPC connections
- **Caching**: Caches template and challenge data
- **Async Processing**: Non-blocking message processing

## Integration with Trading Venues

**Trading Platform Integration**
The oracle integrates with various trading platforms:
- **CCXT Library**: Unified interface for multiple exchanges
- **Webhook Support**: Real-time updates from trading platforms
- **API Integration**: Direct integration with exchange APIs
- **Data Aggregation**: Combines data from multiple sources

**Supported Venues**
The oracle supports integration with major trading venues:
- **Centralized Exchanges**: Binance, Bybit, OKX, and others
- **Decentralized Exchanges**: Raydium, Orca, Drift
- **Forex Platforms**: MetaTrader and other retail platforms
- **Custom Integrations**: Proprietary trading systems

The oracle system provides the critical infrastructure for reliable challenge performance tracking, ensuring accurate and timely updates to the on-chain challenge system while maintaining high availability and security standards.
