import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";
import {
  AccountMeta,
  Address,
  address,
  appendTransactionMessageInstructions,
  signature as asSignature,
  BaseTransactionMessage,
  compileTransaction,
  createTransactionMessage,
  fetchJsonParsedAccount,
  getBase58Decoder,
  getBase64EncodedWireTransaction,
  Instruction,
  MessageModifyingSigner,
  pipe,
  Rpc,
  RpcSubscriptions,
  SendableTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  Signature,
  SignaturesMap,
  signTransactionMessageWithSigners,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
  TransactionMessageBytes,
  TransactionMessageWithFeePayer,
  TransactionModifyingSigner,
  TransactionSendingSigner
} from "@solana/kit";
import { TransactionWithLastValidBlockHeight } from "@solana/transaction-confirmation";

export const MAX_CU_LIMIT = 1_400_000;
export const MIN_COMPUTE_UNIT_PRICE = 30000;

export type SolanaTransactionSimulation = {
  computeUnitLimit: number;
};

export type SolanaAddressLookupTable = {
  addresses: Address[];
};

export class Transaction {
  static async fetchAddressLookupTable(
    rpc: Rpc<SolanaRpcApi>,
    addressLookupTable: Address
  ): Promise<SolanaAddressLookupTable> {
    const account = await fetchJsonParsedAccount<SolanaAddressLookupTable>(
      rpc,
      addressLookupTable
    );
    if (!account.exists) throw new Error("No address lookup table");
    return account.data as SolanaAddressLookupTable;
  }

  private static async calculateComputeUnitPrice(
    instructions: Instruction[],
    computeUnitLimit: number
  ): Promise<number> {
    console.log("@@@@@ instructions", instructions);
    console.log("@@@@@ computeUnitLimit", computeUnitLimit);
    return MIN_COMPUTE_UNIT_PRICE;
    // TODO:
    // const addresses = _.uniqBy(
    //   instructions.flatMap(ix => (ix.accounts || []).flatMap(account => account.address)).filter(Boolean),
    //   address => address,
    // );
    // const recentPriorityFeeByLevel = await Solana.fetchRecentPriorityFeesByLevel(addresses);
    // const lowestPriorityFee = recentPriorityFeeByLevel[SolanaPriorityFeeLevel.Low];

    // const computeUnitPriceCap = calculateComputeUnitPriceFromSol(computeUnitLimit, this.computeUnitPriceCapInSol);
    // const lowestComputeUnitPrice = this.computeUnitPriceMultiplier * lowestPriorityFee;

    // return Math.max(Math.min(lowestComputeUnitPrice, computeUnitPriceCap), MIN_COMPUTE_UNIT_PRICE);
  }

  private static async prepare(args: {
    rpc: Rpc<SolanaRpcApi>;
    signer: TransactionSendingSigner &
      TransactionModifyingSigner &
      MessageModifyingSigner;
    instructions: Instruction[];
    simulation?: SolanaTransactionSimulation;
    remainingAccounts?: AccountMeta[]
  }) {
    console.log("@@@@@ prepare", args);
    const { rpc, signer, instructions, simulation } = args;

    const computeUnitLimit = simulation
      ? simulation.computeUnitLimit
      : MAX_CU_LIMIT;
    const computeUnitPrice = await this.calculateComputeUnitPrice(
      instructions,
      computeUnitLimit
    );

    const { value: latestBlockhash } = await rpc
      .getLatestBlockhash({ commitment: "confirmed" })
      .send();

    return pipe(
      createTransactionMessage({ version: 0 }),
      (txm) =>
        setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, txm),
      (txm) => setTransactionMessageFeePayerSigner(signer, txm),
      (txm) => {
        const setComputeUnitLimitInstruction =
          getSetComputeUnitLimitInstruction({ units: computeUnitLimit });
        const setComputeUnitPriceInstruction =
          getSetComputeUnitPriceInstruction({
            microLamports: computeUnitPrice,
          });
        const ixs = [
          setComputeUnitLimitInstruction,
          setComputeUnitPriceInstruction,
          ...instructions,
        ];
        return appendTransactionMessageInstructions(ixs, txm);
      },
      async (txm) => {
        /*
         * Simulate transaction and call it again with proper settings
         * */
        // if (!simulation) {
        //   const simulation = await this.simulate(rpc, txm);
        //   return this.prepare({ ...args, simulation });
        // }

        return txm;
      }
    );
  }

  static async simulate(
    rpc: Rpc<SolanaRpcApi>,
    txm: BaseTransactionMessage & TransactionMessageWithFeePayer,
    failedAttempts = 0
  ): Promise<SolanaTransactionSimulation> {
    const transaction = compileTransaction(txm);
    const base64EncodedTransaction =
      getBase64EncodedWireTransaction(transaction);
    const simulation = await rpc
      .simulateTransaction(base64EncodedTransaction, { encoding: "base64" })
      .send();
    const {
      value: { unitsConsumed },
    } = simulation;

    if (!unitsConsumed) {
      if (failedAttempts === 3) {
        throw new Error("Simulation failed");
      }

      console.error("No simulation units consumed. Retrying...");

      const nextFailedAttempts = failedAttempts + 1;
      return this.simulate(rpc, txm, nextFailedAttempts);
    }

    // Add 15% and clamp CU to MAX_CU_LIMIT
    const computeUnitLimitWithReserve = Math.min(
      Number((unitsConsumed * 115n) / 100n),
      MAX_CU_LIMIT
    );
    return {
      computeUnitLimit: computeUnitLimitWithReserve,
    };
  }

  static async send(args: {
    rpc: Rpc<SolanaRpcApi>;
    subscription: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
    signer: TransactionSendingSigner &
      TransactionModifyingSigner &
      MessageModifyingSigner;
    instructions: Instruction[];
    alt?: Address;
    simulation?: SolanaTransactionSimulation;
  }): Promise<Signature> {
    const txm = await this.prepare(args);

    // Please don't remove this code. It's helpful to debug the transaction size.
    // console.log("@@@@@ instructions", instructions);
    // const encodedTransaction = this.encode(txm);
    // console.log("@@@@@ encodedTransaction", encodedTransaction.length);

    console.log("@@@@@ txm -> signing", txm);
    const signedTransaction = await signTransactionMessageWithSigners(txm);
    /*
     * Set lifetimeConstraint
     * */
    const transaction = {
      ...signedTransaction,
      lifetimeConstraint: txm.lifetimeConstraint,
    };

    const signatureBytes =
      transaction.signatures[address(args.signer.address)]!;
    const signature = asSignature(getBase58Decoder().decode(signatureBytes));

    console.log("@@@@@ signature -> send and wait", signature);
    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
      rpc: args.rpc,
      rpcSubscriptions: args.subscription,
    });

    await sendAndConfirmTransaction(
      transaction as unknown as SendableTransaction &
        TransactionWithLastValidBlockHeight &
        Readonly<{
          messageBytes: TransactionMessageBytes;
          signatures: SignaturesMap;
        }>,
      {
        skipPreflight: true,
        commitment: "confirmed",
        maxRetries: 0n,
      }
    ).catch(e => {
      throw { ...e, signature }
    });

    if (!signatureBytes) {
      throw new Error("No signature");
    }

    return signature;
  }
}
