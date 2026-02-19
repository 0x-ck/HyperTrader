import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { BN } from "bn.js";
import { PolicyChallenges } from "../target/types/policy_challenges";
import { getChallengePda, getChallengeTemplatePda } from "./lib";

let PROVIDER: anchor.Provider;
let CHALLENGES: Program<PolicyChallenges>;

describe("challenges", () => {
  beforeEach(async () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    PROVIDER = anchor.getProvider();
    CHALLENGES = anchor.workspace.PolicyChallenges as Program<PolicyChallenges>;
  });

  // it.only("pda calculation", async () => {
  //   assert.deepStrictEqual(
  //     getChallengeTemplatePda(1)[0].toBase58(),
  //     "33DujRJ3Upza9FSNrZeD2hYMc5vqicauZ3bTSQ8vvrvJ"
  //   );
  // });
  it("creates a challenge template and updates all fields", async () => {
    const stageId = new anchor.BN(101);
    const [templatePda] = getChallengeTemplatePda(stageId.toNumber());

    await CHALLENGES.methods
      .createChallengeTemplate(stageId, {
        stageSequence: 1,
        stageType: { evaluation: {} },
        startingDeposit: new BN(1_000_000_000),
        admin: PROVIDER.wallet.payer.publicKey,
        entranceCost: new BN(1_000_000),
        entranceTokenMint: new anchor.web3.PublicKey(
          "So11111111111111111111111111111111111111111"
        ),
        minimumTradingDays: [3],
        dailyDrawdown: [100],
        maximumLoss: [200],
        profitTarget: [300],
        maxParticipants: [50],
        isActive: true,
      })
      .accounts({ signer: PROVIDER.wallet.payer.publicKey })
      .rpc();

    const afterCreate = await CHALLENGES.account.challengeTemplate.fetch(
      templatePda
    );
    assert.strictEqual(afterCreate.stageId, stageId.toNumber());
    assert.strictEqual(afterCreate.stageSequence, 1);
    assert.deepStrictEqual(afterCreate.stageType, { evaluation: {} });
    assert.strictEqual(afterCreate.startingDeposit.toNumber(), 1_000_000_000);
    assert.strictEqual(
      afterCreate.admin.toBase58(),
      PROVIDER.wallet.payer.publicKey.toBase58()
    );
    assert.strictEqual(afterCreate.entranceCost.toNumber(), 1_000_000);
    assert.strictEqual(
      afterCreate.entranceTokenMint.toBase58(),
      new anchor.web3.PublicKey(
        "So11111111111111111111111111111111111111111"
      ).toBase58()
    );
    assert.deepStrictEqual(afterCreate.minimumTradingDays, { 0: 3 });
    assert.deepStrictEqual(afterCreate.dailyDrawdown, { 0: 100 });
    assert.deepStrictEqual(afterCreate.maximumLoss, { 0: 200 });
    assert.deepStrictEqual(afterCreate.profitTarget, { 0: 300 });
    assert.deepStrictEqual(afterCreate.maxParticipants, { 0: 50 });
    assert.strictEqual(afterCreate.isActive, true);

    // Update profit target
    await CHALLENGES.methods
      .updateChallengeTemplateProfitTarget([350])
      .accounts({
        challengeTemplateAccount: templatePda,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .rpc();

    // Update entrance cost
    await CHALLENGES.methods
      .updateChallengeTemplateEntranceCost(new BN(2_000_000))
      .accounts({
        challengeTemplateAccount: templatePda,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .rpc();

    // Update entrance token mint
    const newMint = anchor.web3.Keypair.generate().publicKey;
    await CHALLENGES.methods
      .updateChallengeTemplateEntranceTokenMint(newMint)
      .accounts({
        challengeTemplateAccount: templatePda,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .rpc();

    // Update minimum trading days
    await CHALLENGES.methods
      .updateChallengeTemplateMinimumTradingDays([5])
      .accounts({
        challengeTemplateAccount: templatePda,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .rpc();

    // Update daily drawdown
    await CHALLENGES.methods
      .updateChallengeTemplateDailyDrawdown([120])
      .accounts({
        challengeTemplateAccount: templatePda,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .rpc();

    // Update maximum loss
    await CHALLENGES.methods
      .updateChallengeTemplateMaximumLoss([220])
      .accounts({
        challengeTemplateAccount: templatePda,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .rpc();

    // Update max participants
    await CHALLENGES.methods
      .updateChallengeTemplateMaxParticipants([75])
      .accounts({
        challengeTemplateAccount: templatePda,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .rpc();

    // Toggle is_active
    await CHALLENGES.methods
      .updateChallengeTemplateIsActive(false)
      .accounts({
        challengeTemplateAccount: templatePda,
        signer: PROVIDER.wallet.payer.publicKey,
      })
      .rpc();

    const afterUpdates = await CHALLENGES.account.challengeTemplate.fetch(
      templatePda
    );
    assert.deepStrictEqual(afterUpdates.profitTarget, { 0: 350 });
    assert.strictEqual(afterUpdates.entranceCost.toNumber(), 2_000_000);
    assert.strictEqual(
      afterUpdates.entranceTokenMint.toBase58(),
      newMint.toBase58()
    );
    assert.deepStrictEqual(afterUpdates.minimumTradingDays, { 0: 5 });
    assert.deepStrictEqual(afterUpdates.dailyDrawdown, { 0: 120 });
    assert.deepStrictEqual(afterUpdates.maximumLoss, { 0: 220 });
    assert.deepStrictEqual(afterUpdates.maxParticipants, { 0: 75 });
    assert.strictEqual(afterUpdates.isActive, false);
  });

  it("joins a challenge and updates via oracle", async () => {
    const stageId = new anchor.BN(202);
    const [templatePda] = getChallengeTemplatePda(stageId.toNumber());

    await CHALLENGES.methods
      .createChallengeTemplate(stageId, {
        stageSequence: 1,
        stageType: { evaluation: {} },
        startingDeposit: new BN(500_000_000),
        admin: PROVIDER.wallet.payer.publicKey,
        entranceCost: new BN(250_000),
        entranceTokenMint: new anchor.web3.PublicKey(
          "So11111111111111111111111111111111111111111"
        ),
        minimumTradingDays: [2],
        dailyDrawdown: [100],
        maximumLoss: [200],
        profitTarget: [300],
        maxParticipants: [10],
        isActive: true,
      })
      .accounts({ signer: PROVIDER.wallet.payer.publicKey })
      .rpc();

    const template = await CHALLENGES.account.challengeTemplate.fetch(
      templatePda
    );

    const participant = anchor.web3.Keypair.generate();
    const airdropSig = await PROVIDER.connection.requestAirdrop(
      participant.publicKey,
      5_000_000_000
    );
    await PROVIDER.connection.confirmTransaction(airdropSig, "confirmed");
    const challengeId = "challenge-202";
    const [challengePda] = getChallengePda(participant.publicKey, challengeId);

    await CHALLENGES.methods
      .joinChallenge(challengeId, {
        stageId: template.stageId,
        stageSequence: template.stageSequence,
        profitTarget: {
          target: [300],
          targetAmount: { 0: new BN(100_000_000) },
          achieved: [0],
          achievedAmount: { 0: new BN(0) },
        },
        tradingDays: {
          required: [2],
          completed: [0],
          requirementsMet: false,
          remainingDays: [2],
        },
        maximumLoss: {
          maximumLossPercentage: [200],
          maximumLossAmount: { 0: new BN(100_000_000) },
          currentLossAchieved: [0],
          currentLossAchievedAmount: { 0: new BN(0) },
        },
        dailyDrawdown: {
          drawdownType: { static: {} },
          limitPercentage: [100],
          limitAmount: { 0: new BN(100_000_000) },
          maxEquity: { 0: new BN(0) },
          currentDrawdownPercentage: [0],
          currentDrawdownAmount: { 0: new BN(0) },
          violationTriggered: false,
        },
        status: { active: {} },
        payout: new BN(0),
        createdAt: new BN(Math.floor(Date.now() / 1000)),
      })
      .accounts({
        challengeTemplateAccount: templatePda,
        participant: participant.publicKey,
      })
      .signers([participant])
      .rpc();

    const joined = await CHALLENGES.account.challenge.fetch(challengePda);
    assert.strictEqual(joined.challengeId, challengeId);
    assert.strictEqual(joined.stageId, template.stageId);
    assert.strictEqual(joined.stageSequence, template.stageSequence);
    assert.deepStrictEqual(joined.stageType, template.stageType);
    const updatedAtBefore = joined.updatedAt.toNumber();

    const newLatestBalance = new BN(1_234_567_890);
    await CHALLENGES.methods
      .updateChallenge({
        challengeId,
        latestBalance: newLatestBalance,
        status: { passed: {} },
        profitTarget: {
          target: [350],
          targetAmount: { 0: new BN(150_000_000) },
          achieved: [175],
          achievedAmount: { 0: new BN(120_000_000) },
        },
        tradingDays: {
          required: [2],
          completed: [2],
          requirementsMet: true,
          remainingDays: [0],
        },
        maximumLoss: {
          maximumLossPercentage: [200],
          maximumLossAmount: { 0: new BN(100_000_000) },
          currentLossAchieved: [50],
          currentLossAchievedAmount: { 0: new BN(50_000_000) },
        },
        dailyDrawdown: {
          drawdownType: { static: {} },
          limitPercentage: [120],
          limitAmount: { 0: new BN(120_000_000) },
          maxEquity: { 0: new BN(0) },
          currentDrawdownPercentage: [60],
          currentDrawdownAmount: { 0: new BN(60_000_000) },
          violationTriggered: false,
        },
        payout: new BN(42_000_000),
      })
      .accounts({
        challengeTemplateAccount: templatePda,
        challengeAccount: challengePda,
        sender: PROVIDER.wallet.payer.publicKey,
      })
      .rpc();

    const afterUpdate = await CHALLENGES.account.challenge.fetch(challengePda);
    assert.strictEqual(
      afterUpdate.latestBalance.toNumber(),
      newLatestBalance.toNumber()
    );
    assert.deepStrictEqual(afterUpdate.status, { passed: {} });
    assert.deepStrictEqual(afterUpdate.profitTarget.target, { 0: 350 });
    assert.deepStrictEqual(afterUpdate.tradingDays.completed, { 0: 2 });
    assert.deepStrictEqual(afterUpdate.maximumLoss.currentLossAchieved, {
      0: 50,
    });
    assert.deepStrictEqual(
      afterUpdate.dailyDrawdown.currentDrawdownPercentage,
      { 0: 60 }
    );
    assert.strictEqual(afterUpdate.payout.toNumber(), 42_000_000);
    assert.isTrue(afterUpdate.updatedAt.toNumber() >= updatedAtBefore);

    await CHALLENGES.methods
      .updateChallenge({
        challengeId: "wrong-id",
        latestBalance: new BN(0),
        status: { active: {} },
        profitTarget: {
          target: [300],
          targetAmount: { 0: new BN(0) },
          achieved: [0],
          achievedAmount: { 0: new BN(0) },
        },
        tradingDays: {
          required: [2],
          completed: [0],
          requirementsMet: false,
          remainingDays: [2],
        },
        maximumLoss: {
          maximumLossPercentage: [200],
          maximumLossAmount: { 0: new BN(0) },
          currentLossAchieved: [0],
          currentLossAchievedAmount: { 0: new BN(0) },
        },
        dailyDrawdown: {
          drawdownType: { static: {} },
          limitPercentage: [100],
          limitAmount: { 0: new BN(0) },
          maxEquity: { 0: new BN(0) },
          currentDrawdownPercentage: [0],
          currentDrawdownAmount: { 0: new BN(0) },
          violationTriggered: false,
        },
        payout: new BN(0),
      })
      .accounts({
        challengeTemplateAccount: templatePda,
        challengeAccount: challengePda,
        sender: PROVIDER.wallet.payer.publicKey,
      })
      .rpc()
      .then(() => {
        throw new Error("Expected revert but did not get one");
      })
      .catch((e) => {
        if (e instanceof anchor.AnchorError) {
          const has = e.errorLogs.some((l) =>
            l.includes("Invalid challenge ID")
          );
          if (!has) throw e;
        } else {
          throw e;
        }
      });
  });

  it("should revert unauthorized updates", async () => {
    const stageId = new anchor.BN(203);
    const [templatePda] = getChallengeTemplatePda(stageId.toNumber());

    await CHALLENGES.methods
      .createChallengeTemplate(stageId, {
        stageSequence: 1,
        stageType: { evaluation: {} },
        startingDeposit: new BN(500_000_000),
        admin: PROVIDER.wallet.payer.publicKey,
        entranceCost: new BN(250_000),
        entranceTokenMint: new anchor.web3.PublicKey(
          "So11111111111111111111111111111111111111111"
        ),
        minimumTradingDays: [2],
        dailyDrawdown: [100],
        maximumLoss: [200],
        profitTarget: [300],
        maxParticipants: [10],
        isActive: true,
      })
      .accounts({ signer: PROVIDER.wallet.payer.publicKey })
      .rpc();

    const template = await CHALLENGES.account.challengeTemplate.fetch(
      templatePda
    );

    const participant = anchor.web3.Keypair.generate();
    const airdropSig = await PROVIDER.connection.requestAirdrop(
      participant.publicKey,
      5_000_000_000
    );
    await PROVIDER.connection.confirmTransaction(airdropSig, "confirmed");

    const challengeId = "challenge-203";
    const [challengePda] = getChallengePda(participant.publicKey, challengeId);

    await CHALLENGES.methods
      .joinChallenge(challengeId, {
        stageId: template.stageId,
        stageSequence: template.stageSequence,
        profitTarget: {
          target: [300],
          targetAmount: { 0: new BN(100_000_000) },
          achieved: [0],
          achievedAmount: { 0: new BN(0) },
        },
        tradingDays: {
          required: [2],
          completed: [0],
          requirementsMet: false,
          remainingDays: [2],
        },
        maximumLoss: {
          maximumLossPercentage: [200],
          maximumLossAmount: { 0: new BN(100_000_000) },
          currentLossAchieved: [0],
          currentLossAchievedAmount: { 0: new BN(0) },
        },
        dailyDrawdown: {
          drawdownType: { static: {} },
          limitPercentage: [100],
          limitAmount: { 0: new BN(100_000_000) },
          maxEquity: { 0: new BN(0) },
          currentDrawdownPercentage: [0],
          currentDrawdownAmount: { 0: new BN(0) },
          violationTriggered: false,
        },
        status: { active: {} },
        payout: new BN(0),
        createdAt: new BN(Math.floor(Date.now() / 1000)),
      })
      .accounts({
        challengeTemplateAccount: templatePda,
        participant: participant.publicKey,
      })
      .signers([participant])
      .rpc();

    const fakeAdmin = anchor.web3.Keypair.generate();
    const fakeAdminSig = await PROVIDER.connection.requestAirdrop(
      fakeAdmin.publicKey,
      5_000_000_000
    );
    await PROVIDER.connection.confirmTransaction(fakeAdminSig, "confirmed");

    const newLatestBalance = new BN(1_234_567_890);
    await CHALLENGES.methods
      .updateChallenge({
        challengeId,
        latestBalance: newLatestBalance,
        status: { passed: {} },
        profitTarget: {
          target: [350],
          targetAmount: { 0: new BN(150_000_000) },
          achieved: [175],
          achievedAmount: { 0: new BN(120_000_000) },
        },
        tradingDays: {
          required: [2],
          completed: [2],
          requirementsMet: true,
          remainingDays: [0],
        },
        maximumLoss: {
          maximumLossPercentage: [200],
          maximumLossAmount: { 0: new BN(100_000_000) },
          currentLossAchieved: [50],
          currentLossAchievedAmount: { 0: new BN(50_000_000) },
        },
        dailyDrawdown: {
          drawdownType: { static: {} },
          limitPercentage: [120],
          limitAmount: { 0: new BN(120_000_000) },
          maxEquity: { 0: new BN(0) },
          currentDrawdownPercentage: [60],
          currentDrawdownAmount: { 0: new BN(60_000_000) },
          violationTriggered: false,
        },
        payout: new BN(42_000_000),
      })
      .accounts({
        challengeTemplateAccount: templatePda,
        challengeAccount: challengePda,
        sender: fakeAdmin.publicKey,
      })
      .signers([fakeAdmin])
      .rpc()
      .then(() => {
        throw new Error("Expected revert but did not get one");
      })
      .catch((e) => {
        if (e instanceof anchor.AnchorError) {
          const has = e.errorLogs.some((l) => l.includes("Unauthorized admin"));
          if (!has) throw e;
        } else {
          throw e;
        }
      });
  });
});
