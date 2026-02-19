"use client";

import { vaultsAtom, type VaultRecord } from "@/protocol/atoms";
import { Address as KitAddress } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai/react";
import { TrashIcon } from "lucide-react";
import { memo, useCallback } from "react";
import { Address } from "../onchain/address";
import { useConnection } from "../onchain/connection-context";
import { useProtocol } from "../onchain/protocol-context";
import { Button } from "../ui/button";
import { WalletBalance } from "../wallet/wallet-balance";
import { TokenAmount } from "../onchain/token-amount";
import { getVaultPolicyAccount } from "@/lib/vault-policy-utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AllowAnyPolicyDetails = memo((props: { address: KitAddress }) => {
  return <div>Allows any transaction</div>;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DenyAllPolicyDetails = memo((props: { address: KitAddress }) => {
  return <div>Deny all transactions</div>;
});

const OwnersPolicyDetails = memo((props: { address: KitAddress }) => {
  const { protocol } = useProtocol();
  const { connection } = useConnection();
  const { data: parsed, isPending: isLoading, error } = useQuery({
    queryKey: ["account", "policyOwners", props.address],
    queryFn: () => protocol.policyOwners.fetchOwners(connection, props.address),
  });
  
  if (isLoading) {
    return <div className="flex flex-col gap-1">Loading...</div>;
  }
  
  if (error || !parsed) {
    return <div className="text-xs text-muted-foreground">Policy account not initialized</div>;
  }
  
  return (
    <div className="flex flex-col gap-1">
      <span>Allow any transaction from:</span>
      <div className="flex flex-row flex-wrap gap-1">
        {parsed.data.owners.length > 0 ? (
          parsed.data.owners.map((owner) => (
            <Address key={owner} className="text-xs bg-background py-0 px-2">{owner}</Address>
          ))
        ) : (
          <div className="text-xs text-muted-foreground">No owners set</div>
        )}
      </div>
    </div>
  );
});

const LimitTransferPolicyDetails = memo((props: { address: KitAddress }) => {
  const { protocol } = useProtocol();
  const { connection } = useConnection();
  const { data: parsed, isPending: isLoading } = useQuery({
    queryKey: ["account", "policyLimitTransfer", props.address],
    queryFn: () =>
      protocol.policyLimitTransfer.fetchLimitTransfer(
        connection,
        props.address
      ),
  });
  return isLoading ? (
    <div>Loading...</div>
  ) : (
    <div>
      <span>Allow SOL transfers between:</span>
      <span className="flex flex-row gap-1">
        <TokenAmount
          isLoading={isLoading}
          symbol="SOL"
          decimals={9}
          children={parsed?.data.min}
          className="font-semibold"
        />
        <span>and</span>
        <TokenAmount
          isLoading={isLoading}
          symbol="SOL"
          decimals={9}
          children={parsed?.data.max}
          className="font-semibold"
        />
      </span>
    </div>
  );
});

const MultisigPolicyDetails = memo((props: { address: KitAddress }) => {
  const { protocol } = useProtocol();
  const { connection } = useConnection();
  const { data: parsed, isPending: isLoading } = useQuery({
    queryKey: ["account", "policyMultisig", props.address],
    queryFn: () => protocol.policyMultisig.fetchMultiSig(connection, props.address),
  });
  
  return isLoading ? (
    <div className="flex flex-col gap-1">Loading...</div>
  ) : (
    <div className="flex flex-col gap-1">
      <span>Multisig policy:</span>
      <div className="text-sm text-muted-foreground">
        Threshold: {parsed?.data.threshold} of {parsed?.data.owners.length} signatures required
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Owners:</span>
        <div className="flex flex-row flex-wrap gap-1">
          {parsed?.data.owners.map((owner) => (
            <Address key={owner} className="text-xs bg-background py-0 px-2">{owner}</Address>
          ))}
        </div>
      </div>
    </div>
  );
});

