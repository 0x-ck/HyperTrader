use anchor_lang::prelude::*;

pub fn placeholder_oracle_instruction(_ctx: Context<PlaceholderOracle>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct PlaceholderOracle {} 