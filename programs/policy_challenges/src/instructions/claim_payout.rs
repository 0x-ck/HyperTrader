use anchor_lang::prelude::*;
use crate::states::*;

/// Allows a participant to claim their payout
pub fn claim_payout(_ctx: Context<ClaimPayout>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub challenge_account: Account<'info, Challenge>,

    #[account(mut)]
    pub participant: Signer<'info>,
}