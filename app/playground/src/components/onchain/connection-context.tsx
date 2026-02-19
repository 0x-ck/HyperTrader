import { ClusterUrl, createSolanaRpc, createSolanaRpcSubscriptions, devnet } from "@solana/kit";
import { createContext, useContext } from "react";

// Define the type for our context
export type ConnectionContextType = {
  connection: ReturnType<typeof createSolanaRpc>;
  subscription: ReturnType<typeof createSolanaRpcSubscriptions>;
  rpcUrl: ClusterUrl;
  subscriptionsUrl: ClusterUrl;
};

// Create default values
const defaultConnectionContext: ConnectionContextType = {
  connection: createSolanaRpc(devnet("https://api.devnet.solana.com")),
  subscription: createSolanaRpcSubscriptions(devnet("wss://api.devnet.solana.com")),
  rpcUrl: devnet("https://api.devnet.solana.com"),
  subscriptionsUrl: devnet("wss://api.devnet.solana.com"),
};

// Create the context
export const ConnectionContext = createContext<ConnectionContextType>(defaultConnectionContext);

export const useConnection = () => {
  return useContext(ConnectionContext);
};