use anchor_lang::prelude::*;
use crate::states::*;

pub trait ApplyOnChallenge {
    fn apply_challenge(&self, acc: &mut Account<Challenge>);
}

pub trait ApplyOnTemplate {
    fn apply_template(&self, acc: &mut Account<ChallengeTemplate>);
}

pub trait ValidateDto {
    fn validate(&self) -> Result<()>;
}
