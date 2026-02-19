import {
  Base58EncodedBytes,
  Base64EncodedBytes,
  addEncoderSizePrefix,
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU32Encoder,
  getUtf8Encoder,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  type Address,
  type KeyPairSigner,
  getU64Encoder,
} from "@solana/kit";
import * as fs from "fs";
import {
  fetchChallenge,
  getChallengeDecoder,
  getChallengeTemplateDecoder,
  getUpdateChallengeInstruction,
} from "./generated";
import type {
  Challenge,
  ChallengeTemplate,
  UpdateChallengeInstructionDataArgs,
} from "./types";
import { expectAddress, expectSome } from "./generated/shared";

export class SolanaService {
  private rpc: ReturnType<typeof createSolanaRpc>;
  private rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
  private oracleSigner: KeyPairSigner;
  private programId: Address;

  private constructor(
    rpc: ReturnType<typeof createSolanaRpc>,
    rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>,
    oracleSigner: KeyPairSigner,
    programId: Address
  ) {
    this.rpc = rpc;
    this.rpcSubscriptions = rpcSubscriptions;
    this.oracleSigner = oracleSigner;
    this.programId = programId;

    console.log(`Oracle initialized with pubkey: ${this.oracleSigner.address}`);
  }

  static async create(
    rpcUrl: string,
    wsRpcUrl: string,
    keypairPath: string,
    programId: string
  ): Promise<SolanaService> {
    const rpc = createSolanaRpc(rpcUrl);
    const rpcSubscriptions = createSolanaRpcSubscriptions(wsRpcUrl);

    // Load oracle keypair
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    const keypairBytes = new Uint8Array(keypairData);
    const oracleSigner = await createKeyPairSignerFromBytes(keypairBytes);

    const programAddress = address(programId);

    return new SolanaService(
      rpc,
      rpcSubscriptions,
      oracleSigner,
      programAddress
    );
  }

  /**
   * Find all ChallengeTemplates where admin matches oracle key
   */
  async findManagedTemplates(): Promise<ChallengeTemplate[]> {
    try {
      // Get program accounts with memcmp filter for admin field
      // Discriminator (8) + stage_id (2) + stage_sequence (1) + stage_type (1) + starting_deposit (8) = 20 bytes offset
      const adminOffset = 8n + 2n + 1n + 1n + 8n;

      const response = await this.rpc
        .getProgramAccounts(this.programId, {
          commitment: "confirmed",
          encoding: "base64",
          filters: [
            {
              memcmp: {
                offset: adminOffset,
                bytes: this.oracleSigner
                  .address as unknown as Base58EncodedBytes,
                encoding: "base58",
              },
            },
          ],
        })
        .send();

      const decoder = getChallengeTemplateDecoder();
      const templates: ChallengeTemplate[] = [];

      for (const account of response) {
        try {
          const data = Buffer.from(account.account.data[0], "base64");
          const template = decoder.decode(data);
          templates.push(template);
        } catch (error) {
          console.error("Failed to decode template:", error);
        }
      }

      console.log(`Found ${templates.length} managed templates`);
      return templates;
    } catch (error) {
      console.error("Failed to fetch managed templates:", error);
      return [];
    }
  }

  /**
   * Find all active Challenges for given templates
   */
  async findActiveChallenges(
    templates: ChallengeTemplate[]
  ): Promise<Challenge[]> {
    try {
      // Challenge discriminator: [119, 250, 161, 121, 119, 81, 22, 208]
      const challengeDiscriminator = Buffer.from([
        119, 250, 161, 121, 119, 81, 22, 208,
      ]);

      const response = await this.rpc
        .getProgramAccounts(this.programId, {
          commitment: "confirmed",
          encoding: "base64",
          filters: [
            {
              memcmp: {
                offset: 0n,
                bytes: challengeDiscriminator.toString(
                  "base64"
                ) as Base64EncodedBytes,
                encoding: "base64",
              },
            },
          ],
        })
        .send();

      const decoder = getChallengeDecoder();
      const templateStageIds = new Set(templates.map((t) => t.stageId));
      const challenges: Challenge[] = [];

      for (const account of response) {
        try {
          const data = Buffer.from(account.account.data[0], "base64");
          const challenge = decoder.decode(data);

          // Filter by stage ID and active status
          if (
            templateStageIds.has(challenge.stageId) &&
            challenge.status === 1 // ChallengeStatus.Active
          ) {
            challenges.push(challenge);
          }
        } catch (error) {
          console.error("Failed to decode challenge:", error);
        }
      }

      console.log(`Found ${challenges.length} active challenges`);
      return challenges;
    } catch (error) {
      console.error("Failed to fetch active challenges:", error);
      return [];
    }
  }

