import { address } from "@solana/kit";
import { getChallengeDecoder, getChallengeTemplateDecoder, POLICY_CHALLENGES_PROGRAM_ADDRESS } from "../src/generated";
import { createSolanaRpc } from "@solana/kit";
import * as readline from "readline";
import { connect, NatsConnection } from "nats";
import Decimal from "decimal.js";

/**
 * Trading Activity Simulator
 *
 * Simulates realistic trading activity and sends updates to the oracle
 */

interface SimulationConfig {
  challengeAddress: string;
  rpcUrl?: string;
  natsUrl?: string;
  updateIntervalMs?: number;
  volatility?: number; // 0-1, higher = more volatile
}

interface TradeResult {
  profitLoss: number;
  balance: number;
  timestamp: Date;
  reason: string;
}

interface ChallengeRules {
  profitTargetPercent: number;
  minimumTradingDays: number;
  drawdownLimitPercent: number;
  maxLossPercent: number;
}

class TradingSimulator {
  private config: Required<SimulationConfig>;
  private currentBalance: number = 0;
  private startingBalance: number = 0;
  private maxEquity: number = 0;
  private maxDrawdown: number = 0; // Track the worst drawdown ever
  private trades: TradeResult[] = [];
  private tradingDaysCompleted: number = 0;
  private challenge: any;
  private challengeTemplate: any;
  private rules: ChallengeRules | null = null;
  private natsConnection: NatsConnection | null = null;

  constructor(config: SimulationConfig) {
    this.config = {
      challengeAddress: config.challengeAddress,
      rpcUrl: config.rpcUrl || "http://127.0.0.1:8899",
      natsUrl: config.natsUrl || "nats://localhost:4222",
      updateIntervalMs: config.updateIntervalMs || 2000,
      volatility: config.volatility || 0.5,
    };
  }

  /**
   * Connect to NATS
   */
  async connectNats(): Promise<void> {
    try {
      console.log(`\nConnecting to NATS at ${this.config.natsUrl}...`);
      this.natsConnection = await connect({
        servers: this.config.natsUrl,
        name: "hyro-simulator",
      });
      console.log(`✅ Connected to NATS: ${this.natsConnection.getServer()}\n`);
    } catch (error) {
      console.error("❌ Failed to connect to NATS:", error);
      throw error;
    }
  }

  /**
   * Disconnect from NATS
   */
  async disconnectNats(): Promise<void> {
    if (this.natsConnection) {
      console.log("\nDisconnecting from NATS...");
      await this.natsConnection.drain();
      await this.natsConnection.close();
      console.log("✅ NATS connection closed");
    }
  }

