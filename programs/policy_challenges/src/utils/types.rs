use super::traits::*;
use crate::errors::ErrorCode;
use crate::states::*;
use anchor_lang::prelude::*;
use derive_more::{Add, AddAssign, Div, DivAssign, Mul, MulAssign, Sub, SubAssign};

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    AnchorSerialize,
    AnchorDeserialize,
    Add,
    Sub,
    Mul,
    Div,
    AddAssign,
    SubAssign,
    MulAssign,
    DivAssign,
)]
pub struct Percent(i16);

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    AnchorSerialize,
    AnchorDeserialize,
    Add,
    Sub,
    Mul,
    Div,
    AddAssign,
    SubAssign,
    MulAssign,
    DivAssign,
)]
pub struct Amount(i64);

impl Space for Amount {
    const INIT_SPACE: usize = 8;
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    AnchorSerialize,
    AnchorDeserialize,
    Add,
    Sub,
    Mul,
    Div,
    AddAssign,
    SubAssign,
    MulAssign,
    DivAssign,
)]
pub struct SmallScalar(i16);

impl Space for Percent {
    const INIT_SPACE: usize = 2;
}

impl Space for SmallScalar {
    const INIT_SPACE: usize = 2;
}

impl Into<i16> for Percent {
    fn into(self) -> i16 {
        self.0
    }
}

impl Into<Percent> for i16 {
    fn into(self) -> Percent {
        Percent(self)
    }
}

impl Into<i16> for SmallScalar {
    fn into(self) -> i16 {
        self.0
    }
}

impl Into<SmallScalar> for i16 {
    fn into(self) -> SmallScalar {
        SmallScalar(self)
    }
}

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct ChallengeTemplateUpdateInsertDto {
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
    pub is_active: bool,
}

impl ChallengeTemplateUpdateInsertDto {
    pub fn validate(&self) -> Result<()> {
        // Only validate if the field is provided (not None)
        require!(
            <SmallScalar as Into<i16>>::into(self.minimum_trading_days) > 0i16,
            ErrorCode::InvalidMinimumTradingDays
        );
        require!(
            <Percent as Into<i16>>::into(self.daily_drawdown) > 0i16,
            ErrorCode::InvalidDailyDrawdown
        );
        require!(
            <Percent as Into<i16>>::into(self.maximum_loss) > 0i16,
            ErrorCode::InvalidMaximumLoss
        );
        require!(
            <Percent as Into<i16>>::into(self.profit_target) > 0i16,
            ErrorCode::InvalidProfitTarget
        );
        require!(
            <SmallScalar as Into<i16>>::into(self.max_participants) > 0i16,
            ErrorCode::InvalidMaxParticipants
        );
        Ok(())
    }

