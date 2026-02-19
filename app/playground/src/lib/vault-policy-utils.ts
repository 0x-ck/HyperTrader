import { Address as KitAddress, getAddressEncoder, getProgramDerivedAddress } from "@solana/kit";

/**
 * Get vault policy account based on policy program type
 * 
 * For AllowAny and DenyAll policies, the policy account is just the program address.
 * For LimitTransfer, Owners, and Multisig policies, the policy account is a PDA derived
 * from the vault address and policy program.
 */
export const getVaultPolicyAccount = async (
  vaultAddress: KitAddress,
  policyProgram: KitAddress,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  helpers: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protocol: any
): Promise<KitAddress> => {
  // For AllowAny and DenyAll policies, the policy account is just the program address
  if (
    policyProgram === protocol.policyAllowAny.POLICY_ALLOW_ANY_PROGRAM_ADDRESS ||
    policyProgram === protocol.policyDenyAll.POLICY_DENY_ALL_PROGRAM_ADDRESS
  ) {
    return policyProgram;
  }

  // For other policies, we need to derive the PDA using the vault address as seed
  if (policyProgram === protocol.policyLimitTransfer.POLICY_LIMIT_TRANSFER_PROGRAM_ADDRESS) {
    // For limit transfer, the PDA is derived using only the vault address as seed
    // According to the Rust code: seeds = [vault.key().as_ref()]
    const addressEncoder = getAddressEncoder();
    const policyAccount = await getProgramDerivedAddress({
      seeds: [addressEncoder.encode(vaultAddress)],
      programAddress: protocol.policyLimitTransfer.POLICY_LIMIT_TRANSFER_PROGRAM_ADDRESS,
    });
    return policyAccount[0];
  }

  if (policyProgram === protocol.policyOwners.POLICY_OWNERS_PROGRAM_ADDRESS) {
    // For owners policy, the PDA is derived using only the vault address as seed
    const addressEncoder = getAddressEncoder();
    const policyAccount = await getProgramDerivedAddress({
      seeds: [addressEncoder.encode(vaultAddress)],
      programAddress: protocol.policyOwners.POLICY_OWNERS_PROGRAM_ADDRESS,
    });
    return policyAccount[0];
  }

  if (policyProgram === protocol.policyMultisig.POLICY_MULTISIG_PROGRAM_ADDRESS) {
    // For multisig policy, the PDA is derived using only the vault address as seed
    const addressEncoder = getAddressEncoder();
    const policyAccount = await getProgramDerivedAddress({
      seeds: [addressEncoder.encode(vaultAddress)],
      programAddress: protocol.policyMultisig.POLICY_MULTISIG_PROGRAM_ADDRESS,
    });
    return policyAccount[0];
  }

  // Fallback to program address
  return policyProgram;
};
