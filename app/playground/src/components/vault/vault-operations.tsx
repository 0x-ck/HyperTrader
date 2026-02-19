import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Transaction } from "@/features/transaction/transaction";
import { addressBook } from "@/protocol/atoms";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AccountMeta,
  AccountRole,
  Address,
  address as asAddress,
  Rpc,
  Signature,
  SolanaRpcApi,
  TransactionSigner,
} from "@solana/kit";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useAtom } from "jotai";
import { LoaderIcon } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useConnection } from "../onchain/connection-context";
import { useProtocol } from "../onchain/protocol-context";
import { useSigner, useWallet } from "../wallet/wallet-context";
import { MultisigTransfer } from "./multisig-transfer";
import { getVaultPolicyAccount } from "@/lib/vault-policy-utils";

type VaultOperationsProps = {
  address: Address;
  seed: string;
};

const transferSchema = z.object({
  to: z.string(),
  amount: z.string().regex(/^[0-9]+[.,]?[0-9]*$/),
});

export const TransferOp = (props: VaultOperationsProps) => {
  const {
    protocol,
    helpers: { getVaultPda, getTransactionPda },
  } = useProtocol();
  const [book, setBook] = useAtom(addressBook);
  const signer = useSigner();
  const connection = useConnection();
  const { data: vault } = useQuery({
    queryKey: ["vault", props.address],
    queryFn: () =>
      protocol.hyroProtocol.fetchVault(connection.connection, props.address),
  });

  const { data: vaultWallet } = useQuery({
    queryKey: ["vaultWallet", vault?.data.seed],
    queryFn: () =>
      getVaultPda(vault!.data.seed).then(([vault, authority]) => ({
        vault,
        authority,
      })),
    enabled: !!vault,
  });

  // Get the policy account address based on the vault's policy program
  const { data: policyAccount } = useQuery({
    queryKey: ["policyAccount", vault?.data.policyProgram, props.address],
    queryFn: async () => {
      if (!vault) return null;
      return getVaultPolicyAccount(
        props.address,
        vault.data.policyProgram,
        { getVaultPda, getTransactionPda },
        protocol
      );
    },
    enabled: !!vault,
  });

  // policyProgram should always be vault.data.policyProgram (the program ID)
  const policyProgram = vault?.data.policyProgram || null;

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      to: "",
      amount: "",
    },
  });

  const {
    mutate: transfer,
    isPending,
    isError,
    isSuccess,
    error,
    reset,
  } = useMutation({
    onSettled() {
      setTimeout(reset, 3000);
    },
    mutationFn: async (data: z.infer<typeof transferSchema>) => {
      if (!vault) throw new Error("Vault not found");
      if (!vaultWallet) throw new Error("Not yet loaded vault wallet");
      if (!policyProgram) throw new Error("Program is not yet available");
      if (!signer) throw new Error("Signer is not yet available");

      // TODO: generate nonces?
      const nonce = Math.floor(Math.random() * 1000000);
      const transaction = await getTransactionPda(vaultWallet.vault, nonce);

      const amountNumber = Decimal(data.amount)
        .mul(10 ** 9)
        .floor();
      const ix = protocol.dropper.getTransferLamportsInstruction({
        amount: BigInt(amountNumber.toString()),
        from: vaultWallet?.authority as unknown as TransactionSigner,
        to: asAddress(data.to),
        systemProgram: asAddress(SystemProgram.programId.toBase58()),
      });

      console.log("ix", policyAccount, policyProgram);

      const createTxIx = protocol.hyroProtocol.getCreateTxInstruction({
        nonce,
        signer,
        pid: ix.programAddress,
        accs: [
          ...ix.accounts.map((account) => ({
            pubkey: account.address,
            // always false since it is meta tx? 'mnc
            isSigner: false, // account.role === AccountRole.WRITABLE_SIGNER || account.role === AccountRole.READONLY_SIGNER,
            isWritable:
              account.role === AccountRole.WRITABLE ||
              account.role === AccountRole.WRITABLE_SIGNER,
          })),
          {
            pubkey: protocol.dropper.DROPPER_PROGRAM_ADDRESS,
            isSigner: false,
            isWritable: false,
          },
        ],
        data: ix.data,

        vault: props.address,
        transaction: transaction[0],
        vaultSigner: vaultWallet.authority[0],
        policyAccount: policyAccount!,
        policyProgram,
        systemProgram: asAddress(SystemProgram.programId.toBase58()),
      });

      const executeTxIx = protocol.hyroProtocol.getExecuteTxInstruction({
        vault: props.address,
        transaction: transaction[0],
        vaultSigner: vaultWallet.authority[0],
        policyAccount: policyAccount!,
        policyProgram,
        signer,
      });

      // Hack accounts array to include the transfer instruction accounts
      console.log(
        "before",
        executeTxIx.accounts.map((a) => `${a.address}: ${a.role}`).join("\n")
      );
      (executeTxIx.accounts as AccountMeta[]).push(...ix.accounts, {
        address: protocol.dropper.DROPPER_PROGRAM_ADDRESS,
        role: AccountRole.READONLY,
      });
      console.log(
        "after",
        executeTxIx.accounts.map((a) => `${a.address}: ${a.role}`).join("\n")
      );

      await Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription,
        signer,
        instructions: [createTxIx, executeTxIx],
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
    },
  });

  // Check if this is a multisig policy
  const isMultisigPolicy = useMemo(() => {
    return policyProgram === protocol.policyMultisig.POLICY_MULTISIG_PROGRAM_ADDRESS;
  }, [policyProgram, protocol.policyMultisig.POLICY_MULTISIG_PROGRAM_ADDRESS]);

  // If it's a multisig policy, render the multisig transfer component
  if (isMultisigPolicy) {
    return <MultisigTransfer address={props.address} seed={props.seed} />;
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Transfer</h3>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            isPending ? null : transfer(data)
          )}
          className="flex flex-col gap-2"
        >
          <FormField
            control={form.control}
            name="to"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Recepient</FormLabel>
                <FormControl>
                  {/* <Input placeholder="abc_123" {...field} /> */}
                  <Combobox
                    mode="single" //single or multiple
                    options={[
                      ...book.map((v) => ({
                        value: v,
                        label: v.slice(0, 6) + "..." + v.slice(-4),
                      })),
                    ]}
                    placeholder="Select or enter recipient..."
                    selected={field.value} // string or array
                    onChange={field.onChange}
                    onCreate={(v) => {
                      setBook((prev) => [...prev, asAddress(v)]);
                      field.onChange(v);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="mt-2"
            disabled={isPending || isSuccess || isError}
            variant={
              isError ? "destructive" : isSuccess ? "constructive" : "default"
            }
          >
            {isPending ? "Sending..." : isSuccess ? "Sent" : "Send"}
          </Button>

          {isError && (
            <p className="text-destructive text-xs mt-2">{error.message}</p>
          )}
        </form>
      </Form>
    </div>
  );
};

