use anchor_lang::prelude::*;
declare_id!("BhX2Cw1nh8WqBDH8QNFoNmqTKf6Df4W4aDkQCH4mtVno");

mod states;
mod utils;
mod errors;
mod instructions;

use states::*;
use instructions::*;
use utils::*;

#[program]
pub mod policy_challenges {
    use super::*;
    pub fn validate(ctx: Context<Validate>) -> Result<()> {
        instructions::validate(ctx)
    }

    pub fn validate_creation(ctx: Context<ValidateCreation>) -> Result<()> {
        instructions::validate_creation(ctx)
    }

    pub fn create_challenge_template(
        ctx: Context<CreateChallengeTemplate>,
        stage_id: u64,
        dto: ChallengeTemplateUpdateInsertDto,
    ) -> Result<()> {
        instructions::create_challenge_template(ctx, stage_id, dto)
    }

    pub fn update_challenge_template(
        ctx: Context<UpdateChallengeTemplate>,
        dto: ChallengeTemplateUpdateInsertDto,
    ) -> Result<()> {
        instructions::update_challenge_template(ctx, dto)
    }

    pub fn update_challenge_template_profit_target(
        ctx: Context<UpdateChallengeTemplateProfitTarget>,
        profit_target: Percent,
    ) -> Result<()> {
        instructions::update_challenge_template_profit_target(ctx, profit_target)
    }

    pub fn update_challenge_template_entrance_cost(
        ctx: Context<UpdateChallengeTemplateEntranceCost>,
        entrance_cost: u64,
    ) -> Result<()> {
        instructions::update_challenge_template_entrance_cost(ctx, entrance_cost)
    }

    pub fn update_challenge_template_entrance_token_mint(
        ctx: Context<UpdateChallengeTemplateEntranceTokenMint>,
        entrance_token_mint: Pubkey,
    ) -> Result<()> {
        instructions::update_challenge_template_entrance_token_mint(ctx, entrance_token_mint)
    }

    pub fn update_challenge_template_admin(
        ctx: Context<UpdateChallengeTemplateAdmin>,
        new_admin: Pubkey,
    ) -> Result<()> {
        instructions::update_challenge_template_admin(ctx, new_admin)
    }

    pub fn update_challenge_template_is_active(
        ctx: Context<UpdateChallengeTemplateIsActive>,
        is_active: bool,
    ) -> Result<()> {
        instructions::update_challenge_template_is_active(ctx, is_active)
    }

    pub fn update_challenge_template_minimum_trading_days(
        ctx: Context<UpdateChallengeTemplateMinimumTradingDays>,
        minimum_trading_days: SmallScalar,
    ) -> Result<()> {
        instructions::update_challenge_template_minimum_trading_days(ctx, minimum_trading_days)
    }

    pub fn update_challenge_template_daily_drawdown(
        ctx: Context<UpdateChallengeTemplateDailyDrawdown>,
        daily_drawdown: Percent,
    ) -> Result<()> {
        instructions::update_challenge_template_daily_drawdown(ctx, daily_drawdown)
    }

    pub fn update_challenge_template_maximum_loss(
        ctx: Context<UpdateChallengeTemplateMaximumLoss>,
        maximum_loss: Percent,
    ) -> Result<()> {
        instructions::update_challenge_template_maximum_loss(ctx, maximum_loss)
    }

    pub fn update_challenge_template_max_participants(
        ctx: Context<UpdateChallengeTemplateMaxParticipants>,
        max_participants: SmallScalar,
    ) -> Result<()> {
        instructions::update_challenge_template_max_participants(ctx, max_participants)
    }

    pub fn join_challenge(
        ctx: Context<JoinChallengeTemplate>, 
        challenge_id: String, 
        dto: ChallengeInsertDto
    ) -> Result<()> {
        instructions::join_challenge(ctx, challenge_id, dto)
    }

    pub fn update_challenge(
        ctx: Context<UpdateChallenge>,
        dto: ChallengeUpdateDto,
    ) -> Result<()> {
        instructions::update_challenge(ctx, dto)
    }

    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        instructions::claim_payout(ctx)
    }
}
