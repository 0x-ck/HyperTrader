use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct UpdateChallengeTemplateEntranceTokenMint<'info> {
    #[account(mut)]
    pub challenge_template_account: Account<'info, ChallengeTemplate>,

    pub signer: Signer<'info>,
}

/// Updates the entrance token mint of a challenge template
pub fn update_challenge_template_entrance_token_mint(
    ctx: Context<UpdateChallengeTemplateEntranceTokenMint>,
    entrance_token_mint: Pubkey,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge_template_account;

    // Only admin can update the template
    require!(
        ctx.accounts.signer.key() == challenge.admin,
        ErrorCode::UnauthorizedAdmin
    );

    challenge.entrance_token_mint = entrance_token_mint;

    Ok(())
}


