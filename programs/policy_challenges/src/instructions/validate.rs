use anchor_lang::prelude::*;
use crate::states::*;

/// Validates a challenge transaction
pub fn validate(_ctx: Context<Validate>) -> Result<()> {
    // For trader challenges, we allow anyone to participate
    // The validation is done at the individual function level
    Ok(())
}

#[derive(Accounts)]
pub struct Validate<'info> {
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

