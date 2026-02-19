import { atomWithLocalStorage } from "@/lib/atom-with-localstorage";
import { Address } from "@solana/kit";
import { RiskRating, VerificationStatus } from "./hyroProtocol/types";

export type VaultRecord = {
  seed: string;
  kind: "AllowAny" | "DenyAll" | "Owners" | "LimitTransfer" | "Multisig" | "AnyOf" | "AllOf";
  address: Address;
};

export type ChallengeTemplateRecord = {
  stageId: number;
  address: Address;
  stageType: "evaluation" | "funded";
};

export type ManagerRecord = {
  address: Address;
  managerAddress?: string;
  riskRating?: RiskRating;
  verificationStatus?: VerificationStatus;
  isInitialized: boolean;
};

export type Chains = "solana:mainnet" | "solana:testnet" | "solana:devnet" | "solana:localnet" | `solana:${string}`
export const vaultsAtom = atomWithLocalStorage<VaultRecord[]>("hyro:vaults", []);
export const challengeTemplatesAtom = atomWithLocalStorage<ChallengeTemplateRecord[]>("hyro:challenge-templates", []);
export const managersAtom = atomWithLocalStorage<ManagerRecord[]>("hyro:managers", []);
export const addressBook = atomWithLocalStorage<Address[]>("hyro:addresses", []);
export const selectedChain = atomWithLocalStorage<{ selected: Chains }>("hyro:chain", { selected: "solana:localnet" })
export const selectedWallet = atomWithLocalStorage<{ name: string, address: Address } | null>("hyro:wallet", null)
