# Challenge Templates - Detailed View & Join Feature

## Overview
Enhanced the challenge templates section with expandable detailed views, on-chain data fetching, and the ability to join challenges.

## New Features

### 1. Expandable Template Cards
Each challenge template now displays as an expandable card with:
- **Collapsed View**: Shows stage ID, type, and address
- **Expanded View**: Full template details, join form, and challenge list
- **Expand/Collapse Toggle**: Chevron button for easy navigation
- **Refresh Button**: Manually refetch template data from chain

### 2. Detailed Template Information (`ChallengeTemplateDetails` Component)

Displays complete template parameters:

#### **Header Section**
- Stage ID and sequence number
- Active/Inactive status badge
- Stage type (Evaluation/Funded) badge
- Contract address (truncated)

#### **Financial Information**
- **Starting Deposit**: Virtual trading balance in SOL
- **Entrance Cost**: Fee to join in SOL
- **Total Pool**: Accumulated fees from all participants
- **Participants**: Current count vs maximum capacity

#### **Trading Rules** (Color-coded cards)
- 🔵 **Profit Target**: Required profit percentage
- 🟠 **Daily Drawdown**: Maximum daily loss percentage
- 🔴 **Maximum Loss**: Total maximum loss percentage
- **Minimum Trading Days**: Required trading days

#### **Administrative Info**
- Admin wallet address
- Token mint address (for entrance fees)

### 3. Join Challenge Form (`JoinChallengeForm` Component)

Allows users to join a challenge:
- **Challenge ID Input**: Unique identifier (auto-generated default)
- **Loading State**: Spinner and "Joining..." message
- **Error Display**: Clear error messages if join fails
- **Validation**: Ensures valid challenge ID format

### 4. On-Chain Data Fetching

Uses React Query for efficient data management:
- **Lazy Loading**: Fetches template data only when expanded
- **Caching**: Prevents unnecessary refetches
- **Refresh Capability**: Manual refresh button
- **Error Handling**: Graceful fallback on fetch failures

### 5. Join Challenge Transaction

Complete flow for joining a challenge:
1. User enters challengeID
2. Creates challenge PDA
3. Initializes challenge account with:
   - Template parameters
   - Initial state (all zeros)
   - Participant address
   - Timestamps
4. Submits transaction
5. Refreshes template data (updates participant count)

## Component Structure

```
challenges-section.tsx
├── ChallengesSection (Main)
│   ├── CreateChallengeTemplate (Left sidebar)
│   └── ChallengeTemplateSection[] (Right panel)
│       ├── ChallengeTemplateDetails
│       ├── JoinChallengeForm
│       └── Challenge List (placeholder)
│
challenge-template-details.tsx
├── Loading skeleton
├── Template parameters display
└── Color-coded trading rules
│
join-challenge-form.tsx
├── Challenge ID input
├── Loading overlay
└── Error display
│
challenge-card.tsx (Created, ready for future use)
├── Challenge status badges
├── P&L display
├── Progress indicators
└── Payout information
```

## User Experience

### Before Expansion
```
┌─────────────────────────────────┐
│ Stage 1        Evaluation    ▼ │
│ ABC123...XYZ789                 │
└─────────────────────────────────┘
```

### After Expansion
```
┌─────────────────────────────────┐
│ Stage 1     Evaluation  🔄  ▲  │
│ ABC123...XYZ789                 │
├─────────────────────────────────┤
│ [Full Template Details]         │
│ - Financial info                │
│ - Trading rules                 │
│ - Admin info                    │
├─────────────────────────────────┤
│ Join Challenge                  │
│ Challenge ID: [input]           │
│ [Join Challenge Button]         │
├─────────────────────────────────┤
│ Active Challenges               │
│ (Coming soon)                   │
└─────────────────────────────────┘
```

## Technical Implementation

### State Management
- **Local State**: Expand/collapse per template
- **React Query**: Server state for template data
- **Mutations**: Join challenge with optimistic updates

### Data Flow
1. User clicks expand → Triggers fetch
2. Data loads → Displays template details
3. User fills join form → Submits transaction
4. Success → Refetches template (updates count)

### Type Safety
- Strong typing for all protocol types
- Type assertions for complex conversions
- Proper enum usage (StageType, ChallengeStatus, DrawdownType)

### Error Handling
- Network errors: Logged to console, shows placeholder
- Transaction errors: Displayed in form
- Validation errors: Inline form validation

## Files Created/Modified

### New Files
- `challenge-template-details.tsx`: Detailed template view
- `join-challenge-form.tsx`: Join challenge UI
- `challenge-card.tsx`: Challenge display (future use)

### Modified Files
- `challenges-section.tsx`: 
  - Added expandable sections
  - Integrated fetching and joining
  - Added ChallengeTemplateSection component

## Future Enhancements

### Challenge List (Noted as "Coming Soon")
Currently shows placeholder because listing all challenges requires:
- **Indexing Solution**: On-chain program events indexer
- **API Endpoint**: Backend service to query challenges
- **Filtering**: By template, user, status, etc.

Alternatives without indexing:
1. Store challenge PDAs locally after joining
2. Use getProgramAccounts (inefficient, not scalable)
3. Implement event listener for new challenges

### Additional Features
1. **Challenge Status Updates**: Real-time progress tracking
2. **Payout Claims**: UI for claiming rewards
3. **Challenge History**: View past challenges
4. **Filters & Search**: Find specific challenges
5. **Leaderboard**: Top performers per template

## Testing Instructions

### 1. View Template Details
1. Create a challenge template
2. Click the ▼ button on a template card
3. See full template information load
4. Verify all parameters display correctly

### 2. Join a Challenge
1. Expand a template
2. Scroll to "Join Challenge" section
3. Enter a unique challenge ID
4. Click "Join Challenge"
5. Approve wallet transaction
6. See participant count increase

### 3. Refresh Template Data
1. Expand a template
2. Click the refresh 🔄 button
3. See spinner during fetch
4. Data updates

### 4. Handle Errors
1. Try joining with duplicate challenge ID
2. See error message display
3. Disconnect wallet and try joining
4. See "Wallet not connected" error

## Performance Considerations

- **Lazy Loading**: Templates fetch only when needed
- **Query Caching**: Prevents duplicate fetches
- **Optimistic Updates**: Immediate UI feedback
- **Code Splitting**: Components load on demand

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- Clear loading states
- Descriptive error messages

## Summary

The challenge templates section now provides:
✅ Detailed parameter viewing
✅ On-chain data fetching
✅ Join challenge functionality
✅ Loading & error states
✅ Responsive design
✅ Type-safe implementation

The foundation is set for adding the challenge list feature once an indexing solution is in place.

