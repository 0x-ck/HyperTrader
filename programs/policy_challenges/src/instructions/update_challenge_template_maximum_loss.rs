use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;
use crate::utils::Percent;

#[derive(Accounts)]
pub struct UpdateChallengeTemplateMaximumLoss<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    pub signer: Signer<'info>,
}

/// Updates the maximum loss percentage of a challenge template
pub fn update_challenge_template_maximum_loss(
    ctx: Context<UpdateChallengeTemplateMaximumLoss>,
    maximum_loss: Percent,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Only admin can update the template
    require!(
        ctx.accounts.signer.key() == challenge.admin,
        ErrorCode::UnauthorizedAdmin
    );

    // Validate maximum loss
    require!(
        <Percent as Into<i16>>::into(maximum_loss) > 0i16,
        ErrorCode::InvalidMaximumLoss
    );

    challenge.maximum_loss = maximum_loss;

    Ok(())
}


