
import * as HyroProtocol from "@/protocol/index";
import type { Address, Commitment, ProgramDerivedAddress, Signature } from "@solana/kit";
import { createContext, useContext } from "react";

export type ProtocolContext = Readonly<{
    protocol: typeof HyroProtocol,
    helpers: {
      getVaultPda(seed: string): Promise<[ProgramDerivedAddress, ProgramDerivedAddress]>,
      getLimitPolicyPda(seed: string): Promise<ProgramDerivedAddress>,
      getOwnersPolicyPda(seed: string, owners: Address[]): Promise<ProgramDerivedAddress>,
      getMultisigPolicyPda(seed: string): Promise<ProgramDerivedAddress>,
      getTransactionPda(vault: ProgramDerivedAddress, nonce: number): Promise<ProgramDerivedAddress>,
      getChallengeTemplatePda(stageId: number): Promise<ProgramDerivedAddress>,
      getChallengePda(participant: Address, challengeId: string): Promise<ProgramDerivedAddress>,
      getManagerRegistryPda(): Promise<ProgramDerivedAddress>,
      getManagerProfilePda(managerAddress: Address): Promise<ProgramDerivedAddress>,

      waitForConfirmation(signature: Signature, commitment?: Commitment): Promise<void>,
    }
}>;

export const ProtocolContext = createContext<ProtocolContext>(null!);

export const useProtocol = () => {
  return useContext(ProtocolContext);
}