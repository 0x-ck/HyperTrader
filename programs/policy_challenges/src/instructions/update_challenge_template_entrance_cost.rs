use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct UpdateChallengeTemplateEntranceCost<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    pub signer: Signer<'info>,
}

/// Updates the entrance cost of a challenge template
pub fn update_challenge_template_entrance_cost(
    ctx: Context<UpdateChallengeTemplateEntranceCost>,
    entrance_cost: u64,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Only admin can update the template
    require!(
        ctx.accounts.signer.key() == challenge.admin,
        ErrorCode::UnauthorizedAdmin
    );

    // Validate entrance cost
    require!(entrance_cost > 0, ErrorCode::InvalidEntranceCost);

    challenge.entrance_cost = entrance_cost;

    Ok(())
}

