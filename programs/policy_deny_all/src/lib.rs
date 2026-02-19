use anchor_lang::prelude::*;
use hyro_sdk::{get_context, ValidateOperation, ValidateContext};

// .keys/deny_all.json
declare_id!("4xsSjQ4drV5jhYYgeCZMHX9tM3k6vMRvbdpySwmi5cvw");

#[program]
pub mod policy_deny_all {
    use super::*;
    pub fn validate<'a, 'b, 'c:'info, 'info>(ctx: Context<'a, 'b, 'c, 'info, Validate<'info>>, operation: ValidateOperation) -> Result<()> {
        let validate_ctx = get_context(operation);
        match validate_ctx {
            ValidateContext::Creation(creation_ctx) => {
                creation_ctx.validate_accounts(ctx.remaining_accounts)?;
                Ok(())
            }
            ValidateContext::Execution(execution_ctx) => {
                execution_ctx.validate_accounts(ctx.remaining_accounts)?;
                Err(ErrorCode::Denied.into())
            }
        }
    }
}

#[derive(Accounts)]
pub struct Validate<'info> {
    /// CHECK: This is the vault account
    vault: UncheckedAccount<'info>
}

#[error_code]
pub enum ErrorCode {
    #[msg("Action denied by policy.")]
    Denied,
} 