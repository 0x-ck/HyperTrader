"use client";

import { ManagerRecord } from "@/protocol/atoms";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { Address } from "../onchain/address";
import { useConnection } from "../onchain/connection-context";
import { useProtocol } from "../onchain/protocol-context";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { RiskRating, VerificationStatus } from "@/protocol/hyroProtocol/types";

export type ManagerData = ManagerRecord;

const riskRatingLabels = {
  [RiskRating.Conservative]: "Conservative",
  [RiskRating.Moderate]: "Moderate", 
  [RiskRating.Aggressive]: "Aggressive",
  [RiskRating.Speculative]: "Speculative",
};

const verificationStatusLabels = {
  [VerificationStatus.Pending]: "Pending",
  [VerificationStatus.Verified]: "Verified",
  [VerificationStatus.Suspended]: "Suspended",
  [VerificationStatus.Blacklisted]: "Blacklisted",
};

const verificationStatusColors = {
  [VerificationStatus.Pending]: "bg-yellow-100 text-yellow-800",
  [VerificationStatus.Verified]: "bg-green-100 text-green-800",
  [VerificationStatus.Suspended]: "bg-orange-100 text-orange-800",
  [VerificationStatus.Blacklisted]: "bg-red-100 text-red-800",
};

export const ManagerCard = memo((props: { 
  manager: ManagerData; 
  currentUserAddress?: string;
}) => {
  const { protocol } = useProtocol();
  const { connection } = useConnection();
  
  const { data: managerData } = useQuery({
    queryKey: ["managerProfile", props.manager.address],
    queryFn: () => protocol.hyroProtocol.fetchManagerProfile(connection, props.manager.address),
    enabled: !!props.manager.managerAddress, // Only fetch if it's a manager profile, not registry
  });
  
  const verificationStatus = props.manager.verificationStatus ?? VerificationStatus.Pending;
  const riskRating = props.manager.riskRating ?? RiskRating.Moderate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Manager Profile
          <Badge className={verificationStatusColors[verificationStatus]}>
            {verificationStatusLabels[verificationStatus]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Address</div>
          <Address>{props.manager.address}</Address>
        </div>
        
        {props.manager.managerAddress && (
          <div className="flex flex-col gap-1">
            <div className="font-semibold">Manager Address</div>
            <Address>{props.manager.managerAddress}</Address>
          </div>
        )}
        
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Risk Rating</div>
          <Badge variant="outline">
            {riskRatingLabels[riskRating]}
          </Badge>
        </div>
        
        {managerData && (
          <>
            <div className="flex flex-col gap-1">
              <div className="font-semibold">Total AUM</div>
              <div>{managerData.data.totalAum.toString()} lamports</div>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="font-semibold">Active Vaults</div>
              <div>{managerData.data.activeVaults}</div>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="font-semibold">Total Fees Earned</div>
              <div>{managerData.data.totalFeesEarned.toString()} lamports</div>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="font-semibold">Created At</div>
              <div>{new Date(Number(managerData.data.createdAt)).toLocaleString()}</div>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="font-semibold">Last Activity</div>
              <div>{new Date(Number(managerData.data.lastActivity)).toLocaleString()}</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

ManagerCard.displayName = "ManagerCard";
