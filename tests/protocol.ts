import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { PolicyAllowAny } from "../target/types/policy_allow_any";
import { PolicyDenyAll } from "../target/types/policy_deny_all";
import { HyroProtocol } from "../target/types/hyro_protocol";
import { Dropper } from "../target/types/dropper";
import {
  expectRevert,
  getLimitPolicyPda,
  getMultisigPolicyPda,
  getOwnersPolicyPda,
  getTransactionPda,
  getVaultPda,
  getVaultBasedLimitPolicyPda,
  getVaultBasedOwnersPolicyPda,
  getVaultBasedMultisigPolicyPda,
} from "./lib";
import { BN } from "bn.js";
import { PolicyLimitTransfer } from "../target/types/policy_limit_transfer";
import { PolicyOwners } from "../target/types/policy_owners";
import { PolicyMultisig } from "../target/types/policy_multisig";

let DENY_ALL: Program<PolicyDenyAll>;
let ALLOW_ANY: Program<PolicyAllowAny>;
let PROTOCOL: Program<HyroProtocol>;
let PROVIDER: anchor.Provider;
let DROPPER: Program<Dropper>;
let LIMIT_TRANSFER: Program<PolicyLimitTransfer>;
let OWNERS: Program<PolicyOwners>;
let MULTISIG: Program<PolicyMultisig>;