    pub fn apply(&self, acc: &mut Account<ChallengeTemplate>) {
        // Set protected fields (only during creation)
        acc.stage_sequence = self.stage_sequence;
        acc.stage_type = self.stage_type;
        acc.starting_deposit = self.starting_deposit;

        // Set optional fields if provided
        acc.admin = self.admin;
        acc.entrance_cost = self.entrance_cost;
        acc.entrance_token_mint = self.entrance_token_mint;
        acc.minimum_trading_days = self.minimum_trading_days;
        acc.daily_drawdown = self.daily_drawdown;
        acc.maximum_loss = self.maximum_loss;
        acc.profit_target = self.profit_target;
        acc.is_active = self.is_active;
        acc.max_participants = self.max_participants;
    }
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ChallengeInsertDto {
    pub stage_id: u16,
    pub stage_sequence: u8,
    pub profit_target: ProfitTarget,
    pub trading_days: TradingDays,
    pub maximum_loss: MaximumLoss,
    pub daily_drawdown: DailyDrawdown,
    pub status: ChallengeStatus,
    pub payout: u64,
    pub created_at: u64,
}

impl ValidateDto for ChallengeInsertDto {
    fn validate(&self) -> Result<()> {
        self.profit_target.validate()?;
        self.trading_days.validate()?;
        self.maximum_loss.validate()?;
        self.daily_drawdown.validate()?;

        Ok(())
    }
}

impl ApplyOnChallenge for ChallengeInsertDto {
    fn apply_challenge(&self, acc: &mut Account<Challenge>) {
        self.profit_target.apply_challenge(acc);
        self.trading_days.apply_challenge(acc);
        self.maximum_loss.apply_challenge(acc);
        self.daily_drawdown.apply_challenge(acc);
        acc.status = self.status;
        acc.payout = self.payout;
        acc.created_at = self.created_at;
        acc.stage_id = self.stage_id;
        acc.stage_sequence = self.stage_sequence;
    }
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ChallengeUpdateDto {
    pub challenge_id: String,
    pub latest_balance: u64,
    pub status: ChallengeStatus,
    pub profit_target: ProfitTarget,
    pub trading_days: TradingDays,
    pub maximum_loss: MaximumLoss,
    pub daily_drawdown: DailyDrawdown,
    pub payout: u64,
}

impl ValidateDto for ChallengeUpdateDto {
    fn validate(&self) -> Result<()> {
        self.profit_target.validate()?;
        self.trading_days.validate()?;
        self.maximum_loss.validate()?;
        self.daily_drawdown.validate()?;

        Ok(())
    }
}

impl ApplyOnChallenge for ChallengeUpdateDto {
    fn apply_challenge(&self, acc: &mut Account<Challenge>) {
        acc.latest_balance = self.latest_balance;
        self.profit_target.apply_challenge(acc);
        self.trading_days.apply_challenge(acc);
        self.maximum_loss.apply_challenge(acc);
        self.daily_drawdown.apply_challenge(acc);
        acc.status = self.status;
        acc.payout = self.payout;
        // Always update the updated_at timestamp
        acc.updated_at = Clock::get().unwrap().unix_timestamp as u64;
    }
}

#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum StageType {
    Evaluation,
    Funded,
}

impl Space for StageType {
    const INIT_SPACE: usize = 1;
}

#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum ChallengeStatus {
    Pending,
    Active,
    Halted,
    Expired,
    Failed,
    Passed,
}

impl Space for ChallengeStatus {
    const INIT_SPACE: usize = 1;
}

impl Into<ChallengeStatus> for u8 {
    fn into(self) -> ChallengeStatus {
        match self {
            0 => ChallengeStatus::Pending,
            1 => ChallengeStatus::Active,
            2 => ChallengeStatus::Halted,
            3 => ChallengeStatus::Expired,
            4 => ChallengeStatus::Failed,
            5 => ChallengeStatus::Passed,
            _ => panic!("Invalid challenge status"),
        }
    }
}
impl Into<u8> for ChallengeStatus {
    fn into(self) -> u8 {
        self as u8
    }
}

#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct ProfitTarget {
    pub target: Percent,
    pub target_amount: Amount,
    pub achieved: Percent,
    pub achieved_amount: Amount,
}

impl ValidateDto for ProfitTarget {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

impl ApplyOnChallenge for ProfitTarget {
    fn apply_challenge(&self, acc: &mut Account<Challenge>) {
        acc.profit_target.target = self.target;
        acc.profit_target.target_amount = self.target_amount;
        acc.profit_target.achieved = self.achieved;
        acc.profit_target.achieved_amount = self.achieved_amount;
    }
}

impl ApplyOnTemplate for ProfitTarget {
    fn apply_template(&self, acc: &mut Account<ChallengeTemplate>) {
        acc.profit_target = self.target;
    }
}

impl Space for ProfitTarget {
    const INIT_SPACE: usize = <Percent as Space>::INIT_SPACE
        + <Amount as Space>::INIT_SPACE
        + <Percent as Space>::INIT_SPACE
        + <Amount as Space>::INIT_SPACE;
}

#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct TradingDays {
    pub required: SmallScalar,
    pub completed: SmallScalar,
    pub requirements_met: bool,
    pub remaining_days: SmallScalar,
}

