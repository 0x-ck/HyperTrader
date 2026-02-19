"use client";

// Default styles that can be overridden by your app
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ChainContextProvider } from "./onchain/chain-context-provider";
import { ConnectionContextProvider } from "./onchain/connection-context-provider";
import { ProtocolContextProvider } from "./onchain/protocol-context-provider";
import { TooltipProvider } from "./ui/tooltip";
import { SelectedWalletAccountContextProvider } from "./wallet/wallet-context-provider";


const queryClient = new QueryClient();

export const Providers = (props: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChainContextProvider>
        <SelectedWalletAccountContextProvider>
          <ConnectionContextProvider>
            <ProtocolContextProvider>
              <TooltipProvider>{props.children}</TooltipProvider>
              <ReactQueryDevtools />
            </ProtocolContextProvider>
          </ConnectionContextProvider>
        </SelectedWalletAccountContextProvider>
      </ChainContextProvider>
    </QueryClientProvider>
  );
};