describe("hyro_protocol", () => {
  beforeEach(async () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    const provider = anchor.getProvider();

    PROTOCOL = anchor.workspace.HyroProtocol as Program<HyroProtocol>;
    DENY_ALL = anchor.workspace.PolicyDenyAll as Program<PolicyDenyAll>;
    ALLOW_ANY = anchor.workspace.PolicyAllowAny as Program<PolicyAllowAny>;
    DROPPER = anchor.workspace.Dropper as Program<Dropper>;
    LIMIT_TRANSFER = anchor.workspace
      .PolicyLimitTransfer as Program<PolicyLimitTransfer>;
    PROVIDER = anchor.getProvider();
    OWNERS = anchor.workspace.PolicyOwners as Program<PolicyOwners>;
    MULTISIG = anchor.workspace.PolicyMultisig as Program<PolicyMultisig>;
  });

  it("Initializes vault with DenyAll policy", async () => {
    const vaultKeypair = anchor.web3.Keypair.generate();

    const [pda, authority] = getVaultPda("hello world");
    console.log("pda", pda.toBase58());
    console.log("payer", PROVIDER.wallet.payer.publicKey.toBase58());

    await PROTOCOL.methods
      .initializeVault("hello world", DENY_ALL.programId)
      .accounts({
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .signers([PROVIDER.wallet.payer])
      .rpc();

    const vault = await PROTOCOL.account.vault.fetch(pda);
    assert.equal(vault.seed, "hello world");
    assert.deepStrictEqual(
      vault.policyProgram.toBase58(),
      DENY_ALL.programId.toBase58()
    );
  });

  it("DenyAll policy blocks validate", async () => {
    const vaultKeypair = anchor.web3.Keypair.generate();
    const transaction = anchor.web3.Keypair.generate();

    let threw = false;
    try {
      await DENY_ALL.methods
        .validate({ execution: {} })
        .accounts({
          vault: vaultKeypair.publicKey,
        })
        .remainingAccounts([
          { pubkey: transaction.publicKey, isSigner: false, isWritable: false },
          { pubkey: DENY_ALL.programId, isSigner: false, isWritable: false },
          { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
          { pubkey: vaultKeypair.publicKey, isSigner: false, isWritable: false },
        ])
        .rpc();
    } catch (e) {
      threw = true;
    }
    assert(threw, "DenyAll policy should block the action");
  });

  it("Initializes vault with AllowAny policy", async () => {
    const [pda, authority] = getVaultPda("allow_any");

    await PROTOCOL.methods
      .initializeVault("allow_any", ALLOW_ANY.programId)
      .accounts({
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .signers([PROVIDER.wallet.payer])
      .rpc();

    const vault = await PROTOCOL.account.vault.fetch(pda);
    assert.equal(vault.seed, "allow_any");
    assert.deepStrictEqual(
      vault.policyProgram.toBase58(),
      ALLOW_ANY.programId.toBase58()
    );
  });

  it("AllowAny policy allows validate", async () => {
    const [vault, vaultAuthority] = getVaultPda("allow_any");
    const transaction = anchor.web3.Keypair.generate();
    const policyAccount = ALLOW_ANY.programId;
    const signer = PROVIDER.wallet.publicKey;

    let threw = false;
    try {
      await ALLOW_ANY.methods
        .validate({ creation: {} })
        .accounts({
          vault: vault,
        })
        .remainingAccounts([
          { pubkey: transaction.publicKey, isSigner: false, isWritable: false },
          { pubkey: policyAccount, isSigner: false, isWritable: false },
          { pubkey: signer, isSigner: false, isWritable: false },
          { pubkey: vaultAuthority, isSigner: false, isWritable: false },
        ])
        .rpc();
    } catch (e) {
      threw = true;
      console.error(e);
    }
    assert(!threw, "AllowAny policy should allow the action");
  });

  it("Creates and executes transaction", async () => {
    const [pda, authority] = getVaultPda("new_1");
    const [transaction] = getTransactionPda(pda, 42);

    await PROTOCOL.methods
      .initializeVault("new_1", ALLOW_ANY.programId)
      .accounts({
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .signers([PROVIDER.wallet.payer])
      .rpc();

    assert.deepStrictEqual(
      await PROTOCOL.account.vault.fetch(pda).then((v) => v.seed),
      "new_1",
      "Vault nonce should match"
    );


    const ix = await PROTOCOL.methods
      .ping()
      .accounts({ signer: authority })
      .instruction();

    ix.keys = ix.keys.map((k) => ({
      ...k,
      isSigner: false,
    }));

    ix.keys.push({
      pubkey: PROTOCOL.programId,
      isSigner: false,
      isWritable: false,
    });

    console.log(ALLOW_ANY.programId.toBase58());

    await PROTOCOL.methods
      .createTx(new BN(42), ix.programId, ix.keys, ix.data)
      .accounts({
        vault: pda,
        policyAccount: ALLOW_ANY.programId,
        policyProgram: ALLOW_ANY.programId,
      })
      .remainingAccounts([
        { pubkey: transaction, isSigner: false, isWritable: false },
        { pubkey: ALLOW_ANY.programId, isSigner: false, isWritable: false },
        { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
      ])
      .signers([PROVIDER.wallet.payer])
      .rpc();

    const txAccount = await PROTOCOL.account.transaction.fetch(
      transaction
    );

    assert.ok(
      txAccount.programId.equals(PROTOCOL.programId),
      "Transaction program ID should match"
    );
    assert.ok(txAccount.vault.equals(pda), "Transaction vault should match");
    assert.deepStrictEqual(
      txAccount.accounts,
      ix.keys,
      "Transaction account should match"
    );
    assert.deepStrictEqual(
      txAccount.data,
      ix.data,
      "Transaction data should match"
    );
    assert.deepStrictEqual(
      txAccount.didExecute,
      false,
      "Transaction should not have executed"
    );

    await PROTOCOL.methods
      .executeTx()
      .accountsPartial({
        vault: pda,
        transaction,
        policyAccount: ALLOW_ANY.programId,
        policyProgram: ALLOW_ANY.programId,
        vaultSigner: authority,
      })
      .remainingAccounts(
        [
          { pubkey: transaction, isSigner: false, isWritable: false },
          { pubkey: ALLOW_ANY.programId, isSigner: false, isWritable: false },
          { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
          { pubkey: authority, isSigner: false, isWritable: false },
        ],
      )
      .remainingAccounts(ix.keys)
      .rpc();
  });

  it("Should fail to execute transaction with DENY all", async () => {
    const [pda, authority] = getVaultPda("deny_2");
    const [transaction] = getTransactionPda(pda, 42);

    await PROTOCOL.methods
      .initializeVault("deny_2", DENY_ALL.programId)
      .accounts({
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .signers([PROVIDER.wallet.payer])
      .rpc();

    assert.deepStrictEqual(
      await PROTOCOL.account.vault
        .fetch(pda)
        .then((v) => v.policyProgram.toBase58()),
      DENY_ALL.programId.toBase58(),
      "Vault nonce should match"
    );

    assert.deepStrictEqual(
      await PROTOCOL.account.vault.fetch(pda).then((v) => v.policyProgram),
      DENY_ALL.programId,
      "Vault policy program should match"
    );

    const pid = PROTOCOL.programId;
    const accounts = [
      {
        pubkey: pda,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: transaction,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: DENY_ALL.programId,
        isSigner: false,
        isWritable: false,
      },
    ];
    const data = PROTOCOL.coder.instruction.encode("ping", {});

    await PROTOCOL.methods
      .createTx(new BN(42), pid, accounts, data)
      .accounts({
        vault: pda,
        policyAccount: DENY_ALL.programId,
        policyProgram: DENY_ALL.programId,
      })
      .remainingAccounts([
        { pubkey: transaction, isSigner: false, isWritable: false },
        { pubkey: DENY_ALL.programId, isSigner: false, isWritable: false },
        { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
        { pubkey: pda, isSigner: false, isWritable: false },
      ])
      .signers([PROVIDER.wallet.payer])
      .rpc();

    const txAccount = await PROTOCOL.account.transaction.fetch(
      transaction
    );

    assert.ok(
      txAccount.programId.equals(PROTOCOL.programId),
      "Transaction program ID should match"
    );
    assert.ok(txAccount.vault.equals(pda), "Transaction vault should match");
    assert.deepStrictEqual(
      txAccount.accounts,
      accounts,
      "Transaction account should match"
    );
    assert.deepStrictEqual(
      txAccount.data,
      data,
      "Transaction data should match"
    );
    assert.deepStrictEqual(
      txAccount.didExecute,
      false,
      "Transaction should not have executed"
    );

    console.log("PROTOCOL");
    console.log("DENY_ALL_POLICY_ID", DENY_ALL.programId.toBase58());
    console.log("ALLOW_ANY_POLICY_ID", ALLOW_ANY.programId.toBase58());
    console.log("vaultKeypair", pda.toBase58());
    console.log("pda", pda.toBase58());
    console.log("transaction", transaction.toBase58());

    assert.isTrue(
      await PROTOCOL.methods
        .executeTx()
        .accounts({
          vault: pda,
          transaction,
          policyAccount: DENY_ALL.programId,
          policyProgram: DENY_ALL.programId,
        })
        .remainingAccounts([
          { pubkey: transaction, isSigner: false, isWritable: false },
          { pubkey: DENY_ALL.programId, isSigner: false, isWritable: false },
          { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
          { pubkey: pda, isSigner: false, isWritable: false },
        ])
        .remainingAccounts(accounts)
        .rpc()
        .then(() => false)
        .catch((e) => {
          if (
            e instanceof anchor.AnchorError &&
            e.errorLogs.some((log) => log.includes("Action denied by policy"))
          ) {
            return true;
          }

          return false;
        }),
      "Should fail to execute transaction with DENY all"
    );
  });

  it("Transfer funds from vault", async () => {
    // create vault
    const [pda, authority] = getVaultPda("new_2");
    await PROTOCOL.methods
      .initializeVault("new_2", ALLOW_ANY.programId)
      .accounts({
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .signers([PROVIDER.wallet.payer])
      .rpc();

    assert.deepStrictEqual(
      await PROTOCOL.account.vault.fetch(pda).then((v) => v.seed),
      "new_2",
      "Vault nonce should match"
    );

    // topup vault
    await DROPPER.methods
      .transferLamports(new BN(1_000_000_000))
      .accounts({
        from: PROVIDER.wallet.payer.publicKey,
        to: authority,
      })
      .signers([PROVIDER.wallet.payer])
      .rpc({
        commitment: "confirmed",
      });

    const [transaction] = getTransactionPda(pda, 42);

    const ix = await DROPPER.methods
      .transferLamports(new BN(500_000_000))
      .accounts({
        from: authority,
        to: PROVIDER.wallet.payer.publicKey,
      })
      .instruction();

    ix.keys.push({
      pubkey: DROPPER.programId,
      isSigner: false,
      isWritable: false,
    });

    console.log(`
PROTOCOL: ${PROTOCOL.programId.toBase58()}
DROPPER: ${DROPPER.programId.toBase58()}
VAULT: ${pda.toBase58()}
VAULT_AUTHORITY: ${authority.toBase58()}
PAYER: ${PROVIDER.wallet.payer.publicKey.toBase58()}
TX: ${transaction.toBase58()}
`);
    console.log(
      "create tx",
      ix.keys.map((k) => `${k.pubkey.toBase58()} ${k.isSigner} ${k.isWritable}`)
    );

    await PROTOCOL.methods
      .createTx(new BN(42), DROPPER.programId, ix.keys, ix.data)
      .accountsPartial({
        vault: pda,
        transaction,
        policyAccount: ALLOW_ANY.programId,
        policyProgram: ALLOW_ANY.programId,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .remainingAccounts([
        { pubkey: transaction, isSigner: false, isWritable: false },
        { pubkey: ALLOW_ANY.programId, isSigner: false, isWritable: false },
        { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
      ])
      .signers([PROVIDER.wallet.payer])
      .rpc();

    console.log("check balances");
    const balanceVaultBefore = await PROVIDER.connection.getBalance(authority);
    const balanceProviderBefore = await PROVIDER.connection.getBalance(
      PROVIDER.wallet.payer.publicKey
    );
    console.log("execute tx");
    await PROTOCOL.methods
      .executeTx()
      .accountsPartial({
        vault: pda,
        transaction: transaction,
        policyAccount: ALLOW_ANY.programId,
        policyProgram: ALLOW_ANY.programId,
        vaultSigner: authority,
      })
      .remainingAccounts([
        { pubkey: transaction, isSigner: false, isWritable: false },
        { pubkey: ALLOW_ANY.programId, isSigner: false, isWritable: false },
        { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
      ])
      .remainingAccounts(ix.keys.map((k) => ({ ...k, isSigner: false })))
      .rpc({
        commitment: "confirmed",
      });

    const balanceVaultAfter = await PROVIDER.connection.getBalance(authority);
    const balanceProviderAfter = await PROVIDER.connection.getBalance(
      PROVIDER.wallet.payer.publicKey
    );

    console.log("balanceVaultBefore", balanceVaultBefore);
    console.log("balanceVaultAfter ", balanceVaultAfter);
    console.log("balanceProviderBefore", balanceProviderBefore);
    console.log("balanceProviderAfter ", balanceProviderAfter);

    assert.isTrue(
      balanceVaultBefore > balanceVaultAfter,
      "Vault balance should decrease"
    );
    assert.isTrue(
      balanceProviderAfter > balanceProviderBefore,
      "Provider balance should increase"
    );
  });

  it("Limit transfer funds", async () => {
    // create vault first
    const seed = "limit";
    const [pda, authority] = getVaultPda(seed);

    await PROTOCOL.methods
      .initializeVault(seed, LIMIT_TRANSFER.programId)
      .accounts({
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .signers([PROVIDER.wallet.payer])
      .rpc();

    // create policy with vault as seed
    const min = 500_000_000;
    const max = 1_000_000_000;
    const [policy] = getVaultBasedLimitPolicyPda(pda);
    await LIMIT_TRANSFER.methods
      .initializeLimitTransfer(new BN(min), new BN(max))
      .accounts({
        vault: pda,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .rpc();

    // topup vault
    await DROPPER.methods
      .transferLamports(new BN(1_500_000_000))
      .accounts({
        from: PROVIDER.wallet.payer.publicKey,
        to: authority,
      })
      .signers([PROVIDER.wallet.payer])
      .rpc({
        commitment: "confirmed",
      });

    const [transaction] = getTransactionPda(pda, 42);

    const ix = await DROPPER.methods
      .transferLamports(new BN(500_000_000))
      .accounts({
        from: authority,
        to: PROVIDER.wallet.payer.publicKey,
      })
      .instruction();

    ix.keys.push({
      pubkey: DROPPER.programId,
      isSigner: false,
      isWritable: false,
    });

    const createTx = await PROTOCOL.methods
      .createTx(new BN(42), DROPPER.programId, ix.keys, ix.data)
      .accounts({
        vault: pda,
        policyAccount: policy,
        policyProgram: LIMIT_TRANSFER.programId,
      })
      .remainingAccounts([
        { pubkey: transaction, isSigner: false, isWritable: false },
        { pubkey: policy, isSigner: false, isWritable: false },
        { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
      ])
      .signers([PROVIDER.wallet.payer])
      .rpc();
    console.log(createTx);
    console.log("transaction account", transaction.toBase58());
    console.log("policy account", policy.toBase58());
    console.log("provider account", PROVIDER.wallet.payer.publicKey.toBase58());
    console.log("authority account", authority.toBase58());

    console.log("check balances");
    const balanceVaultBefore = await PROVIDER.connection.getBalance(authority);
    const balanceProviderBefore = await PROVIDER.connection.getBalance(
      PROVIDER.wallet.payer.publicKey
    );
    console.log("execute tx");
    const tx = await PROTOCOL.methods
      .executeTx()
      .accountsPartial({
        vault: pda,
        transaction,
        policyAccount: policy,
        policyProgram: LIMIT_TRANSFER.programId,
        vaultSigner: authority,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .remainingAccounts([
        { pubkey: transaction, isSigner: false, isWritable: false },
        { pubkey: policy, isSigner: false, isWritable: false },
        { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
      ])
      .remainingAccounts(ix.keys.map((k) => ({ ...k, isSigner: false })))
      .rpc({
        commitment: "confirmed",
      });
      // .catch((e) => {
      //   if (e instanceof anchor.AnchorError) {
      //     console.log(e.errorLogs);
      //     console.log(e.logs);
      //   }

      //   throw e;
      // });

    console.log(tx);

    const balanceVaultAfter = await PROVIDER.connection.getBalance(authority);
    const balanceProviderAfter = await PROVIDER.connection.getBalance(
      PROVIDER.wallet.payer.publicKey
    );

    console.log("balanceVaultBefore", balanceVaultBefore);
    console.log("balanceVaultAfter ", balanceVaultAfter);
    console.log("balanceProviderBefore", balanceProviderBefore);
    console.log("balanceProviderAfter ", balanceProviderAfter);

    assert.isTrue(
      balanceVaultBefore > balanceVaultAfter,
      "Vault balance should decrease"
    );
    assert.isTrue(
      balanceProviderAfter > balanceProviderBefore,
      "Provider balance should increase"
    );
  });

  it("Only whitelisted owners can transfer funds", async () => {
    const owners = Array.from({ length: 2 }, () =>
      anchor.web3.Keypair.generate()
    );

    // topup owners
    await Promise.all(
      owners.map(async (owner) =>
        PROVIDER.connection.requestAirdrop(owner.publicKey, 10_000_000_000)
      )
    );

    // create vault first
    const [pda, authority] = getVaultPda("owners");

    await PROTOCOL.methods
      .initializeVault("owners", OWNERS.programId)
      .accounts({
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .signers([PROVIDER.wallet.payer])
      .rpc();

    // create policy with vault as seed
    const [policy] = getVaultBasedOwnersPolicyPda(pda);
    await OWNERS.methods
      .initializeOwners(owners.map((o) => o.publicKey))
      .accounts({
        vault: pda,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .signers([PROVIDER.wallet.payer])
      .rpc();

    const ownersAccount = await OWNERS.account.owners.fetch(policy);

    assert.isTrue(
      ownersAccount.owners.length === owners.length,
      "Owners length should match"
    );

    assert.deepStrictEqual(
      ownersAccount.owners,
      owners.map((o) => o.publicKey),
      "Owners should match"
    );

    // topup vault
    await PROVIDER.connection.requestAirdrop(authority, 20_000_000_000);

    console.log(
      "OWNERS",
      owners.map((o) => o.publicKey.toBase58())
    );
    console.log("POLICY", policy.toBase58());
    console.log("VAULT", pda.toBase58());
    console.log("AUTHORITY", authority.toBase58());
    console.log("PAYER", PROVIDER.wallet.payer.publicKey.toBase58());

    const [transaction] = getTransactionPda(pda, 42);
    const ix = await DROPPER.methods
      .transferLamports(new BN(500_000_000))
      .accounts({
        from: authority,
        to: PROVIDER.wallet.payer.publicKey,
      })
      .instruction();

    ix.keys.push({
      pubkey: DROPPER.programId,
      isSigner: false,
      isWritable: false,
    });

    await PROTOCOL.methods
      .createTx(new BN(42), DROPPER.programId, ix.keys, ix.data)
      .accounts({
        vault: pda,
        policyAccount: policy,
        policyProgram: OWNERS.programId,
      })
      .remainingAccounts([
        { pubkey: transaction, isSigner: false, isWritable: false },
        { pubkey: policy, isSigner: false, isWritable: false },
        { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
      ])
      .signers([PROVIDER.wallet.payer])
      .rpc();
    
    const transactionAccount = await PROTOCOL.account.transaction.fetch(transaction);
    
    assert.deepStrictEqual(
      transactionAccount.accounts,
      ix.keys,
      "Transaction accounts should match"
    )

    assert.deepStrictEqual(
      transactionAccount.data,
      ix.data,
      "Transaction data should match"
    )

    assert.deepStrictEqual(
      transactionAccount.didExecute,
      false,
      "Transaction should not have executed"
    )

    assert.deepStrictEqual(
      transactionAccount.nonce.toNumber(),
      42,
      "Transaction nonce should match"
    )

    await PROTOCOL.methods
      .executeTx()
      .accountsPartial({
        vault: pda,
        transaction,
        policyAccount: policy,
        policyProgram: OWNERS.programId,
        vaultSigner: authority,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .remainingAccounts([
        { pubkey: transaction, isSigner: false, isWritable: false },
        { pubkey: policy, isSigner: false, isWritable: false },
        { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
      ])
      .remainingAccounts(ix.keys.map((k) => ({ ...k, isSigner: false })))
      .rpc({
        commitment: "confirmed",
      })
      .then(() => {
        throw new Error("Expected revert but did not get one");
      })
      .catch(expectRevert("Unauthorized sender"));

    await PROTOCOL.methods
      .executeTx()
      .accountsPartial({
        vault: pda,
        transaction,
        policyAccount: policy,
        policyProgram: OWNERS.programId,
        vaultSigner: authority,
        signer: owners[0].publicKey,
      })
      .remainingAccounts([
        { pubkey: transaction, isSigner: false, isWritable: false },
        { pubkey: policy, isSigner: false, isWritable: false },
        { pubkey: owners[0].publicKey, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
      ])
      .signers([owners[0]])
      .remainingAccounts(ix.keys.map((k) => ({ ...k, isSigner: false })))
      .rpc({
        commitment: "confirmed",
      });
  });

  describe("Policy Multisig", () => {
    it("Initializes multisig policy with valid parameters", async () => {
      const owners = Array.from({ length: 3 }, () =>
        anchor.web3.Keypair.generate()
      );
      const threshold = 2;
      const seed = "multisig_test";

      // create vault first
      const [vaultPda, vaultAuthority] = getVaultPda(seed);
      await PROTOCOL.methods
        .initializeVault(seed, MULTISIG.programId)
        .accounts({
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // create policy with vault as seed
      const [policy] = getVaultBasedMultisigPolicyPda(vaultPda);

      await MULTISIG.methods
        .initializeMultisig(owners.map((o) => o.publicKey), new BN(threshold))
        .accounts({
          vault: vaultPda,
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      const multisigAccount = await MULTISIG.account.multiSig.fetch(policy);

      assert.deepStrictEqual(
        multisigAccount.owners,
        owners.map((o) => o.publicKey),
        "Owners should match"
      );
      assert.equal(
        multisigAccount.threshold.toNumber(),
        threshold,
        "Threshold should match"
      );
      assert.isNull(
        multisigAccount.pendingTransaction,
        "Pending transaction should be null"
      );
      assert.deepStrictEqual(
        multisigAccount.pendingSignatures,
        [false, false, false],
        "Pending signatures should be all false"
      );
    });

    it("Validates transaction creation and approval flow", async () => {
      const owners = Array.from({ length: 3 }, () =>
        anchor.web3.Keypair.generate()
      );
      const threshold = 2;
      const seed = "multisig_approval_flow";

      // Top up owners with SOL
      await Promise.all(
        owners.map(async (owner) =>
          PROVIDER.connection.requestAirdrop(owner.publicKey, 10_000_000_000)
        )
      );

      // Create vault first
      const [vaultPda, vaultAuthority] = getVaultPda(seed);
      await PROTOCOL.methods
        .initializeVault(seed, MULTISIG.programId)
        .accounts({
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Initialize multisig policy with vault as seed
      const [policy] = getVaultBasedMultisigPolicyPda(vaultPda);
      await MULTISIG.methods
        .initializeMultisig(owners.map((o) => o.publicKey), new BN(threshold))
        .accounts({
          vault: vaultPda,
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Create a transaction
      const [transaction] = getTransactionPda(vaultPda, 42);
      const ix = await PROTOCOL.methods
        .ping()
        .accounts({ signer: vaultAuthority })
        .instruction();

      ix.keys = ix.keys.map((k) => ({
        ...k,
        isSigner: false,
      }));

      ix.keys.push({
        pubkey: PROTOCOL.programId,
        isSigner: false,
        isWritable: false,
      });

      await PROTOCOL.methods
        .createTx(new BN(42), ix.programId, ix.keys, ix.data)
        .accounts({
          vault: vaultPda,
          policyAccount: policy,
          policyProgram: MULTISIG.programId,
          signer: owners[0].publicKey,
        })
        .remainingAccounts([
          { pubkey: transaction, isSigner: false, isWritable: false },
          { pubkey: policy, isSigner: false, isWritable: true },
          { pubkey: owners[0].publicKey, isSigner: false, isWritable: false },
          { pubkey: vaultAuthority, isSigner: false, isWritable: false },
        ])
        .signers([owners[0]])
        .rpc();

      let multisigAccount = await MULTISIG.account.multiSig.fetch(policy);
      assert.isNotNull(
        multisigAccount.pendingTransaction,
        "Pending transaction should be set"
      );
      assert.deepStrictEqual(
        multisigAccount.pendingTransaction,
        transaction,
        "Pending transaction should match"
      );
      assert.deepStrictEqual(
        multisigAccount.pendingSignatures,
        [true, false, false],
        "First owner should have signed"
      );

      // Second owner approves
      await MULTISIG.methods
        .approve()
        .accounts({
          policyAccount: policy,
          owner: owners[1].publicKey,
        })
        .signers([owners[1]])
        .rpc();

      multisigAccount = await MULTISIG.account.multiSig.fetch(policy);
      assert.deepStrictEqual(
        multisigAccount.pendingSignatures,
        [true, true, false],
        "First two owners should have signed"
      );

      await PROTOCOL.methods
      .executeTx()
      .accountsPartial({
        vault: vaultPda,
        transaction,
        policyAccount: policy,
        policyProgram: MULTISIG.programId,
        vaultSigner: vaultAuthority,
        signer: owners[0].publicKey,
      })
      .signers([owners[0]])
      .remainingAccounts([
        { pubkey: transaction, isSigner: false, isWritable: false },
        { pubkey: policy, isSigner: false, isWritable: true },
        { pubkey: owners[0].publicKey, isSigner: false, isWritable: false },
        { pubkey: vaultAuthority, isSigner: false, isWritable: false },
      ])
      .remainingAccounts(ix.keys.map((k) => ({ ...k, isSigner: false })))
      .rpc({
        commitment: "confirmed",
      });      

      // After validation, pending transaction should be cleared
      multisigAccount = await MULTISIG.account.multiSig.fetch(policy);
      assert.isNull(
        multisigAccount.pendingTransaction,
        "Pending transaction should be cleared after validation"
      );
      assert.deepStrictEqual(
        multisigAccount.pendingSignatures,
        [false, false, false],
        "Pending signatures should be reset"
      );
    });

    it("Fails validation with insufficient signatures", async () => {
      const owners = Array.from({ length: 3 }, () =>
        anchor.web3.Keypair.generate()
      );
      const threshold = 2;
      const seed = "multisig_insufficient_sigs";

      // Top up owners with SOL
      await Promise.all(
        owners.map(async (owner) =>
          PROVIDER.connection.requestAirdrop(owner.publicKey, 10_000_000_000)
        )
      );

      // Create vault first
      const [vaultPda, vaultAuthority] = getVaultPda(seed);
      await PROTOCOL.methods
        .initializeVault(seed, MULTISIG.programId)
        .accounts({
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Initialize multisig policy with vault as seed
      const [policy] = getVaultBasedMultisigPolicyPda(vaultPda);
      await MULTISIG.methods
        .initializeMultisig(owners.map((o) => o.publicKey), new BN(threshold))
        .accounts({
          vault: vaultPda,
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Create a transaction
      const [transaction] = getTransactionPda(vaultPda, 42);
      const ix = await PROTOCOL.methods
        .ping()
        .accounts({ signer: vaultAuthority })
        .instruction();

      ix.keys = ix.keys.map((k) => ({
        ...k,
        isSigner: false,
      }));

      ix.keys.push({
        pubkey: PROTOCOL.programId,
        isSigner: false,
        isWritable: false,
      });

      await PROTOCOL.methods
        .createTx(new BN(42), ix.programId, ix.keys, ix.data)
        .accounts({
          vault: vaultPda,
          policyAccount: policy,
          policyProgram: MULTISIG.programId,
          signer: owners[0].publicKey,
        })
        .remainingAccounts([
          { pubkey: transaction, isSigner: false, isWritable: false },
          { pubkey: policy, isSigner: false, isWritable: true },
          { pubkey: owners[0].publicKey, isSigner: false, isWritable: false },
          { pubkey: vaultAuthority, isSigner: false, isWritable: false },
        ])
        .signers([owners[0]])
        .rpc();

      // Try to validate with only one signature (should fail)
      let threw = false;
      try {
        await PROTOCOL.methods
          .executeTx()
          .accountsPartial({
            vault: vaultPda,
            transaction,
            policyAccount: policy,
            policyProgram: MULTISIG.programId,
            vaultSigner: vaultAuthority,
            signer: owners[0].publicKey,
          })
          .signers([owners[0]])
          .remainingAccounts([
            { pubkey: transaction, isSigner: false, isWritable: false },
            { pubkey: policy, isSigner: false, isWritable: true },
            { pubkey: owners[0].publicKey, isSigner: false, isWritable: false },
            { pubkey: vaultAuthority, isSigner: false, isWritable: false },
          ])
          .remainingAccounts(ix.keys.map((k) => ({ ...k, isSigner: false })))
          .rpc({
            commitment: "confirmed",
          });      
      } catch (e) {
        threw = true;
        assert.isTrue(
          e instanceof anchor.AnchorError &&
          e.errorLogs.some((log) => log.includes("Not enough owners signed this transaction")),
          "Should fail with not enough signers error"
        );
      }
      assert(threw, "Should have thrown an error");
    });

    it("Fails to approve without pending transaction", async () => {
      const owners = Array.from({ length: 3 }, () =>
        anchor.web3.Keypair.generate()
      );
      const threshold = 2;
      const seed = "multisig_no_pending";

      // Top up owners with SOL
      await Promise.all(
        owners.map(async (owner) =>
          PROVIDER.connection.requestAirdrop(owner.publicKey, 10_000_000_000)
        )
      );

      // Create vault first
      const [vaultPda, vaultAuthority] = getVaultPda(seed);
      await PROTOCOL.methods
        .initializeVault(seed, MULTISIG.programId)
        .accounts({
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Initialize multisig policy with vault as seed
      const [policy] = getVaultBasedMultisigPolicyPda(vaultPda);
      await MULTISIG.methods
        .initializeMultisig(owners.map((o) => o.publicKey), new BN(threshold))
        .accounts({
          vault: vaultPda,
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Try to approve without pending transaction (should fail)
      let threw = false;
      try {
        await MULTISIG.methods
          .approve()
          .accounts({
            policyAccount: policy,
            owner: owners[0].publicKey,
          })
          .signers([owners[0]])
          .rpc();
      } catch (e) {
        threw = true;
        assert.isTrue(
          e instanceof anchor.AnchorError &&
          e.errorLogs.some((log) => log.includes("No pending transaction to approve")),
          "Should fail with no pending transaction error"
        );
      }
      assert(threw, "Should have thrown an error");
    });

    it("Integration test: Multisig vault transaction execution", async () => {
      const owners = Array.from({ length: 3 }, () =>
        anchor.web3.Keypair.generate()
      );
      const threshold = 2;
      const seed = "multisig_integration";

      // Top up owners with SOL
      await Promise.all(
        owners.map(async (owner) =>
          PROVIDER.connection.requestAirdrop(owner.publicKey, 10_000_000_000)
        )
      );

      // Create vault first
      const [vaultPda, vaultAuthority] = getVaultPda(seed);
      await PROTOCOL.methods
        .initializeVault(seed, MULTISIG.programId)
        .accounts({
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Initialize multisig policy with vault as seed
      const [policy] = getVaultBasedMultisigPolicyPda(vaultPda);
      await MULTISIG.methods
        .initializeMultisig(owners.map((o) => o.publicKey), new BN(threshold))
        .accounts({
          vault: vaultPda,
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Top up vault
      await DROPPER.methods
        .transferLamports(new BN(1_000_000_000))
        .accounts({
          from: PROVIDER.wallet.payer.publicKey,
          to: vaultAuthority,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc({
          commitment: "confirmed",
        });

      // Create a transfer transaction
      const [transaction] = getTransactionPda(vaultPda, 42);
      const ix = await DROPPER.methods
        .transferLamports(new BN(500_000_000))
        .accounts({
          from: vaultAuthority,
          to: PROVIDER.wallet.payer.publicKey,
        })
        .instruction();

      ix.keys.push({
        pubkey: DROPPER.programId,
        isSigner: false,
        isWritable: false,
      });

      await PROTOCOL.methods
        .createTx(new BN(42), DROPPER.programId, ix.keys, ix.data)
        .accounts({
          vault: vaultPda,
          policyAccount: policy,
          policyProgram: MULTISIG.programId,
          signer: owners[0].publicKey,
        })
        .remainingAccounts([
          { pubkey: transaction, isSigner: false, isWritable: false },
          { pubkey: policy, isSigner: false, isWritable: true },
          { pubkey: owners[0].publicKey, isSigner: false, isWritable: false },
          { pubkey: vaultAuthority, isSigner: false, isWritable: false },
        ])
        .signers([owners[0]])
        .rpc();
      // Check balances before execution
      const balanceVaultBefore = await PROVIDER.connection.getBalance(vaultAuthority);
      const balanceProviderBefore = await PROVIDER.connection.getBalance(
        PROVIDER.wallet.payer.publicKey
      );

      // approve
      await MULTISIG.methods
        .approve()
        .accounts({
          policyAccount: policy,
          owner: owners[1].publicKey,
        })
        .signers([owners[1]])
        .rpc();
      // Execute transaction (should succeed with enough signatures)
      await PROTOCOL.methods
        .executeTx()
        .accountsPartial({
          vault: vaultPda,
          transaction: transaction,
          policyAccount: policy,
          policyProgram: MULTISIG.programId,
          vaultSigner: vaultAuthority,
          signer: owners[0].publicKey,
        })
        .signers([owners[0]])
        .remainingAccounts([
          { pubkey: transaction, isSigner: false, isWritable: false },
          { pubkey: policy, isSigner: false, isWritable: true },
          { pubkey: owners[0].publicKey, isSigner: false, isWritable: false },
          { pubkey: vaultAuthority, isSigner: false, isWritable: false },
        ])
        .remainingAccounts(ix.keys.map((k) => ({ ...k, isSigner: false })))
        .rpc({
          commitment: "confirmed",
        });
      // Check balances after execution
      const balanceVaultAfter = await PROVIDER.connection.getBalance(vaultAuthority);
      const balanceProviderAfter = await PROVIDER.connection.getBalance(
        PROVIDER.wallet.payer.publicKey
      );

      assert.isTrue(
        balanceVaultBefore > balanceVaultAfter,
        "Vault balance should decrease"
      );
      assert.isTrue(
        balanceProviderAfter > balanceProviderBefore,
        "Provider balance should increase"
      );
    });
  });

  describe("Negative Tests - Policy Account Validation", () => {
    it("Should fail with multisig policy account not properly derived", async () => {
      const [vaultPda, vaultAuthority] = getVaultPda("negative_test");
      const [anotherVaultPda, _] = getVaultPda("negative_test_2");

      // Initialize vault with Multisig policy
      await PROTOCOL.methods
        .initializeVault("negative_test", MULTISIG.programId)
        .accounts({
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      await PROTOCOL.methods
        .initializeVault("negative_test_2", MULTISIG.programId)
        .accounts({
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      const [anotherVaultPolicy] = getVaultBasedMultisigPolicyPda(anotherVaultPda);
      const owners = Array.from({ length: 3 }, () => anchor.web3.Keypair.generate());
      
      await MULTISIG.methods
        .initializeMultisig(owners.map((o) => o.publicKey), new BN(2))
        .accounts({
          vault: vaultPda,
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      await MULTISIG.methods
        .initializeMultisig(owners.map((o) => o.publicKey), new BN(2))
        .accounts({
          vault: anotherVaultPda,
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Create instruction
      const ix = await PROTOCOL.methods
        .ping()
        .accounts({ signer: vaultAuthority })
        .instruction();

      ix.keys = ix.keys.map((k) => ({
        ...k,
        isSigner: false,
      }));

      ix.keys.push({
        pubkey: PROTOCOL.programId,
        isSigner: false,
        isWritable: false,
      });

      const [transaction] = getTransactionPda(vaultPda, 42);

      try {
        const tx = await PROTOCOL.methods
          .createTx(new BN(42), ix.programId, ix.keys, ix.data)
          .accounts({
            vault: vaultPda,
            policyAccount: anotherVaultPolicy, // Wrong policy account (different vault)
            policyProgram: MULTISIG.programId,
          })
          .remainingAccounts([
            { pubkey: transaction, isSigner: false, isWritable: false },
            { pubkey: anotherVaultPolicy, isSigner: false, isWritable: false },
            { pubkey: PROVIDER.wallet.payer.publicKey, isSigner: false, isWritable: false },
            { pubkey: vaultAuthority, isSigner: false, isWritable: false },
          ])
          .signers([PROVIDER.wallet.payer])
          .rpc();
      } catch (e) {
        assert.isTrue(
          e instanceof anchor.AnchorError,
          "Expected an AnchorError"
        );
        const anchorError = e as anchor.AnchorError;
        assert.strictEqual(
          anchorError.error.errorCode.number,
          6009,
          "Expected error code 6009"
        );
        assert.strictEqual(
          anchorError.error.errorMessage,
          "Invalid policy PDA.",
          "Expected error message 'Invalid policy PDA.'"
        );
      }
    });
  });
});

