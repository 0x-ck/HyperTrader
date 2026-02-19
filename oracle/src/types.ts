// Re-export Codama generated types
export type {
  Challenge,
  ChallengeTemplate,
  ChallengeStatus,
  ChallengeStatusArgs,
  ProfitTarget,
  ProfitTargetArgs,
  TradingDays,
  TradingDaysArgs,
  MaximumLoss,
  MaximumLossArgs,
  DailyDrawdown,
  DailyDrawdownArgs,
  DrawdownType,
  StageType,
  UpdateChallengeInstructionDataArgs,
} from './generated';

// Webhook payload structure from external system
export interface WebhookPayload {
  challenge_id: string;
  stage_id: string;
  stage_sequence: number;
  stage_type: string;
  effective_from: string;
  starting_balance: string;
  current_balance: string;
  
  profit_target: {
    target_percentage: number;
    target_amount: string;
    achieved_percentage: number;
    achieved_amount: string;
    target_met: boolean;
  };
  
  trading_days: {
    required_days: number;
    completed_days: number;
    requirement_met: boolean;
    remaining_days: number;
  };
  
  max_loss: {
    equity_loss_limit_percentage: number;
    equity_loss_limit_amount: string;
    current_loss: string;
    current_loss_percentage: number;
    violation_triggered: boolean;
  };
  
  drawdown_limit: {
    drawdown_type: string;
    limit_percentage: number;
    limit_amount: string;
    max_equity: string;
    current_drawdown: string;
    current_drawdown_percentage: number;
    violation_triggered: boolean;
  };
  
  state_change_event?: {
    event_type: string;
    timestamp: string;
    previous_status: string;
    new_status: string;
    reason: string;
  };
}
