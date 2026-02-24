use anchor_lang::prelude::*;
#[cfg(feature = "enable_governance")]
pub mod governance;
pub mod manager_registry;
#[cfg(feature = "enable_oracle")]
pub mod oracle;
pub mod vault;
#[cfg(feature = "enable_verification")]
pub mod verification;

pub use vault::*;
pub use manager_registry::*;


declare_id!("2fYZAvtCCuRBYQ229q2WHrvwWtiSwwa5Qbipo3ceC3N9");

#[derive(Accounts)]
pub struct Ping<'info> {
    #[account(signer)]
    pub signer: Signer<'info>,
}

#[program]
pub mod hyro_protocol {
    use super::*;

    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        seed: String,
        policy_program: Pubkey,
    ) -> Result<()> {
        vault::initialize_vault(ctx, policy_program, seed)
    }

    pub fn create_tx<'a, 'b, 'c:'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, CreateTransaction<'info>>,
        nonce: u64,
        pid: Pubkey,
        accs: Vec<TransactionAccount>,
        data: Vec<u8>
    ) -> Result<()> {
        vault::create_tx(ctx, nonce, pid, accs, data)
    }

    pub fn execute_tx<'a, 'b, 'c:'info, 'info>(ctx: Context<'a, 'b, 'c, 'info, ExecuteTransaction<'info>>) -> Result<()> {
        vault::execute_tx(ctx)
    }

    pub fn initialize_manager_registry(
        ctx: Context<InitializeManagerRegistry>,
    ) -> Result<()> {
        manager_registry::initialize_manager_registry(ctx)
    }

    pub fn register_manager(
        ctx: Context<RegisterManager>,
        risk_rating: RiskRating,
    ) -> Result<()> {
        manager_registry::register_manager(ctx, risk_rating)
    }

    pub fn verify_manager(
        ctx: Context<VerifyManager>,
        verification_status: VerificationStatus,
    ) -> Result<()> {
        manager_registry::verify_manager(ctx, verification_status)
    }

    pub fn issue_child_vault(
        ctx: Context<IssueChildVault>,
        seed: String,
        allocation: u64,
        manager_fees: ManagerFeeStructure,
    ) -> Result<()> {
        vault::issue_child_vault(ctx, seed, allocation, manager_fees)
    }

    pub fn validate_balances(
        ctx: Context<ValidateBalances>,
        amount: u64,
    ) -> Result<()> {
        vault::validate_balances(ctx, amount)
    }

    #[cfg(feature = "enable_verification")]
    pub fn initialize_verification(
        ctx: Context<verification::InitializeVerification>,
    ) -> Result<()> {
        verification::initialize_verification(ctx)
    }

    #[cfg(feature = "enable_oracle")]
    pub fn initialize_oracle(ctx: Context<oracle::InitializeOracle>) -> Result<()> {
        oracle::initialize_oracle(ctx)
    }

    #[cfg(feature = "enable_governance")]
    pub fn initialize_governance(ctx: Context<governance::InitializeGovernance>) -> Result<()> {
        governance::initialize_governance(ctx)
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Transaction already executed.")]
    TransactionAlreadyExecuted,
    #[msg("Transaction not found.")]
    TransactionNotFound,
    #[msg("Transaction not executable.")]
    TransactionNotExecutable,
}
