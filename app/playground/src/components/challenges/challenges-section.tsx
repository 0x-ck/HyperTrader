"use client";

import { Transaction } from "@/features/transaction/transaction";
import { challengeTemplatesAtom } from "@/protocol/atoms";
import {
  ChallengeStatus,
  DrawdownType,
  StageType,
} from "@/protocol/policyChallenges/types";
import {
  address as asAddress,
  Instruction,
  Rpc,
  Signature,
  SolanaRpcApi,
} from "@solana/kit";
import { useMutation, useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useAtom } from "jotai/react";
import { ChevronDownIcon, ChevronUpIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { useConnection } from "../onchain/connection-context";
import { useProtocol } from "../onchain/protocol-context";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useSigner } from "../wallet/wallet-context";
import { ChallengeTemplateDetails } from "./challenge-template-details";
import { challengeTemplateSchema } from "./challenge-template-schema";
import { CreateChallengeTemplate } from "./create-challenge-template-form";
import { JoinChallengeForm } from "./join-challenge-form";
import { ChallengeCard, ChallengeData } from "./challenge-card";
import { Address as AddressBox } from "../onchain/address";

export const ChallengesSection = () => {
  const [challengeTemplates, setChallengeTemplates] = useAtom(
    challengeTemplatesAtom
  );
  const connection = useConnection();
  const signer = useSigner();
  const protocolContext = useProtocol();

  const {
    protocol,
    helpers: { getChallengeTemplatePda },
  } = protocolContext || { helpers: {} };

  const {
    mutate: createTemplate,
    isPending: isPendingCreating,
    isError: isErrorCreating,
    error: errorCreating,
  } = useMutation({
    mutationKey: ["createChallengeTemplate"],
    mutationFn: async (opts: z.infer<typeof challengeTemplateSchema>) => {
      console.log("Creating challenge template", opts);

      if (protocolContext === null) {
        throw new Error("Protocol context is not initialized");
      }

      if (challengeTemplates.find((t) => t.stageId === opts.stageId)) {
        throw new Error("Template with this stage ID already exists locally");
      }

      if (!signer) throw new Error("Wallet is not connected");

      const [templatePda] = await getChallengeTemplatePda(opts.stageId);

      // Check if template already exists on-chain
      const existing = await protocol.policyChallenges
        .fetchChallengeTemplate(connection.connection, templatePda)
        .then(() => true)
        .catch(() => false);

      if (existing) {
        console.log("Challenge template already exists on-chain", templatePda);
        return [templatePda, opts] as const;
      }

      console.log("Creating new challenge template", templatePda);

      // Convert stage type to enum value
      const stageType =
        opts.stageType === "evaluation"
          ? StageType.Evaluation
          : StageType.Funded;

      // Create the instruction
      const ix: Instruction =
        await protocol.policyChallenges.getCreateChallengeTemplateInstructionAsync(
          {
            signer,
            stageId: opts.stageId,
            dto: {
              stageSequence: opts.stageSequence,
              stageType,
              startingDeposit: BigInt(
                Decimal(opts.startingDeposit)
                  .mul(10 ** 9)
                  .floor()
                  .toNumber()
              ),
               admin: opts.admin ? asAddress(opts.admin) : signer.address,
              entranceCost: BigInt(
                Decimal(opts.entranceCost)
                  .mul(10 ** 9)
                  .floor()
                  .toNumber()
              ),
              entranceTokenMint: asAddress(opts.entranceTokenMint),
              minimumTradingDays: [opts.minimumTradingDays] as const,
              dailyDrawdown: [opts.dailyDrawdown] as const,
              maximumLoss: [opts.maximumLoss] as const,
              profitTarget: [opts.profitTarget] as const,
              maxParticipants: [opts.maxParticipants] as const,
              isActive: opts.isActive,
            },
          }
        );

      await Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription,
        signer: signer,
        instructions: [ix],
        simulation: {
          computeUnitLimit: 200000,
        },
      }).catch(async (e) => {
        const tx = await connection.connection
          .getTransaction(e.signature as Signature, {
            maxSupportedTransactionVersion: 0,
            encoding: "jsonParsed",
          })
          .send();

        if (tx) {
          console.log(
            "Transaction details:\n\t" + tx.meta?.logMessages?.join("\n\t")
          );
        }

        console.log("Error sending transaction", e);
        throw e;
      });

      return [templatePda, opts] as const;
    },
    onSuccess: ([templatePda, opts]) => {
      if (templatePda) {
        setChallengeTemplates((prev) => [
          ...prev,
          {
            stageId: opts.stageId,
            address: templatePda,
            stageType: opts.stageType,
          },
        ]);
      }
    },
  });

  const handleCreateTemplate = useCallback(
    async (opts: z.infer<typeof challengeTemplateSchema>) => {
      console.log("Creating challenge template", opts);
      return createTemplate(opts);
    },
    [createTemplate]
  );

  const { data: testChallengeAddress } = useQuery({
    queryKey: ["testChallengeAddress"],
    queryFn: async () => {
      return getChallengeTemplatePda(1).then(([address]) => address);
    },
  });
  return (
    <div className="flex flex-row gap-2 relative w-full flex-grow h-full overflow-y-hidden overflow-x-auto">
      <Card className="sticky left-0 z-10 border-t-0 border-b-0 shadow-2xl rounded-none w-md overflow-hidden flex-shrink-0 flex-grow-0">
        <CardContent className="sticky top-32 overflow-y-auto max-h-screen">
          <CreateChallengeTemplate
            onCreateTemplate={handleCreateTemplate}
            isLoading={isPendingCreating}
            isDisabled={isPendingCreating}
            error={isErrorCreating ? errorCreating : null}
          />
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4 p-4 flex-1">
        <pre>{testChallengeAddress}</pre>
        {challengeTemplates.length === 0 && (
          <Card className="w-full">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                No challenge templates yet. Create one to get started!
              </p>
            </CardContent>
          </Card>
        )}
        {challengeTemplates.map((template) => (
          <ChallengeTemplateSection
            key={template.stageId}
            template={template}
            currentUserAddress={signer?.address}
          />
        ))}
      </div>
    </div>
  );
};

