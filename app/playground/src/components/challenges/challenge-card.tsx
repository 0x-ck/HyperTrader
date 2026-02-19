"use client";

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Address } from "@solana/kit";
import { memo } from "react";
import { Challenge, ChallengeStatus } from "@/protocol/policyChallenges";
import { Address as AddressBox } from "../onchain/address";
import { TokenAmount } from "../onchain/token-amount";
import Decimal from "decimal.js";

export type ChallengeData = Challenge;

type ChallengeCardProps = {
  challenge: Challenge;
  currentUserAddress?: Address;
  challengeAddress?: Address;
};

export const ChallengeCard = memo(
  ({ challenge, currentUserAddress, challengeAddress }: ChallengeCardProps) => {
    const lamportsToSol = (lamports: bigint) =>
      (Number(lamports) / 1e9).toFixed(4);
    const bpsToPercent = (bps: number) => (bps / 100).toFixed(2);

    const getStatusVariant = () => {
      switch (challenge.status) {
        case ChallengeStatus.Active:
          return "default";
        case ChallengeStatus.Passed:
          return "constructive";
        case ChallengeStatus.Expired:
        case ChallengeStatus.Halted:
        case ChallengeStatus.Failed:
          return "destructive";
        case ChallengeStatus.Pending:
          return "secondary";
      }
    };

    const getStatusLabel = () => {
      switch (challenge.status) {
        case ChallengeStatus.Active:
          return "Active";
        case ChallengeStatus.Passed:
          return "Passed";
        case ChallengeStatus.Expired:
        case ChallengeStatus.Halted:
        case ChallengeStatus.Failed:
          return "Failed";
        case ChallengeStatus.Pending:
          return "Pending";
      }
    };

    const isCurrentUser = currentUserAddress === challenge.user;

    const pnl = new Decimal(challenge.latestBalance - challenge.startingBalance).toNumber();
    const pnlPercent =
      challenge.startingBalance > 0n
        ? (
            (Number(challenge.latestBalance - challenge.startingBalance) /
              Number(challenge.startingBalance)) *
            100
          ).toFixed(2)
        : "0.00";

    return (
      <Card
        className={`w-full ${isCurrentUser ? "border-blue-300 border-2" : ""}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {challenge.challengeId}
              </p>
              <div className="flex gap-2">
                <div>
                  <p className="text-gray-600 text-xs">User</p>
                  <AddressBox className="text-xs">{challenge.user}</AddressBox>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Challenge</p>
                  <AddressBox className="text-xs">
                    {challengeAddress}
                  </AddressBox>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end ml-2">
              <Badge variant={getStatusVariant()} className="text-xs">
                {getStatusLabel()}
              </Badge>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs">
                  You
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-600">Balance</p>
              <TokenAmount className="font-semibold" isLoading={false} symbol="USD" decimals={9}>
                {challenge.latestBalance}
              </TokenAmount>
            </div>
            <div
              className={`p-2 rounded ${
                pnl >= 0 ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <p className="text-gray-600">P&L</p>
              <TokenAmount className="font-semibold" isLoading={false} symbol="USD" decimals={9} endContent={
                <span>({pnl >= 0 ? "+" : ""}{pnlPercent}%)</span>
              }>
                {BigInt(pnl)}
              </TokenAmount>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Trading Days</span>
              <span className="font-medium">
                {challenge.tradingDays.completed[0]} /{" "}
                {challenge.tradingDays.required[0]}
                {challenge.tradingDays.requirementsMet && " ✓"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Profit Target</span>
              <span className="font-medium">
                {bpsToPercent(challenge.profitTarget.achieved[0])} /{" "}
                {bpsToPercent(challenge.profitTarget.target[0])}%
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Drawdown</span>
              <span className="font-medium">
                {bpsToPercent(
                  challenge.dailyDrawdown.currentDrawdownPercentage[0]
                )}{" "}
                / {bpsToPercent(challenge.dailyDrawdown.limitPercentage[0])}%
                {challenge.dailyDrawdown.violationTriggered && " ⚠️"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Max Loss</span>
              <span className="font-medium">
                {bpsToPercent(challenge.maximumLoss.currentLossAchieved[0])} /{" "}
                {bpsToPercent(challenge.maximumLoss.maximumLossPercentage[0])}%
              </span>
            </div>
          </div>

          {challenge.payout > 0n && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 font-semibold">Payout</span>
                <span className="font-bold text-green-700">
                    {lamportsToSol(challenge.payout)} USD
                </span>
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Created</span>
              <span>
                {new Date(
                  Number(challenge.createdAt) * 1000
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Updated</span>
              <span>
                {new Date(
                  Number(challenge.updatedAt) * 1000
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ChallengeCard.displayName = "ChallengeCard";
