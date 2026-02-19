import type { ClusterUrl } from "@solana/kit";
import { createContext, useContext } from "react";

export type ChainContext = Readonly<{
  chain: `solana:${string}`;
  displayName: string;
  setChain?(chain: `solana:${string}`): void;
  solanaExplorerClusterName: "devnet" | "mainnet-beta" | "testnet" | "localnet";
  solanaRpcSubscriptionsUrl: ClusterUrl;
  solanaRpcUrl: ClusterUrl;
}>;

export const DEFAULT_CHAIN_CONFIG = Object.freeze({
  chain: "solana:localnet",
  displayName: "Localnet",
  solanaExplorerClusterName: "localnet",
  solanaRpcSubscriptionsUrl: "ws://127.0.0.1:8900",
  solanaRpcUrl: "http://127.0.0.1:8899",
});

export const ChainContext = createContext<ChainContext>(DEFAULT_CHAIN_CONFIG);

export const useChain = () => {
  return useContext(ChainContext);
}