use anchor_lang::prelude::*;
use crate::utils::*;
use crate::states::*;

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct JoinChallengeTemplate<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    #[account(init, payer = participant, seeds = [participant.key().as_ref(), challenge_id.as_ref()], bump, space = 8 + <Challenge as Space>::INIT_SPACE)]
    pub challenge_account: Account<'info, Challenge>,

    #[account(mut)]
    pub participant: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Allows a user to join an existing challenge template
pub fn join_challenge(
    ctx: Context<JoinChallengeTemplate>, 
    challenge_id: String, 
    dto: ChallengeInsertDto
) -> Result<()> {
    let challenge_template = &mut ctx.accounts.challenge_template_account;
    let challenge = &mut ctx.accounts.challenge_account;

    dto.validate()?;
    dto.apply_challenge(challenge);

    // Set protected fields that cannot be changed after creation
    challenge.challenge_id = challenge_id;
    challenge.stage_id = challenge_template.stage_id;
    challenge.stage_sequence = challenge_template.stage_sequence;
    challenge.stage_type = challenge_template.stage_type;
    challenge.effective_from = Clock::get()?.unix_timestamp as u64;
    challenge.starting_balance = challenge_template.starting_deposit;
    challenge.latest_balance = challenge_template.starting_deposit;
    challenge.user = ctx.accounts.participant.key();
    
    // Set timestamps
    challenge.created_at = Clock::get()?.unix_timestamp as u64;
    challenge.updated_at = Clock::get()?.unix_timestamp as u64;

    // Update template statistics
    challenge_template.participants += 1.into();
    challenge_template.total_pool += challenge_template.entrance_cost;

    Ok(())
}
