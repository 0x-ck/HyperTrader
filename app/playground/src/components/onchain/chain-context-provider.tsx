"use client";

import { devnet, mainnet, testnet } from "@solana/kit";
import { useCallback, useMemo } from "react";
import { ChainContext, DEFAULT_CHAIN_CONFIG } from "./chain-context";
import { useAtom } from "jotai";
import { Chains, selectedChain } from "@/protocol/atoms";

const STORAGE_KEY = "hyro-protocol:selected-chain";

export function ChainContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chainAtom, setChainAtom] = useAtom(selectedChain);

  const chain = chainAtom.selected;

  const setChain = useCallback(
    (selected: Chains) => setChainAtom((prev) => ({ ...prev, selected })),
    [setChainAtom]
  );

  const contextValue = useMemo<ChainContext>(() => {
    switch (chain) {
      case "solana:mainnet":
        if (process.env.REACT_EXAMPLE_APP_ENABLE_MAINNET === "true") {
          return {
            chain: "solana:mainnet",
            displayName: "Mainnet Beta",
            solanaExplorerClusterName: "mainnet-beta",
            solanaRpcSubscriptionsUrl: mainnet(
              "wss://api.mainnet-beta.solana.com"
            ),
            solanaRpcUrl: mainnet("https://api.mainnet-beta.solana.com"),
          };
        }
      // falls through
      case "solana:testnet":
        return {
          chain: "solana:testnet",
          displayName: "Testnet",
          solanaExplorerClusterName: "testnet",
          solanaRpcSubscriptionsUrl: testnet("wss://api.testnet.solana.com"),
          solanaRpcUrl: testnet("https://api.testnet.solana.com"),
        };
      // return {
      //   chain: "solana:localnet",
      //   displayName: "Localnet",
      //   solanaExplorerClusterName: "localnet",
      //   solanaRpcSubscriptionsUrl: "ws://127.0.0.1:8900",
      //   solanaRpcUrl: "http://127.0.0.1:8899",
      // };
      case "solana:devnet":
        return {
          chain: "solana:devnet",
          displayName: "Devnet",
          solanaExplorerClusterName: "devnet",
          solanaRpcSubscriptionsUrl: devnet("wss://api.devnet.solana.com"),
          solanaRpcUrl: devnet("https://api.devnet.solana.com"),
        };
      case "solana:localnet":
      default:
        if (chain !== "solana:localnet") {
          localStorage.removeItem(STORAGE_KEY);
          console.error(`Unrecognized chain \`${chain}\``);
        }
        return DEFAULT_CHAIN_CONFIG;
    }
  }, [chain]);
  return (
    <ChainContext.Provider
      value={useMemo(
        () => ({
          ...contextValue,
          setChain(chain) {
            localStorage.setItem(STORAGE_KEY, chain);
            setChain(chain);
          },
        }),
        [contextValue, setChain]
      )}
    >
      {children}
    </ChainContext.Provider>
  );
}
