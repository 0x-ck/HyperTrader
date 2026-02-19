import type {
  WebhookPayload,
  UpdateChallengeInstructionDataArgs,
} from "./types";
import { ChallengeStatus, DrawdownType } from "./generated";
import Decimal from "decimal.js";

/**
 * Converts percentage to basis points (0.01% = 1 basis point)
 * On-chain uses u16 for percentages (5% = 500)
 */
function percentageToBasisPoints(percentage: number): number {
  return Math.round(percentage * 100);
}

/**
 * Converts dollar amount string to lamports (smallest unit)
 * Assumes amounts are in whole dollars
 */
function amountToLamports(amount: string) {
  const numericAmount = Decimal(amount.replace(/,/g, ""))
    .mul(10 ** 9)
    .floor()
    .toNumber();
  return BigInt(numericAmount);
}

/**
 * Maps status string to ChallengeStatus enum
 */
function mapStatus(status: string): ChallengeStatus {
  const statusLower = status.toLowerCase();

  switch (statusLower) {
    case "pending":
      return ChallengeStatus.Pending;
    case "active":
      return ChallengeStatus.Active;
    case "halted":
      return ChallengeStatus.Halted;
    case "expired":
      return ChallengeStatus.Expired;
    case "failed":
      return ChallengeStatus.Failed;
    case "passed":
      return ChallengeStatus.Passed;
    default:
      return ChallengeStatus.Active;
  }
}

/**
 * Maps drawdown type string to enum variant
 */
function mapDrawdownType(type: string): DrawdownType {
  return type.toLowerCase() === "static"
    ? DrawdownType.Static
    : DrawdownType.Dynamic;
}

/**
 * Transforms webhook payload to ChallengeUpdateDto format
 */
export function transformMessageToUpdateDto(
  payload: WebhookPayload
): UpdateChallengeInstructionDataArgs {
  const status = payload.state_change_event
    ? mapStatus(payload.state_change_event.new_status)
    : ChallengeStatus.Active;

  return {
    challengeId: payload.challenge_id,
    latestBalance: amountToLamports(payload.current_balance),
    status,
    profitTarget: {
      target: [
        percentageToBasisPoints(payload.profit_target.target_percentage),
      ] as const,
      targetAmount: [
        amountToLamports(payload.profit_target.target_amount),
      ] as const,
      achieved: [
        percentageToBasisPoints(payload.profit_target.achieved_percentage),
      ] as const,
      achievedAmount: [
        amountToLamports(payload.profit_target.achieved_amount),
      ] as const,
    },
    tradingDays: {
      required: [payload.trading_days.required_days] as const,
      completed: [payload.trading_days.completed_days] as const,
      requirementsMet: payload.trading_days.requirement_met,
      remainingDays: [payload.trading_days.remaining_days] as const,
    },
    maximumLoss: {
      maximumLossPercentage: [
        percentageToBasisPoints(payload.max_loss.equity_loss_limit_percentage),
      ] as const,
      maximumLossAmount: [
        amountToLamports(payload.max_loss.equity_loss_limit_amount),
      ] as const,
      currentLossAchieved: [
        percentageToBasisPoints(payload.max_loss.current_loss_percentage),
      ] as const,
      currentLossAchievedAmount: [
        amountToLamports(payload.max_loss.current_loss),
      ] as const,
    },
    dailyDrawdown: {
      drawdownType: mapDrawdownType(payload.drawdown_limit.drawdown_type),
      limitPercentage: [
        percentageToBasisPoints(payload.drawdown_limit.limit_percentage),
      ] as const,
      limitAmount: [
        amountToLamports(payload.drawdown_limit.limit_amount),
      ] as const,
      maxEquity: [amountToLamports(payload.drawdown_limit.max_equity)] as const,
      currentDrawdownPercentage: [
        percentageToBasisPoints(
          payload.drawdown_limit.current_drawdown_percentage
        ),
      ] as const,
      currentDrawdownAmount: [
        amountToLamports(payload.drawdown_limit.current_drawdown),
      ] as const,
      violationTriggered: payload.drawdown_limit.violation_triggered,
    },
    payout: 0n, // Will be calculated based on challenge outcome
  };
}