const topupSchema = z.object({
  amount: z.string().regex(/^[0-9]+[.,]?[0-9]*$/),
});

export const TopupOp = (props: VaultOperationsProps) => {
  const wallet = useWallet();
  const { protocol } = useProtocol();
  const signer = useSigner();
  const connection = useConnection();

  const { data: vault } = useQuery({
    queryKey: ["vault", props.address],
    queryFn: () =>
      protocol.hyroProtocol.fetchVault(connection.connection, props.address),
  });

  const form = useForm<z.infer<typeof topupSchema>>({
    resolver: zodResolver(topupSchema),
    defaultValues: {
      amount: "",
    },
  });

  const {
    mutate: topup,
    isPending,
    isError,
    isSuccess,
    error,
    reset,
  } = useMutation({
    onSettled() {
      setTimeout(reset, 3000);
    },
    mutationFn: async (data: z.infer<typeof topupSchema>) => {
      console.log("topup", data);
      if (!wallet) throw new Error("Wallet is not connected");
      if (!vault) throw new Error("Vault not found");
      if (!signer) throw new Error("Signer not found");

      const ixRaw = SystemProgram.transfer({
        fromPubkey: new PublicKey(wallet.address),
        toPubkey: new PublicKey(vault.data.authority),
        lamports: Decimal(data.amount)
          .mul(10 ** 9)
          .toNumber(),
      });

      return Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription,
        signer,
        instructions: [
          {
            programAddress: asAddress(SystemProgram.programId.toBase58()),
            data: ixRaw.data,
            accounts: ixRaw.keys.map((key) => ({
              address: asAddress(key.pubkey.toBase58()),
              role:
                key.isSigner && key.isWritable
                  ? AccountRole.WRITABLE_SIGNER
                  : key.isSigner
                  ? AccountRole.READONLY_SIGNER
                  : key.isWritable
                  ? AccountRole.WRITABLE
                  : AccountRole.READONLY,
            })),
          },
        ],
        simulation: {
          computeUnitLimit: 200000,
        },
      });
    },
  });

  if (!vault)
    return <LoaderIcon className="animate-spin w-4 text-muted-foreground" />;

  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Topup</h3>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            isPending ? null : topup(data)
          )}
          className="flex flex-col gap-2"
        >
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="mt-2"
            disabled={isPending || isSuccess || isError}
            variant={
              isError ? "destructive" : isSuccess ? "constructive" : "default"
            }
          >
            {isPending ? "Sending..." : isSuccess ? "Sent" : "Send"}
          </Button>

          {isError && (
            <p className="text-destructive text-xs mt-2">{error.message}</p>
          )}
        </form>
      </Form>
    </div>
  );
};
