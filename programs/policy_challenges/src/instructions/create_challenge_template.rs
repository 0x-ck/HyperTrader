use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(stage_id: u64)]
pub struct CreateChallengeTemplate<'info> {
    #[account(init, seeds = [stage_id.to_le_bytes().as_ref()], bump, payer = signer, space = 8 + <ChallengeTemplate as Space>::INIT_SPACE)]
    pub challenge_template_account: Box<Account<'info, ChallengeTemplate>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Creates a new challenge template with the specified stage_id and configuration
pub fn create_challenge_template(
    ctx: Context<CreateChallengeTemplate>,
    stage_id: u64,
    dto: ChallengeTemplateUpdateInsertDto,
) -> Result<()> {
    dto.validate()?;
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Set protected fields that cannot be changed after creation
    challenge.stage_id = stage_id as u16;
    challenge.participants = 0.into();
    challenge.total_pool = 0;

    // Apply other fields from DTO
    dto.apply(challenge);

    // Set admin if not provided in DTO
    Ok(())
}