  /**
   * Fetch challenge from blockchain
   */
  async fetchChallenge(): Promise<void> {
    try {
      const rpc = createSolanaRpc(this.config.rpcUrl);
      const challengeAddr = address(this.config.challengeAddress);

      console.log(`Fetching challenge: ${this.config.challengeAddress}...`);

      const accountInfo = await rpc
        .getAccountInfo(challengeAddr, {
          encoding: "base64",
          commitment: "confirmed",
        })
        .send();

      if (!accountInfo.value) {
        throw new Error(
          "Challenge account not found on-chain.\n" +
            "Make sure:\n" +
            "  1. The address is correct\n" +
            "  2. The challenge has been created (joined) on-chain\n" +
            "  3. You are connected to the right network (devnet/mainnet/localnet)"
        );
      }

      if (!accountInfo.value.data || accountInfo.value.data[0].length === 0) {
        throw new Error(
          "Challenge account exists but has no data.\n" +
            "This might not be a valid challenge account."
        );
      }

      const data = Buffer.from(accountInfo.value.data[0], "base64");

      // Validate minimum size
      if (data.length < 8) {
        throw new Error(
          `Account data too small (${data.length} bytes).\n` +
            "This is not a valid challenge account.\n" +
            "Expected at least 8 bytes for discriminator."
        );
      }

      const decoder = getChallengeDecoder();
      this.challenge = decoder.decode(data);

      const balance = Decimal(this.challenge.latestBalance)
        .div(10 ** 9)
        .toNumber();
      this.maxEquity = balance;
      this.currentBalance = balance;
      this.startingBalance = balance;

      console.log("\n✅ Challenge loaded:");
      console.log(`   ID: ${this.challenge.challengeId}`);
      console.log(`   Stage: ${this.challenge.stageId}`);
      console.log(`   User: ${this.challenge.user}`);
      console.log(`   Status: ${this.challenge.status}`);
      console.log(`   Current Balance: ${balance}`);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch challenge: ${error}`);
    }
  }

  /**
   * Fetch challenge template from blockchain and extract rules
   */
  async fetchChallengeTemplate(): Promise<void> {
    try {
      const rpc = createSolanaRpc(this.config.rpcUrl);
      
      // Derive challenge template address from stage_id
      const stageIdBuffer = Buffer.alloc(8);
      stageIdBuffer.writeBigUInt64LE(BigInt(this.challenge.stageId));
      
      const [templateAddr] = await (async () => {
        const { getProgramDerivedAddress } = await import("@solana/addresses");
        return getProgramDerivedAddress({
          programAddress: POLICY_CHALLENGES_PROGRAM_ADDRESS,
          seeds: [stageIdBuffer],
        });
      })();

      console.log(`\nFetching challenge template for stage ${this.challenge.stageId}...`);

      const accountInfo = await rpc
        .getAccountInfo(templateAddr, {
          encoding: "base64",
          commitment: "confirmed",
        })
        .send();

      if (!accountInfo.value) {
        throw new Error(
          "Challenge template not found on-chain.\n" +
            `Stage ID: ${this.challenge.stageId}`
        );
      }

      if (!accountInfo.value.data || accountInfo.value.data[0].length === 0) {
        throw new Error("Challenge template exists but has no data.");
      }

      const data = Buffer.from(accountInfo.value.data[0], "base64");
      const decoder = getChallengeTemplateDecoder();
      this.challengeTemplate = decoder.decode(data);

      // Extract and convert rules from basis points to percentages
      this.rules = {
        profitTargetPercent: this.challengeTemplate.profitTarget[0] / 100,
        minimumTradingDays: this.challengeTemplate.minimumTradingDays[0],
        drawdownLimitPercent: this.challengeTemplate.dailyDrawdown[0] / 100,
        maxLossPercent: this.challengeTemplate.maximumLoss[0] / 100,
      };

      console.log("✅ Challenge template loaded:");
      console.log(`   Profit Target: ${this.rules.profitTargetPercent}%`);
      console.log(`   Min Trading Days: ${this.rules.minimumTradingDays}`);
      console.log(`   Drawdown Limit: ${this.rules.drawdownLimitPercent}%`);
      console.log(`   Max Loss: ${this.rules.maxLossPercent}%`);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch challenge template: ${error}`);
    }
  }

  /**
   * Simulate a single trade
   */
  private simulateTrade(): TradeResult {
    // Random trade outcome based on volatility
    const isWin = Math.random() > 0.52;

    // Trade size: 0.5% - 2% of balance (risk management)
    const riskPercent = 0.005 + Math.random() * 0.015;
    const riskAmount = this.currentBalance * riskPercent;

    // Profit/loss ratio: Winners are bigger than losers (2:1)
    const multiplier = this.config.volatility * (isWin ? 2 : -1);
    const profitLoss = riskAmount * multiplier;

    this.currentBalance += profitLoss;

    // Track max equity and max drawdown
    if (this.currentBalance > this.maxEquity) {
      this.maxEquity = this.currentBalance;
    }

    // Calculate current drawdown and update max if this is worse
    const currentDrawdown = this.maxEquity - this.currentBalance;
    if (currentDrawdown > this.maxDrawdown) {
      this.maxDrawdown = currentDrawdown;
    }

    const result: TradeResult = {
      profitLoss,
      balance: this.currentBalance,
      timestamp: new Date(),
      reason: isWin ? "profitable_trade" : "losing_trade",
    };

    this.trades.push(result);
    return result;
  }

  /**
   * Calculate current metrics
   */
  private calculateMetrics() {
    const profitLoss = this.currentBalance - this.startingBalance;
    const profitPercent = (profitLoss / this.startingBalance) * 100;

    const currentDrawdown = this.maxEquity - this.currentBalance;
    const drawdownPercent = (currentDrawdown / this.maxEquity) * 100;

    // Max loss is the worst drawdown from peak that ever occurred
    const maxLoss = this.maxDrawdown;
    const maxLossPercent = (maxLoss / this.startingBalance) * 100;

    return {
      profitLoss,
      profitPercent,
      currentDrawdown,
      drawdownPercent,
      maxLoss,
      maxLossPercent,
    };
  }

  /**
   * Check if any violations occurred
   */
  private checkViolations(metrics: ReturnType<typeof this.calculateMetrics>) {
    if (!this.rules) {
      throw new Error("Rules not loaded. Call fetchChallengeTemplate first.");
    }

    const violations = {
      maxLoss: metrics.maxLossPercent > this.rules.maxLossPercent,
      drawdown: metrics.drawdownPercent > this.rules.drawdownLimitPercent,
    };

    return violations;
  }

  /**
   * Send update to oracle via NATS
   */
  private async sendUpdate(trade: TradeResult): Promise<void> {
    if (!this.natsConnection) {
      throw new Error("NATS connection not established");
    }

    if (!this.rules) {
      throw new Error("Rules not loaded. Call fetchChallengeTemplate first.");
    }

    const metrics = this.calculateMetrics();
    const violations = this.checkViolations(metrics);

    // Determine status
    let newStatus = "active";
    let reason = "regular_update";

    if (violations.maxLoss || violations.drawdown) {
      newStatus = "failed";
      reason = violations.maxLoss ? "max_loss_violation" : "drawdown_violation";
    } else if (metrics.profitPercent >= this.rules.profitTargetPercent) {
      newStatus = "passed";
      reason = "profit_target_achieved";
    }

    const payload = {
      challenge_id: this.challenge.challengeId,
      stage_id: this.challenge.stageId.toString(),
      stage_sequence: this.challenge.stageSequence,
      stage_type: "evaluation",
      effective_from: new Date(
        Number(this.challenge.effectiveFrom) * 1000
      ).toISOString(),
      starting_balance: this.formatCurrency(this.startingBalance),
      current_balance: this.formatCurrency(this.currentBalance),

      profit_target: {
        target_percentage: this.rules.profitTargetPercent,
        target_amount: this.formatCurrency(
          this.startingBalance * (this.rules.profitTargetPercent / 100)
        ),
        achieved_percentage: metrics.profitPercent,
        achieved_amount: this.formatCurrency(metrics.profitLoss),
        target_met: metrics.profitPercent >= this.rules.profitTargetPercent,
      },

      trading_days: {
        required_days: this.rules.minimumTradingDays,
        completed_days: this.tradingDaysCompleted,
        requirement_met: this.tradingDaysCompleted >= this.rules.minimumTradingDays,
        remaining_days: Math.max(0, this.rules.minimumTradingDays - this.tradingDaysCompleted),
      },

      max_loss: {
        equity_loss_limit_percentage: this.rules.maxLossPercent,
        equity_loss_limit_amount: this.formatCurrency(
          this.startingBalance * (this.rules.maxLossPercent / 100)
        ),
        current_loss: this.formatCurrency(metrics.maxLoss),
        current_loss_percentage: metrics.maxLossPercent,
        violation_triggered: violations.maxLoss,
      },

      drawdown_limit: {
        drawdown_type: "static",
        limit_percentage: this.rules.drawdownLimitPercent,
        limit_amount: this.formatCurrency(
          this.startingBalance * (this.rules.drawdownLimitPercent / 100)
        ),
        max_equity: this.formatCurrency(this.maxEquity),
        current_drawdown: this.formatCurrency(metrics.currentDrawdown),
        current_drawdown_percentage: metrics.drawdownPercent,
        violation_triggered: violations.drawdown,
      },

      state_change_event:
        newStatus !== "active"
          ? {
              event_type: newStatus,
              timestamp: new Date().toISOString(),
              previous_status: "active",
              new_status: newStatus,
              reason: reason,
            }
          : undefined,
    };

    try {
      // Publish to NATS
      const subject = "hyro.challenge.update";
      this.natsConnection.publish(subject, JSON.stringify(payload));

      console.log(`✅ Update published to NATS (status: ${newStatus})`);
    } catch (error) {
      console.error(`❌ Failed to publish update:`, error);
      throw error;
    }
  }

  /**
   * Display trade result
   */
  private displayTrade(
    trade: TradeResult,
    metrics: ReturnType<typeof this.calculateMetrics>
  ) {
    const emoji = trade.profitLoss > 0 ? "📈" : "📉";
    const sign = trade.profitLoss > 0 ? "+" : "";

    console.log(`\n${emoji} Trade #${this.trades.length}`);
    console.log(
      `   P&L: ${sign}${this.formatCurrency(
        trade.profitLoss
      )} (${sign}${metrics.profitPercent.toFixed(2)}%)`
    );
    console.log(`   Balance: ${this.formatCurrency(this.currentBalance)}`);
    console.log(
      `   Drawdown: ${this.formatCurrency(
        metrics.currentDrawdown
      )} (${metrics.drawdownPercent.toFixed(2)}%)`
    );
    console.log(
      `   Max Loss: ${this.formatCurrency(
        metrics.maxLoss
      )} (${metrics.maxLossPercent.toFixed(2)}%)`
    );
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Run simulation
   */
  async run(numTrades: number = 50): Promise<void> {
    console.log("\n🎮 Starting Trading Simulation");
    console.log("═══════════════════════════════════════════════════\n");

    try {
      // Connect to NATS
      await this.connectNats();

      // Fetch challenge details
      await this.fetchChallenge();

      // Fetch challenge template to get rules
      await this.fetchChallengeTemplate();

      console.log(
        `\nStarting Balance: ${this.formatCurrency(this.startingBalance)}`
      );
      console.log(`Number of Trades: ${numTrades}`);
      console.log(`Update Interval: ${this.config.updateIntervalMs}ms`);
      console.log(`Volatility: ${this.config.volatility}\n`);

      console.log("\n🔄 Simulating trades...\n");

      for (let i = 0; i < numTrades; i++) {
        // Simulate trade
        const trade = this.simulateTrade();
        const metrics = this.calculateMetrics();

        // Display result
        this.displayTrade(trade, metrics);

        // Increment trading days every 10 trades
        if ((i + 1) % 10 === 0) {
          this.tradingDaysCompleted++;
          console.log(
            `\n📅 Trading Day ${this.tradingDaysCompleted} completed`
          );
        }

        // Send update to oracle
        await this.sendUpdate(trade);

        // Check for violations
        const violations = this.checkViolations(metrics);
        if (violations.maxLoss || violations.drawdown) {
          console.log("\n❌ VIOLATION DETECTED - Challenge Failed!");
          break;
        }

        if (this.rules && metrics.profitPercent >= this.rules.profitTargetPercent) {
          console.log("\n✅ PROFIT TARGET REACHED - Challenge Passed!");
          break;
        }

        // Wait before next trade
        if (i < numTrades - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.updateIntervalMs)
          );
        }
      }

      // Final summary
      this.displaySummary();
    } finally {
      // Always disconnect from NATS
      await this.disconnectNats();
    }
  }

  /**
   * Display final summary
   */
  private displaySummary() {
    const metrics = this.calculateMetrics();
    const violations = this.checkViolations(metrics);

    console.log("\n\n📊 SIMULATION COMPLETE");
    console.log("═══════════════════════════════════════════════════");
    console.log(`Total Trades: ${this.trades.length}`);
    console.log(`Trading Days: ${this.tradingDaysCompleted}`);
    console.log(
      `Starting Balance: ${this.formatCurrency(this.startingBalance)}`
    );
    console.log(`Final Balance: ${this.formatCurrency(this.currentBalance)}`);
    console.log(
      `P&L: ${metrics.profitLoss > 0 ? "+" : ""}${this.formatCurrency(
        metrics.profitLoss
      )} (${
        metrics.profitPercent > 0 ? "+" : ""
      }${metrics.profitPercent.toFixed(2)}%)`
    );
    console.log(`Max Equity: ${this.formatCurrency(this.maxEquity)}`);
    console.log(
      `Max Drawdown: ${this.formatCurrency(
        metrics.currentDrawdown
      )} (${metrics.drawdownPercent.toFixed(2)}%)`
    );
    console.log(
      `Max Loss: ${this.formatCurrency(
        metrics.maxLoss
      )} (${metrics.maxLossPercent.toFixed(2)}%)`
    );

    console.log("\n🎯 Result:");
    if (violations.maxLoss) {
      console.log("   ❌ FAILED - Max Loss Exceeded");
    } else if (violations.drawdown) {
      console.log("   ❌ FAILED - Drawdown Exceeded");
    } else if (this.rules && metrics.profitPercent >= this.rules.profitTargetPercent) {
      console.log("   ✅ PASSED - Profit Target Achieved");
    } else {
      console.log("   ⏸️  IN PROGRESS");
    }
    console.log("═══════════════════════════════════════════════════\n");
  }
}

// CLI interface
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  try {
    console.log("\n🎮 Trading Activity Simulator");
    console.log("═══════════════════════════════════════════════════\n");

    console.log(
      "💡 Tip: Get challenge address from playground after joining a challenge"
    );
    console.log(
      "   Example: Use getProgramDerivedAddress([user, challengeId])\n"
    );

    const challengeAddress = await question("Challenge Address: ");

    if (!challengeAddress || challengeAddress.trim().length === 0) {
      throw new Error("Challenge address is required");
    }

    const numTradesStr = await question("Number of Trades (default 50): ");
    const volatilityStr = await question("Volatility 0-1 (default 0.5): ");
    const intervalStr = await question("Update Interval ms (default 2000): ");

    rl.close();

    const config: SimulationConfig = {
      challengeAddress: challengeAddress.trim(),
      updateIntervalMs: parseInt(intervalStr) || 2000,
      volatility: parseFloat(volatilityStr) || 0.5,
      rpcUrl: "http://127.0.0.1:8899",
      natsUrl: "nats://localhost:4222",
    };

    const numTrades = parseInt(numTradesStr) || 50;

    const simulator = new TradingSimulator(config);
    await simulator.run(numTrades);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
