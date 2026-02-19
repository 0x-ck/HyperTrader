use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::solana_program::instruction::Instruction;
use hyro_sdk::ValidateOperation;
use std::convert::Into;
use std::ops::Deref;
use crate::manager_registry::{ManagerRegistry, ManagerProfile, VerificationStatus};
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[account]
pub struct Vault {
    pub policy_program: Pubkey,
    pub seed: String,
    pub authority: Pubkey,

    // Manager fields
    pub manager: Option<Pubkey>,           // Assigned manager (if any)
    pub parent_vault: Option<Pubkey>,      // Parent vault (if child)
    pub allocation: u64,                   // Initial allocated amount

    // Balance tracking (onchain + offchain)
    pub onchain_balance: u64,              // SOL/tokens in vault account
    pub offchain_balance: u64,             // Funds in external venues (DEX, CEX, etc.)
    pub total_balance: u64,                // onchain_balance + offchain_balance
    pub last_balance_update: u64,          // Timestamp of last balance sync

    // Fee tracking (only what's needed)
    pub high_water_mark: u64,              // For performance fees
    pub total_fees_paid: u64,              // Audit trail

    // Manager fee structure
    pub manager_fees: Option<ManagerFeeStructure>,
    
    // Timestamps
    pub created_at: u64,
    pub last_fee_collection: u64,
}

impl Vault {
    pub const INIT_SPACE: usize = 32 + 132 + 32 + 33 + 33 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 46 + 8 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ManagerFeeStructure {
    pub performance_fee_rate: u16,        // basis points (2000 = 20%)
    pub management_fee_rate: u16,         // basis points (200 = 2%)
    pub collection_frequency: FeeCollectionFrequency,
    pub high_water_mark: u64,             // for performance fees
    pub fee_recipient: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum FeeCollectionFrequency {
    Monthly,
    Quarterly,
    Annually,
    OnWithdrawal,
}

#[account]
pub struct Transaction {
    // Unique identifier for the transaction.
    pub nonce: u64,
    // Boolean ensuring one time execution.
    pub did_execute: bool,
    // The multisig account this transaction belongs to.
    pub vault: Pubkey,
    // Target program to execute against.
    pub program_id: Pubkey,
    // Instruction data for the transaction.
    pub data: Vec<u8>,
    // Accounts requried for the transaction.
    pub accounts: Vec<TransactionAccount>,
}

impl From<&Transaction> for Instruction {
    fn from(tx: &Transaction) -> Instruction {
        Instruction {
            program_id: tx.program_id,
            accounts: tx.accounts.iter().map(Into::into).collect(),
            data: tx.data.clone(),
        }
    }
}

#[derive(Accounts)]
#[instruction(seed: String)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + Vault::INIT_SPACE,
        seeds = [seed.as_ref()],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    /// CHECK: authority is a PDA program signer
    #[account(
        seeds = [vault.key().as_ref()],
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct CreateTransaction<'info> {
    vault: Box<Account<'info, Vault>>,

    #[account(
        init, 
        payer = signer, 
        seeds = [vault.key().as_ref(), nonce.to_le_bytes().as_ref()], 
        bump, 
        space = 1024)]
    transaction: Box<Account<'info, Transaction>>,

    /// CHECK: policy account - will be validated for correct PDA derivation
    #[account(mut)]
    policy_account: AccountInfo<'info>,

    /// CHECK: policy program
    #[account(
        constraint = policy_program.key() == vault.policy_program @ ErrorCode::InvalidPolicyProgram
    )]
    policy_program: AccountInfo<'info>,

    /// CHECK: vault signer is a PDA program signer
    #[account(
        seeds = [vault.key().as_ref()],
        bump
    )]
    vault_signer: UncheckedAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteTransaction<'info> {
    vault: Box<Account<'info, Vault>>,
    transaction: Box<Account<'info, Transaction>>,

    /// CHECK: vault signer is a PDA program signer
    #[account(
        seeds = [vault.key().as_ref()],
        bump
    )]
    vault_signer: UncheckedAccount<'info>,

    /// CHECK: policy account - will be validated for correct PDA derivation (mutable for clearing pending transaction)
    #[account(mut)]
    policy_account: AccountInfo<'info>,

    /// CHECK: policy program
    #[account(
        constraint = policy_program.key() == vault.policy_program @ ErrorCode::InvalidPolicyProgram
    )]
    policy_program: AccountInfo<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: String, allocation: u64, child_policy: Pubkey)]
