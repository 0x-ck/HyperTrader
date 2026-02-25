use anchor_lang::prelude::*;
use hyro_sdk::{get_context, ValidateOperation, ValidateContext};

declare_id!("G2pCRumKN4itQdQUbwqy2r6wUNhjokHdQ1Yx6BbCKtRT");

fn owners_contains_sender(policy_account: &AccountInfo, sender: &Pubkey) -> Result<bool> {
    let data = policy_account.data.borrow();

    // Anchor account layout:
    // - 8 bytes discriminator
    // - 4 bytes vec length (u32 LE)
    // - N * 32 bytes pubkeys
    require!(data.len() >= 8 + 4, ErrorCode::InvalidPolicyData);

    let mut offset = 8;
    let len_bytes: [u8; 4] = data[offset..offset + 4]
        .try_into()
        .map_err(|_| ErrorCode::InvalidPolicyData)?;
    let owners_len = u32::from_le_bytes(len_bytes) as usize;
    offset += 4;

    let required_len = offset
        .checked_add(owners_len.checked_mul(32).ok_or(ErrorCode::InvalidPolicyData)?)
        .ok_or(ErrorCode::InvalidPolicyData)?;
    require!(data.len() >= required_len, ErrorCode::InvalidPolicyData);

    let sender_bytes = sender.to_bytes();
    for i in 0..owners_len {
        let start = offset + i * 32;
        if data[start..start + 32] == sender_bytes {
            return Ok(true);
        }
    }
    Ok(false)
}

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

                let sender_key = sender.key();
                if !owners_contains_sender(policy_account, &sender_key)? {
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
    #[msg("Invalid policy account data.")]
    InvalidPolicyData,
}