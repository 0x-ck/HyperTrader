use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;
use crate::utils::SmallScalar;

#[derive(Accounts)]
pub struct UpdateChallengeTemplateMaxParticipants<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    pub signer: Signer<'info>,
}

/// Updates the maximum allowed participants of a challenge template
pub fn update_challenge_template_max_participants(
    ctx: Context<UpdateChallengeTemplateMaxParticipants>,
    max_participants: SmallScalar,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Only admin can update the template
    require!(
        ctx.accounts.signer.key() == challenge.admin,
        ErrorCode::UnauthorizedAdmin
    );

    // Validate max participants
    require!(
        <SmallScalar as Into<i16>>::into(max_participants) > 0i16,
        ErrorCode::InvalidMaxParticipants
    );

    challenge.max_participants = max_participants;

    Ok(())
}


