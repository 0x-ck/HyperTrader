use anchor_lang::prelude::*;
use crate::utils::*;
use crate::errors::ErrorCode;
use crate::states::*;


#[derive(Accounts)]
pub struct UpdateChallenge<'info> {
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    #[account(mut)]
    pub challenge_account: Account<'info, Challenge>,

    #[account(mut)]
    pub sender: Signer<'info>,
}

/// Updates an existing challenge (oracle calls this with whole document)
pub fn update_challenge(
    ctx: Context<UpdateChallenge>,
    dto: ChallengeUpdateDto,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_account;
    let template = &mut ctx.accounts.challenge_template_account;
    
    // Verify the challenge_id matches
    require!(
        challenge.challenge_id == dto.challenge_id,
        ErrorCode::InvalidChallengeId
    );

    // Only admin can update the challenge (oracle)
    require!(
        template.admin == ctx.accounts.sender.key(),
        ErrorCode::UnauthorizedAdmin
    );
    
    dto.validate()?;
    dto.apply_challenge(challenge);

    Ok(())
}
