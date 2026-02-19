"use client";

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Address } from "@solana/kit";
import { memo } from "react";
import { ChallengeTemplate, StageType } from "@/protocol/policyChallenges";
import { Address as AddressBox } from "../onchain/address";

type ChallengeTemplateDetailsProps = {
  address: Address;
  templateData?: ChallengeTemplate | null;
  isLoading: boolean;
  onRefresh?: () => void;
};

export const ChallengeTemplateDetails = memo(
  ({ address, templateData, isLoading }: ChallengeTemplateDetailsProps) => {
    if (isLoading) {
      return (
        <Card className="w-full">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!templateData) {
      return (
        <Card className="w-full">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">No template data available</p>
          </CardContent>
        </Card>
      );
    }

    const stageType = templateData.stageType === StageType.Evaluation ? "Evaluation" : "Funded";
    const lamportsToSol = (lamports: bigint) => 
      (Number(lamports) / 1e9).toFixed(4);
    const bpsToPercent = (bps: number) => (bps / 100).toFixed(2);

    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold">
                Stage {templateData.stageId}
              </h4>
              <AddressBox className="text-xs">{address}</AddressBox>
            </div>
            <div className="flex gap-2">
              <Badge variant={templateData.isActive ? "default" : "secondary"}>
                {templateData.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">{stageType}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Sequence</p>
              <p className="font-medium">{templateData.stageSequence}</p>
            </div>

            <div>
              <p className="text-gray-500">Starting Deposit</p>
              <p className="font-medium">
                {lamportsToSol(templateData.startingDeposit)} USD
              </p>
            </div>

            <div>
              <p className="text-gray-500">Entrance Cost</p>
              <p className="font-medium">
                {lamportsToSol(templateData.entranceCost)} USD
              </p>
            </div>

            <div>
              <p className="text-gray-500">Participants</p>
              <p className="font-medium">
                {templateData.participants[0]} / {templateData.maxParticipants[0]}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Total Pool</p>
              <p className="font-medium">
                {lamportsToSol(templateData.totalPool)} USD
              </p>
            </div>

            <div>
              <p className="text-gray-500">Min Trading Days</p>
              <p className="font-medium">{templateData.minimumTradingDays[0]}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Trading Rules
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-blue-50 p-2 rounded">
                <p className="text-gray-600">Profit Target</p>
                <p className="font-semibold text-blue-700">
                  {bpsToPercent(templateData.profitTarget[0])}%
                </p>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <p className="text-gray-600">Daily Drawdown</p>
                <p className="font-semibold text-orange-700">
                  {bpsToPercent(templateData.dailyDrawdown[0])}%
                </p>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <p className="text-gray-600">Max Loss</p>
                <p className="font-semibold text-red-700">
                  {bpsToPercent(templateData.maximumLoss[0])}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500">Admin</p>
            <AddressBox className="text-xs">{templateData.admin}</AddressBox>
          </div>

          <div className="mt-2">
            <p className="text-xs text-gray-500">Token Mint</p>
            <AddressBox className="text-xs">{templateData.entranceTokenMint}</AddressBox>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ChallengeTemplateDetails.displayName = "ChallengeTemplateDetails";

