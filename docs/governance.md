# Governance

The HYRO Protocol governance system is currently under development. While the protocol operates under multisig administrative control, a comprehensive token-based governance system is planned for future phases.

## Current Governance Structure

**Multisig Administrative Control**
The protocol currently operates under multisig administrative control for:
- Challenge template creation and modification
- Policy program updates and security patches
- Emergency protocol pauses and parameter overrides
- Oracle configuration and management

**Planned Token-Based Governance**
A decentralized governance system powered by the $HYRO token is planned for Phase 2, enabling stakeholders to participate in protocol decision-making and development.

### Voting Mechanism

**Vote Weight Calculation**

voteWeight \= baseVotes \* stakingMultiplier \* voteLockMultiplier

*where:*

baseVotes \= heldTokens

stakingMultiplier \= 1.0 to 2.0 (based on stake duration)

voteLockMultiplier \= 1.0 to 3.0 (based on vote lock time)

### Staking Multipliers

| Staking Duration | Multiplier |
| :---- | ----- |
| Base (unstaked) | 1.0x |
| 1 month | 1.2x |
| 3 months | 1.5x |
| 6 months | 1.8x |
| 12 months | 2.0x |

### Vote Lock Multipliers

| Lock Period | Multiplier |
| ----- | ----- |
| No lock | 1.0x |
| 1 month | 1.5x |
| 3 months | 2.0x |
| 6 months | 2.5x |
| 12 months | 3.0x |

### Proposal Types

**Protocol Parameters**

1. Fee structures

2. Risk limits

3. Oracle configurations

4. Challenge templates

**System Upgrades**

5. Smart contract updates

6. Integration additions

7. Security enhancements

8. Feature implementations

**Treasury Actions**

9. Fund allocations

10. Investment decisions

11. Reward distributions

12. Emergency funds

### **Submission Requirements**

* Minimum 100,000 $HYRO tokens staked

* 14-day cool-down between proposals

* Detailed specification document

* Testing results (for technical changes)

### **Voting Timeline**

Submission → Review: 72 hours → Voting: 7 days → Timelock: 48 hours → Implementation

### **Quorum Requirements**

| Proposal Type | Minimum Participation | Pass Threshold |
| :---- | :---- | :---- |
| Parameter | 10% of total supply | \>50% |
| System | 20% of total supply | \>66% |
| Treasury | 15% of total supply | \>60% |
| Emergency | 25% of total supply | \>75% |

### Emergency Governance

**Emergency Actions:** Protocol pause, parameter overrides, fund freezing, oracle suspension

**Emergency Committee:** 7 elected members with 48-hour response requirement. All decisions are multisignature approvable with 5/7 consensus needed.

**Execution Process:**  
Emergency signal raised

1. Committee verification

2. Action implementation

3. Community notification

4. Post-action review

## Implementation Status

**Current Status**: The governance system described above is planned for future implementation. The protocol currently operates under multisig administrative control while the token-based governance system is developed.

**Timeline**: Token-based governance is planned for Phase 2 of protocol development, expected to be implemented after the completion of core protocol features and manager registry system.

**Note**: This documentation reflects the planned governance structure. Parameters and processes may be modified through governance proposals as the protocol evolves.