import { address, getProgramDerivedAddress } from '@solana/kit';
import * as readline from 'readline';

/**
 * Helper script to derive challenge PDA address
 * 
 * Usage: npm run get-challenge-address
 */

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
    console.log('\n🔍 Challenge Address Finder');
    console.log('═══════════════════════════════════════════════════\n');

    const userAddress = await question('User Address (wallet that joined): ');
    const challengeId = await question('Challenge ID (UUID): ');
    const programId = await question('Program ID (default: 9Gbrov...): ') || 
      '9GbrovAKnWfbXuq5dXYiZgZob75qTBz9HFcZGFRjftcH';

    rl.close();

    console.log('\nCalculating PDA...\n');

    const [pda, bump] = await getProgramDerivedAddress({
      programAddress: address(programId),
      seeds: [
        new TextEncoder().encode(userAddress),
        new TextEncoder().encode(challengeId),
      ],
    });

    console.log('✅ Challenge PDA:');
    console.log(`   Address: ${pda}`);
    console.log(`   Bump: ${bump}`);
    console.log('\nUse this address with the simulator!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

