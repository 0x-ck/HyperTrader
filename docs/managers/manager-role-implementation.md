# Manager Role Implementation

## Overview

The manager role system enables qualified traders to access protocol capital through a transparent verification process. Managers can create child vaults with allocated funds while maintaining security through admin-controlled verification and policy-based access controls.

## Current Implementation Status

**Implemented Features:**
- Manager registry with profile management
- Admin-controlled manager verification
- Basic child vault creation framework
- Risk rating system

**Planned Features:**
- Balance tracking and performance monitoring
- Fee collection mechanisms
- Event emission system

## Manager Registry

The registry tracks verified managers and their capabilities:

- **Manager Profiles**: Basic information, verification status, and risk ratings
- **Verification System**: Admin-controlled approval process for new managers
- **Risk Assessment**: Conservative, Moderate, Aggressive, and Speculative risk categories
- **Performance Tracking**: AUM and active vault monitoring

### Register Manager
```rust
await hyroProgram.methods
  .registerManager(RiskRating.Moderate)
  .accounts({ 
    managerRegistry: registryPDA,
    manager: managerKeypair.publicKey,
    admin: adminKeypair.publicKey
  })
  .signers([adminKeypair])
  .rpc();
```

### Verify Manager
```rust
await hyroProgram.methods
  .verifyManager(VerificationStatus.Verified)
  .accounts({ 
    managerRegistry: registryPDA,
    managerProfile: managerProfilePDA,
    admin: adminKeypair.publicKey
  })
  .signers([adminKeypair])
  .rpc();
```

## Child Vault Creation

Verified managers can create child vaults with allocated funds from parent vaults:

- **Allocation Control**: Managers receive specific fund allocations for trading
- **Policy Integration**: Child vaults inherit policy controls from parent vaults
- **Admin Oversight**: All child vault creation requires admin approval
- **Balance Tracking**: Framework for monitoring on-chain and off-chain balances

### Create Child Vault
```rust
const managerFees = {
  performanceFeeRate: 2000, // 20%
  managementFeeRate: 200,   // 2%
  collectionFrequency: FeeCollectionFrequency.Monthly,
  highWaterMark: allocation,
  feeRecipient: managerKeypair.publicKey
};

await hyroProgram.methods
  .issueChildVault(seed, allocation, managerFees)
  .accounts({ 
    parentVault: parentVaultPDA,
    childVault: childVaultPDA,
    childAuthority: childAuthorityPDA,
    managerRegistry: registryPDA,
    managerProfile: managerProfilePDA,
    childPolicy: policyPDA,
    manager: managerKeypair.publicKey,
    admin: adminKeypair.publicKey
  })
  .signers([adminKeypair])
  .rpc();
```

## Security Model

**Non-Custodial Design**
- Managers never directly access LP funds
- All transactions require policy validation
- Complete audit trails for all operations

**Admin Controls**
- Manager verification requires admin approval
- Child vault creation controlled by admin
- Risk parameters set during registration

**Policy Integration**
- Child vaults inherit security policies from parent vaults
- Transaction validation through policy programs
- Automated rule enforcement

## Future Enhancements

**Balance Tracking**
- Real-time monitoring of on-chain and off-chain balances
- Performance calculation and P&L tracking
- High water mark management for fee calculations

**Fee Collection**
- Performance-based fee calculations
- Management fee structures
- Automated fee distribution

**Event System**
- Real-time notifications for vault operations
- Performance milestone tracking
- Audit trail enhancements

## Usage Flow

1. **Manager Registration**: Traders register with risk rating
2. **Admin Verification**: Admin approves qualified managers
3. **Child Vault Creation**: Verified managers request fund allocations
4. **Trading Operations**: Managers execute trades within policy constraints
5. **Performance Monitoring**: System tracks results and compliance

### Complete Example
```rust
// 1. Initialize manager registry (admin only)
await hyroProgram.methods
  .initializeManagerRegistry()
  .accounts({ managerRegistry: registryPDA })
  .rpc();

// 2. Register manager
await hyroProgram.methods
  .registerManager(RiskRating.Moderate)
  .accounts({ 
    managerRegistry: registryPDA,
    manager: managerKeypair.publicKey,
    admin: adminKeypair.publicKey
  })
  .signers([adminKeypair])
  .rpc();

// 3. Verify manager
await hyroProgram.methods
  .verifyManager(VerificationStatus.Verified)
  .accounts({ 
    managerRegistry: registryPDA,
    managerProfile: managerProfilePDA,
    admin: adminKeypair.publicKey
  })
  .signers([adminKeypair])
  .rpc();

// 4. Create child vault
await hyroProgram.methods
  .issueChildVault(seed, allocation, managerFees)
  .accounts({ 
    parentVault: parentVaultPDA,
    childVault: childVaultPDA,
    // ... other accounts
  })
  .signers([adminKeypair])
  .rpc();
```

The manager role system provides a secure foundation for decentralized asset management while maintaining proper oversight and risk controls.