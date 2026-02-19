# Challenge Vault Feature - Testing Guide

## Overview
The playground now supports creating challenge templates (challenge vaults) through a user-friendly interface.

## What Was Implemented

### 1. Protocol Integration
- Added `policyChallenges` export to protocol index
- Created PDA helper functions for challenge templates and challenges
- Updated protocol context with challenge-specific helpers

### 2. UI Components
- **Challenge Template Form** (`create-challenge-template-form.tsx`): 
  - Form for creating new challenge templates
  - Includes all required parameters (stage ID, type, costs, rules, etc.)
  - Input validation with Zod schema

- **Challenges Section** (`challenges-section.tsx`):
  - Main container for challenge template management
  - Handles on-chain transaction creation
  - Displays created challenge templates

### 3. State Management
- Added `challengeTemplatesAtom` for persisting created templates locally
- Templates are stored with stage ID, address, and type

### 4. Navigation
- Added tab navigation in main page to switch between Vaults and Challenge Templates

## How to Test

### 1. Start the Playground
```bash
cd app/playground
npm run dev  # or yarn dev / pnpm dev
```

### 2. Connect Your Wallet
- Click the wallet button in the header
- Connect to a wallet with some SOL for transaction fees

### 3. Create a Challenge Template
1. Navigate to the "Challenge Templates" tab
2. Fill in the form:
   - **Stage ID**: Unique identifier (e.g., 1, 2, 3...)
   - **Stage Sequence**: Order in progression (usually 1)
   - **Stage Type**: Evaluation or Funded
   - **Starting Deposit**: Virtual balance in lamports (e.g., 1000000000 = 1 SOL)
   - **Entrance Cost**: Fee to join in lamports
   - **Token Mint**: SOL or USDC for payments
   - **Minimum Trading Days**: Required days
   - **Daily Drawdown**: Max daily loss in basis points (500 = 5%)
   - **Maximum Loss**: Total max loss in basis points
   - **Profit Target**: Required profit in basis points
   - **Max Participants**: Capacity limit
   - **Is Active**: Enable/disable the template

3. Click "Create Challenge Template"
4. Approve the transaction in your wallet

### 4. View Created Templates
- Successfully created templates appear as cards on the right side
- Each card shows the stage ID, type, and on-chain address

## Default Values
The form provides sensible defaults:
- Stage ID: 1
- Stage Sequence: 1
- Type: Evaluation
- Starting Deposit: 1000 SOL
- Entrance Cost: 100 lamports
- Minimum Trading Days: 3
- Daily Drawdown: 5%
- Maximum Loss: 10%
- Profit Target: 10%
- Max Participants: 100

## Technical Details

### Challenge Template Parameters
- **Stage ID**: Unique identifier used for PDA derivation
- **Stage Sequence**: Allows multiple stages in a challenge progression
- **Stage Type**: Evaluation (demo) or Funded (real money)
- **Starting Deposit**: Virtual trading balance participants receive
- **Entrance Cost**: Fee charged when joining (in lamports)
- **Rules**: Trading days, drawdown limits, loss limits, profit targets
- **Capacity**: Maximum number of participants

### On-Chain Structure
- Challenge templates are PDAs derived from stage ID
- Each template is stored on-chain with immutable stage ID
- Other parameters can be updated by the admin
- Participants join by creating Challenge accounts

## Next Steps (Future Enhancements)
1. **Join Challenge UI**: Allow users to join existing templates
2. **Template Management**: Update template parameters
3. **Challenge Tracking**: View active challenges and their status
4. **Oracle Integration**: Update challenge progress
5. **Payout Claims**: UI for claiming rewards

## Files Modified/Created
- `/app/playground/src/protocol/index.ts` - Added policyChallenges export
- `/app/playground/src/protocol/atoms.ts` - Added challenge templates atom
- `/app/playground/src/components/challenges/challenge-template-schema.ts` - Schema
- `/app/playground/src/components/challenges/create-challenge-template-form.tsx` - Form
- `/app/playground/src/components/challenges/challenges-section.tsx` - Main component
- `/app/playground/src/components/onchain/protocol-context.ts` - Updated types
- `/app/playground/src/components/onchain/protocol-context-provider.tsx` - Added helpers
- `/app/playground/src/app/page.tsx` - Added tab navigation

## Troubleshooting
- **"Template already exists"**: Use a different stage ID
- **"Wallet not connected"**: Connect your wallet first
- **Transaction fails**: Ensure you have enough SOL for gas fees
- **Invalid address**: Check that token mint addresses are valid

## Notes
- All amounts are in lamports (1 SOL = 1,000,000,000 lamports)
- Percentages are in basis points (100 = 1%, 1000 = 10%)
- Templates persist locally in browser storage
- The feature requires the policy_challenges program to be deployed

