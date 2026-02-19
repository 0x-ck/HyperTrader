use anchor_lang::prelude::*;

// Initialize manager registry
pub fn initialize_manager_registry(
    ctx: Context<InitializeManagerRegistry>,
) -> Result<()> {
    let registry = &mut ctx.accounts.registry;
    registry.admin = ctx.accounts.admin.key();
    registry.total_managers = 0;
    registry.total_aum = 0;
    registry.created_at = Clock::get()?.unix_timestamp as u64;
    Ok(())
}

// Register a new manager
pub fn register_manager(
    ctx: Context<RegisterManager>,
    risk_rating: RiskRating,
) -> Result<()> {
    let profile = &mut ctx.accounts.manager_profile;
    profile.manager_pubkey = ctx.accounts.manager.key();
    profile.verification_status = VerificationStatus::Pending;
    profile.risk_rating = risk_rating;
    profile.total_aum = 0;
    profile.active_vaults = 0;
    profile.total_fees_earned = 0;
    profile.created_at = Clock::get()?.unix_timestamp as u64;
    profile.last_activity = Clock::get()?.unix_timestamp as u64;
    
    // Update registry
    ctx.accounts.registry.total_managers += 1;
    Ok(())
}

// Verify a manager
pub fn verify_manager(
    ctx: Context<VerifyManager>,
    verification_status: VerificationStatus,
) -> Result<()> {
    require!(
        ctx.accounts.registry.admin == ctx.accounts.admin.key(),
        ErrorCode::UnauthorizedAdmin
    );
    
    ctx.accounts.manager_profile.verification_status = verification_status;
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeManagerRegistry<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + <ManagerRegistry as Space>::INIT_SPACE,
        seeds = [b"manager_registry"],
        bump,
    )]
    pub registry: Account<'info, ManagerRegistry>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterManager<'info> {
    #[account(
        mut,
        constraint = admin.key() == registry.admin @ ErrorCode::UnauthorizedAdmin
    )]
    pub admin: Signer<'info>,
    /// CHECK: manager
    pub manager: UncheckedAccount<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + <ManagerProfile as Space>::INIT_SPACE,
        seeds = [b"manager_profile", manager.key().as_ref()],
        bump,
    )]
    pub manager_profile: Box<Account<'info, ManagerProfile>>,
    #[account(
        mut,
    )]
    pub registry: Box<Account<'info, ManagerRegistry>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyManager<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub manager_profile: Box<Account<'info, ManagerProfile>>,
    #[account(constraint = registry.admin == admin.key())]
    pub registry: Box<Account<'info, ManagerRegistry>>,
}

#[account]
#[derive(InitSpace)]
pub struct ManagerRegistry {
    pub admin: Pubkey,
    pub total_managers: u32,
    pub total_aum: u64,
    pub created_at: u64,
}

#[account]
#[derive(InitSpace)]
pub struct ManagerProfile {
    pub manager_pubkey: Pubkey,
    pub verification_status: VerificationStatus,
    pub risk_rating: RiskRating,
    pub total_aum: u64,
    pub active_vaults: u32,
    pub total_fees_earned: u64,
    pub created_at: u64,
    pub last_activity: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum VerificationStatus {
    Pending,
    Verified,
    Suspended,
    Blacklisted,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum RiskRating {
    Conservative,    // 0
    Moderate,        // 1
    Aggressive,      // 2
    Speculative,     // 3
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized admin access.")]
    UnauthorizedAdmin,
}