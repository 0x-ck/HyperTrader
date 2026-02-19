use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct UpdateChallengeTemplateIsActive<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    pub signer: Signer<'info>,
}

/// Updates the active status of a challenge template
pub fn update_challenge_template_is_active(
    ctx: Context<UpdateChallengeTemplateIsActive>,
    is_active: bool,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Only admin can update the template
    require!(
        ctx.accounts.signer.key() == challenge.admin,
        ErrorCode::UnauthorizedAdmin
    );

    challenge.is_active = is_active;

    Ok(())
}

