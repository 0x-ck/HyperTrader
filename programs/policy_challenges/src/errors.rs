use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized sender.")]
    UnauthorizedSender,
    #[msg("Unauthorized admin.")]
    UnauthorizedAdmin,
    #[msg("Challenge is not active.")]
    ChallengeNotActive,
    #[msg("Challenge is full.")]
    ChallengeFull,
    #[msg("Already participating in challenge.")]
    AlreadyParticipating,
    #[msg("Invalid time range.")]
    InvalidTimeRange,
    #[msg("Invalid max participants.")]
    InvalidMaxParticipants,
    #[msg("Invalid entrance cost.")]
    InvalidEntranceCost,
    #[msg("Invalid minimum trading days.")]
    InvalidMinimumTradingDays,
    #[msg("Invalid daily drawdown.")]
    InvalidDailyDrawdown,
    #[msg("Invalid maximum loss.")]
    InvalidMaximumLoss,
    #[msg("Invalid profit target.")]
    InvalidProfitTarget,
    #[msg("Invalid participant index.")]
    InvalidParticipantIndex,
    #[msg("Invalid challenge ID.")]
    InvalidChallengeId,
}
