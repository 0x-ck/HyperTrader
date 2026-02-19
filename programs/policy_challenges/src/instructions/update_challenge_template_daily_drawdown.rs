use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;
use crate::utils::Percent;

#[derive(Accounts)]
pub struct UpdateChallengeTemplateDailyDrawdown<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    pub signer: Signer<'info>,
}

/// Updates the daily drawdown limit percentage of a challenge template
pub fn update_challenge_template_daily_drawdown(
    ctx: Context<UpdateChallengeTemplateDailyDrawdown>,
    daily_drawdown: Percent,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Only admin can update the template
    require!(
        ctx.accounts.signer.key() == challenge.admin,
        ErrorCode::UnauthorizedAdmin
    );

    // Validate daily drawdown
    require!(
        <Percent as Into<i16>>::into(daily_drawdown) > 0i16,
        ErrorCode::InvalidDailyDrawdown
    );

    challenge.daily_drawdown = daily_drawdown;

    Ok(())
}


