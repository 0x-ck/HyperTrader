use anchor_lang::prelude::*;

pub fn placeholder_verification_instruction(_ctx: Context<PlaceholderVerification>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct PlaceholderVerification {} 