impl ValidateDto for TradingDays {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

impl ApplyOnChallenge for TradingDays {
    fn apply_challenge(&self, acc: &mut Account<Challenge>) {
        acc.trading_days.required = self.required;
        acc.trading_days.completed = self.completed;
        acc.trading_days.requirements_met = self.requirements_met;
        acc.trading_days.remaining_days = self.remaining_days;
    }
}

impl ApplyOnTemplate for TradingDays {
    fn apply_template(&self, acc: &mut Account<ChallengeTemplate>) {
        acc.minimum_trading_days = self.required;
    }
}

impl Space for TradingDays {
    const INIT_SPACE: usize = <SmallScalar as Space>::INIT_SPACE
        + <SmallScalar as Space>::INIT_SPACE
        + 1
        + <SmallScalar as Space>::INIT_SPACE;
}

#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct MaximumLoss {
    pub maximum_loss_percentage: Percent,
    pub maximum_loss_amount: Amount,
    pub current_loss_achieved: Percent,
    pub current_loss_achieved_amount: Amount,
}

impl ValidateDto for MaximumLoss {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

impl ApplyOnChallenge for MaximumLoss {
    fn apply_challenge(&self, acc: &mut Account<Challenge>) {
        acc.maximum_loss.maximum_loss_percentage = self.maximum_loss_percentage;
        acc.maximum_loss.maximum_loss_amount = self.maximum_loss_amount;
        acc.maximum_loss.current_loss_achieved = self.current_loss_achieved;
        acc.maximum_loss.current_loss_achieved_amount = self.current_loss_achieved_amount;
    }
}

impl ApplyOnTemplate for MaximumLoss {
    fn apply_template(&self, acc: &mut Account<ChallengeTemplate>) {
        acc.maximum_loss = self.maximum_loss_percentage;
    }
}

impl Space for MaximumLoss {
    const INIT_SPACE: usize = <Percent as Space>::INIT_SPACE
        + <Amount as Space>::INIT_SPACE
        + <Percent as Space>::INIT_SPACE
        + <Amount as Space>::INIT_SPACE;
}

#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum DrawdownType {
    Static,
    Dynamic,
}

impl Space for DrawdownType {
    const INIT_SPACE: usize = 1;
}

#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct DailyDrawdown {
    pub drawdown_type: DrawdownType,
    pub limit_percentage: Percent,
    pub limit_amount: Amount,
    pub max_equity: Amount,
    pub current_drawdown_percentage: Percent,
    pub current_drawdown_amount: Amount,
    pub violation_triggered: bool,
}

impl Space for DailyDrawdown {
    const INIT_SPACE: usize = <DrawdownType as Space>::INIT_SPACE
        + <Percent as Space>::INIT_SPACE
        + <Amount as Space>::INIT_SPACE
        + <Amount as Space>::INIT_SPACE
        + <Percent as Space>::INIT_SPACE
        + <Amount as Space>::INIT_SPACE
        + 1;
}

impl ValidateDto for DailyDrawdown {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

impl ApplyOnChallenge for DailyDrawdown {
    fn apply_challenge(&self, acc: &mut Account<Challenge>) {
        acc.daily_drawdown.drawdown_type = self.drawdown_type;
        acc.daily_drawdown.limit_percentage = self.limit_percentage;
        acc.daily_drawdown.limit_amount = self.limit_amount;
        acc.daily_drawdown.max_equity = self.max_equity;
        acc.daily_drawdown.current_drawdown_percentage = self.current_drawdown_percentage;
        acc.daily_drawdown.current_drawdown_amount = self.current_drawdown_amount;
        acc.daily_drawdown.violation_triggered = self.violation_triggered;
    }
}

impl ApplyOnTemplate for DailyDrawdown {
    fn apply_template(&self, acc: &mut Account<ChallengeTemplate>) {
        acc.daily_drawdown = self.limit_percentage;
    }
}
