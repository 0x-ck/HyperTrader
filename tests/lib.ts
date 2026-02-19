import { HyroProtocol } from "../target/types/hyro_protocol";
import { PolicyAllowAny } from "../target/types/policy_allow_any";
import { PolicyDenyAll } from "../target/types/policy_deny_all";
import * as anchor from "@coral-xyz/anchor";
import { Dropper } from "../target/types/dropper";
import { PolicyOwners } from "../target/types/policy_owners";
import { PolicyLimitTransfer } from "../target/types/policy_limit_transfer";
import { PolicyChallenges } from "../target/types/policy_challenges";
import { PolicyMultisig } from "../target/types/policy_multisig";

export const useAnchor = () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  let protocol = anchor.workspace.HyroProtocol as anchor.Program<HyroProtocol>;
  let denyAll = anchor.workspace.PolicyDenyAll as anchor.Program<PolicyDenyAll>;
  let allowAny = anchor.workspace
    .PolicyAllowAny as anchor.Program<PolicyAllowAny>;
  let limitTransfer = anchor.workspace
    .PolicyLimitTransfer as anchor.Program<PolicyLimitTransfer>;
  let owners = anchor.workspace.PolicyOwners as anchor.Program<PolicyOwners>;
  let dropper = anchor.workspace.Dropper as anchor.Program<Dropper>;
  let challenges = anchor.workspace.PolicyChallenges as anchor.Program<PolicyChallenges>;
  let multisig = anchor.workspace.PolicyMultisig as anchor.Program<PolicyMultisig>;
  let provider = anchor.getProvider();

  return {
    protocol,
    denyAll,
    allowAny,
    dropper,
    limitTransfer,
    owners,
    provider,
    anchor,
    challenges,
    multisig,
  };
};

export const getVaultPda = (seed: string) => {
  const { anchor, protocol } = useAnchor();

  const [vault] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(seed, "utf8")],
    protocol.programId
  );
  const [authority] = anchor.web3.PublicKey.findProgramAddressSync(
    [vault.toBytes()],
    protocol.programId
  );

  return [vault, authority];
};

export const getLimitPolicyPda = (seed: string, min: number, max: number) => {
  const { anchor, limitTransfer } = useAnchor();
  const minBuffer = Buffer.alloc(8)
  minBuffer.writeBigUInt64LE(BigInt(min));
  const maxBuffer = Buffer.alloc(8)
  maxBuffer.writeBigUInt64LE(BigInt(max));
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(seed, "utf8"), minBuffer, maxBuffer],
    limitTransfer.programId
  );
};

export const getTransactionPda = (vault: anchor.web3.PublicKey, nonce: number) => {
  const { anchor, protocol } = useAnchor();
  const nonceBuffer = Buffer.alloc(8)
  nonceBuffer.writeBigUInt64LE(BigInt(nonce));
  return anchor.web3.PublicKey.findProgramAddressSync(
    [vault.toBytes(), nonceBuffer],
    protocol.programId
  );
};

export const getOwnersPolicyPda = (seed: string, owners: anchor.web3.PublicKey[]) => {
  const { anchor, owners: ownersProgram } = useAnchor();
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(seed, "utf8")], //TEMPORARY: , ...owners.map((o) => o.toBytes())],
    ownersProgram.programId
  );
};

export const getChallengeTemplatePda = (stageId: number | bigint) => {
  const { anchor, challenges } = useAnchor();
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(stageId));
  return anchor.web3.PublicKey.findProgramAddressSync([buf], challenges.programId);
};

export const getChallengePda = (user: anchor.web3.PublicKey, seed: string) => {
  const { anchor, challenges } = useAnchor();
  return anchor.web3.PublicKey.findProgramAddressSync(
    [user.toBytes(), Buffer.from(seed, "utf8")],
    challenges.programId
  );
};

export const getMultisigPolicyPda = (seed: string) => {
  const { anchor, multisig } = useAnchor();
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(seed, "utf8")],
    multisig.programId
  );
};

export const getVaultBasedLimitPolicyPda = (vault: anchor.web3.PublicKey) => {
  const { anchor, limitTransfer } = useAnchor();
  return anchor.web3.PublicKey.findProgramAddressSync(
    [vault.toBytes()],
    limitTransfer.programId
  );
};

export const getVaultBasedOwnersPolicyPda = (vault: anchor.web3.PublicKey) => {
  const { anchor, owners } = useAnchor();
  return anchor.web3.PublicKey.findProgramAddressSync(
    [vault.toBytes()],
    owners.programId
  );
};

export const getVaultBasedMultisigPolicyPda = (vault: anchor.web3.PublicKey) => {
  const { anchor, multisig } = useAnchor();
  return anchor.web3.PublicKey.findProgramAddressSync(
    [vault.toBytes()],
    multisig.programId
  );
};

export const getManagerRegistryPda = () => {
  const { anchor, protocol } = useAnchor();
  const [registry] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("manager_registry")],
    protocol.programId
  );
  return registry;
};

export const getManagerProfilePda = (managerPubkey: anchor.web3.PublicKey) => {
  const { anchor, protocol } = useAnchor();
  const [profile] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("manager_profile"), managerPubkey.toBytes()],
    protocol.programId
  );
  return profile;
};

export const getChildVaultPda = (
  parentVault: anchor.web3.PublicKey,
  allocation: number,
  manager: anchor.web3.PublicKey
) => {
  const { anchor, protocol } = useAnchor();
  const allocationBuffer = Buffer.alloc(8);
  allocationBuffer.writeBigUInt64LE(BigInt(allocation));
  
  const [childVault] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      parentVault.toBytes(),
      Buffer.from("child"),
      allocationBuffer,
      manager.toBytes()
    ],
    protocol.programId
  );
  return childVault;
};

export const getChildVaultAuthorityPda = (childVault: anchor.web3.PublicKey) => {
  const { anchor, protocol } = useAnchor();
  const [authority] = anchor.web3.PublicKey.findProgramAddressSync(
    [childVault.toBytes()],
    protocol.programId
  );
  return authority;
};

export const expectRevert = (message: string) => {
  return (e: unknown) => {
    if (e instanceof anchor.AnchorError) {
      if (e.errorLogs.some((log) => log.includes(message))) {
        return true;
      }
    }

    throw new Error("Expected revert but did not get one");
  };
};