  private getPDAAndBump(
    programAddress: Address,
    seeds: Array<string | Address | bigint | number>
  ) {
    const addressEncoder = getAddressEncoder();
    const bigIntToSeed = (bigInt: bigint, byteLength: number): Uint8Array => {
      const buf = Buffer.alloc(byteLength);
      buf.writeBigUInt64LE(bigInt);
      return buf;
      // const bytes = new Uint8Array(byteLength);
      // for (let i = 0; i < byteLength && bigInt > 0n; i++) {
      //   bytes[i] = Number(bigInt & 0xffn); // Get least significant byte
      //   bigInt >>= 8n; // Shift right by 8 bits
      // }
      // return bytes;
    };

    const seedsUint8Array = seeds.map((seed) => {
      if (typeof seed === "bigint" || typeof seed === "number") {
        return bigIntToSeed(BigInt(seed), 8);
      }

      // Try to encode as Address, if it fails treat as string
      // (since Address is an extension of String at runtime)
      try {
        const encoded = addressEncoder.encode(seed as Address);
        return encoded;
      } catch {
        return new TextEncoder().encode(seed as string);
      }
    });
    return getProgramDerivedAddress({
      seeds: seedsUint8Array,
      programAddress,
    });
  }
  /**
   * Derives the PDA for a challenge account
   */
  async deriveChallengeAddress(
    userAddress: Address,
    challengeId: string
  ): Promise<Address> {
    // const [pda] = await getProgramDerivedAddress({
    //   programAddress: this.programId,
    //   seeds: [
    //     getAddressEncoder().encode(expectAddress(userAddress)),
    //     addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder()).encode(
    //       challengeId
    //     ),
    //   ],
    // });

    const [pda] = await this.getPDAAndBump(this.programId, [
      userAddress,
      challengeId,
    ]);
    return pda;
  }

  /**
   * Derives the PDA for a challenge template account
   */
  async deriveChallengeTemplateAddress(stageId: number): Promise<Address> {
    const [pda] = await this.getPDAAndBump(this.programId, [stageId]);
    return pda;
  }

  /**
   * Updates a challenge with new data from webhook
   */
  async updateChallenge(
    challengeId: string,
    userAddress: Address,
    stageId: number,
    updateData: UpdateChallengeInstructionDataArgs
  ): Promise<string> {
    try {
      const challengeAddress = await this.deriveChallengeAddress(
        userAddress,
        challengeId
      );
      const templateAddress = await this.deriveChallengeTemplateAddress(
        stageId
      );

      console.log(
        `Update challenge ${challengeAddress} from template ${templateAddress}`
      );

      // Create the update instruction
      const instruction = getUpdateChallengeInstruction({
        challengeTemplateAccount: templateAddress,
        challengeAccount: challengeAddress,
        sender: this.oracleSigner,
        ...updateData,
      });

      // Build and send transaction using @solana/kit
      const { value: latestBlockhash } = await this.rpc
        .getLatestBlockhash()
        .send();

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(this.oracleSigner, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstructions([instruction], tx)
      );

      const signedTransaction = await signTransactionMessageWithSigners(
        transactionMessage
      );

      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
        rpc: this.rpc as any,
        rpcSubscriptions: this.rpcSubscriptions as any,
      });

      await sendAndConfirmTransaction(signedTransaction, {
        commitment: "confirmed",
      });

      // Extract signature from the signed transaction
      const signature = Object.keys(signedTransaction.signatures)[0];

      console.log(`Challenge ${challengeId} updated successfully`);
      console.log(`Template: ${templateAddress}`);
      console.log(`Challenge: ${challengeAddress}`);
      console.log(`Signature: ${signature}`);

      return signature;
    } catch (error) {
      console.error(`Failed to update challenge ${challengeId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a specific challenge by ID and user
   */
  async getChallenge(
    challengeId: string,
    userAddress: Address
  ): Promise<Challenge | null> {
    try {
      const challengeAddress = await this.deriveChallengeAddress(
        userAddress,
        challengeId
      );
      const challengeAccount = await fetchChallenge(this.rpc, challengeAddress);
      return challengeAccount.data;
    } catch (error) {
      console.error(`Failed to fetch challenge ${challengeId}:`, error);
      return null;
    }
  }

  getOracleAddress(): Address {
    return this.oracleSigner.address;
  }

  getRpc(): ReturnType<typeof createSolanaRpc> {
    return this.rpc;
  }
}
