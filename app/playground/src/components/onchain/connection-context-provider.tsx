"use client";

import "client-only";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit";
import { ReactNode, useContext, useMemo } from "react";
import { ChainContext } from "./chain-context";
import { ConnectionContextType, ConnectionContext } from "./connection-context";

// Define the props type
type ConnectionContextProviderProps = {
  children: ReactNode;
};

// Create the provider component
export function ConnectionContextProvider({ children }: ConnectionContextProviderProps) {
  const { solanaRpcSubscriptionsUrl, solanaRpcUrl } = useContext(ChainContext);

  // Create the context value
  const contextValue: ConnectionContextType = useMemo(() => {
    console.log("connect to ", solanaRpcUrl)
    return {
      connection: createSolanaRpc(solanaRpcUrl),
      subscription: createSolanaRpcSubscriptions(solanaRpcSubscriptionsUrl),
      rpcUrl: solanaRpcUrl,
      subscriptionsUrl: solanaRpcSubscriptionsUrl,
    };
  }, [solanaRpcSubscriptionsUrl, solanaRpcUrl]);

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}
