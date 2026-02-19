"use client";

import {
  Address,
  lamports,
  Lamports,
  RpcDevnet,
  RpcSubscriptionsDevnet,
  SolanaRpcApiDevnet,
  SolanaRpcSubscriptionsApi,
} from "@solana/kit";
import { createRecentSignatureConfirmationPromiseFactory } from "@solana/transaction-confirmation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { useConnection } from "../onchain/connection-context";
import { TokenAmount } from "../onchain/token-amount";
import { useChain } from "../onchain/chain-context";
import { LoaderIcon } from "lucide-react";

type WalletBalanceProps = {
  address: Address;
  noAirdrop?: true;
  airdropAmount?: Lamports;
  minimalBalance?: Lamports;
};

const DEFAULT_AIRDROP_AMOUNT = lamports(10_000_000_000n);
const DEFAULT_MINIMAL_BALANCE = lamports(5_000_000_000n);

export const WalletBalance = (props: WalletBalanceProps) => {
  const {
    address,
    noAirdrop,
    airdropAmount = DEFAULT_AIRDROP_AMOUNT,
    minimalBalance = DEFAULT_MINIMAL_BALANCE,
  } = props;
  const connection = useConnection();
  const { chain } = useChain();

  const { data: balance, isFetching } = useQuery({
    queryKey: ["balance", chain, address],
    queryFn: () =>
      connection.connection
        .getBalance(address)
        .send()
        .then((balance) => balance.value),
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 5,
  });

  const {
    mutate: requestAirdrop,
    isPending,
    isError,
    error,
  } = useMutation({
    retry: false,
    onError: (error) => {
      console.error(error);
    },
    mutationFn: async () => {
      console.log(address, balance, minimalBalance);
      if (address && typeof balance === "bigint" && balance < minimalBalance) {
        const signature = await (
          connection.connection as RpcDevnet<SolanaRpcApiDevnet>
        )
          .requestAirdrop(address, airdropAmount)
          .send();

        await createRecentSignatureConfirmationPromiseFactory({
          rpc: connection.connection as RpcDevnet<SolanaRpcApiDevnet>,
          rpcSubscriptions: connection.subscription as RpcSubscriptionsDevnet<SolanaRpcSubscriptionsApi>,
        })({
          signature,
          abortSignal: new AbortController().signal,
          commitment: "confirmed"
        });
      }

      return true;
    },
  });

  return (
    <div className="flex flex-row items-center gap-4">
      <TokenAmount isLoading={isFetching} symbol="SOL" decimals={9}>
        {balance ? BigInt(balance) : 0n}
      </TokenAmount>
      {!noAirdrop &&
        typeof balance === "bigint" &&
        balance < minimalBalance && (
          <Button
            onClick={() => requestAirdrop()}
            disabled={isPending}
            variant={isError ? "destructive" : "default"}
          >
            {isPending ? (
              <LoaderIcon className="animate-spin" />
            ) : error ? (
              error.message
            ) : (
              "Request Airdrop"
            )}
          </Button>
        )}
    </div>
  );
};
