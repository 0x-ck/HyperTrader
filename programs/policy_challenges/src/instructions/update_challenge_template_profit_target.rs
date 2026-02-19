use anchor_lang::prelude::*;
use crate::states::*;
use crate::utils::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct UpdateChallengeTemplateProfitTarget<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    pub signer: Signer<'info>,
}

/// Updates the profit target of a challenge template
pub fn update_challenge_template_profit_target(
    ctx: Context<UpdateChallengeTemplateProfitTarget>,
    profit_target: Percent,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Only admin can update the template
    require!(
        ctx.accounts.signer.key() == challenge.admin,
        ErrorCode::UnauthorizedAdmin
    );

    // Validate profit target
    require!(
        <Percent as Into<i16>>::into(profit_target) > 0i16,
        ErrorCode::InvalidProfitTarget
    );

    challenge.profit_target = profit_target;

    Ok(())
}