pub struct IssueChildVault<'info> {
    // Parent vault (source of funds)
    #[account(mut)]
    pub parent_vault: Account<'info, Vault>,
    
    // New child vault
    #[account(
        init,
        payer = admin,
        seeds = [
            parent_vault.key().as_ref(), 
            seed.as_ref(), 
            allocation.to_le_bytes().as_ref(),
            manager.key().as_ref()
        ],
        bump,
        space = 8 + Vault::INIT_SPACE
    )]
    pub child_vault: Account<'info, Vault>,
    
    /// CHECK: child vault authority (PDA)
    #[account(
        seeds = [child_vault.key().as_ref()],
        bump,
    )]
    pub child_authority: UncheckedAccount<'info>,
    
    // Manager registry
    #[account(
        mut,
        constraint = manager_registry.admin == admin.key() @ ErrorCode::UnauthorizedAdmin
    )]
    pub manager_registry: Account<'info, ManagerRegistry>,
    
    // Manager profile
    #[account(
        mut,
        constraint = manager_profile.manager_pubkey == manager.key() @ ErrorCode::InvalidManager,
        constraint = manager_profile.verification_status == VerificationStatus::Verified @ ErrorCode::UnverifiedManager
    )]
    pub manager_profile: Account<'info, ManagerProfile>,
    
    /// CHECK: child policy
    pub child_policy: UncheckedAccount<'info>,
    
    /// CHECK: manager
    pub manager: UncheckedAccount<'info>,
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_vault(
    ctx: Context<InitializeVault>,
    policy_program: Pubkey,
    seed: String,
) -> Result<()> {
    ctx.accounts.vault.policy_program = policy_program;
    ctx.accounts.vault.seed = seed;
    ctx.accounts.vault.authority = ctx.accounts.authority.key();
    Ok(())
}

pub fn create_tx<'a, 'b, 'c:'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, CreateTransaction<'info>>,
    nonce: u64,
    pid: Pubkey,
    accs: Vec<TransactionAccount>,
    data: Vec<u8>
) -> Result<()> {
    if ctx.accounts.policy_account.key() != ctx.accounts.policy_program.key() {
        require!(
            ctx.accounts.policy_account.owner == &ctx.accounts.policy_program.key(),
            ErrorCode::InvalidPolicyAccount
        );
    }
    
    let tx = &mut ctx.accounts.transaction;

    // Set transaction data first
    tx.nonce = nonce;
    tx.vault = ctx.accounts.vault.key();
    tx.program_id = pid;
    tx.data = data;
    tx.accounts = accs;
    tx.did_execute = false;

    // Prepare instruction AccountMetas for validate
    let mut account_metas = vec![
        AccountMeta::new_readonly(ctx.accounts.vault.key(), false),
    ];

    for acc_info in ctx.remaining_accounts.iter() {
        account_metas.push(AccountMeta {
            pubkey: acc_info.key(),
            is_signer: acc_info.is_signer,
            is_writable: acc_info.is_writable,
        });
    }

    // Validate function discriminator
    let instruction_discriminator: [u8; 8] = [60, 252, 90, 66, 246, 253, 232, 139];

    // Prepare instruction data
    let mut instruction_data = Vec::with_capacity(8);
    instruction_data.extend_from_slice(&instruction_discriminator);
    instruction_data.extend(ValidateOperation::Creation.try_to_vec()?);

    // Create instruction
    let instruction = Instruction {
        program_id: ctx.accounts.policy_program.key(),
        accounts: account_metas,
        data: instruction_data,
    };

    let mut all_infos = Vec::with_capacity(1 + ctx.remaining_accounts.len());
    all_infos.push(ctx.accounts.vault.to_account_info());
    all_infos.extend_from_slice(ctx.remaining_accounts);
    all_infos.push(ctx.accounts.policy_program.to_account_info());

    solana_program::program::invoke(
        &instruction,
        &all_infos,
    )?;

    Ok(())
}

