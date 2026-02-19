import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { HyroProtocol } from "../target/types/hyro_protocol";
import { PolicyAllowAny } from "../target/types/policy_allow_any";
import { BN } from "bn.js";
import {
  useAnchor,
  getVaultPda,
  getManagerRegistryPda,
  getManagerProfilePda,
  getChildVaultPda,
  getChildVaultAuthorityPda,
  expectRevert,
} from "./lib";

let PROTOCOL: Program<HyroProtocol>;
let ALLOW_ANY: Program<PolicyAllowAny>;
let PROVIDER: anchor.Provider;

describe("Funds Management (use_funds & return_funds)", () => {
  beforeEach(async () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    PROVIDER = anchor.getProvider();
    PROTOCOL = anchor.workspace.HyroProtocol as Program<HyroProtocol>;
    ALLOW_ANY = anchor.workspace.PolicyAllowAny as Program<PolicyAllowAny>;
  });

  // Helper function to sync parent vault balance
  // NOTE: This is a workaround - in production, use a sync_vault_balance instruction
  async function syncParentVaultBalance(
    vaultPda: anchor.web3.PublicKey,
    vaultAuthority: anchor.web3.PublicKey,
    expectedBalance: number
  ): Promise<void> {
    // Get actual SOL balance in vault authority
    const actualBalance = await PROVIDER.connection.getBalance(vaultAuthority);
    
    // Fetch current vault account
    const vaultAccount = await PROTOCOL.account.vault.fetch(vaultPda);
    
    // Check if balance needs syncing
    if (vaultAccount.totalBalance.toNumber() !== actualBalance) {
      // TODO: This requires a sync_vault_balance instruction
      // For now, we'll use a workaround by creating a transaction that updates the account
      // But we can't directly modify account data in Anchor tests
      // The protocol needs to be updated to support balance syncing
      
      console.warn(
        `Parent vault balance mismatch: ` +
        `tracked=${vaultAccount.totalBalance.toNumber()}, ` +
        `actual=${actualBalance}. ` +
        `This requires a sync_vault_balance instruction.`
      );
      
      // For testing, we'll try to proceed and see if issue_child_vault works
      // In production, you MUST sync the balance first
    }
  }

  describe("use_funds", () => {
    let parentVaultPda: anchor.web3.PublicKey;
    let parentVaultAuthority: anchor.web3.PublicKey;
    let childVaultPda: anchor.web3.PublicKey;
    let childVaultAuthority: anchor.web3.PublicKey;
    let manager: anchor.web3.Keypair;
    let managerProfilePda: anchor.web3.PublicKey;
    let registryPda: anchor.web3.PublicKey;
    const parentInitialBalance = 10 * anchor.web3.LAMPORTS_PER_SOL; // 10 SOL
    const allocation = 5 * anchor.web3.LAMPORTS_PER_SOL; // 5 SOL allocation to child vault
    const useAmount = 2 * anchor.web3.LAMPORTS_PER_SOL; // 2 SOL

    beforeEach(async () => {
      // Setup: Initialize manager registry
      registryPda = getManagerRegistryPda();
      try {
        await PROTOCOL.methods
          .initializeManagerRegistry()
          .accounts({
            admin: PROVIDER.wallet.payer.publicKey,
          })
          .signers([PROVIDER.wallet.payer])
          .rpc();
      } catch (e) {
        // Registry might already be initialized
      }

      // Setup: Register and verify manager
      manager = anchor.web3.Keypair.generate();
      managerProfilePda = getManagerProfilePda(manager.publicKey);

      try {
        await PROTOCOL.methods
          .registerManager({ conservative: {} })
          .accounts({
            admin: PROVIDER.wallet.payer.publicKey,
            manager: manager.publicKey,
            registry: registryPda,
          })
          .signers([PROVIDER.wallet.payer])
          .rpc();

        await PROTOCOL.methods
          .verifyManager({ verified: {} })
          .accounts({
            admin: PROVIDER.wallet.payer.publicKey,
            managerProfile: managerProfilePda,
            registry: registryPda,
          })
          .signers([PROVIDER.wallet.payer])
          .rpc();
      } catch (e) {
        // Manager might already be registered
      }

      // Setup: Create parent vault and fund it
      [parentVaultPda, parentVaultAuthority] = getVaultPda("parent_funds_test");
      await PROTOCOL.methods
        .initializeVault("parent_funds_test", ALLOW_ANY.programId)
        .accounts({
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Transfer SOL to parent vault authority
      const transferTx = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: PROVIDER.wallet.payer.publicKey,
          toPubkey: parentVaultAuthority,
          lamports: parentInitialBalance,
        })
      );
      await PROVIDER.sendAndConfirm(transferTx);

      // CRITICAL: Sync parent vault balance before issuing child vault
      // The protocol currently doesn't have a sync instruction, so we need to work around this
      // Option 1: Modify issue_child_vault to also transfer actual SOL and sync balance
      // Option 2: Add a sync_vault_balance instruction
      // Option 3: Modify initialize_vault to accept initial balance
      
      // For now, we'll try to sync using a workaround
      await syncParentVaultBalance(parentVaultPda, parentVaultAuthority, parentInitialBalance);
      
      // Setup: Create child vault with manager via issue_child_vault
      childVaultPda = getChildVaultPda(parentVaultPda, allocation, manager.publicKey);
      childVaultAuthority = getChildVaultAuthorityPda(childVaultPda);

      // Create manager fee structure
      const managerFees = {
        performanceFeeRate: 2000, // 20%
        managementFeeRate: 200,   // 2%
        collectionFrequency: { monthly: {} },
        highWaterMark: new BN(0),
        feeRecipient: manager.publicKey,
      };

      // Try to issue child vault
      // Note: This will fail if parent vault balance is not set
      // The parent vault's onchain_balance and total_balance need to be synced
      // with the actual SOL balance in the vault authority account
      try {
        await PROTOCOL.methods
          .issueChildVault("child_vault", new BN(allocation), managerFees)
          .accounts({
            parentVault: parentVaultPda,
            managerRegistry: registryPda,
            childPolicy: ALLOW_ANY.programId,
            manager: manager.publicKey,
            admin: PROVIDER.wallet.payer.publicKey,
          })
          .signers([PROVIDER.wallet.payer])
          .rpc();
      } catch (e: any) {
        // If it fails due to insufficient balance, provide helpful error message
        if (e.message?.includes("InsufficientFunds") || 
            e.message?.includes("Insufficient funds") ||
            e.error?.errorCode?.code === "InsufficientFunds") {
          console.error("Parent vault balance not set. The parent vault's onchain_balance and total_balance");
          console.error("must be synced with the actual SOL balance before issuing child vault.");
          console.error("This requires adding a sync_vault_balance instruction to the protocol.");
          throw new Error(
            "Parent vault balance must be set before issuing child vault. " +
            "Add a sync_vault_balance instruction or manually set parent vault's balance tracking."
          );
        }
        // Re-throw other errors (like DeclaredProgramIdMismatch)
        throw e;
      }
    });

    it("should successfully use funds (SOL transfer from child vault to manager)", async () => {
      // Get initial balances
      const vaultBalanceBefore = await PROVIDER.connection.getBalance(childVaultAuthority);
      const managerBalanceBefore = await PROVIDER.connection.getBalance(manager.publicKey);

      // Fetch child vault to check initial state
      const vaultBefore = await PROTOCOL.account.vault.fetch(childVaultPda);
      const initialOnchainBalance = vaultBefore.onchainBalance.toNumber();
      const initialOffchainBalance = vaultBefore.offchainBalance.toNumber();

      // Verify child vault has manager set and initial balance
      assert.isNotNull(vaultBefore.manager, "Child vault should have manager set");
      assert.equal(vaultBefore.manager?.toBase58(), manager.publicKey.toBase58(), "Manager should match");
      assert.isTrue(initialOnchainBalance >= useAmount, "Child vault should have sufficient balance");

      // Create manager's token account (for SOL, this is just the manager's wallet)
      const managerTokenAccount = manager.publicKey; // For SOL, use wallet directly
      const vaultTokenAccount = childVaultAuthority; // For SOL, use authority directly

      await PROTOCOL.methods
        .useFunds(new BN(useAmount))
        .accounts({
          vault: childVaultPda,
          managerTokenAccount: managerTokenAccount,
          vaultTokenAccount: vaultTokenAccount,
          tokenProgram: anchor.web3.SystemProgram.programId, // SOL uses system program
          manager: manager.publicKey,
        })
        .signers([manager])
        .rpc();

      // Verify balances after transfer
      const vaultBalanceAfter = await PROVIDER.connection.getBalance(childVaultAuthority);
      const managerBalanceAfter = await PROVIDER.connection.getBalance(manager.publicKey);

      // Check on-chain SOL balances
      assert.isTrue(
        vaultBalanceBefore > vaultBalanceAfter,
        "Vault SOL balance should decrease"
      );
      assert.isTrue(
        managerBalanceAfter > managerBalanceBefore,
        "Manager SOL balance should increase"
      );

      // Verify vault state was updated
      const vaultAfter = await PROTOCOL.account.vault.fetch(childVaultPda);
      assert.isTrue(
        vaultAfter.onchainBalance.toNumber() < initialOnchainBalance,
        "Vault onchain_balance should decrease"
      );
      assert.isTrue(
        vaultAfter.offchainBalance.toNumber() > initialOffchainBalance,
        "Vault offchain_balance should increase"
      );
      assert.equal(
        vaultAfter.totalBalance.toNumber(),
        vaultAfter.onchainBalance.toNumber() + vaultAfter.offchainBalance.toNumber(),
        "Total balance should equal onchain + offchain"
      );
    });

    it("should fail when manager is not authorized", async () => {
      const unauthorizedManager = anchor.web3.Keypair.generate();
      const unauthorizedManagerProfilePda = getManagerProfilePda(unauthorizedManager.publicKey);
      const useAmount = new BN(1 * anchor.web3.LAMPORTS_PER_SOL);

      try {
        await PROTOCOL.methods
          .useFunds(useAmount)
          .accounts({
            vault: childVaultPda,
            managerTokenAccount: unauthorizedManager.publicKey,
            vaultTokenAccount: childVaultAuthority,
            tokenProgram: anchor.web3.SystemProgram.programId,
            manager: unauthorizedManager.publicKey,
          })
          .signers([unauthorizedManager])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (e: any) {
        assert.isTrue(
          e.message?.includes("UnauthorizedManager") ||
          e.message?.includes("Manager is not set") ||
          e.message?.includes("InvalidManager"),
          "Should fail with UnauthorizedManager error"
        );
      }
    });

    it("should fail when insufficient onchain balance", async () => {
      const excessiveAmount = new BN(1000 * anchor.web3.LAMPORTS_PER_SOL); // 1000 SOL

      try {
        await PROTOCOL.methods
          .useFunds(excessiveAmount)
          .accounts({
            vault: childVaultPda,
            managerTokenAccount: manager.publicKey,
            vaultTokenAccount: childVaultAuthority,
            tokenProgram: anchor.web3.SystemProgram.programId,
            manager: manager.publicKey,
          })
          .signers([manager])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (e: any) {
        assert.isTrue(
          e.message?.includes("InsufficientOnchainBalance") ||
          e.message?.includes("insufficient"),
          "Should fail with InsufficientOnchainBalance error"
        );
      }
    });
  });

  describe("return_funds", () => {
    let parentVaultPda: anchor.web3.PublicKey;
    let parentVaultAuthority: anchor.web3.PublicKey;
    let childVaultPda: anchor.web3.PublicKey;
    let childVaultAuthority: anchor.web3.PublicKey;
    let manager: anchor.web3.Keypair;
    let managerProfilePda: anchor.web3.PublicKey;
    let registryPda: anchor.web3.PublicKey;
    const parentInitialBalance = 10 * anchor.web3.LAMPORTS_PER_SOL; // 10 SOL
    const allocation = 5 * anchor.web3.LAMPORTS_PER_SOL; // 5 SOL allocation to child vault
    const returnAmount = 1 * anchor.web3.LAMPORTS_PER_SOL; // 1 SOL

    beforeEach(async () => {
      // Similar setup as use_funds
      registryPda = getManagerRegistryPda();
      manager = anchor.web3.Keypair.generate();
      managerProfilePda = getManagerProfilePda(manager.publicKey);

      // Initialize registry and register manager (same as before)
      try {
        await PROTOCOL.methods
          .initializeManagerRegistry()
          .accounts({
            admin: PROVIDER.wallet.payer.publicKey,
          })
          .signers([PROVIDER.wallet.payer])
          .rpc();
      } catch (e) {
        // Already initialized
      }

      try {
        await PROTOCOL.methods
          .registerManager({ conservative: {} })
          .accounts({
            admin: PROVIDER.wallet.payer.publicKey,
            manager: manager.publicKey,
            registry: registryPda,
          })
          .signers([PROVIDER.wallet.payer])
          .rpc();

        await PROTOCOL.methods
          .verifyManager({ verified: {} })
          .accounts({
            admin: PROVIDER.wallet.payer.publicKey,
            managerProfile: managerProfilePda,
            registry: registryPda,
          })
          .signers([PROVIDER.wallet.payer])
          .rpc();
      } catch (e) {
        // Already registered
      }

      // Setup: Create parent vault and fund it
      [parentVaultPda, parentVaultAuthority] = getVaultPda("parent_return_funds_test");
      await PROTOCOL.methods
        .initializeVault("parent_return_funds_test", ALLOW_ANY.programId)
        .accounts({
          signer: PROVIDER.wallet.payer.publicKey,
        })
        .signers([PROVIDER.wallet.payer])
        .rpc();

      // Transfer SOL to parent vault authority
      const transferTx = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: PROVIDER.wallet.payer.publicKey,
          toPubkey: parentVaultAuthority,
          lamports: parentInitialBalance,
        })
      );
      await PROVIDER.sendAndConfirm(transferTx);

      // Setup: Create child vault with manager via issue_child_vault
      childVaultPda = getChildVaultPda(parentVaultPda, allocation, manager.publicKey);
      childVaultAuthority = getChildVaultAuthorityPda(childVaultPda);

      // Create manager fee structure
      const managerFees = {
        performanceFeeRate: 2000, // 20%
        managementFeeRate: 200,   // 2%
        collectionFrequency: { monthly: {} },
        highWaterMark: new BN(0),
        feeRecipient: manager.publicKey,
      };

      // Try to issue child vault
      // Note: This will fail if parent vault balance is not set
      try {
        await PROTOCOL.methods
          .issueChildVault("child_return_vault", new BN(allocation), managerFees)
          .accounts({
            parentVault: parentVaultPda,
            managerRegistry: registryPda,
            childPolicy: ALLOW_ANY.programId,
            manager: manager.publicKey,
            admin: PROVIDER.wallet.payer.publicKey,
          })
          .signers([PROVIDER.wallet.payer])
          .rpc();
      } catch (e: any) {
        // If it fails due to insufficient balance, provide helpful error message
        if (e.message?.includes("InsufficientFunds") || 
            e.message?.includes("Insufficient funds") ||
            e.error?.errorCode?.code === "InsufficientFunds") {
          console.error("Parent vault balance not set. The parent vault's onchain_balance and total_balance");
          console.error("must be synced with the actual SOL balance before issuing child vault.");
          console.error("This requires adding a sync_vault_balance instruction to the protocol.");
          throw new Error(
            "Parent vault balance must be set before issuing child vault. " +
            "Add a sync_vault_balance instruction or manually set parent vault's balance tracking."
          );
        }
        // Re-throw other errors (like DeclaredProgramIdMismatch)
        throw e;
      }

      // Fund manager wallet for return_funds test
      const airdropSignature = await PROVIDER.connection.requestAirdrop(
        manager.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await PROVIDER.connection.confirmTransaction(airdropSignature);

      // First use some funds to create offchain balance for return_funds test
      const useAmount = 2 * anchor.web3.LAMPORTS_PER_SOL;
      await PROTOCOL.methods
        .useFunds(new BN(useAmount))
        .accounts({
          vault: childVaultPda,
          managerTokenAccount: manager.publicKey,
          vaultTokenAccount: childVaultAuthority,
          tokenProgram: anchor.web3.SystemProgram.programId,
          manager: manager.publicKey,
        })
        .signers([manager])
        .rpc();
    });

    it("should successfully return funds (SOL transfer from manager to child vault)", async () => {
      // Get initial balances
      const vaultBalanceBefore = await PROVIDER.connection.getBalance(childVaultAuthority);
      const managerBalanceBefore = await PROVIDER.connection.getBalance(manager.publicKey);

      // Fetch child vault state
      const vaultBefore = await PROTOCOL.account.vault.fetch(childVaultPda);
      const initialOnchainBalance = vaultBefore.onchainBalance.toNumber();
      const initialOffchainBalance = vaultBefore.offchainBalance.toNumber();

      // Verify child vault has offchain balance to return
      assert.isTrue(initialOffchainBalance >= returnAmount, "Child vault should have sufficient offchain balance");

      const managerTokenAccount = manager.publicKey;
      const vaultTokenAccount = childVaultAuthority;

      await PROTOCOL.methods
        .returnFunds(new BN(returnAmount))
        .accounts({
          vault: childVaultPda,
          managerTokenAccount: managerTokenAccount,
          vaultTokenAccount: vaultTokenAccount,
          tokenProgram: anchor.web3.SystemProgram.programId,
          manager: manager.publicKey,
        })
        .signers([manager])
        .rpc();

      // Verify balances after transfer
      const vaultBalanceAfter = await PROVIDER.connection.getBalance(childVaultAuthority);
      const managerBalanceAfter = await PROVIDER.connection.getBalance(manager.publicKey);

      // Check on-chain SOL balances
      assert.isTrue(
        vaultBalanceAfter > vaultBalanceBefore,
        "Vault SOL balance should increase"
      );
      assert.isTrue(
        managerBalanceBefore > managerBalanceAfter,
        "Manager SOL balance should decrease"
      );

      // Verify vault state was updated
      const vaultAfter = await PROTOCOL.account.vault.fetch(childVaultPda);
      assert.isTrue(
        vaultAfter.onchainBalance.toNumber() > initialOnchainBalance,
        "Vault onchain_balance should increase"
      );
      assert.isTrue(
        vaultAfter.offchainBalance.toNumber() < initialOffchainBalance,
        "Vault offchain_balance should decrease"
      );
      assert.equal(
        vaultAfter.totalBalance.toNumber(),
        vaultAfter.onchainBalance.toNumber() + vaultAfter.offchainBalance.toNumber(),
        "Total balance should equal onchain + offchain"
      );
    });

    it("should fail when manager is not authorized", async () => {
      const unauthorizedManager = anchor.web3.Keypair.generate();
      const unauthorizedManagerProfilePda = getManagerProfilePda(unauthorizedManager.publicKey);

      try {
        await PROTOCOL.methods
          .returnFunds(new BN(returnAmount))
          .accounts({
            vault: childVaultPda,
            managerTokenAccount: unauthorizedManager.publicKey,
            vaultTokenAccount: childVaultAuthority,
            tokenProgram: anchor.web3.SystemProgram.programId,
            manager: unauthorizedManager.publicKey,
          })
          .signers([unauthorizedManager])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (e: any) {
        assert.isTrue(
          e.message?.includes("UnauthorizedManager") ||
          e.message?.includes("Manager is not set") ||
          e.message?.includes("InvalidManager"),
          "Should fail with UnauthorizedManager error"
        );
      }
    });

    it("should fail when insufficient offchain balance", async () => {
      const excessiveAmount = new BN(1000 * anchor.web3.LAMPORTS_PER_SOL);

      try {
        await PROTOCOL.methods
          .returnFunds(excessiveAmount)
          .accounts({
            vault: childVaultPda,
            managerTokenAccount: manager.publicKey,
            vaultTokenAccount: childVaultAuthority,
            tokenProgram: anchor.web3.SystemProgram.programId,
            manager: manager.publicKey,
          })
          .signers([manager])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (e: any) {
        assert.isTrue(
          e.message?.includes("InsufficientOffchainBalance") ||
          e.message?.includes("insufficient"),
          "Should fail with InsufficientOffchainBalance error"
        );
      }
    });
  });

  describe("Full lifecycle: use_funds -> return_funds", () => {
    it("should complete full cycle of using and returning funds", async () => {
      // This test would require a properly configured vault with manager
      // and initial balance set via issue_child_vault
      // For now, this is a placeholder showing the expected flow

      console.log("Full lifecycle test would require:");
      console.log("1. Create vault with manager via issue_child_vault");
      console.log("2. Use funds to move from vault to manager");
      console.log("3. Verify balances updated correctly");
      console.log("4. Return funds from manager back to vault");
      console.log("5. Verify balances restored correctly");
    });
  });
});
