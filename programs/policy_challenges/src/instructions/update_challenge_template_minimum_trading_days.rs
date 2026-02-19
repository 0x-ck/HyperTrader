use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;
use crate::utils::SmallScalar;

#[derive(Accounts)]
pub struct UpdateChallengeTemplateMinimumTradingDays<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    pub signer: Signer<'info>,
}

/// Updates the minimum trading days of a challenge template
pub fn update_challenge_template_minimum_trading_days(
    ctx: Context<UpdateChallengeTemplateMinimumTradingDays>,
    minimum_trading_days: SmallScalar,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Only admin can update the template
    require!(
        ctx.accounts.signer.key() == challenge.admin,
        ErrorCode::UnauthorizedAdmin
    );

    // Validate minimum trading days
    require!(
        <SmallScalar as Into<i16>>::into(minimum_trading_days) > 0i16,
        ErrorCode::InvalidMinimumTradingDays
    );

    challenge.minimum_trading_days = minimum_trading_days;

    Ok(())
}