pub fn execute_tx<'a, 'b, 'c:'info, 'info>(ctx: Context<'a, 'b, 'c, 'info, ExecuteTransaction<'info>>) -> Result<()> {
    if ctx.accounts.transaction.did_execute {
        return Err(crate::ErrorCode::TransactionAlreadyExecuted.into());
    }
    
    if ctx.accounts.policy_account.key() != ctx.accounts.policy_program.key() {
        require!(
            ctx.accounts.policy_account.owner == &ctx.accounts.policy_program.key(),
            ErrorCode::InvalidPolicyAccount
        );
    }

    // For validation, we need the required accounts
    // but NOT the ix.keys which are at the end of remaining_accounts
    let ix_accounts_len = ctx.accounts.transaction.accounts.len();
   
    let required_accounts_len = ctx.remaining_accounts.len() - ix_accounts_len;
    let required_accounts = &ctx.remaining_accounts[..required_accounts_len];

    // Prepare instruction AccountMetas for validate
    let mut account_metas = vec![
        AccountMeta::new_readonly(ctx.accounts.vault.key(), false),
    ];

    for acc_info in required_accounts.iter() {
        account_metas.push(AccountMeta {
            pubkey: acc_info.key(),
            is_signer: acc_info.is_signer,
            is_writable: acc_info.is_writable,
        });
    }

    // Validate function discriminator
    let instruction_discriminator: [u8; 8] = [60, 252, 90, 66, 246, 253, 232, 139];

    // Prepare instruction data
    let mut instruction_data = Vec::with_capacity(8);
    instruction_data.extend_from_slice(&instruction_discriminator);
    instruction_data.extend(ValidateOperation::Execution.try_to_vec()?);

    // Execute instruction
    let instruction = Instruction {
        program_id: ctx.accounts.policy_program.key(),
        accounts: account_metas,
        data: instruction_data,
    };

    let mut all_infos = Vec::with_capacity(1 + required_accounts.len() + 1);
    all_infos.push(ctx.accounts.vault.to_account_info());
    all_infos.extend_from_slice(required_accounts);
    all_infos.push(ctx.accounts.policy_program.to_account_info());

    // Call policy validate
    solana_program::program::invoke(
        &instruction,
        &all_infos,
    )?;

    let mut ix: Instruction = (*ctx.accounts.transaction).deref().into();
    ix.accounts = ix
        .accounts
        .iter()
        .map(|acc| {
            let mut acc = acc.clone();
            if acc.pubkey == ctx.accounts.vault.authority {
                acc.is_signer = true;
            }
            acc
        })
        .collect();

    let seed = ctx.accounts.vault.key();
    let seeds = &[&seed.as_ref()[..], &[ctx.bumps.vault_signer]];
    let signer = &[&seeds[..]];

    msg!("invoking signed ix: {:?}", ix.accounts.iter().map(|a| format!("{}: {} {}", a.pubkey, a.is_writable, a.is_signer)).collect::<Vec<String>>().join("\n"));
    solana_program::program::invoke_signed(&ix, &ctx.remaining_accounts, signer)?;

    // TODO: Tx execution policy check
    ctx.accounts.transaction.did_execute = true;
    Ok(())
}

pub fn issue_child_vault(
    ctx: Context<IssueChildVault>,
    _seed: String,
    allocation: u64,
    manager_fees: ManagerFeeStructure,
) -> Result<()> {
    // Validate allocation
    let parent_balance = ctx.accounts.parent_vault.total_balance;
    require!(allocation <= parent_balance, ErrorCode::InsufficientFunds);
    require!(allocation > 0, ErrorCode::InvalidAllocation);
    
    // Initialize child vault
    let child_vault = &mut ctx.accounts.child_vault;
    child_vault.policy_program = ctx.accounts.child_policy.key();
    child_vault.seed = format!("child_{}_{}", allocation, ctx.accounts.manager.key());
    child_vault.authority = ctx.accounts.child_authority.key();
    child_vault.manager = Some(ctx.accounts.manager.key());
    child_vault.parent_vault = Some(ctx.accounts.parent_vault.key());
    child_vault.allocation = allocation;
    child_vault.onchain_balance = allocation;
    child_vault.offchain_balance = 0;
    child_vault.total_balance = allocation;
    child_vault.high_water_mark = allocation;
    child_vault.total_fees_paid = 0;
    child_vault.manager_fees = Some(manager_fees);
    child_vault.created_at = Clock::get()?.unix_timestamp as u64;
    child_vault.last_fee_collection = Clock::get()?.unix_timestamp as u64;
    child_vault.last_balance_update = Clock::get()?.unix_timestamp as u64;
    
    // Transfer allocation from parent to child
    ctx.accounts.parent_vault.onchain_balance -= allocation;
    ctx.accounts.parent_vault.total_balance -= allocation;
    
    // Update manager profile
    let manager_profile = &mut ctx.accounts.manager_profile;
    manager_profile.active_vaults += 1;
    manager_profile.total_aum += allocation;
    manager_profile.last_activity = Clock::get()?.unix_timestamp as u64;
    
    // Update registry
    ctx.accounts.manager_registry.total_aum += allocation;
    
    Ok(())
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TransactionAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

impl From<&TransactionAccount> for AccountMeta {
    fn from(account: &TransactionAccount) -> AccountMeta {
        match account.is_writable {
            false => AccountMeta::new_readonly(account.pubkey, account.is_signer),
            true => AccountMeta::new(account.pubkey, account.is_signer),
        }
    }
}

impl From<&AccountMeta> for TransactionAccount {
    fn from(account_meta: &AccountMeta) -> TransactionAccount {
        TransactionAccount {
            pubkey: account_meta.pubkey,
            is_signer: account_meta.is_signer,
            is_writable: account_meta.is_writable,
        }
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized admin access.")]
    UnauthorizedAdmin,
    #[msg("Invalid manager profile.")]
    InvalidManager,
    #[msg("Manager is not verified.")]
    UnverifiedManager,
    #[msg("Insufficient funds for allocation.")]
    InsufficientFunds,
    #[msg("Invalid allocation amount.")]
    InvalidAllocation,
    #[msg("Invalid policy account - PDA derivation failed.")]
    InvalidPolicyAccount,
    #[msg("Invalid policy program.")]
    InvalidPolicyProgram,
}