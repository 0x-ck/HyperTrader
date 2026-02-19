use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq, Copy)]
pub enum ValidateOperation {
    Creation,
    Execution,
}

pub fn get_context(operation: ValidateOperation) -> ValidateContext {
        match operation {
            ValidateOperation::Creation => ValidateContext::Creation(CreationContext {
                transaction_index: 0,
                policy_account_index: 1,
                signer_index: 2,
                vault_signer_index: 3
            }),
            ValidateOperation::Execution => ValidateContext::Execution(ExecutionContext {
                transaction_index: 0,
                policy_account_index: 1,
                signer_index: 2,
                vault_signer_index: 3
            }),
        }
}

/// Validation context enum that holds operation-specific account indices
#[derive(Clone, Copy)]
pub enum ValidateContext {
    Creation(CreationContext),
    Execution(ExecutionContext),
}

/// Context for Creation operation with account indices
#[derive(Clone, Copy)]
pub struct CreationContext {
    pub transaction_index: usize,
    pub policy_account_index: usize,
    pub signer_index: usize,
    pub vault_signer_index: usize,
}

impl CreationContext {
    /// Validate that all required accounts exist in remaining_accounts
    pub fn validate_accounts(&self, remaining_accounts: &[AccountInfo]) -> Result<()> {
        require!(
            remaining_accounts.len() > self.transaction_index,
            ErrorCode::MissingTransaction
        );
        require!(
            remaining_accounts.len() > self.policy_account_index,
            ErrorCode::MissingPolicyAccount
        );
        require!(
            remaining_accounts.len() > self.signer_index,
            ErrorCode::MissingSigner
        );
        require!(
            remaining_accounts.len() > self.vault_signer_index,
            ErrorCode::MissingVaultSigner
        );
        Ok(())
    }
    
    /// Get transaction account from remaining_accounts
    pub fn transaction<'a>(&self, remaining_accounts: &'a [AccountInfo<'a>]) -> &'a AccountInfo<'a> {
        &remaining_accounts[self.transaction_index]
    }
    
    /// Get policy account from remaining_accounts
    pub fn policy_account<'a>(&self, remaining_accounts: &'a [AccountInfo<'a>]) -> &'a AccountInfo<'a> {
        &remaining_accounts[self.policy_account_index]
    }
    
    /// Get signer account from remaining_accounts
    pub fn signer<'a>(&self, remaining_accounts: &'a [AccountInfo<'a>]) -> &'a AccountInfo<'a> {
        &remaining_accounts[self.signer_index]
    }
    
    /// Get vault signer account from remaining_accounts
    pub fn vault_signer<'a>(&self, remaining_accounts: &'a [AccountInfo<'a>]) -> &'a AccountInfo<'a> {
        &remaining_accounts[self.vault_signer_index]
    }
}

/// Context for Execution operation with account indices
#[derive(Clone, Copy)]
pub struct ExecutionContext {
    pub transaction_index: usize,
    pub policy_account_index: usize,
    pub signer_index: usize,
    pub vault_signer_index: usize,
}

impl ExecutionContext {
    /// Validate that all required accounts exist in remaining_accounts
    pub fn validate_accounts(&self, remaining_accounts: &[AccountInfo]) -> Result<()> {
        require!(
            remaining_accounts.len() > self.transaction_index,
            ErrorCode::MissingTransaction
        );
        require!(
            remaining_accounts.len() > self.policy_account_index,
            ErrorCode::MissingPolicyAccount
        );
        require!(
            remaining_accounts.len() > self.signer_index,
            ErrorCode::MissingSigner
        );
        require!(
            remaining_accounts.len() > self.vault_signer_index,
            ErrorCode::MissingVaultSigner
        );
        Ok(())
    }
    
    /// Get transaction account from remaining_accounts
    pub fn transaction<'a>(&self, remaining_accounts: &'a [AccountInfo<'a>]) -> &'a AccountInfo<'a> {
        &remaining_accounts[self.transaction_index]
    }
    
    /// Get policy account from remaining_accounts
    pub fn policy_account<'a>(&self, remaining_accounts: &'a [AccountInfo<'a>]) -> &'a AccountInfo<'a> {
        &remaining_accounts[self.policy_account_index]
    }
    
    /// Get signer account from remaining_accounts
    pub fn signer<'a>(&self, remaining_accounts: &'a [AccountInfo<'a>]) -> &'a AccountInfo<'a> {
        &remaining_accounts[self.signer_index]
    }
    
    /// Get vault signer account from remaining_accounts
    pub fn vault_signer<'a>(&self, remaining_accounts: &'a [AccountInfo<'a>]) -> &'a AccountInfo<'a> {
        &remaining_accounts[self.vault_signer_index]
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Missing transaction account in remaining accounts")]
    MissingTransaction,
    #[msg("Missing policy account in remaining accounts")]
    MissingPolicyAccount,
    #[msg("Missing signer account in remaining accounts")]
    MissingSigner,
    #[msg("Missing vault signer account in remaining accounts")]
    MissingVaultSigner,
}