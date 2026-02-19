# Managers

Asset managers are the backbone of HYRO, bringing skill, strategy, and disciplined execution to the capital provided by liquidity providers (LPs). HYRO connects these managers directly with LPs through a transparent, challenge-based qualification system that ensures only proven traders can access protocol capital.

## Challenge-Based Manager Qualification

**Meritocratic Onboarding Process**
HYRO uses challenge-based qualification to ensure only capable managers access LP capital. This approach eliminates subjective criteria and creates a transparent, meritocratic system based on actual trading performance.

**Challenge Templates**
Manager qualification is determined through standardized challenge templates that define:
- **Financial Parameters**: Starting deposits, entrance costs, and profit targets
- **Risk Management**: Daily drawdown limits and maximum loss thresholds
- **Trading Requirements**: Minimum trading days and activity levels
- **Performance Metrics**: Win rates, position sizing, and risk management

**Challenge Participation**
Managers participate in challenges by:
1. **Selecting Templates**: Choosing appropriate challenge templates based on their trading style
2. **Paying Entry Fees**: Contributing to the challenge pool through entrance costs
3. **Demonstrating Skills**: Trading under real market conditions within defined parameters
4. **Meeting Targets**: Achieving profit targets while respecting risk limits
5. **Completing Requirements**: Meeting minimum trading day requirements

## Challenge System Implementation

**Template Creation**
Challenge templates are created by protocol administrators and define standardized qualification criteria:

```rust
pub struct ChallengeTemplate {
    pub stage_id: u16,                    // Unique template identifier
    pub stage_sequence: u8,               // Template sequence number
    pub stage_type: StageType,            // Challenge type (evaluation/funded)
    pub starting_deposit: u64,            // Virtual trading balance
    pub entrance_cost: u64,               // Fee to join challenge
    pub minimum_trading_days: SmallScalar, // Required trading days
    pub daily_drawdown: Percent,          // Daily drawdown limit
    pub maximum_loss: Percent,            // Maximum loss threshold
    pub profit_target: Percent,           // Required profit target
    pub max_participants: SmallScalar,    // Maximum participants
    pub is_active: bool,                  // Template status
}
```

**Challenge Tracking**
Individual challenges track participant progress through comprehensive state management:

```rust
pub struct Challenge {
    pub challenge_id: String,             // Unique challenge identifier
    pub user: Pubkey,                     // Participant address
    pub starting_balance: u64,           // Initial balance
    pub latest_balance: u64,              // Current balance
    pub status: ChallengeStatus,          // Current status
    pub payout: u64,                      // Calculated payout
    // ... additional tracking fields
}
```

## Oracle-Driven Performance Monitoring

**Real-Time Tracking**
The oracle system provides continuous monitoring of challenge performance:
- **NATS Message Queue**: Reliable delivery of trading performance updates
- **Performance Calculation**: Real-time profit/loss and risk metric computation
- **Rule Enforcement**: Automated validation against challenge parameters
- **State Updates**: On-chain synchronization of challenge progress

**Performance Validation**
The system validates multiple performance criteria:
- **Profit Targets**: Achievement of required profit percentages
- **Drawdown Limits**: Compliance with daily and total drawdown limits
- **Trading Activity**: Meeting minimum trading day requirements
- **Risk Management**: Adherence to position sizing and risk parameters

## Manager Privileges and Capabilities

**Challenge-Based Access Control**
Successful challenge completion grants managers access to protocol features:

- **Vault Creation**: Ability to create and configure trading vaults
- **Transaction Execution**: Execute trades through approved venues
- **Parameter Adjustment**: Modify vault parameters within protocol limits
- **Performance Tracking**: Access to comprehensive analytics and reporting

**Vault Management**
Qualified managers can create and manage vaults with:
- **Policy Integration**: Associate vaults with appropriate policy programs
- **Risk Parameters**: Set trading limits and risk management rules
- **Fee Structures**: Configure performance and management fees
- **Access Controls**: Define who can interact with vault funds

