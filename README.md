# HYRO Protocol

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Anchor](https://img.shields.io/badge/anchor-0.31.1-blue.svg)](https://anchor-lang.com/)
[![Solana](https://img.shields.io/badge/solana-v1.18-blue.svg)](https://solana.com/)

> **Decentralized, non-custodial vault protocol for transparent capital allocation between Liquidity Providers and Asset Managers**

HYRO Protocol eliminates traditional intermediaries in asset management by creating direct, trustless connections between LPs and managers through Solana smart contracts. Built with institutional-grade security and automated compliance.

## 🚀 Quick Start

### Prerequisites
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) v1.18+
- [Anchor Framework](https://anchor-lang.com/docs/installation) v0.31.1+
- [Node.js](https://nodejs.org/) v18+
- [Bun](https://bun.sh/) v1.0+ (for playground)
- [Yarn](https://yarnpkg.com/) v1.22+ (for Solana programs)

### Installation & Setup
```bash
# Clone repository
git clone https://github.com/your-org/hyro-protocol-v2.git
cd hyro-protocol-v2

# Install dependencies
yarn install

# Build programs
anchor build

# Run tests
yarn test

# Start local validator
solana-test-validator

# Deploy to localnet
anchor deploy
```

### Playground Application
```bash
cd app/playground
bun install
bun dev
```

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Current Implementation Status](#current-implementation-status)
- [Core Components](#core-components)
- [Programs](#programs)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## 🎯 Overview

HYRO Protocol addresses critical pain points in the $128T global asset management industry:

- **High Fees & Inefficiency**: Intermediaries inflate costs 20-50%
- **Opaque Performance**: Legacy reporting delays transparency
- **Access Barriers**: Minimums range $100K–$1.5M, excluding most investors
- **Slow Deployment**: Typical capital deployment takes 2-4 years

### Key Features

**For Liquidity Providers:**
- Full asset custody through smart contracts
- Real-time performance monitoring
- Automated fee calculations
- Flexible deposit/withdrawal terms

**For Asset Managers:**
- Permissionless access (subject to verification)
- Transparent track record building
- Automated fee collection
- Configurable trading parameters

**For Protocol Builders:**
- Flexible verification and evaluation policies
- Compatibility with off-chain trading venues

## 🏗️ Architecture

HYRO operates as a modular protocol with several key components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Liquidity     │    │   HYRO Protocol │    │   Asset         │
│   Providers     │◄──►│   Smart         │◄──►│   Managers      │
│   (LPs)         │    │   Contracts     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │   Policy        │
                       │   Programs      │
                       │   (Modular)     │
                       └─────────────────┘
```

### Core Architecture Principles

1. **Non-custodial**: Managers never directly access funds
2. **Modular**: Composable policy system for different risk profiles
3. **Transparent**: All operations recorded on-chain
4. **Automated**: Smart contract enforcement of rules and payouts

## 📊 Current Implementation Status

### ✅ Phase 0 - Foundation (Partially Complete)

**Implemented:**
- [x] Core vault system with PDA-based architecture
- [x] Transaction execution framework
- [x] Policy system (Allow Any, Deny All, Limit Transfer, Owners)
- [x] Basic frontend playground application
- [x] Local development and testing infrastructure
- [x] Anchor program structure with modular features
- [x] TypeScript client generation with Codama
- [x] Comprehensive test suite
- [x] Challenge Template Policies (MVP)
- [x] Challenge Participant accounts (MVP)
- [ ] Oracle integration for off-chain data
- [ ] Manager verification system
- [ ] zkTLS proof validation
- [ ] Automated payout system
- [ ] DAO governance mechanisms

### 🔄 Development Phases

| Phase | Status | Timeline | Description |
|-------|--------|----------|-------------|
| **Phase 0** | 🚧 In Progress | Current | Foundation layer with basic vaults |
| **Phase 1** | 📋 Planned | 8-10 weeks | Base layer with oracle integration |
| **Phase 2** | 📋 Planned | 8-10 weeks | Challenge engine and rule system |
| **Phase 3** | 📋 Planned | 4-8 weeks | DAO governance and automated payouts |

## 🧩 Core Components

### Vault System
Non-custodial smart contracts that receive deposits from LPs and enforce specific risk parameters, trading limits, and fee structures.

**Status:** ✅ Implemented
- PDA-based account architecture
- Transaction creation and execution
- Policy integration
- Fund custody management

### Policy Programs
Modular policy system allowing different risk profiles and trading constraints:

- **Allow Any Policy**: ✅ Permits all transactions
- **Deny All Policy**: ✅ Blocks all transactions  
- **Limit Transfer Policy**: ✅ Enforces transfer limits
- **Owners Policy**: ✅ Restricts access to specific owners
- `policy_challenges`: 🚧 Challenge templates, participants, join/update, payout claim (MVP)

### Oracle System
**Status:** ❌ Planned for Phase 1
Integration with off-chain trading venues for real-time performance data and rule enforcement.

### Manager Registry
**Status:** ❌ Planned for Phase 1
On-chain registry for verified asset managers with performance tracking.

### Challenge System
**Status:** 🚧 Partially implemented (MVP)
- Challenge template accounts
- Participant accounts and join flow
- Oracle-updatable challenge progress and validations
- Payout claim flow

Full challenge engine (rule system, automated progression, leaderboards) remains planned for Phase 2.

## 📁 Programs

### Main Program: `hyro_protocol`
- **Program ID**: `7gx2mxou2JwuBNiDhfPeXf8EVK8DUGnXPLKdiyYKT3NL`
- **Features**: 
  - [x] Vault management
  - [x] Transaction execution
  - [x] Policy integration
  - [ ] Manager registry (feature-flagged)
  - [ ] Oracle integration (feature-flagged)
  - [ ] Verification system (feature-flagged)
  - [ ] Governance (feature-flagged)

### Policy Programs
- `policy_allow_any`: ✅ Permissive policy allowing all operations
- `policy_deny_all`: ✅ Restrictive policy blocking all operations  
- `policy_limit_transfer`: ✅ Transfer limit enforcement
- `policy_owners`: ✅ Owner-based access control

### Utility Programs
- `dropper`: ✅ Utility program for testing/deployment

## 🛠️ Development

### Project Structure
```
├── programs/           # Solana programs (Anchor)
│   ├── hyro_protocol/  # Main protocol program
│   └── policy_*/       # Policy programs
├── app/playground/     # Next.js frontend application
├── tests/              # Integration tests
├── migrations/         # Deployment scripts
└── docs/               # Documentation
```

### Available Scripts
```bash
# Build all programs
anchor build

# Deploy to selected network
anchor deploy

# Testing contracts
anchor test

# Runing localnet and deploy contracts
solana-test-validator --reset
anchor test --skip-local-validator

# Start playground app
cd app/playground && bun dev

# Regenerate TypeScript client
cd app/playground && bun run regenerate-client
```
> `bun run regenerate-client` is essential EACH time then contract code has been changed.

> `

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Configure Solana cluster
solana config set --url localhost

# Create keypair
solana-keygen new --outfile ~/.config/solana/id.json
```

### Technology Stack

**Backend (Solana Programs):**
- [Rust](https://rust-lang.org/) with [Anchor Framework](https://anchor-lang.com/) v0.31.1
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) v1.18+

**Frontend (Playground):**
- [Next.js](https://nextjs.org/) v15.5.2
- [React](https://reactjs.org/) v19.1.1
- [TypeScript](https://www.typescriptlang.org/) v5.8.3
- [Tailwind CSS](https://tailwindcss.com/) v4.1.12
- [Solana Kit](https://github.com/solana-labs/solana-kit) v3.0.2
- [TanStack Query](https://tanstack.com/query) v5.85.6

**Testing:**
- [Mocha](https://mochajs.org/) v9.0.3
- [Chai](https://www.chaijs.com/) v4.3.4
- [TypeScript Mocha](https://github.com/TypeStrong/ts-mocha) v10.0.0

## 🧪 Testing

### Running Tests
```bash
# Run all tests
anchor test

# Run all tests on localnet
solana config set --url localhost
solana-test-validator --reset 
# inside new terminal
anchor test --skip-local-validator

# Run specific test file
anchor test --run tests/protocol.ts
anchor test --run tests/challenges.ts
```

### Test Coverage
- [x] Vault initialization and management
- [x] Policy integration and enforcement
- [x] Transaction creation and execution
- [x] PDA derivation and account validation
- [x] Error handling and edge cases
- [x] Multi-signature operations

## 🚀 Deployment

### Local Development
```bash
# Start local validator
solana-test-validator

# Deploy programs
anchor deploy

# Verify deployment
anchor verify
```

### Mainnet Deployment
**Status:** ❌ Planned for Phase 1
- Security audit completion required
- Multi-signature deployment process
- Gradual rollout with monitoring

## 🗺️ Roadmap

### Phase 1: Base Layer (8-10 weeks)
- [ ] Oracle integration with zkTLS proofs
- [ ] Manager verification system
- [ ] Enhanced frontend with real-time data
- [ ] Security audit preparation
- [ ] Mainnet deployment infrastructure

### Phase 2: Challenge Engine (8-10 weeks)  
- [ ] Challenge template system
- [ ] Rule engine implementation
- [ ] Automated challenge progression
- [ ] Performance tracking and leaderboards
- [ ] Tokenomics audit

### Phase 3: DAO Governance (4-8 weeks)
- [ ] Automated payout system
- [ ] DAO parameter governance
- [ ] Emergency pause mechanisms
- [ ] Community-driven protocol evolution
- [ ] HYRO token implementation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- Follow Rust best practices for Solana programs
- Use TypeScript for frontend development
- Write comprehensive tests
- Document public APIs
- Use conventional commit messages

## 🔒 Security

### Security Considerations
- All programs use PDA-based account architecture
- Role-based access control with Anchor constraints
- Upgradeable programs with multisig control
- Comprehensive test coverage
- Feature flags for gradual rollout

### Audit Status
- **Phase 0**: ✅ Internal review completed
- **Phase 1**: 📋 External security audit planned
- **Phase 2**: 📋 Tokenomics audit planned

### Reporting Security Issues
Please report security vulnerabilities to security@hyro-protocol.com

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [hyro-protocol.gitbook.io](https://hyro-protocol.gitbook.io/)
- **Discord**: [discord.gg/hyro](https://discord.gg/hyro)

---

**Built with ❤️ on Solana**
