use anchor_lang::prelude::*;
use crate::states::*;

/// Validates a challenge transaction creation
pub fn validate_creation(_ctx: Context<ValidateCreation>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct ValidateCreation<'info> {
    /// CHECK: This is the vault account
    pub vault: UncheckedAccount<'info>,
    /// CHECK: This is the transaction account
    pub transaction: UncheckedAccount<'info>,
    /// CHECK: This is the policy account
    pub policy_account: Account<'info, Challenge>,
    /// CHECK: original tx sender
    pub sender: UncheckedAccount<'info>,
    /// CHECK: vault signer
    pub signer: UncheckedAccount<'info>,
}

