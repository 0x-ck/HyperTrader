import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';

/**
 * Generates a new Solana keypair for the oracle
 */
function generateOracleKeypair() {
  const keypair = Keypair.generate();
  const keypairArray = Array.from(keypair.secretKey);
  
  const filename = 'oracle-keypair.json';
  fs.writeFileSync(filename, JSON.stringify(keypairArray));
  
  console.log('✅ Oracle keypair generated successfully!');
  console.log(`📁 Saved to: ${filename}`);
  console.log(`🔑 Public Key: ${keypair.publicKey.toBase58()}`);
  console.log('\n⚠️  IMPORTANT:');
  console.log('   1. Keep this keypair file secure');
  console.log('   2. Use this public key as the admin for ChallengeTemplates');
  console.log('   3. Fund this account with SOL for transaction fees:');
  console.log(`      solana airdrop 1 ${keypair.publicKey.toBase58()}`);
}

generateOracleKeypair();