type ChallengeTemplateSectionProps = {
  template: { stageId: number; address: string; stageType: string };
  currentUserAddress?: string;
};

const ChallengeTemplateSection = ({
  template,
}: ChallengeTemplateSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const connection = useConnection();
  const signer = useSigner();
  const protocolContext = useProtocol();

  const {
    protocol,
    helpers: { getChallengePda },
  } = protocolContext || { helpers: {} };

  // Fetch template data
  const {
    data: templateData,
    isLoading: isLoadingTemplate,
    refetch: refetchTemplate,
  } = useQuery({
    queryKey: ["challengeTemplate", template.address],
    queryFn: async () => {
      if (!protocol) return null;
      try {
        const data = await protocol.policyChallenges.fetchChallengeTemplate(
          connection.connection,
          asAddress(template.address)
        );
        return data.data;
      } catch (e) {
        console.error("Failed to fetch template", e);
        return null;
      }
    },
    enabled: isExpanded,
  });

  // Join challenge mutation
  const {
    mutateAsync: joinChallenge,
    isPending: isJoining,
    error: joinError,
  } = useMutation({
    mutationKey: ["joinChallenge", template.stageId],
    mutationFn: async (challengeId: string) => {
      if (!protocolContext) throw new Error("Protocol context not initialized");
      if (!signer) throw new Error("Wallet not connected");
      if (!templateData) throw new Error("Template data not loaded");

      const [challengePda] = await getChallengePda(signer.address, challengeId);

      // Calculate amounts based on starting deposit and percentages
      const startingDeposit = templateData.startingDeposit;
      const profitTargetAmount =
        (startingDeposit * BigInt(templateData.profitTarget[0])) / 10000n;
      const maximumLossAmount =
        (startingDeposit * BigInt(templateData.maximumLoss[0])) / 10000n;
      const dailyDrawdownLimitAmount =
        (startingDeposit * BigInt(templateData.dailyDrawdown[0])) / 10000n;

      const ix: Instruction =
        await protocol.policyChallenges.getJoinChallengeInstructionAsync({
          participant: signer,
          challengeTemplateAccount: asAddress(template.address),
          challengeAccount: challengePda,
          challengeId,
          stageId: templateData.stageId,
          stageSequence: templateData.stageSequence,
          profitTarget: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            target: [templateData.profitTarget[0]] as any,
            targetAmount: [profitTargetAmount] as const,
            achieved: [0] as const,
            achievedAmount: [0n] as const,
          },
          tradingDays: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            required: [templateData.minimumTradingDays[0]] as any,
            completed: [0] as const,
            requirementsMet: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            remainingDays: [templateData.minimumTradingDays[0]] as any,
          },
          maximumLoss: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            maximumLossPercentage: [templateData.maximumLoss[0]] as any,
            maximumLossAmount: [maximumLossAmount] as const,
            currentLossAchieved: [0] as const,
            currentLossAchievedAmount: [0n] as const,
          },
          dailyDrawdown: {
            drawdownType: DrawdownType.Static,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            limitPercentage: [templateData.dailyDrawdown[0]] as any,
            limitAmount: [dailyDrawdownLimitAmount] as const,
            maxEquity: [0n] as const,
            currentDrawdownPercentage: [0] as const,
            currentDrawdownAmount: [0n] as const,
            violationTriggered: false,
          },
          status: ChallengeStatus.Active,
          payout: 0n,
          createdAt: BigInt(Math.floor(Date.now() / 1000)),
        });

      await Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription,
        signer: signer,
        instructions: [ix],
        simulation: {
          computeUnitLimit: 200000,
        },
      }).catch(async (e) => {
        const tx = await connection.connection
          .getTransaction(e.signature as Signature, {
            maxSupportedTransactionVersion: 0,
            encoding: "jsonParsed",
          })
          .send();

        if (tx) {
          console.error(
            "Join Challenge Transaction failed:\n\t" +
              tx.meta?.logMessages?.join("\n\t")
          );
        }

        console.error("Error joining challenge", e);
        throw e;
      });

      return challengePda;
    },
    onError: (e) => {
      console.error("Failed to join challenge", e);
    },
    onSuccess: () => {
      refetchTemplate();
    },
  });

  const { data: allChallenges, isLoading: isLoadingChallenges } = useQuery({
    queryKey: ["allChallenges", template.stageId],
    refetchInterval: 3000,
    queryFn: async () => {
      try {
        const result = await connection.connection
          .getProgramAccounts(
            protocol.policyChallenges.POLICY_CHALLENGES_PROGRAM_ADDRESS,
            {
              commitment: "confirmed",
              filters: [
                {
                  memcmp: {
                    offset: 0n,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    bytes: Buffer.from([119, 250, 161, 121, 119, 81, 22, 208]).toString("base64") as any,
                    encoding: "base64" as const,
                  },
                },
              ],
              encoding: "base64",
            }
          )
          .send();

        return result
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((account: any) => {
            try {
              const decoded = protocol.policyChallenges.getChallengeDecoder().decode(
                Buffer.from(account.account.data[0], "base64")
              );
              return {
                address: asAddress(account.pubkey),
                data: decoded as ChallengeData,
              };
            } catch (e) {
              console.error("Failed to decode challenge", e);
              return null;
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((c: any): c is NonNullable<typeof c> => c !== null);
      } catch (e) {
        console.error("Failed to fetch challenges", e);
        return [];
      }
    },
    enabled: isExpanded,
  });

  const challenges = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => allChallenges?.filter((c: any) => c && c.data.stageId === template.stageId) || [],
    [allChallenges, template.stageId]
  );

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Stage {template.stageId}</h3>
            <p className="text-sm text-gray-600">
              {template.stageType === "evaluation" ? "Evaluation" : "Funded"}
            </p>
          </div>
          <div className="flex gap-2">
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchTemplate()}
                disabled={isLoadingTemplate}
              >
                <RefreshCwIcon
                  className={`w-4 h-4 ${
                    isLoadingTemplate ? "animate-spin" : ""
                  }`}
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        <AddressBox className="text-xs">{template.address}</AddressBox>

        {isExpanded && (
          <div className="space-y-4 mt-4">
            <ChallengeTemplateDetails
              address={asAddress(template.address)}
              templateData={templateData}
              isLoading={isLoadingTemplate}
            />

            {templateData && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Join Challenge</h4>
                  <JoinChallengeForm
                    stageId={template.stageId}
                    isLoading={isJoining}
                    error={joinError}
                    onJoinChallenge={(challengeId) => {
                      return joinChallenge(challengeId).then(() => void {});
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">
                  Active Challenges ({challenges.length})
                </h4>
              </div>
              
              {isLoadingChallenges && (
                <div className="flex items-center justify-center p-8">
                  <RefreshCwIcon className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}

              {!isLoadingChallenges && challenges.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-gray-500">
                      No challenges yet. Be the first to join!
                    </p>
                  </CardContent>
                </Card>
              )}

              {!isLoadingChallenges && challenges.length > 0 && (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {challenges.map((item: any) => 
                    item && (
                      <ChallengeCard
                        key={item.data.challengeId}
                        challenge={item.data}
                        challengeAddress={item.address}
                        currentUserAddress={signer?.address}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
