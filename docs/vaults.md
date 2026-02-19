# Vaults

The HYRO Protocol vault system provides a secure, non-custodial framework for capital management through smart contract-based vaults. Built on Solana using Program Derived Addresses (PDAs), the system ensures fund security while enabling flexible transaction execution through policy-based validation.

## Vault Architecture

**PDA-Based Design**
Vaults are implemented using Program Derived Addresses (PDAs) with customizable seeds, ensuring unique and deterministic addresses. Each vault contains:

```rust
pub struct Vault {
    pub policy_account: Pubkey,    // Policy program for transaction validation
    pub seed: String,              // Custom seed for address generation
    pub authority: Pubkey,         // Vault authority for transaction execution
    
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

**Note**: The current implementation includes the basic vault structure with placeholder fields for future manager functionality. The enhanced manager features are planned for future development phases.

**Policy Integration**
Each vault is associated with a specific policy program that governs transaction execution:
- **Allow Any Policy**: Permits all transactions (testing and unrestricted use)
- **Deny All Policy**: Blocks all transactions (emergency or maintenance mode)
- **Limit Transfer Policy**: Enforces specific transfer limitations
- **Owners Policy**: Restricts access to predefined owner addresses
- **Challenge Policy**: Implements challenge-based verification and manager qualification

## Transaction System

**Multisig-Like Execution Pattern**
The vault system implements a sophisticated transaction execution framework:

1. **Transaction Creation**: Users create transaction proposals with specific program calls
2. **Policy Validation**: The associated policy program validates the transaction against vault rules
3. **Execution**: Approved transactions are executed by the vault authority
4. **Recording**: All transactions are recorded on-chain for audit and compliance

**Transaction Account Structure**
```rust
pub struct Transaction {
    pub nonce: u64,                    // Unique transaction identifier
    pub did_execute: bool,             // Execution status flag
    pub vault: Pubkey,                 // Associated vault account
    pub program_id: Pubkey,            // Target program for execution
    pub data: Vec<u8>,                 // Instruction data
    pub accounts: Vec<TransactionAccount>, // Required accounts
}
```

## Vault Creation Process

**Initialization Flow**
Creating a vault involves several key steps:

1. **Seed Generation**: Users provide a custom seed string for address generation
2. **Policy Selection**: Choose the appropriate policy program for transaction validation
3. **Account Creation**: The system generates a PDA using the vault seed
4. **Authority Setup**: Creates the vault authority account for transaction execution
5. **Policy Association**: Links the vault to the selected policy program

**Address Determinism**
The PDA-based approach ensures:
- Deterministic vault addresses based on seed input
- No address collisions or conflicts
- Predictable vault locations for integration
- Efficient account management and discovery

## Transaction Execution

**Pre-Execution Validation**
Before any transaction executes, the system performs comprehensive validation:

- **Policy Check**: The associated policy program validates the transaction
- **Account Verification**: Ensures all required accounts are present and valid
- **Data Validation**: Verifies instruction data format and parameters
- **Authority Confirmation**: Confirms the vault authority can execute the transaction

**Execution Process**
Once validated, transactions execute through a secure process:

1. **Authority Signing**: The vault authority signs the transaction
2. **Program Invocation**: The target program executes with vault authority
3. **State Updates**: On-chain state is updated atomically
4. **Transaction Recording**: Complete audit trail is maintained

**Post-Execution**
After execution, the system ensures:
- Transaction status is marked as executed
- All state changes are committed to the blockchain
- Audit logs are updated with execution details
- Policy-specific post-execution logic is applied

## Policy System Integration

**Flexible Validation Framework**
The policy system provides flexible validation options:

**Allow Any Policy**
- Permits all transactions without restrictions
- Useful for testing and unrestricted vaults
- Provides maximum flexibility for development

**Deny All Policy**
- Blocks all transactions completely
- Useful for emergency situations or maintenance
- Provides maximum security when needed

**Limit Transfer Policy**
- Enforces specific transfer limitations
- Validates transfer amounts against predefined limits
- Provides controlled access to vault funds

**Owners Policy**
- Restricts access to predefined owner addresses
- Validates transaction signers against owner list
- Provides multi-signature-like functionality

**Challenge Policy**
- Implements challenge-based verification
- Validates transactions based on challenge completion
- Provides meritocratic access control

## Security Features

**Non-Custodial Architecture**
Funds remain under smart contract custody at all times:
- Managers receive execution rights within predefined constraints
- No direct access to vault funds
- All transactions require policy validation
- Complete audit trail for all operations

**PDA Security**
The PDA-based architecture provides:
- Cryptographic address generation
- No private key management for vault addresses
- Deterministic but unpredictable addresses
- Protection against address collision attacks

**Policy Enforcement**
The policy system ensures:
- All transactions are validated before execution
- Policy-specific rules are enforced consistently
- Unauthorized transactions are automatically rejected
- Audit trails are maintained for compliance

## Integration with Challenge System

**Challenge-Based Vaults**
Vaults can be integrated with the challenge system for manager verification:

- **Qualification Requirements**: Managers must complete challenges to access vaults
- **Performance Tracking**: Challenge results determine vault access levels
- **Automated Validation**: Challenge completion is verified on-chain
- **Dynamic Access Control**: Vault access can be updated based on performance

**Template Integration**
Challenge templates define vault access parameters:
- **Profit Requirements**: Minimum profit targets for vault access
- **Risk Limits**: Maximum drawdown and loss thresholds
- **Trading Requirements**: Minimum trading days and activity levels
- **Fee Structures**: Performance-based fee arrangements

## Frontend Integration

**Vault Management Interface**
The playground application provides comprehensive vault management:

- **Vault Creation**: Easy-to-use interface for creating vaults with different policies
- **Policy Selection**: Visual selection of appropriate policy programs
- **Transaction Management**: Create and execute transactions through vaults
- **Real-Time Monitoring**: Live updates on vault status and transactions

**TypeScript Client Integration**
Generated clients provide type-safe vault interactions:
- **Vault Creation**: Type-safe vault initialization
- **Transaction Building**: Structured transaction creation
- **Account Management**: Automatic account discovery and validation
- **Error Handling**: Comprehensive error types and handling

## Future Enhancements

**Advanced Features (Planned)**
Future vault enhancements will include:

- **Multi-Asset Support**: Support for multiple token types in single vaults
- **Automated Fee Distribution**: Built-in fee calculation and distribution
- **Performance Analytics**: Comprehensive performance tracking and reporting
- **Cross-Chain Integration**: Support for assets from other blockchains

**Governance Integration**
Vault parameters will be controllable through governance:
- **Policy Updates**: Community-controlled policy modifications
- **Fee Structure Changes**: Governance-determined fee adjustments
- **Risk Parameter Updates**: Community-controlled risk management
- **Emergency Controls**: Governance-controlled emergency procedures

The vault system provides a robust foundation for secure capital management while maintaining flexibility for future enhancements and governance integration.