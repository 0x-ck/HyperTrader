"use client";

import { Transaction } from "@/features/transaction/transaction";
import { vaultsAtom } from "@/protocol/atoms";
import {
  address as asAddress,
  Instruction,
  Address as KitAddress,
  ProgramDerivedAddressBump,
  Rpc,
  Signature,
  SolanaRpcApi,
} from "@solana/kit";
import { useMutation } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useAtom } from "jotai/react";
import { useCallback } from "react";
import { z } from "zod";
import { useConnection } from "../onchain/connection-context";
import { useProtocol } from "../onchain/protocol-context";
import { Card, CardContent } from "../ui/card";
import { CreateNewVault } from "../vault/create-vault-forms";
import { newVaultSchema } from "../vault/new-vault-schema";
import { TopupOp, TransferOp } from "../vault/vault-operations";
import { useSigner } from "../wallet/wallet-context";
import { VaultDetails } from "../vault/vault-details";


export const HyroProtocol = () => {
  const [vaults, setVaults] = useAtom(vaultsAtom);
  const connection = useConnection();
  const signer = useSigner();
  const protocolContext = useProtocol();

  const {
    protocol,
    helpers: { getVaultPda, getLimitPolicyPda, getOwnersPolicyPda, getMultisigPolicyPda },
  } = protocolContext || { helpers: {} };

  const {
    mutate: createOrConnect,
    isPending: isPendingCreatingOrConnecting,
    isError: isErrorCreatingOrConnecting,
    error: errorCreatingOrConnecting,
  } = useMutation({
    mutationKey: ["createOrConnect"],
    mutationFn: async (opts: z.infer<typeof newVaultSchema>) => {
      const {
        seed,
        policy: { kind, params },
      } = opts;

      console.log("create or connect vault", opts);

      if (protocolContext === null) {
        throw new Error("Protocol context is not initialized");
      }

      if (vaults.find((v) => v.seed === seed)) {
        throw new Error("Already known vault");
      }

      if (!signer) throw new Error("Wallet is not connected");

      const [vault, authority] = await getVaultPda(seed);
      const existing = await protocol.hyroProtocol
        .fetchVault(connection.connection, vault[0])
        .then(() => true)
        .catch(() => false);
      if (existing) {
        console.log("vault already exists", vault[0]);
        return vault;
      }

      console.log("vault does not exist", vault[0]);

      const ixs: Instruction[] = [];

      const policyProgram = await (async () => {
        if (kind === "AllowAny")
          return protocol.policyAllowAny.POLICY_ALLOW_ANY_PROGRAM_ADDRESS;
        if (kind === "DenyAll")
          return protocol.policyDenyAll.POLICY_DENY_ALL_PROGRAM_ADDRESS;
        if (kind === "LimitTransfer")
          return protocol.policyLimitTransfer.POLICY_LIMIT_TRANSFER_PROGRAM_ADDRESS;
        if (kind === "Owners")
          return protocol.policyOwners.POLICY_OWNERS_PROGRAM_ADDRESS;
        if (kind === "Multisig")
          return protocol.policyMultisig.POLICY_MULTISIG_PROGRAM_ADDRESS;
        throw new Error("Not supported policy kind");
      })();

      const policyAccount = await (async () => {
        if (kind === "AllowAny")
          return protocol.policyAllowAny.POLICY_ALLOW_ANY_PROGRAM_ADDRESS;
        if (kind === "DenyAll")
          return protocol.policyDenyAll.POLICY_DENY_ALL_PROGRAM_ADDRESS;
        if (kind === "LimitTransfer") {
          return getLimitPolicyPda(vault[0]);
        }

        if (kind === "Owners") {
          console.log("owners", params);
          return getOwnersPolicyPda(vault[0], (params as string[]).map(asAddress));
        }

        if (kind === "Multisig") {
          console.log("multisig", params);
          return getMultisigPolicyPda(vault[0]);
        }

        throw new Error("Not supported policy kind");
      })();

      if (kind === "Owners" && policyAccount) {
        ixs.push(
          protocol.policyOwners.getInitializeOwnersInstruction({
            vault: vault[0],
            owners: (params as string[]).map(asAddress),
            policyAccount: getPdaOrAddress(policyAccount),
            signer: signer,
          })
        );
      }
      if (kind === "LimitTransfer" && policyAccount) {
        ixs.push(
          protocol.policyLimitTransfer.getInitializeLimitTransferInstruction({
            vault: vault[0],
            min: Decimal(params.min)
              .mul(10 ** 9)
              .floor()
              .toNumber(),
            max: Decimal(params.max)
              .mul(10 ** 9)
              .floor()
              .toNumber(),
            policyAccount: getPdaOrAddress(policyAccount),
            signer: signer,
          })
        );
      }

      if (kind === "Multisig" && policyAccount) {
        ixs.push(
          protocol.policyMultisig.getInitializeMultisigInstruction({
            vault: vault[0],
            owners: (params.owners as string[]).map(asAddress),
            threshold: params.threshold as number,
            policyAccount: getPdaOrAddress(policyAccount),
            signer: signer,
          })
        );
      }
      ixs.push(
        protocol.hyroProtocol.getInitializeVaultInstruction({
          vault: vault[0],
          signer: signer,
          authority: authority[0],
          seed,
          policyProgram,
        })
      );

      await Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription,
        signer: signer,
        instructions: ixs,
        simulation: {
          computeUnitLimit: 200000,
        },
      }).catch(async (e) => {
        const tx = await connection.connection
          .getTransaction(e.signature as Signature, {
            maxSupportedTransactionVersion: 0,
            encoding: "jsonParsed",
          })
          .send();

        if (tx) {
          console.log(
            "Transaction details:\n\t" + tx.meta?.logMessages?.join("\n\t")
          );
        }

        console.log("error sending transaction", e);

        throw e;
      });

      return vault;
      //       // create overvise
      //       const initializeVaultIx = await protocol.getInitializeVaultInstruction({
      //         vault,
      //         signer: address,
      //         authority,
      //         systemProgram: protocol.SYSTEM_PROGRAM_ADDRESS,
      //         seed,
      //         policyAccount,
      //       })

      //       return protocol.account.vault
      //         .fetch(vault, "confirmed")
      //         .then((v) => {
      //           if (v.seed !== seed) {
      //             throw new Error("Vault is unexpectly not the same as the seed");
      //           }
      //           return null;
      //         })
      //         .catch(() =>
      //           protocol.methods
      //             .initializeVault(seed, policyAccount)
      //             .accountsPartial({
      //               vault: vault,
      //               signer: publicKey,
      //               authority,
      //               systemProgram: SystemProgram.programId,
      //             })
      //             .transaction()
      //             .then(
      //               (tx) => (
      //                 console.log(`sending tx..
      // ${tx.instructions
      //   .map(
      //     (i) =>
      //       `\tProgram: ${i.programId} \n\t\t${i.data.toString(
      //         "hex"
      //       )}\n${i.keys
      //         .map((k) => `\t\t${k.pubkey} ${k.isSigner} ${k.isWritable}`)
      //         .join("\n")}`
      //   )
      //   .join("\n")}`),
      //                 sendTransaction(tx, connection)
      //               )
      //             )
      //         )
      //         .then(() => vault);
    },
    onSuccess: (vault, { seed, policy: { kind } }) => {
      if (vault)
        setVaults((prev) => [...prev, { seed, kind, address: vault?.[0] }]);
    },
  });

  const handleCreateOrConnect = useCallback(
    async (opts: z.infer<typeof newVaultSchema>) => {
      console.log("create or connect vault", opts);
      return createOrConnect(opts);
    },
    [createOrConnect]
  );

  return (
    <div className="flex flex-row gap-2 relative w-full flex-grow h-full overflow-y-hidden overflow-x-auto snap-center snap-x snap-mandatory">
      <Card className="sticky relative left-0 z-10 border-t-0 border-b-0 shadow-2xl rounded-none w-xs overflow-hidden flex-shrink-0 flex-grow-0">
        <CardContent className="sticky top-32">
          <CreateNewVault
            onCreateOrConnect={handleCreateOrConnect}
            isLoading={isPendingCreatingOrConnecting}
            isDisabled={isPendingCreatingOrConnecting}
          />
          {isErrorCreatingOrConnecting && (
            <div className="text-red-500">
              {errorCreatingOrConnecting.message}
            </div>
          )}
        </CardContent>
      </Card>
      {vaults.map((vault) => (
        <div
          className="flex flex-col -gap-px mx-2 my-4 w-sm items-start flex-shrink-0"
          key={vault.seed}
        >
          <Card className="w-full snap-center overflow-hidden">
            <CardContent>
              <VaultDetails {...vault} />
            </CardContent>
          </Card>
          <Card className="w-full snap-center overflow-hidden">
            <CardContent>
              <TopupOp {...vault} />
            </CardContent>
          </Card>
          <Card className="w-full snap-center overflow-hidden">
            <CardContent>
              <TransferOp {...vault} />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};
function getPdaOrAddress(
  policyAccount: readonly [KitAddress, ProgramDerivedAddressBump] | KitAddress
): KitAddress {
  return typeof policyAccount === "string" ? policyAccount : policyAccount[0];
}
