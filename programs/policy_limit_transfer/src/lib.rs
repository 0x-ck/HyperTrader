use anchor_lang::prelude::*;
use hyro_sdk::{get_context, ValidateOperation, ValidateContext};

// .keys/allow_any.json
declare_id!("J4JzdiMJt2YJubjvkndS2KPwJC7MiLMopZLsYGKBMYfG");
#[program]
pub mod policy_limit_transfer {
    use super::*;
    pub fn validate<'a, 'b, 'c:'info, 'info>(ctx: Context<'a, 'b, 'c, 'info, Validate<'info>>, operation: ValidateOperation) -> Result<()> {
        // Check that policy_account is the correct PDA for this vault (seeds == vault.key())
        let (expected_policy_pda, _) = Pubkey::find_program_address(
            &[ctx.accounts.vault.key().as_ref()],
            &crate::ID
        );

        let validate_ctx = get_context(operation);
        match validate_ctx {
            ValidateContext::Creation(creation_ctx) => {
                creation_ctx.validate_accounts(ctx.remaining_accounts)?;

                let policy_account = creation_ctx.policy_account(ctx.remaining_accounts);
                require!(policy_account.key() == expected_policy_pda, ErrorCode::InvalidPolicyPda);

                Ok(())
            }
            ValidateContext::Execution(execution_ctx) => {
                execution_ctx.validate_accounts(ctx.remaining_accounts)?;

                let policy_account = execution_ctx.policy_account(ctx.remaining_accounts);
                let transaction = execution_ctx.transaction(ctx.remaining_accounts);
                require!(policy_account.key() == expected_policy_pda, ErrorCode::InvalidPolicyPda);

                // Manual parsing since owner constraint doesnt work as expected...
                let data = transaction.data.borrow();
                let transaction = Transaction::try_deserialize(&mut &data[..])?;
                let payload = transaction.data;
                let policy_data = policy_account.data.borrow();
                let policy = LimitTransfer::try_deserialize(&mut &policy_data[..])?;
                let max = policy.max;
                let min = policy.min;
                msg!("max: {}, min: {}", max, min);
                let amount = u64::from_le_bytes(payload[8..].try_into().unwrap());

                if amount > max {
                    return Err(ErrorCode::AmountTooHigh.into());
                }

                if amount < min {
                    return Err(ErrorCode::AmountTooLow.into());
                }

                Ok(())
            }
        }
    }

    pub fn initialize_limit_transfer(
        ctx: Context<Initialize>,
        min: u64,
        max: u64,
    ) -> Result<()> {
        ctx.accounts.policy_account.max = max;
        ctx.accounts.policy_account.min = min;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TransactionAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

#[account]
#[derive(Debug)]
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

#[account]
pub struct LimitTransfer {
    pub max: u64,
    pub min: u64,
}

#[derive(Accounts)]
pub struct Validate<'info> {
    /// CHECK: This is the vault account
    vault: UncheckedAccount<'info>
}
#[derive(Accounts)]
#[instruction(min: u64, max: u64)]
pub struct Initialize<'info> {
    /// CHECK: This is the vault account used as seed for PDA derivation
    vault: UncheckedAccount<'info>,
    
    #[account(
        init,
        seeds = [vault.key().as_ref()],
        bump,
        payer = signer,
        space = 8 + 8 + 8
    )]
    policy_account: Box<Account<'info, LimitTransfer>>,

    #[account(mut)]
    signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid data.")]
    InvalidData,
    #[msg("Amount too high.")]
    AmountTooHigh,
    #[msg("Amount too low.")]
    AmountTooLow,
    #[msg("Invalid seed. Non ASCII")]
    InvalidSeed,
    #[msg("Invalid policy PDA.")]
    InvalidPolicyPda,
}