export const AccountDetails = memo(
  (props: { address: KitAddress; program: KitAddress }) => {
    const { protocol } = useProtocol();

    switch (props.program) {
      case protocol.policyAllowAny.POLICY_ALLOW_ANY_PROGRAM_ADDRESS:
        return <AllowAnyPolicyDetails address={props.address} />;
      case protocol.policyDenyAll.POLICY_DENY_ALL_PROGRAM_ADDRESS:
        return <DenyAllPolicyDetails address={props.address} />;
      case protocol.policyOwners.POLICY_OWNERS_PROGRAM_ADDRESS:
        return <OwnersPolicyDetails address={props.address} />;
      case protocol.policyLimitTransfer.POLICY_LIMIT_TRANSFER_PROGRAM_ADDRESS:
        return <LimitTransferPolicyDetails address={props.address} />;
      case protocol.policyMultisig.POLICY_MULTISIG_PROGRAM_ADDRESS:
        return <MultisigPolicyDetails address={props.address} />;
      default:
        return null;
    }
  }
);

export const VaultDetails = memo((props: VaultRecord) => {
  const { connection } = useConnection();
  const { protocol, helpers } = useProtocol();

  const [, setVaults] = useAtom(vaultsAtom);

  const { data: vault } = useQuery({
    queryKey: ["vault", props.address],
    queryFn: () => protocol.hyroProtocol.fetchVault(connection, props.address),
  });

  // Get the policy account address based on the vault's policy program
  const { data: policyAccount } = useQuery({
    queryKey: ["policyAccount", vault?.data.policyProgram, props.address],
    queryFn: async () => {
      if (!vault || !helpers) return null;
      const account = await getVaultPolicyAccount(
        props.address,
        vault.data.policyProgram,
        helpers,
        protocol
      );
      console.log("Vault Policy Program (stored):", vault.data.policyProgram);
      console.log("Derived Policy Account:", account);
      console.log("Are they the same?", account === vault.data.policyProgram);
      return account;
    },
    enabled: !!vault && !!helpers,
  });

  // Unused for now - keeping for potential future use
  // const { data: policy } = useQuery({
  //   queryKey: ["policy", policyAccount],
  //   queryFn: () =>
  //     policyAccount
  //       ? connection
  //           .getAccountInfo(asAddress(policyAccount))
  //           .send()
  //           .then((res) => res.value)
  //       : null,
  //   enabled: !!policyAccount,
  // });

  // policyProgram should always be vault.data.policyProgram (the program ID)
  const policyProgram = vault?.data.policyProgram || null;

  const handleForget = useCallback(() => {
    setVaults((prev) => prev.filter((v) => v.address !== props.address));
  }, [props.address, setVaults]);

  if (!vault)
    return (
      <div className="flex flex-col gap-2 relative">
        <Button
          onClick={handleForget}
          className="absolute -top-4 -right-4 scale-75"
          size="sm"
        >
          <TrashIcon className="w-4" />
        </Button>
      </div>
    );

  if (typeof window === "undefined") return null;

  return (
    <div className="flex flex-col gap-2 relative">
      <Button
        onClick={handleForget}
        className="absolute -top-4 -right-4 scale-75"
        size="sm"
      >
        <TrashIcon className="w-4" />
      </Button>
      <div className="flex flex-col gap-1">
        <div className="font-semibold">Address</div>
        <Address>{props.address}</Address>
      </div>
      <div className="flex flex-col gap-1">
        <div className="font-semibold">Seed</div>
        <div>{vault?.data.seed}</div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="font-semibold">Authority</div>
        <Address>{vault?.data.authority}</Address>
      </div>

      <div className="flex flex-col gap-1">
        <div className="font-semibold">Policy Account</div>
        <Address>{policyAccount}</Address>
        {policyAccount && policyProgram && (
          <div className="flex flex-col gap-1 bg-accent p-2 mt-2 rounded-md text-xs">
            <AccountDetails
              address={policyAccount}
              program={policyProgram}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="font-semibold">Policy Program</div>
        <Address>{policyProgram}</Address>
      </div>
      <div className="flex flex-col gap-1">
        <div className="font-semibold">Balance</div>
        <WalletBalance address={vault?.data.authority} />
      </div>
    </div>
  );
});
