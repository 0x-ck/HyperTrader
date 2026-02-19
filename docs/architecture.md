# Architecture

The HYRO Protocol architecture is built on Solana using a modular smart contract system that combines on-chain governance with off-chain oracle infrastructure. The current implementation focuses on a foundation layer with challenge-based manager verification and vault management capabilities.

## Core Smart Contract Layer

**Hyro Protocol Program**
The main protocol program (`7gx2mxou2JwuBNiDhfPeXf8EVK8DUGnXPLKdiyYKT3NL`) provides the foundational vault system and transaction execution framework. Built with Anchor 0.31.1, it features a modular design where optional components are controlled by feature flags, allowing for gradual feature rollout.

**Policy System Architecture**
The protocol implements a flexible policy system where vaults can be associated with different validation programs:
- **Allow Any Policy**: Permits all transactions (useful for testing and unrestricted vaults)
- **Deny All Policy**: Blocks all transactions (emergency or maintenance mode)
- **Limit Transfer Policy**: Enforces specific transfer limitations
- **Owners Policy**: Restricts access to predefined owner addresses
- **Challenge Policy**: Implements challenge-based verification and manager qualification

## Vault System (Implemented)

**PDA-Based Architecture**
Vaults are implemented using Program Derived Addresses (PDAs) with customizable seeds, ensuring unique and deterministic addresses. Each vault contains:
- Policy account reference for transaction validation
- Custom seed for address generation
- Authority account for transaction execution

**Transaction Execution Framework**
The vault system implements a multisig-like pattern where:
1. Users create transaction proposals with specific program calls
2. The associated policy program validates the transaction against vault rules
3. Approved transactions are executed by the vault authority
4. All transactions are recorded on-chain for audit and compliance

**Non-Custodial Design**
Funds remain under smart contract custody at all times. Managers receive execution rights within predefined constraints but never direct access to funds. This architecture ensures capital security while enabling flexible trading strategies.

## Challenge System (Implemented)

**Challenge Templates**
Challenge templates define standardized parameters for manager qualification:
- **Financial Parameters**: Starting deposits, entrance costs, profit targets
- **Risk Management**: Daily drawdown limits, maximum loss thresholds  
- **Trading Requirements**: Minimum trading days, maximum participants
- **Administrative Controls**: Admin management, fee structures

**Challenge Participants**
Individual challenges track participant progress through comprehensive state management:
- Balance tracking with real-time updates
- Progress metrics including trading days and profit/loss calculations
- Status transitions (initialized, active, completed, failed)
- Automated payout logic upon successful completion

## Oracle Infrastructure (Implemented)

**NATS-Based Architecture**
The oracle system uses NATS message queuing with JetStream for reliable off-chain data processing:
- **Message Queue**: Persistent message delivery for challenge updates
- **Real-Time Processing**: Live trading performance data aggregation
- **On-Chain Integration**: Automated blockchain updates based on off-chain events
- **Template Discovery**: Automatic discovery and management of challenge templates

**Oracle Service Features**
- Continuous monitoring of active challenges across all templates
- Data transformation from off-chain trading venues to on-chain format
- Automated transaction submission for challenge state updates
- Error handling and retry mechanisms for reliable operation

## Manager Registry (Partially Implemented)

**Current Implementation**
The manager registry system is currently implemented with basic functionality:
- ✅ Manager profile creation and management
- ✅ Manager verification system with admin controls
- ✅ Risk rating assignment and tracking
- ✅ Basic child vault creation framework
- 🚧 Balance tracking and fee collection (planned)
- 🚧 Event emission (planned)

**Challenge-Based Qualification**
The current implementation uses challenge templates for manager qualification, which:
- Provides transparent, verifiable performance tracking
- Eliminates subjective qualification criteria
- Creates a meritocratic system based on actual trading results
- Reduces barriers to entry while maintaining quality standards

**Future Registry Enhancements**
Additional registry features are planned for future phases:
- Comprehensive manager profiles and historical performance
- KYC/AML status tracking and compliance management
- On-chain reputation scores based on challenge performance
- Integration with external verification services

## Verification Engine (Planned)

**Current Challenge-Based Verification**
The existing challenge system provides verification through:
- Real-time performance monitoring via oracle updates
- Automated rule enforcement (drawdown limits, profit targets)
- Transparent audit trails for all trading activities
- Immediate disqualification for rule violations

**Advanced Verification (Planned)**
A comprehensive verification engine is planned for Phase 1, featuring:
- Pre-execution trade validation against vault parameters
- Post-execution verification of fills and pricing
- Multi-source data validation for accuracy
- Integration with external price oracles and trading venues

## Governance Module (Planned)

**Current Admin Controls**
The protocol currently operates under multisig administrative control for:
- Challenge template creation and modification
- Policy program updates and security patches
- Emergency protocol pauses and parameter overrides

**Future Token Governance**
A decentralized governance system is planned for Phase 2, featuring:
- $HYRO token-based voting mechanisms
- Proposal submission and voting procedures
- Timelock mechanisms for security
- Treasury management and protocol upgrades

## Frontend Integration

**Playground Application**
A comprehensive Next.js application provides:
- Vault creation and management interface
- Challenge template configuration tools
- Real-time challenge participation and monitoring
- Type-safe blockchain interactions via auto-generated clients

**TypeScript Client**
Generated using Codama for complete type safety:
- Auto-generated types from Anchor IDLs
- Instruction builders for transaction construction
- Account parsing and data deserialization
- Comprehensive error handling and validation

## Security Architecture

**Smart Contract Security**
- PDA-based account architecture prevents address collisions
- Feature flags enable gradual rollout and emergency controls
- Comprehensive input validation and error handling
- Anchor framework provides built-in security patterns

**Oracle Security**
- NATS JetStream provides message persistence and reliability
- Oracle keypair management with secure key storage
- Template and challenge validation before state updates
- Error handling and retry mechanisms for failed operations

The architecture is designed for scalability and security, with clear separation between implemented features and planned enhancements, ensuring users understand the current capabilities while maintaining transparency about future development.