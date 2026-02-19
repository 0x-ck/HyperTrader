use anchor_lang::prelude::*;
use crate::utils::*;

#[account]
#[derive(InitSpace)]
pub struct ChallengeTemplate {
    pub stage_id: u16,
    pub stage_sequence: u8,
    pub stage_type: StageType,
    pub starting_deposit: u64,
    pub admin: Pubkey,
    pub entrance_cost: u64,
    pub entrance_token_mint: Pubkey,
    pub minimum_trading_days: SmallScalar,
    pub daily_drawdown: Percent,
    pub maximum_loss: Percent,
    pub profit_target: Percent,
    pub max_participants: SmallScalar,
    pub participants: SmallScalar,
    pub total_pool: u64,
    pub is_active: bool,
}

#[account]
#[derive(InitSpace)]
pub struct Challenge {
    #[max_len(36)] // UUID
    pub challenge_id: String,
    pub stage_id: u16,
    pub stage_sequence: u8,
    pub stage_type: StageType,
    pub effective_from: u64,
    pub starting_balance: u64,
    pub latest_balance: u64,
    pub profit_target: ProfitTarget,
    pub trading_days: TradingDays,
    pub maximum_loss: MaximumLoss,
    pub daily_drawdown: DailyDrawdown,
    pub user: Pubkey,
    pub status: ChallengeStatus,
    pub payout: u64,
    pub created_at: u64,
    pub updated_at: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_challenge_template_init_space() {
        assert_eq!(ChallengeTemplate::INIT_SPACE, 105);
    }

    #[test]
    fn test_challenge_init_space() {
        assert_eq!(Challenge::INIT_SPACE, 202);
    }
}