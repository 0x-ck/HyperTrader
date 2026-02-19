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
  SolanaRpcApi,
  TransactionSigner,
} from "@solana/kit";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useAtom } from "jotai";
import { LoaderIcon, CheckCircle, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useConnection } from "../onchain/connection-context";
import { useProtocol } from "../onchain/protocol-context";
import { useSigner, useWallet } from "../wallet/wallet-context";
import { getVaultPolicyAccount } from "@/lib/vault-policy-utils";

type MultisigTransferProps = {
  address: Address;
  seed: string;
};

const transferSchema = z.object({
  to: z.string(),
  amount: z.string().regex(/^[0-9]+[.,]?[0-9]*$/),
});

export const MultisigTransfer = (props: MultisigTransferProps) => {
  const {
    protocol,
    helpers: { getVaultPda, getTransactionPda },
  } = useProtocol();
  const [book, setBook] = useAtom(addressBook);
  const signer = useSigner();
  const connection = useConnection();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  // Store pending transaction details - use localStorage key based on transaction address
  const getPendingTxDetailsKey = (txAddress?: string) => 
    txAddress ? `pendingTxDetails_${txAddress}` : null;
  
  const [pendingTxDetails, setPendingTxDetails] = useState<{ to: string; amount: string } | null>(null);

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

  // Fetch multisig policy data
  const { data: multisigPolicy } = useQuery({
    queryKey: ["multisigPolicy", policyAccount],
    queryFn: async () => {
      if (!policyAccount) return null;
      return protocol.policyMultisig.fetchMultiSig(
        connection.connection,
        policyAccount
      );
    },
    enabled: !!policyAccount,
  });

  // Check if current wallet is a multisig owner
  const isOwner = useMemo(() => {
    if (!multisigPolicy || !wallet?.publicKey) return false;
    
    // Convert wallet public key to base58 string format
    const walletAddress = new PublicKey(wallet.publicKey).toBase58();
    
    return multisigPolicy.data.owners.some(
      (owner) => owner === walletAddress
    );
  }, [multisigPolicy, wallet?.publicKey]);

  // Check if there's a pending transaction
  const hasPendingTransaction = useMemo(() => {
    const hasPending = multisigPolicy?.data.pendingTransaction && multisigPolicy.data.pendingTransaction.__option !== "None";
    
    // Load transaction details from localStorage if available
    if (hasPending && multisigPolicy.data.pendingTransaction.__option !== "None") {
      const txAddress = multisigPolicy.data.pendingTransaction.value;
      const key = getPendingTxDetailsKey(txAddress);
      const storedDetails = localStorage.getItem(key || "");
      if (storedDetails) {
        try {
          const parsed = JSON.parse(storedDetails);
          setPendingTxDetails(parsed);
        } catch (e) {
          console.error("Failed to parse stored transaction details:", e);
        }
      }
    } else {
      // Clear pending details if no pending transaction
      setPendingTxDetails(null);
    }
    
    return hasPending;
  }, [multisigPolicy]);

  // Get pending transaction details
  const { data: pendingTransaction } = useQuery({
    queryKey: ["pendingTransaction", multisigPolicy?.data.pendingTransaction],
    queryFn: async () => {
      if (!multisigPolicy?.data.pendingTransaction || multisigPolicy.data.pendingTransaction.__option === "None") return null;
      return protocol.hyroProtocol.fetchTransaction(
        connection.connection,
        multisigPolicy.data.pendingTransaction.value
      );
    },
    enabled: !!multisigPolicy?.data.pendingTransaction && multisigPolicy.data.pendingTransaction.__option !== "None",
  });

  // Check if current user has already signed
  const hasSigned = useMemo(() => {
    if (!multisigPolicy || !wallet?.publicKey) return false;
    const walletAddress = new PublicKey(wallet.publicKey).toBase58();
    const ownerIndex = multisigPolicy.data.owners.findIndex(
      (owner) => owner === walletAddress
    );
    return ownerIndex >= 0 && multisigPolicy.data.pendingSignatures[ownerIndex];
  }, [multisigPolicy, wallet?.publicKey]);

  // Count current signatures
  const signatureCount = useMemo(() => {
    if (!multisigPolicy) return 0;
    return multisigPolicy.data.pendingSignatures.filter(Boolean).length;
  }, [multisigPolicy]);

  // Check if threshold is met
  const canExecute = useMemo(() => {
    if (!multisigPolicy) return false;
    return signatureCount >= multisigPolicy.data.threshold;
  }, [multisigPolicy, signatureCount]);

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      to: "",
      amount: "",
    },
  });

  // Create Transaction Mutation
  const {
    mutate: createTransaction,
    isPending: isCreating,
    isError: isCreateError,
    isSuccess: isCreateSuccess,
    error: createError,
    reset: resetCreate,
  } = useMutation({
    onSettled() {
      setTimeout(resetCreate, 3000);
    },
    mutationFn: async (data: z.infer<typeof transferSchema>) => {
      if (!vault) throw new Error("Vault not found");
      if (!vaultWallet) throw new Error("Not yet loaded vault wallet");
      if (!signer) throw new Error("Signer is not yet available");

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

      const createTxIx = protocol.hyroProtocol.getCreateTxInstruction({
        nonce,
        signer,
        pid: ix.programAddress,
        accs: [
          ...ix.accounts.map((account) => ({
            pubkey: account.address,
            isSigner: false,
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
        policyProgram: protocol.policyMultisig.POLICY_MULTISIG_PROGRAM_ADDRESS,
        systemProgram: asAddress(SystemProgram.programId.toBase58()),
      });

      await Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription,
        signer,
        instructions: [createTxIx],
        simulation: {
          computeUnitLimit: 200000,
        },
      });

      // Store transaction details for later use
      const txDetails = { to: data.to, amount: data.amount };
      setPendingTxDetails(txDetails);
      
      // Save to localStorage so other users can access the details
      const txAddress = transaction[0];
      const key = getPendingTxDetailsKey(txAddress);
      localStorage.setItem(key || "", JSON.stringify(txDetails));
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["multisigPolicy", policyAccount] });
      queryClient.invalidateQueries({ queryKey: ["pendingTransaction"] });
    },
  });

  // Approve Transaction Mutation
  const {
    mutate: approveTransaction,
    isPending: isApproving,
    isError: isApproveError,
    isSuccess: isApproveSuccess,
    error: approveError,
    reset: resetApprove,
  } = useMutation({
    onSettled() {
      setTimeout(resetApprove, 3000);
    },
    mutationFn: async () => {
      if (!vault) throw new Error("Vault not found");
      if (!signer) throw new Error("Signer is not yet available");

      const approveIx = protocol.policyMultisig.getApproveInstruction({
        policyAccount: policyAccount!,
        owner: signer,
      });

      await Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription,
        signer,
        instructions: [approveIx],
        simulation: {
          computeUnitLimit: 200000,
        },
      });
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["multisigPolicy", policyAccount] });
      queryClient.invalidateQueries({ queryKey: ["pendingTransaction"] });
    },
  });

  // Execute Transaction Mutation
  const {
    mutate: executeTransaction,
    isPending: isExecuting,
    isError: isExecuteError,
    isSuccess: isExecuteSuccess,
    error: executeError,
    reset: resetExecute,
  } = useMutation({
    onSettled() {
      setTimeout(resetExecute, 3000);
    },
    mutationFn: async () => {
      if (!vault) throw new Error("Vault not found");
      if (!vaultWallet) throw new Error("Not yet loaded vault wallet");
      if (!signer) throw new Error("Signer not available");
      if (!multisigPolicy?.data.pendingTransaction || multisigPolicy.data.pendingTransaction.__option === "None") {
        throw new Error("No pending transaction");
      }

      const executeTxIx = protocol.hyroProtocol.getExecuteTxInstruction({
        vault: props.address,
        transaction: multisigPolicy.data.pendingTransaction.value,
        vaultSigner: vaultWallet.authority[0],
        policyAccount: policyAccount!,
        policyProgram: protocol.policyMultisig.POLICY_MULTISIG_PROGRAM_ADDRESS,
        signer: signer as TransactionSigner,
      });

      // We need to add the same accounts that were used during transaction creation
      // These accounts are required for the execution to work properly
      if (!pendingTxDetails) {
        // Try to load from localStorage as fallback
        const txAddress = multisigPolicy.data.pendingTransaction.value;
        const storedDetails = localStorage.getItem(getPendingTxDetailsKey(txAddress) || "");
        if (storedDetails) {
          try {
            const parsed = JSON.parse(storedDetails);
            setPendingTxDetails(parsed);
            // Use the parsed details
            const amountNumber = Decimal(parsed.amount)
              .mul(10 ** 9)
              .floor();
            const ix = protocol.dropper.getTransferLamportsInstruction({
              amount: BigInt(amountNumber.toString()),
              from: vaultWallet?.authority as unknown as TransactionSigner,
              to: asAddress(parsed.to),
              systemProgram: asAddress(SystemProgram.programId.toBase58()),
            });

            // Add the required accounts to the execute instruction
            (executeTxIx.accounts as AccountMeta[]).push(...ix.accounts, {
              address: protocol.dropper.DROPPER_PROGRAM_ADDRESS,
              role: AccountRole.READONLY,
            });

            await Transaction.send({
              rpc: connection.connection as Rpc<SolanaRpcApi>,
              subscription: connection.subscription,
              signer,
              instructions: [executeTxIx],
              simulation: {
                computeUnitLimit: 200000,
              },
            });
            
            // Clean up localStorage after successful execution
            localStorage.removeItem(getPendingTxDetailsKey(txAddress) || "");
            setPendingTxDetails(null);
            
            // Invalidate queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ["multisigPolicy", policyAccount] });
            queryClient.invalidateQueries({ queryKey: ["pendingTransaction"] });
            return;
          } catch (e) {
            console.error("Failed to parse stored transaction details:", e);
          }
        }
        
        // If localStorage fails, try to fetch transaction data from blockchain
        try {
          const transactionData = await protocol.hyroProtocol.fetchTransaction(
            connection.connection,
            txAddress
          );
          
          if (transactionData) {
            // For now, we'll need to parse the transaction data to extract the transfer details
            // This is a temporary solution - we need to understand the transaction data structure
            throw new Error("Transaction data found but parsing not implemented yet. Please contact the transaction creator for details.");
          }
        } catch (e) {
          console.error("Failed to fetch transaction data:", e);
        }
        
        throw new Error("Transaction details not found. Please refresh the page and try again, or contact the transaction creator.");
      }

      const amountNumber = Decimal(pendingTxDetails.amount)
        .mul(10 ** 9)
        .floor();
      const ix = protocol.dropper.getTransferLamportsInstruction({
        amount: BigInt(amountNumber.toString()),
        from: vaultWallet?.authority as unknown as TransactionSigner,
        to: asAddress(pendingTxDetails.to),
        systemProgram: asAddress(SystemProgram.programId.toBase58()),
      });

      // Add the required accounts to the execute instruction
      (executeTxIx.accounts as AccountMeta[]).push(...ix.accounts, {
        address: protocol.dropper.DROPPER_PROGRAM_ADDRESS,
        role: AccountRole.READONLY,
      });

      await Transaction.send({
        rpc: connection.connection as Rpc<SolanaRpcApi>,
        subscription: connection.subscription,
        signer,
        instructions: [executeTxIx],
        simulation: {
          computeUnitLimit: 200000,
        },
      });
      
      // Clean up localStorage after successful execution
      const txAddress = multisigPolicy.data.pendingTransaction.value;
      localStorage.removeItem(getPendingTxDetailsKey(txAddress) || "");
      setPendingTxDetails(null);
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["multisigPolicy", policyAccount] });
      queryClient.invalidateQueries({ queryKey: ["pendingTransaction"] });
    },
  });

  // Handle wallet disconnected state
  if (!wallet?.publicKey) {
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          Please connect your wallet to interact with this multisig vault.
        </p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          You are not an owner of this multisig vault.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Multisig Transfer</h3>
      
      {/* Pending Transaction Status */}
      {hasPendingTransaction && (
        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Pending Transaction</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Signatures: {signatureCount}/{multisigPolicy?.data.threshold}</p>
            {pendingTransaction && (
              <>
                <p>Transaction: {(multisigPolicy?.data.pendingTransaction as { value?: string })?.value?.slice(0, 8)}...</p>
                {pendingTxDetails && (
                  <>
                    <p>To: {pendingTxDetails.to}</p>
                    <p>Amount: {pendingTxDetails.amount} SOL</p>
                  </>
                )}
              </>
            )}
            
            {/* Show all owners and their signing status */}
            <div className="mt-3">
              <p className="font-medium mb-2">Owner Signatures:</p>
              <div className="space-y-1">
                {multisigPolicy?.data.owners.map((owner, index) => {
                  const isSigned = multisigPolicy.data.pendingSignatures[index];
                  const isCurrentUser = wallet?.publicKey && new PublicKey(wallet.publicKey).toBase58() === owner;
                  
                  return (
                    <div key={owner} className="flex items-center justify-between text-xs">
                      <span className={isCurrentUser ? "font-medium" : ""}>
                        {isCurrentUser ? "You" : owner.slice(0, 6) + "..." + owner.slice(-4)}
                      </span>
                      <div className="flex items-center gap-1">
                        {isSigned ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">Signed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-orange-600" />
                            <span className="text-orange-600">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            {!hasSigned && (
              <Button
                onClick={() => approveTransaction()}
                disabled={isApproving}
                size="sm"
              >
                {isApproving ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign Transaction"
                )}
              </Button>
            )}
            
            {hasSigned && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">You have signed</span>
              </div>
            )}
            
            {canExecute && (
              <Button
                onClick={() => executeTransaction()}
                disabled={isExecuting}
                size="sm"
                variant="default"
              >
                {isExecuting ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  "Execute Transaction"
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Create New Transaction Form */}
      {!hasPendingTransaction && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              isCreating ? null : createTransaction(data)
            )}
            className="flex flex-col gap-2"
          >
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem className="w-full text-left">
                  <FormLabel>Recipient</FormLabel>
                  <FormControl>
                    <Combobox
                      mode="single"
                      options={[
                        ...book.map((v) => ({
                          value: v,
                          label: v.slice(0, 6) + "..." + v.slice(-4),
                        })),
                      ]}
                      placeholder="Select or enter recipient..."
                      selected={field.value}
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
                  <FormLabel>Amount (SOL)</FormLabel>
                  <FormControl>
                    <Input placeholder="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                "Create Transaction"
              )}
            </Button>
          </form>
        </Form>
      )}

      {/* Error Messages */}
      {(isCreateError || isApproveError || isExecuteError) && (
        <div className="p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950">
          <p className="text-sm text-red-600">
            {createError?.message || approveError?.message || executeError?.message}
          </p>
        </div>
      )}

      {/* Success Messages */}
      {(isCreateSuccess || isApproveSuccess || isExecuteSuccess) && (
        <div className="p-3 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950">
          <p className="text-sm text-green-600">
            {isCreateSuccess && "Transaction created successfully!"}
            {isApproveSuccess && "Transaction signed successfully!"}
            {isExecuteSuccess && "Transaction executed successfully!"}
          </p>
        </div>
      )}
    </div>
  );
};
