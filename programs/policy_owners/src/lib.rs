use anchor_lang::prelude::*;
use hyro_sdk::{get_context, ValidateOperation, ValidateContext};

declare_id!("G2pCRumKN4itQdQUbwqy2r6wUNhjokHdQ1Yx6BbCKtRT");

#[program]
pub mod policy_owners {
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
                let sender = execution_ctx.signer(ctx.remaining_accounts);
                require!(policy_account.key() == expected_policy_pda, ErrorCode::InvalidPolicyPda);

                let policy_account_data = policy_account.data.borrow();
                let policy = Owners::try_deserialize(&mut &policy_account_data[..])?;
                if !policy.owners.contains(&sender.key()) {
                    return Err(ErrorCode::UnauthorizedSender.into());
                }
                Ok(())
            }
        }
        
        
    }

    pub fn initialize_owners(ctx: Context<Initialize>, owners: Vec<Pubkey>) -> Result<()> {
        ctx.accounts.policy_account.owners = owners;
        Ok(())
    }
}

#[account]
pub struct Owners {
    pub owners: Vec<Pubkey>
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
        space = 8 + 4 + owners.len() * 32
    )]
    policy_account: Box<Account<'info, Owners>>,

    #[account(mut)]
    signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized sender.")]
    UnauthorizedSender,
    #[msg("Invalid policy PDA.")]
    InvalidPolicyPda,
}