import * as HyroProtocol from "@/protocol/index";
import {
  Address,
  Commitment,
  getAddressEncoder,
  getProgramDerivedAddress,
  ProgramDerivedAddress,
  RpcDevnet,
  RpcSubscriptionsDevnet,
  Signature,
  SolanaRpcApiDevnet,
  SolanaRpcSubscriptionsApi,
} from "@solana/kit";
import { ReactNode } from "react";
import { ProtocolContext } from "./protocol-context";
import { useConnection } from "./connection-context";
import { createRecentSignatureConfirmationPromiseFactory } from "@solana/transaction-confirmation";

// Define the props type
type ProtocolContextProviderProps = {
  children: ReactNode;
};

// Create the provider component
export function ProtocolContextProvider({
  children,
}: ProtocolContextProviderProps) {
  const connection = useConnection();
  const addressEncoder = getAddressEncoder();
  const bigIntToSeed = (bigInt: bigint, byteLength: number): Uint8Array => {
    const buf = Buffer.alloc(byteLength);
    buf.writeBigUInt64LE(bigInt);
    return buf;
    // const bytes = new Uint8Array(byteLength);
    // for (let i = 0; i < byteLength && bigInt > 0n; i++) {
    //   bytes[i] = Number(bigInt & 0xffn); // Get least significant byte
    //   bigInt >>= 8n; // Shift right by 8 bits
    // }
    // return bytes;
  };

  const getPDAAndBump = async (
    programAddress: Address,
    seeds: Array<string | Address | bigint | number>
  ) => {
    const seedsUint8Array = seeds.map((seed) => {
      if (typeof seed === "bigint" || typeof seed === "number") {
        return bigIntToSeed(BigInt(seed), 8);
      }

      // Try to encode as Address, if it fails treat as string
      // (since Address is an extension of String at runtime)
      try {
        const encoded = addressEncoder.encode(seed as Address);
        return encoded;
      } catch {
        return new TextEncoder().encode(seed as string);
      }
    });
    return getProgramDerivedAddress({
      seeds: seedsUint8Array,
      programAddress,
    });
  };

  const waitForSig = createRecentSignatureConfirmationPromiseFactory({
    rpc: connection.connection as RpcDevnet<SolanaRpcApiDevnet>,
    rpcSubscriptions:
      connection.subscription as RpcSubscriptionsDevnet<SolanaRpcSubscriptionsApi>,
  });

  return (
    <ProtocolContext.Provider
      value={{
        protocol: HyroProtocol,
        helpers: {
          waitForConfirmation: async (
            signature: Signature,
            commitment?: Commitment
          ) => {
            const abortSignal = new AbortController();
            setTimeout(() => {
              abortSignal.abort();
            }, 10000);
            
            return waitForSig({
              signature,
              commitment: commitment ?? "confirmed",
              abortSignal: abortSignal as unknown as AbortSignal,
            });
          },
          getVaultPda: async (seed: string) => {
            const vault = await getPDAAndBump(
              HyroProtocol.hyroProtocol.HYRO_PROTOCOL_PROGRAM_ADDRESS,
              [seed]
            );

            const authority = await getPDAAndBump(
              HyroProtocol.hyroProtocol.HYRO_PROTOCOL_PROGRAM_ADDRESS,
              [vault[0]]
            );

            return [vault, authority] as const;
          },

          getLimitPolicyPda: async (
            seed: string
          ) => {
            console.log('getLimitTransferPda', seed)
            const policy = await getPDAAndBump(
              HyroProtocol.policyLimitTransfer.POLICY_LIMIT_TRANSFER_PROGRAM_ADDRESS,
              [seed]
            );
            return policy;
          },

          getOwnersPolicyPda: async (seed: string, owners: Address[]) => {
            console.log("getOwnersPolicyPda", seed, owners);
            const policy = await getPDAAndBump(
              HyroProtocol.policyOwners.POLICY_OWNERS_PROGRAM_ADDRESS,
              [seed] // TEMPORARY: , ...owners]
            );
            return policy;
          },

          getMultisigPolicyPda: async (seed: string) => {
            console.log("getMultisigPolicyPda", seed);
            const policy = await getPDAAndBump(
              HyroProtocol.policyMultisig.POLICY_MULTISIG_PROGRAM_ADDRESS,
              [seed]
            );
            return policy;
          },

          getTransactionPda: async (vault: ProgramDerivedAddress, nonce: number) => {
            const transaction = await getPDAAndBump(
              HyroProtocol.hyroProtocol.HYRO_PROTOCOL_PROGRAM_ADDRESS,
              [vault[0], nonce]
            );
            return transaction;
          },

          getChallengeTemplatePda: async (stageId: number) => {
            const template = await getPDAAndBump(
              HyroProtocol.policyChallenges.POLICY_CHALLENGES_PROGRAM_ADDRESS,
              [stageId]
            );
            return template;
          },

          getChallengePda: async (participant: Address, challengeId: string) => {
            const challenge = await getPDAAndBump(
              HyroProtocol.policyChallenges.POLICY_CHALLENGES_PROGRAM_ADDRESS,
              [participant, challengeId]
            );
            return challenge;
          },

          getManagerRegistryPda: async () => {
            const registry = await getPDAAndBump(
              HyroProtocol.hyroProtocol.HYRO_PROTOCOL_PROGRAM_ADDRESS,
              ["manager_registry"]
            );
            return registry;
          },

          getManagerProfilePda: async (managerAddress: Address) => {
            const profile = await getPDAAndBump(
              HyroProtocol.hyroProtocol.HYRO_PROTOCOL_PROGRAM_ADDRESS,
              ["manager_profile", managerAddress]
            );
            return profile;
          },
        },
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
}
