"use client";

import { Transaction } from "@/features/transaction/transaction";
import { managersAtom } from "@/protocol/atoms";
import {
  RiskRating,
  VerificationStatus,
} from "@/protocol/hyroProtocol/types";
import {
  address,
  Instruction,
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
} from "@solana/kit";
import { useMutation } from "@tanstack/react-query";
import { useAtom } from "jotai/react";
import { useCallback } from "react";
import { z } from "zod";
import { useConnection } from "../onchain/connection-context";
import { useProtocol } from "../onchain/protocol-context";
import { Card, CardContent } from "../ui/card";
import { useSigner } from "../wallet/wallet-context";
import { ManagerRegistryDetails } from "./manager-registry-details";
import { managerRegistrySchema } from "./manager-registry-schema";
import { InitializeManagerRegistryForm } from "./initialize-manager-registry-form";
import { RegisterManagerForm } from "./register-manager-form";
import { VerifyManagerForm } from "./verify-manager-form";
import { ManagerCard } from "./manager-card";

export const ManagersSection = () => {
  const [managers, setManagers] = useAtom(managersAtom);
  const connection = useConnection();
  const signer = useSigner();
  const protocolContext = useProtocol();

  const {
    protocol,
    helpers: { getManagerRegistryPda, getManagerProfilePda },
  } = protocolContext || { helpers: {} };

  const {
    mutate: initializeRegistry,
    isPending: isPendingInitializing,
    isError: isErrorInitializing,
    error: errorInitializing,
  } = useMutation({
    mutationKey: ["initializeManagerRegistry"],
    mutationFn: async (opts: z.infer<typeof managerRegistrySchema>) => {
      console.log("Initializing manager registry", opts);

      if (protocolContext === null) {
        throw new Error("Protocol context is not initialized");
      }

      if (!signer) throw new Error("Wallet is not connected");

      const [registryPda] = await getManagerRegistryPda();
      console.log("Manager registry PDA:", registryPda);

      // Check if registry already exists on-chain
      const existing = await protocol.hyroProtocol
        .fetchMaybeManagerRegistry(connection.connection, registryPda)
        .then((result) => {
          console.log("Registry exists check result:", result);
          return result.exists;
        })
        .catch((err) => {
          console.log("Registry exists check error:", err);
          return false;
        });

      if (existing) {
        console.log("Manager registry already exists on-chain", registryPda);
        return registryPda;
      }

      console.log("Creating new manager registry", registryPda);

      // Create the instruction
      const ix: Instruction =
        await protocol.hyroProtocol.getInitializeManagerRegistryInstructionAsync({
          registry: registryPda,
          admin: signer,
        });

      const signature = await Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription as RpcSubscriptions<SolanaRpcSubscriptionsApi>,
        signer: signer,
        instructions: [ix],
        simulation: {
          computeUnitLimit: 200000,
        },
      });

      console.log("Manager registry initialized", signature);

      // Wait a moment for the transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));

      return registryPda;
    },
    onSuccess: (registryPda) => {
      console.log("Manager registry initialization success, PDA:", registryPda);
      if (registryPda) {
        setManagers((prev) => [
          ...prev,
          {
            address: registryPda,
            isInitialized: true,
          },
        ]);
        console.log("Added registry to managers state");
      }
    },
  });

  const {
    mutate: registerManager,
    isPending: isPendingRegistering,
    isError: isErrorRegistering,
    error: errorRegistering,
  } = useMutation({
    mutationKey: ["registerManager"],
    mutationFn: async (opts: {
      managerAddress: string;
      riskRating: RiskRating;
    }) => {
      console.log("Registering manager", opts);

      if (protocolContext === null) {
        throw new Error("Protocol context is not initialized");
      }

      if (!signer) throw new Error("Wallet is not connected");

      const [registryPda] = await getManagerRegistryPda();
      const [managerProfilePda] = await getManagerProfilePda(address(opts.managerAddress));

      // Create the instruction
      const ix: Instruction =
        await protocol.hyroProtocol.getRegisterManagerInstructionAsync({
          admin: signer,
          manager: address(opts.managerAddress),
          managerProfile: managerProfilePda,
          registry: registryPda,
          riskRating: opts.riskRating,
        });

      const signature = await Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription as RpcSubscriptions<SolanaRpcSubscriptionsApi>,
        signer: signer,
        instructions: [ix],
        simulation: {
          computeUnitLimit: 200000,
        },
      });

      console.log("Manager registered", signature);

      return [managerProfilePda, opts] as const;
    },
    onSuccess: ([managerProfilePda, opts]) => {
      if (managerProfilePda) {
        setManagers((prev) => [
          ...prev,
          {
            address: managerProfilePda,
            managerAddress: opts.managerAddress,
            riskRating: opts.riskRating,
            verificationStatus: VerificationStatus.Pending,
            isInitialized: false,
          },
        ]);
      }
    },
  });

  const {
    mutate: verifyManager,
    isPending: isPendingVerifying,
    isError: isErrorVerifying,
    error: errorVerifying,
  } = useMutation({
    mutationKey: ["verifyManager"],
    mutationFn: async (opts: { managerAddress: string; verificationStatus: VerificationStatus }) => {
      console.log("Verifying manager", opts);

      if (protocolContext === null) {
        throw new Error("Protocol context is not initialized");
      }

      if (!signer) throw new Error("Wallet is not connected");

      const [registryPda] = await getManagerRegistryPda();
      const [managerProfilePda] = await getManagerProfilePda(address(opts.managerAddress));

      // Create the instruction
      const ix: Instruction = protocol.hyroProtocol.getVerifyManagerInstruction({
        admin: signer,
        managerProfile: managerProfilePda,
        registry: registryPda,
        verificationStatus: opts.verificationStatus,
      });

      const signature = await Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription as RpcSubscriptions<SolanaRpcSubscriptionsApi>,
        signer: signer,
        instructions: [ix],
        simulation: {
          computeUnitLimit: 200000,
        },
      });

      console.log("Manager verified", signature);

      return [managerProfilePda, opts] as const;
    },
    onSuccess: ([, opts]) => {
      // Update the manager's verification status
      setManagers((prev) =>
        prev.map((manager) =>
          manager.managerAddress === opts.managerAddress
            ? { ...manager, verificationStatus: opts.verificationStatus }
            : manager
        )
      );
    },
  });

  const handleInitializeRegistry = useCallback(
    async (opts: z.infer<typeof managerRegistrySchema>) => {
      console.log("Initializing manager registry", opts);
      return initializeRegistry(opts);
    },
    [initializeRegistry]
  );

  const handleRegisterManager = useCallback(
    async (opts: { managerAddress: string; riskRating: RiskRating }) => {
      console.log("Registering manager", opts);
      return registerManager(opts);
    },
    [registerManager]
  );

  const handleVerifyManager = useCallback(
    async (opts: { managerAddress: string; verificationStatus: VerificationStatus }) => {
      console.log("Verifying manager", opts);
      return verifyManager(opts);
    },
    [verifyManager]
  );


  const registryManager = managers.find((m) => m.isInitialized);
  const registeredManagers = managers.filter((m) => !m.isInitialized);

  return (
    <div className="flex flex-row gap-2 relative w-full flex-grow h-full overflow-y-hidden overflow-x-auto">
      <Card className="sticky left-0 z-10 border-t-0 border-b-0 shadow-2xl rounded-none w-md overflow-hidden flex-shrink-0 flex-grow-0">
        <CardContent className="sticky top-32 overflow-y-auto max-h-screen">
          <div className="flex flex-col gap-4">
            <InitializeManagerRegistryForm
              onInitializeRegistry={handleInitializeRegistry}
              isLoading={isPendingInitializing}
              isDisabled={isPendingInitializing || !!registryManager}
              error={isErrorInitializing ? errorInitializing : null}
            />
            
            <RegisterManagerForm
              onRegisterManager={handleRegisterManager}
              isLoading={isPendingRegistering}
              isDisabled={isPendingRegistering || !registryManager}
              error={isErrorRegistering ? errorRegistering : null}
            />
            
            <VerifyManagerForm
              onVerifyManager={handleVerifyManager}
              isLoading={isPendingVerifying}
              isDisabled={isPendingVerifying || !registryManager}
              error={isErrorVerifying ? errorVerifying : null}
              managers={registeredManagers}
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4 p-4 flex-1">
        {registryManager && (
          <ManagerRegistryDetails
            registry={registryManager}
            currentUserAddress={signer?.address}
          />
        )}
        
        {registeredManagers.length === 0 && !registryManager && (
          <Card className="w-full">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                No manager registry initialized yet. Initialize one to get started!
              </p>
            </CardContent>
          </Card>
        )}
        
        {registeredManagers.length === 0 && registryManager && (
          <Card className="w-full">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                No managers registered yet. Register a manager to get started!
              </p>
            </CardContent>
          </Card>
        )}
        
        {registeredManagers.map((manager) => (
          <ManagerCard
            key={manager.address}
            manager={manager}
            currentUserAddress={signer?.address}
          />
        ))}
      </div>
    </div>
  );
};