**Trading Execution**
Managers execute trades through:
- **Approved Venues**: Integration with supported trading platforms
- **Risk Validation**: Automatic validation against vault parameters
- **Performance Tracking**: Real-time monitoring of trading results
- **Audit Trails**: Complete record of all trading activities

## Performance Analytics and Reporting

**Challenge Performance Tracking**
The system provides comprehensive analytics for challenge performance:
- **Profit/Loss Tracking**: Real-time calculation of trading results
- **Risk Metrics**: Monitoring of drawdowns and risk management
- **Trading Statistics**: Win rates, average trade duration, and position sizing
- **Progress Indicators**: Visual tracking of challenge completion

**Vault Performance Analytics**
Qualified managers receive detailed analytics for their vaults:
- **Performance Dashboards**: Real-time monitoring of vault performance
- **Risk Monitoring**: Tracking of risk metrics and compliance
- **Fee Calculations**: Automated calculation of performance fees
- **Historical Analysis**: Long-term performance tracking and reporting

## Integration with Trading Venues

**Supported Platforms**
The protocol integrates with major trading venues:
- **Centralized Exchanges**: Binance, Bybit, OKX, and others
- **Decentralized Exchanges**: Raydium, Orca, Drift
- **Forex Platforms**: MetaTrader and other retail platforms
- **Custom Integrations**: Proprietary trading systems

**Technical Integration**
Managers integrate with trading venues through:
- **API Connections**: Direct integration with exchange APIs
- **Webhook Support**: Real-time updates from trading platforms
- **Data Aggregation**: Combination of data from multiple sources
- **Performance Validation**: Cross-validation of trading results

## Manager Registry (Current Implementation)

**Implemented Registry Features**
The manager registry is currently implemented with basic functionality:
- ✅ **Manager Profiles**: Basic manager information and verification status
- ✅ **Verification System**: Admin-controlled manager verification process
- ✅ **Risk Rating**: Risk assessment and assignment system
- ✅ **Child Vault Creation**: Basic framework for manager-controlled vaults
- 🚧 **Performance Tracking**: Planned for future implementation
- 🚧 **Fee Management**: Planned for future implementation

**Current Qualification Process**
The current system provides:
- **Challenge-Based Qualification**: Transparent performance-based verification
- **Admin Verification**: Controlled manager approval process
- **Risk Assessment**: Risk rating assignment during registration
- **Basic Vault Access**: Limited vault creation capabilities

**Future Registry Enhancements**
Additional registry features are planned for future phases:
- **Comprehensive Profiles**: Detailed manager information and historical performance
- **KYC/AML Integration**: Regulatory compliance and identity verification
- **Reputation Scoring**: On-chain reputation based on challenge performance
- **Performance History**: Long-term tracking of manager capabilities
- **Multi-Stage Challenges**: Progressive qualification through multiple challenge levels
- **Specialized Templates**: Challenge templates for specific trading strategies
- **Performance Tiers**: Different access levels based on challenge performance
- **Continuous Monitoring**: Ongoing performance tracking and qualification maintenance

## Security and Compliance

**Challenge Integrity**
The challenge system ensures fair and transparent qualification:
- **On-Chain Verification**: All challenge data is recorded on-chain
- **Oracle Validation**: Real-time verification of trading performance
- **Rule Enforcement**: Automatic disqualification for rule violations
- **Audit Trails**: Complete record of all challenge activities

**Manager Security**
The system protects manager interests through:
- **Non-Custodial Design**: Managers never directly access LP funds
- **Policy Enforcement**: Automated validation of all transactions
- **Performance Transparency**: Public visibility of challenge results
- **Fair Competition**: Equal opportunity for all participants

The challenge-based manager qualification system provides a transparent, meritocratic approach to manager selection while ensuring only proven traders can access protocol capital.