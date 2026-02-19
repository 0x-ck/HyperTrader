use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct UpdateChallengeTemplateAdmin<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    pub signer: Signer<'info>,
}

/// Updates the admin of a challenge template
pub fn update_challenge_template_admin(
    ctx: Context<UpdateChallengeTemplateAdmin>,
    new_admin: Pubkey,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Only current admin can update the admin
    require!(
        ctx.accounts.signer.key() == challenge.admin,
        ErrorCode::UnauthorizedAdmin
    );

    challenge.admin = new_admin;

    Ok(())
}

