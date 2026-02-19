use anchor_lang::prelude::*;
use hyro_sdk::{get_context, ValidateOperation, ValidateContext};

// .keys/allow_any.json
declare_id!("Ag11DzSV7e6yrfCSKQx67gzEy6JbkEBFys8yreeRRc5N");

#[program]
pub mod policy_allow_any {
    use super::*;
    
    pub fn validate<'a, 'b, 'c:'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, Validate<'info>>, 
        operation: ValidateOperation
    ) -> Result<()> {
        // Get context based on operation type
        let validate_ctx = get_context(operation);

        match validate_ctx {
            ValidateContext::Creation(creation_ctx) => {
                creation_ctx.validate_accounts(ctx.remaining_accounts)?;
                
                Ok(())
            }
            ValidateContext::Execution(execution_ctx) => {
                execution_ctx.validate_accounts(ctx.remaining_accounts)?;
                
                Ok(())
            }
        }
    }
}

#[derive(Accounts)]
pub struct Validate<'info> {
    /// CHECK: This is the vault account
    pub vault: UncheckedAccount<'info>,
}
