import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { HyroProtocol } from "../target/types/hyro_protocol";
import { PolicyAllowAny } from "../target/types/policy_allow_any";
import { PolicyDenyAll } from "../target/types/policy_deny_all";
import { useAnchor, getVaultPda, expectRevert, getManagerRegistryPda, getManagerProfilePda, getChildVaultPda, getChildVaultAuthorityPda } from "./lib";
import { BN } from "@coral-xyz/anchor";

let PROTOCOL: Program<HyroProtocol>;
let ALLOW_ANY: Program<PolicyAllowAny>;
let DENY_ALL: Program<PolicyDenyAll>;
let PROVIDER: anchor.Provider;

describe("Manager Functions", () => {
  beforeEach(async () => {
    const { protocol, allowAny, denyAll, provider } = useAnchor();
    PROTOCOL = protocol;
    ALLOW_ANY = allowAny;
    DENY_ALL = denyAll;
    PROVIDER = provider;
  });


  describe("initialize_manager_registry", () => {
    it("should initialize manager registry successfully", async () => {
      const admin = PROVIDER.wallet.payer;
      const registryPda = getManagerRegistryPda();

      // Initialize manager registry
      await PROTOCOL.methods
        .initializeManagerRegistry()
        .accounts({
          admin: admin.publicKey,
        })
        .rpc();

      // Fetch and verify registry data
      const registry = await PROTOCOL.account.managerRegistry.fetch(registryPda);
      
      assert.equal(registry.admin.toBase58(), admin.publicKey.toBase58());
      assert.equal(registry.totalManagers, 0);
      assert.equal(registry.totalAum.toNumber(), 0);
      assert.isAbove(registry.createdAt.toNumber(), 0);
    });

    it("should fail to initialize registry twice", async () => {
      const admin = PROVIDER.wallet.payer;
      // Second initialization should fail
      try {
        await PROTOCOL.methods
          .initializeManagerRegistry()
          .accounts({
            admin: admin.publicKey,
          })
          .rpc();
        assert.fail("Expected transaction to fail");
      } catch (error) {
        // Should fail because account already exists
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("register_manager", () => {
    let registryPda: anchor.web3.PublicKey;
    let admin: anchor.web3.Keypair;

    beforeEach(async () => {
      admin = PROVIDER.wallet.payer;
      registryPda = getManagerRegistryPda();
    });

    it("should register a new manager successfully", async () => {
      const manager = anchor.web3.Keypair.generate();
      const managerProfilePda = getManagerProfilePda(manager.publicKey);

      // Register manager with Conservative risk rating
      await PROTOCOL.methods
        .registerManager({ conservative: {} })
        .accounts({
          admin: admin.publicKey,
          manager: manager.publicKey,
          registry: registryPda,
        })
        .signers([admin])
        .rpc();

      // Fetch and verify manager profile
      const profile = await PROTOCOL.account.managerProfile.fetch(managerProfilePda);
      
      assert.equal(profile.managerPubkey.toBase58(), manager.publicKey.toBase58());
      assert.deepEqual(profile.verificationStatus, { pending: {} });
      assert.deepEqual(profile.riskRating, { conservative: {} });
      assert.equal(profile.totalAum.toNumber(), 0);
      assert.equal(profile.activeVaults, 0);
      assert.equal(profile.totalFeesEarned.toNumber(), 0);
      assert.isAbove(profile.createdAt.toNumber(), 0);
      assert.isAbove(profile.lastActivity.toNumber(), 0);

      // Verify registry was updated
      const registry = await PROTOCOL.account.managerRegistry.fetch(registryPda);
      assert.equal(registry.totalManagers, 1);
    });

    it("should register manager with different risk ratings", async () => {
      const manager1 = anchor.web3.Keypair.generate();
      const manager2 = anchor.web3.Keypair.generate();
      const manager3 = anchor.web3.Keypair.generate();
      const manager4 = anchor.web3.Keypair.generate();

      const profile1Pda = getManagerProfilePda(manager1.publicKey);
      const profile2Pda = getManagerProfilePda(manager2.publicKey);
      const profile3Pda = getManagerProfilePda(manager3.publicKey);
      const profile4Pda = getManagerProfilePda(manager4.publicKey);

      // Register managers with different risk ratings
      await PROTOCOL.methods
        .registerManager({ conservative: {} })
        .accounts({
          admin: admin.publicKey,
          manager: manager1.publicKey,
          registry: registryPda,
        })
        .signers([admin])
        .rpc();

      await PROTOCOL.methods
        .registerManager({ moderate: {} })
        .accounts({
          admin: admin.publicKey,
          manager: manager2.publicKey,
          registry: registryPda,
        })
        .signers([admin])
        .rpc();

      await PROTOCOL.methods
        .registerManager({ aggressive: {} })
        .accounts({
          admin: admin.publicKey,
          manager: manager3.publicKey,
          registry: registryPda,
        })
        .signers([admin])
        .rpc();

      await PROTOCOL.methods
        .registerManager({ speculative: {} })
        .accounts({
          admin: admin.publicKey,
          manager: manager4.publicKey,
          registry: registryPda,
        })
        .signers([admin])
        .rpc();

      // Verify all profiles were created with correct risk ratings
      const profile1 = await PROTOCOL.account.managerProfile.fetch(profile1Pda);
      const profile2 = await PROTOCOL.account.managerProfile.fetch(profile2Pda);
      const profile3 = await PROTOCOL.account.managerProfile.fetch(profile3Pda);
      const profile4 = await PROTOCOL.account.managerProfile.fetch(profile4Pda);

      assert.deepEqual(profile1.riskRating, { conservative: {} });
      assert.deepEqual(profile2.riskRating, { moderate: {} });
      assert.deepEqual(profile3.riskRating, { aggressive: {} });
      assert.deepEqual(profile4.riskRating, { speculative: {} });

      // Verify registry total managers count
      const registry = await PROTOCOL.account.managerRegistry.fetch(registryPda);
      assert.equal(registry.totalManagers, 5); // 4 current managers + 1 old manager (previous test)
    });

    it("should fail to register the same manager twice", async () => {
      const manager = anchor.web3.Keypair.generate();
      const managerProfilePda = getManagerProfilePda(manager.publicKey);

      // First registration should succeed
      await PROTOCOL.methods
        .registerManager({ conservative: {} })
        .accounts({
          admin: admin.publicKey,
          manager: manager.publicKey,
          registry: registryPda,
        })
        .signers([admin])
        .rpc();

      // Second registration should fail
      try {
        await PROTOCOL.methods
          .registerManager({ moderate: {} })
          .accounts({
            admin: admin.publicKey,
            manager: manager.publicKey,
            registry: registryPda,
          })
          .signers([admin])
          .rpc();
        assert.fail("Expected transaction to fail");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("verify_manager", () => {
    let registryPda: anchor.web3.PublicKey;
    let admin: anchor.web3.Keypair;
    let manager: anchor.web3.Keypair;
    let managerProfilePda: anchor.web3.PublicKey;

    beforeEach(async () => {
      admin = PROVIDER.wallet.payer;
      manager = anchor.web3.Keypair.generate();
      
      registryPda = getManagerRegistryPda();
      managerProfilePda = getManagerProfilePda(manager.publicKey);

      // Register manager
      await PROTOCOL.methods
        .registerManager({ conservative: {} })
        .accounts({
          admin: admin.publicKey,
          manager: manager.publicKey,
          registry: registryPda,
        })
        .signers([admin])
        .rpc();
    });

    it("should verify a manager successfully", async () => {
      // Verify manager
      await PROTOCOL.methods
        .verifyManager({ verified: {} })
        .accounts({
          admin: admin.publicKey,
          managerProfile: managerProfilePda,
          registry: registryPda,
        })
        .signers([admin])
        .rpc();

      // Fetch and verify manager profile
      const profile = await PROTOCOL.account.managerProfile.fetch(managerProfilePda);
      assert.deepEqual(profile.verificationStatus, { verified: {} });
    });

    it("should suspend a manager", async () => {
      // Suspend manager
      await PROTOCOL.methods
        .verifyManager({ suspended: {} })
        .accounts({
          admin: admin.publicKey,
          managerProfile: managerProfilePda,
          registry: registryPda,
        })
        .signers([admin])
        .rpc();

      // Fetch and verify manager profile
      const profile = await PROTOCOL.account.managerProfile.fetch(managerProfilePda);
      assert.deepEqual(profile.verificationStatus, { suspended: {} });
    });

    it("should blacklist a manager", async () => {
      // Blacklist manager
      await PROTOCOL.methods
        .verifyManager({ blacklisted: {} })
        .accounts({
          admin: admin.publicKey,
          managerProfile: managerProfilePda,
          registry: registryPda,
        })
        .signers([admin])
        .rpc();

      // Fetch and verify manager profile
      const profile = await PROTOCOL.account.managerProfile.fetch(managerProfilePda);
      assert.deepEqual(profile.verificationStatus, { blacklisted: {} });
    });

    it("should fail to verify manager with non-admin", async () => {
      const nonAdmin = anchor.web3.Keypair.generate();
      
      // Airdrop SOL to non-admin
      const signature = await PROVIDER.connection.requestAirdrop(
        nonAdmin.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await PROVIDER.connection.confirmTransaction(signature);

      try {
        await PROTOCOL.methods
          .verifyManager({ verified: {} })
          .accounts({
            admin: nonAdmin.publicKey,
            managerProfile: managerProfilePda,
            registry: registryPda,
          })
          .signers([nonAdmin])
          .rpc();
        assert.fail("Expected transaction to fail");
      } catch (error) {
        expect(error.message).to.include("constraint");
      }
    });
  });

  // describe("issue_child_vault", () => {
  //   let registryPda: anchor.web3.PublicKey;
  //   let admin: anchor.web3.Keypair;
  //   let manager: anchor.web3.Keypair;
  //   let managerProfilePda: anchor.web3.PublicKey;
  //   let parentVault: anchor.web3.PublicKey;
  //   let childPolicy: anchor.web3.PublicKey;

  //   before(async () => {
  //     admin = PROVIDER.wallet.payer;
  //     manager = anchor.web3.Keypair.generate();
      
  //     registryPda = getManagerRegistryPda();
  //     managerProfilePda = getManagerProfilePda(manager.publicKey);

  //     // Register and verify manager
  //     await PROTOCOL.methods
  //       .registerManager({ conservative: {} })
  //       .accounts({
  //         admin: admin.publicKey,
  //         manager: manager.publicKey,
  //         registry: registryPda,
  //       })
  //       .signers([admin])
  //       .rpc();

  //     await PROTOCOL.methods
  //       .verifyManager({ verified: {} })
  //       .accounts({
  //         admin: admin.publicKey,
  //         managerProfile: managerProfilePda,
  //         registry: registryPda,
  //       })
  //       .signers([admin])
  //       .rpc();

  //     // Create parent vault
  //     [parentVault, ] = getVaultPda("parent_vault");
  //     childPolicy = anchor.web3.Keypair.generate().publicKey;

  //     await PROTOCOL.methods
  //       .initializeVault("parent_vault", childPolicy)
  //       .accounts({
  //         signer: admin.publicKey,
  //       })
  //       .signers([admin])
  //       .rpc();

  //     // Set initial balance for parent vault (simulate funds)
  //     const vaultAccount = await PROTOCOL.account.vault.fetch(parentVault);
  //     // Note: In a real scenario, you would need to transfer actual funds to the vault
  //     // For testing, we'll assume the vault has been funded externally
  //   });

  //   it("should issue child vault successfully", async () => {
  //     const allocation = 1000000; // 1 SOL in lamports
  //     const childVault = getChildVaultPda(parentVault, allocation, manager.publicKey);
  //     const childAuthority = getChildVaultAuthorityPda(childVault);

  //     // Create manager fee structure
  //     const managerFees = {
  //       performanceFeeRate: 2000, // 20%
  //       managementFeeRate: 200,   // 2%
  //       collectionFrequency: { monthly: {} },
  //       highWaterMark: new BN(0),
  //       feeRecipient: manager.publicKey,
  //     };

  //     // Issue child vault
  //     await PROTOCOL.methods
  //       .issueChildVault("child_vault", new BN(allocation), managerFees)
  //       .accounts({
  //         parentVault: parentVault,
  //         managerRegistry: registryPda,
  //         managerProfile: managerProfilePda,
  //         childPolicy: childPolicy,
  //         manager: manager.publicKey,
  //         admin: admin.publicKey,
  //       })
  //       .signers([admin])
  //       .rpc();

  //     // Fetch and verify child vault
  //     const childVaultAccount = await PROTOCOL.account.vault.fetch(childVault);
      
  //     assert.equal(childVaultAccount.policyAccount.toBase58(), childPolicy.toBase58());
  //     assert.equal(childVaultAccount.seed, `child_${allocation}_${manager.publicKey.toBase58()}`);
  //     assert.equal(childVaultAccount.authority.toBase58(), childAuthority.toBase58());
  //     assert.equal(childVaultAccount.manager?.toBase58(), manager.publicKey.toBase58());
  //     assert.equal(childVaultAccount.parentVault?.toBase58(), parentVault.toBase58());
  //     assert.equal(childVaultAccount.allocation.toNumber(), allocation);
  //     assert.equal(childVaultAccount.onchainBalance.toNumber(), allocation);
  //     assert.equal(childVaultAccount.offchainBalance.toNumber(), 0);
  //     assert.equal(childVaultAccount.totalBalance.toNumber(), allocation);
  //     assert.equal(childVaultAccount.highWaterMark.toNumber(), allocation);
  //     assert.equal(childVaultAccount.totalFeesPaid.toNumber(), 0);
  //     assert.isAbove(childVaultAccount.createdAt.toNumber(), 0);
  //     assert.isAbove(childVaultAccount.lastFeeCollection.toNumber(), 0);
  //     assert.isAbove(childVaultAccount.lastBalanceUpdate.toNumber(), 0);

  //     // Verify manager fees structure
  //     assert.isNotNull(childVaultAccount.managerFees);
  //     if (childVaultAccount.managerFees) {
  //       assert.equal(childVaultAccount.managerFees.performanceFeeRate, 2000);
  //       assert.equal(childVaultAccount.managerFees.managementFeeRate, 200);
  //       assert.deepEqual(childVaultAccount.managerFees.collectionFrequency, { monthly: {} });
  //       assert.equal(childVaultAccount.managerFees.feeRecipient.toBase58(), manager.publicKey.toBase58());
  //     }

  //     // Verify manager profile was updated
  //     const updatedProfile = await PROTOCOL.account.managerProfile.fetch(managerProfilePda);
  //     assert.equal(updatedProfile.activeVaults, 1);
  //     assert.equal(updatedProfile.totalAum.toNumber(), allocation);
  //     assert.isAbove(updatedProfile.lastActivity.toNumber(), 0);

  //     // Verify registry was updated
  //     const updatedRegistry = await PROTOCOL.account.managerRegistry.fetch(registryPda);
  //     assert.equal(updatedRegistry.totalAum.toNumber(), allocation);
  //   });

  //   it("should fail to issue child vault with unverified manager", async () => {
  //     // Create a new unverified manager
  //     const unverifiedManager = anchor.web3.Keypair.generate();
  //     const unverifiedProfilePda = getManagerProfilePda(unverifiedManager.publicKey);

  //     // Register but don't verify the manager
  //     await PROTOCOL.methods
  //       .registerManager({ moderate: {} })
  //       .accounts({
  //         admin: admin.publicKey,
  //         manager: unverifiedManager.publicKey,
  //         registry: registryPda,
  //       })
  //       .signers([admin])
  //       .rpc();

  //     const allocation = 1000000;
  //     const childVault = getChildVaultPda(parentVault, allocation, unverifiedManager.publicKey);
  //     const childAuthority = getChildVaultAuthorityPda(childVault);

  //     const managerFees = {
  //       performanceFeeRate: 2000,
  //       managementFeeRate: 200,
  //       collectionFrequency: { monthly: {} },
  //       highWaterMark: new BN(0),
  //       feeRecipient: unverifiedManager.publicKey,
  //     };

  //     try {
  //       await PROTOCOL.methods
  //         .issueChildVault("child_vault", new BN(allocation), managerFees)
  //         .accounts({
  //           parentVault: parentVault,
  //           managerRegistry: registryPda,
  //           managerProfile: unverifiedProfilePda,
  //           childPolicy: childPolicy,
  //           manager: unverifiedManager.publicKey,
  //           admin: admin.publicKey,
  //         })
  //         .signers([admin])
  //         .rpc();
  //       assert.fail("Expected transaction to fail");
  //     } catch (error) {
  //       expect(error.message).to.include("Manager is not verified");
  //     }
  //   });

  //   it("should fail to issue child vault with zero allocation", async () => {
  //     const allocation = 0;
  //     const childVault = getChildVaultPda(parentVault, allocation, manager.publicKey);
  //     const childAuthority = getChildVaultAuthorityPda(childVault);

  //     const managerFees = {
  //       performanceFeeRate: 2000,
  //       managementFeeRate: 200,
  //       collectionFrequency: { monthly: {} },
  //       highWaterMark: new BN(0),
  //       feeRecipient: manager.publicKey,
  //     };

  //     try {
  //       await PROTOCOL.methods
  //         .issueChildVault("child_vault", new BN(allocation), managerFees)
  //         .accounts({
  //           parentVault: parentVault,
  //           managerRegistry: registryPda,
  //           managerProfile: managerProfilePda,
  //           childPolicy: childPolicy,
  //           manager: manager.publicKey,
  //           admin: admin.publicKey,
  //         })
  //         .signers([admin])
  //         .rpc();
  //       assert.fail("Expected transaction to fail");
  //     } catch (error) {
  //       expect(error.message).to.include("Invalid allocation amount");
  //     }
  //   });

  //   it("should fail to issue child vault with insufficient funds", async () => {
  //     const allocation = 1000000000; // Very large allocation
  //     const childVault = getChildVaultPda(parentVault, allocation, manager.publicKey);
  //     const childAuthority = getChildVaultAuthorityPda(childVault);

  //     const managerFees = {
  //       performanceFeeRate: 2000,
  //       managementFeeRate: 200,
  //       collectionFrequency: { monthly: {} },
  //       highWaterMark: new BN(0),
  //       feeRecipient: manager.publicKey,
  //     };

  //     try {
  //       await PROTOCOL.methods
  //         .issueChildVault("child_vault", new BN(allocation), managerFees)
  //         .accounts({
  //           parentVault: parentVault,
  //           managerRegistry: registryPda,
  //           managerProfile: managerProfilePda,
  //           childPolicy: childPolicy,
  //           manager: manager.publicKey,
  //           admin: admin.publicKey,
  //         })
  //         .signers([admin])
  //         .rpc();
  //       assert.fail("Expected transaction to fail");
  //     } catch (error) {
  //       expect(error.message).to.include("Insufficient funds for allocation");
  //     }
  //   });
  // });

  // describe("Integration Tests", () => {
  //   it("should complete full manager lifecycle", async () => {
  //     const admin = PROVIDER.wallet.payer;
  //     const registryPda = getManagerRegistryPda();

  //     // 2. Register multiple managers
  //     const managers = Array.from({ length: 3 }, () => anchor.web3.Keypair.generate());

  //     // Register first manager with conservative risk rating
  //     const managerProfilePda1 = getManagerProfilePda(managers[0].publicKey);
  //     await PROTOCOL.methods
  //       .registerManager({ conservative: {} })
  //       .accounts({
  //         admin: admin.publicKey,
  //         manager: managers[0].publicKey,
  //         registry: registryPda,
  //       })
  //       .signers([admin])
  //       .rpc();

  //     // Register second manager with moderate risk rating
  //     const managerProfilePda2 = getManagerProfilePda(managers[1].publicKey);
  //     await PROTOCOL.methods
  //       .registerManager({ moderate: {} })
  //       .accounts({
  //         admin: admin.publicKey,
  //         manager: managers[1].publicKey,
  //         registry: registryPda,
  //       })
  //       .signers([admin])
  //       .rpc();

  //     // Register third manager with aggressive risk rating
  //     const managerProfilePda3 = getManagerProfilePda(managers[2].publicKey);
  //     await PROTOCOL.methods
  //       .registerManager({ aggressive: {} })
  //       .accounts({
  //         admin: admin.publicKey,
  //         manager: managers[2].publicKey,
  //         registry: registryPda,
  //       })
  //       .signers([admin])
  //       .rpc();

  //     // 3. Verify all managers
  //     for (const manager of managers) {
  //       const managerProfilePda = getManagerProfilePda(manager.publicKey);
        
  //       await PROTOCOL.methods
  //         .verifyManager({ verified: {} })
  //         .accounts({
  //           admin: admin.publicKey,
  //           managerProfile: managerProfilePda,
  //           registry: registryPda,
  //         })
  //         .signers([admin])
  //         .rpc();
  //     }

  //     // 4. Create parent vault
  //     const [parentVault, parentAuthority] = getVaultPda("integration_parent");
  //     const childPolicy = anchor.web3.Keypair.generate().publicKey;

  //     await PROTOCOL.methods
  //       .initializeVault("integration_parent", childPolicy)
  //       .accounts({
  //         signer: admin.publicKey,
  //       })
  //       .signers([admin])
  //       .rpc();

  //     // 5. Issue child vaults for each manager
  //     const allocation = 500000; // 0.5 SOL each
      
  //     for (const manager of managers) {
  //       const managerProfilePda = getManagerProfilePda(manager.publicKey);
  //       const childVault = getChildVaultPda(parentVault, allocation, manager.publicKey);
  //       const childAuthority = getChildVaultAuthorityPda(childVault);

  //       const managerFees = {
  //         performanceFeeRate: 2000,
  //         managementFeeRate: 200,
  //         collectionFrequency: { monthly: {} },
  //         highWaterMark: new BN(0),
  //         feeRecipient: manager.publicKey,
  //       };

  //       await PROTOCOL.methods
  //         .issueChildVault("child_vault", new BN(allocation), managerFees)
  //         .accounts({
  //           parentVault: parentVault,
  //           managerRegistry: registryPda,
  //           managerProfile: managerProfilePda,
  //           childPolicy: childPolicy,
  //           manager: manager.publicKey,
  //           admin: admin.publicKey,
  //         })
  //         .signers([admin])
  //         .rpc();
  //     }

  //     // 6. Verify final state
  //     const finalRegistry = await PROTOCOL.account.managerRegistry.fetch(registryPda);
  //     assert.equal(finalRegistry.totalManagers, 3);
  //     assert.equal(finalRegistry.totalAum.toNumber(), allocation * 3);

  //     // Verify each manager profile
  //     for (const manager of managers) {
  //       const managerProfilePda = getManagerProfilePda(manager.publicKey);
  //       const profile = await PROTOCOL.account.managerProfile.fetch(managerProfilePda);
        
  //       assert.deepEqual(profile.verificationStatus, { verified: {} });
  //       assert.equal(profile.activeVaults, 1);
  //       assert.equal(profile.totalAum.toNumber(), allocation);
  //     }
  //   });
  // });
});
