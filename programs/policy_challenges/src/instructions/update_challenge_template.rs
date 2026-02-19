use anchor_lang::prelude::*;
use crate::states::*;
use crate::utils::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct UpdateChallengeTemplate<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    pub signer: Signer<'info>,
}

/// Updates an existing challenge template (only admin can update)
pub fn update_challenge_template(
    ctx: Context<UpdateChallengeTemplate>,
    dto: ChallengeTemplateUpdateInsertDto,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Only admin can update the template
    require!(
        ctx.accounts.signer.key() == challenge.admin,
        ErrorCode::UnauthorizedAdmin
    );

    dto.validate()?;
    dto.apply(challenge);

    Ok(())
}

