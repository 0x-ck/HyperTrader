
# Implementation

The HYRO Protocol implementation consists of a comprehensive Solana-based smart contract system, oracle infrastructure, and frontend interface. The current implementation focuses on Phase 0 foundation features with a modular architecture designed for future expansion.

## Smart Contract Architecture

### Core Programs

The protocol is built on Solana using the Anchor framework and consists of several interconnected programs:

**Hyro Protocol (Main Program)**
- Program ID: `7gx2mxou2JwuBNiDhfPeXf8EVK8DUGnXPLKdiyYKT3NL`
- Contains the core vault system and transaction execution framework
- Features modular design with optional components controlled by feature flags

**Policy Programs**
- `policy_challenges`: Challenge templates and participant management (`9GbrovAKnWfbXuq5dXYiZgZob75qTBz9HFcZGFRjftcH`)
- `policy_allow_any`: Permits all transactions (`2QPMdHH58BK9yFH5AdDmL4UXUb5hRBW51ga2p3KuUZ2t`)
- `policy_deny_all`: Blocks all transactions (`2QPMdHH58BK9yFH5AdDmL4UXUb5hRBW51ga2p3KuUZ2t`)
- `policy_limit_transfer`: Enforces transfer limits
- `policy_owners`: Restricts access to specific owners (`G4wLdUkWJnqkN31sKA7t5RogsijrKryieVFaKuw1GvBL`)

### Vault System Implementation

**Vault Account Structure**
```rust
pub struct Vault {
    pub policy_account: Pubkey,
    pub seed: String,
    pub authority: Pubkey,
    
    // Manager fields (planned for future implementation)
    pub manager: Option<Pubkey>,           // Assigned manager (if any)
    pub parent_vault: Option<Pubkey>,      // Parent vault (if child)
    pub allocation: u64,                   // Initial allocated amount
    
    // Balance tracking (planned for future implementation)
    pub onchain_balance: u64,              // SOL/tokens in vault account
    pub offchain_balance: u64,             // Funds in external venues (DEX, CEX, etc.)
    pub total_balance: u64,                // onchain_balance + offchain_balance
    pub last_balance_update: u64,          // Timestamp of last balance sync
    
    // Fee tracking (planned for future implementation)
    pub high_water_mark: u64,              // For performance fees
    pub total_fees_paid: u64,              // Audit trail
    
    // Manager fee structure (planned for future implementation)
    pub manager_fees: Option<ManagerFeeStructure>,
    
    // Timestamps (planned for future implementation)
    pub created_at: u64,
    pub last_fee_collection: u64,
}
```

Vaults are created using Program Derived Addresses (PDAs) with customizable seeds, ensuring unique and deterministic addresses. Each vault is associated with a specific policy program that governs transaction execution. The current implementation includes placeholder fields for future manager functionality.

**Transaction System**
The vault system implements a multisig-like transaction execution pattern:

1. **Transaction Creation**: Users create transaction proposals with specific program calls
2. **Policy Validation**: The associated policy program validates the transaction
3. **Execution**: Approved transactions are executed by the vault authority

**Transaction Account Structure**
```rust
pub struct Transaction {
    pub nonce: u64,
    pub did_execute: bool,
    pub vault: Pubkey,
    pub program_id: Pubkey,
    pub data: Vec<u8>,
    pub accounts: Vec<TransactionAccount>,
}
```

### Challenge System Implementation

**Challenge Templates**
Challenge templates define the parameters for trading challenges, including:

- **Financial Parameters**: Starting deposit, entrance cost, profit targets
- **Risk Management**: Daily drawdown limits, maximum loss thresholds
- **Trading Requirements**: Minimum trading days, maximum participants
- **Administrative**: Admin controls, token mint for fees

**Challenge Accounts**
Individual challenges track participant progress through:

- **Balance Tracking**: Starting and current balance monitoring
- **Progress Metrics**: Trading days completed, profit/loss calculations
- **Status Management**: Challenge state transitions (initialized, active, completed, failed)
- **Payout Logic**: Automated reward distribution upon completion

### Oracle System Implementation

**NATS-Based Architecture**
The oracle system uses NATS message queuing for reliable off-chain data processing:

- **Message Queue**: NATS JetStream for persistent message delivery
- **Challenge Updates**: Real-time trading performance data
- **On-Chain Integration**: Automated blockchain updates based on off-chain events

**Oracle Service Features**
- **Template Discovery**: Automatic discovery of managed challenge templates
- **Challenge Monitoring**: Continuous monitoring of active challenges
- **Data Transformation**: Conversion of off-chain data to on-chain format
- **Transaction Submission**: Automated blockchain transaction execution

### Frontend Implementation

**Playground Application**
A comprehensive Next.js application provides:

- **Vault Management**: Create and manage vaults with different policy types
- **Challenge Templates**: Create and configure trading challenge parameters
- **Challenge Participation**: Join challenges and track progress
- **Real-Time Updates**: Live data fetching and display

**TypeScript Client**
Generated using Codama for type-safe blockchain interactions:

- **Auto-Generated Types**: Complete type definitions from Anchor IDLs
- **Instruction Builders**: Type-safe transaction construction
- **Account Parsing**: Automatic account data deserialization
- **Error Handling**: Comprehensive error type definitions

## Current Implementation Status

### ✅ Implemented Features

**Core Infrastructure**
- Vault system with PDA-based architecture
- Transaction creation and execution framework
- Policy system with multiple validation types
- Challenge template and participant management
- Oracle service with NATS integration
- Frontend playground with full functionality
- TypeScript client generation

**Challenge System**
- Template creation and management
- Participant registration and tracking
- Real-time performance monitoring
- Automated payout calculations
- Status transition management

**Oracle Integration**
- NATS message queue processing
- Challenge performance updates
- On-chain data synchronization
- Template and challenge discovery

### 🚧 Partially Implemented Features

**Manager Registry**
- ✅ Basic manager registry with profile management implemented
- ✅ Manager verification system implemented
- ✅ Child vault creation framework implemented
- 🚧 Balance tracking and fee collection planned
- 🚧 Event emission planned

**Verification Engine**
- Placeholder for advanced verification logic
- Current verification handled by challenge system
- Planned for comprehensive trade validation

**Governance Module**
- Placeholder for token-based governance
- Current admin controls via multisig
- Planned for decentralized decision-making

### 🔄 Development Phases

**Phase 0 (Current)**
- Foundation layer with basic vaults and challenges
- Oracle integration for performance tracking
- Frontend interface for user interaction

**Phase 1 (Planned)**
- Manager verification system implementation
- Advanced verification engine
- Enhanced oracle capabilities

**Phase 2 (Future)**
- Governance module activation
- Cross-chain integrations
- Advanced trading features

## Technical Specifications

**Blockchain**: Solana
**Framework**: Anchor 0.31.1
**Frontend**: Next.js with TypeScript
**Oracle**: NATS with JetStream
**Client Generation**: Codama
**Testing**: Comprehensive test suite with local validator

The implementation follows Solana best practices with PDA-based architecture, efficient account management, and modular design patterns that enable future expansion while maintaining security and performance.