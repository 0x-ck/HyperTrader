use anchor_lang::prelude::*;
use hyro_sdk::{get_context, ValidateOperation, ValidateContext};

declare_id!("DP8vZFZ1PtxAU9SSp46eGtggxBHa6N6hj5pQaGAW9gKx");

#[program]
pub mod policy_multisig {
    use super::*;
    pub fn validate<'a, 'b, 'c:'info, 'info>(ctx: Context<'a, 'b, 'c, 'info, Validate<'info>>, operation: ValidateOperation) -> Result<()> {
        // Check that policy_account is the correct PDA for this vault (seeds == vault.key())
        let (expected_policy_pda, _) = Pubkey::find_program_address(
            &[ctx.accounts.vault.key().as_ref()],
            &crate::ID
        );
        
        // Get context based on operation type
        let validate_ctx = get_context(operation);
        match validate_ctx {
            ValidateContext::Creation(creation_ctx) => {
                creation_ctx.validate_accounts(ctx.remaining_accounts)?;

                let policy_account = creation_ctx.policy_account(ctx.remaining_accounts);
                let transaction = creation_ctx.transaction(ctx.remaining_accounts);
                let sender = creation_ctx.signer(ctx.remaining_accounts);

                require!(policy_account.key() == expected_policy_pda, ErrorCode::InvalidPolicyPda);
                
                let mut multisig = {
                    let data = policy_account.data.borrow();
                    MultiSig::try_deserialize(&mut &data[..])?
                };
                
                // Check if there's already a pending transaction
                if multisig.pending_transaction.is_some() {
                    return Err(ErrorCode::TransactionAlreadyPending.into());
                }
                
                // Store the transaction as pending
                multisig.pending_transaction = Some(transaction.key());
                msg!("pending_transaction: {:?}", multisig.pending_transaction);

                // Find the owner index and mark their signature
                let owner_index = multisig
                    .owners
                    .iter()
                    .position(|a| a == &sender.key())
                    .ok_or(ErrorCode::InvalidOwner)?;
                multisig.pending_signatures[owner_index] = true;
                
                let mut data = policy_account.try_borrow_mut_data()?;
                {
                    let mut writer = &mut &mut data[..];
                    multisig.try_serialize(&mut writer)?;                    
                }
                
                Ok(())
            }
            ValidateContext::Execution(execution_ctx) => {
                execution_ctx.validate_accounts(ctx.remaining_accounts)?;

                let policy_account = execution_ctx.policy_account(ctx.remaining_accounts);
                let transaction = execution_ctx.transaction(ctx.remaining_accounts);
                require!(policy_account.key() == expected_policy_pda, ErrorCode::InvalidPolicyPda);

                let mut multisig = {
                    let data = policy_account.data.borrow();
                    MultiSig::try_deserialize(&mut &data[..])?
                };
                // Check if there's a pending transaction that needs to be validated
                if let Some(pending_tx) = multisig.pending_transaction {
                    if pending_tx == transaction.key() {
                        // Validate pending transaction signatures
                        let sig_count = 
                            multisig
                            .pending_signatures
                            .iter()
                            .filter(|&did_sign| *did_sign)
                            .count() as u64;
                        if sig_count < multisig.threshold {
                            return Err(ErrorCode::NotEnoughSigners.into());
                        }
                        
                        // Clear pending transaction after successful validation
                        multisig.pending_transaction = None;
                        multisig.pending_signatures = vec![false; multisig.owners.len()];

                        let mut data = policy_account.try_borrow_mut_data()?;
                        {
                            let mut writer = &mut &mut data[..];
                            multisig.try_serialize(&mut writer)?;                    
                        }
                        
                        return Ok(());
                    } else {
                        return Err(ErrorCode::InvalidPendingTransaction.into());
                    } 
                } else {
                    return Err(ErrorCode::NoPendingTransaction.into());
                }
            }
        }
    }
        
    pub fn initialize_multisig(ctx: Context<Initialize>, owners: Vec<Pubkey>, threshold: u64) -> Result<()> {
        assert_unique_owners(&owners)?;
        require!(
            threshold > 0 && threshold <= owners.len() as u64,
            ErrorCode::InvalidThreshold
        );
        require!(!owners.is_empty(), ErrorCode::InvalidOwnersLen);

        let multisig = &mut ctx.accounts.policy_account;
        multisig.owners = owners;
        multisig.threshold = threshold;

        // Initialize pending transaction state
        multisig.pending_transaction = None;
        let mut pending_signatures = Vec::new();
        pending_signatures.resize(multisig.owners.len(), false);
        multisig.pending_signatures = pending_signatures;

        Ok(())
    }

    // Approves a transaction on behalf of an owner of the policy_account.
    pub fn approve(ctx: Context<Approve>) -> Result<()> {
        let owner_index = ctx
            .accounts
            .policy_account
            .owners
            .iter()
            .position(|a| a == ctx.accounts.owner.key)
            .ok_or(ErrorCode::InvalidOwner)?;

        // Only allow approval if there's a pending transaction
        if ctx.accounts.policy_account.pending_transaction.is_some() {
            ctx.accounts.policy_account.pending_signatures[owner_index] = true;
        } else {
            return Err(ErrorCode::NoPendingTransaction.into());
        }

        Ok(())
    }
}

fn assert_unique_owners(owners: &[Pubkey]) -> Result<()> {
    for (i, owner) in owners.iter().enumerate() {
        require!(
            !owners.iter().skip(i + 1).any(|item| item == owner),
            ErrorCode::UniqueOwners
        )
    }
    Ok(())
}

#[account]
#[derive(Debug)]
pub struct MultiSig {
    pub owners: Vec<Pubkey>,
    pub threshold: u64,
    // Pending transaction information for multi-sig validation
    pub pending_transaction: Option<Pubkey>,
    // Bitmask of signers who have approved the pending transaction
    pub pending_signatures: Vec<bool>,
}
#[derive(Accounts)]
pub struct Validate<'info> {
    /// CHECK: This is the vault account
    vault: UncheckedAccount<'info>
}
#[derive(Accounts)]
#[instruction(owners: Vec<Pubkey>)]
pub struct Initialize<'info> {
    /// CHECK: This is the vault account used as seed for PDA derivation
    vault: UncheckedAccount<'info>,
    
    #[account(
        init,
        seeds = [vault.key().as_ref()],
        bump,
        payer = signer,
        space = 8 + 4 + owners.len() * 32 + 8 + 1 + 32 + 4 + owners.len()
    )]
    policy_account: Box<Account<'info, MultiSig>>,

    #[account(mut)]
    signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Approve<'info> {
    #[account(mut)]
    policy_account: Box<Account<'info, MultiSig>>,
    // One of the policy_account owners. Checked in the handler.
    owner: Signer<'info>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid threshold.")]
    InvalidThreshold,
    #[msg("Owners length must be non zero.")]
    InvalidOwnersLen,
    #[msg("Invalid owner.")]
    InvalidOwner,
    #[msg("Not enough owners signed this transaction.")]
    NotEnoughSigners,
    #[msg("Owners must be unique")]
    UniqueOwners,
    #[msg("The given transaction has already been executed.")]
    AlreadyExecuted,
    #[msg("A transaction is already pending approval.")]
    TransactionAlreadyPending,
    #[msg("No pending transaction to approve.")]
    NoPendingTransaction,
    #[msg("The given transaction is not pending approval.")]
    InvalidPendingTransaction,
    #[msg("Invalid policy PDA.")]
    InvalidPolicyPda,
}
