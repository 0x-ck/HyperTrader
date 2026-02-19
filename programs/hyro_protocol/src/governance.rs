use anchor_lang::prelude::*;

pub fn placeholder_governance_instruction(_ctx: Context<PlaceholderGovernance>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct PlaceholderGovernance {} 