use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

const PLATFORM_FEE_LAMPORTS: u64 = 10_000_000; // 0.01 SOL in lamports (1 SOL = 1,000,000,000 lamports)
const MAX_PARTIES: usize = 10; // Maximum number of parties in a contract
const MAX_DOCUMENT_HASH_LENGTH: usize = 64; // Maximum length for document hash
const MAX_TITLE_LENGTH: usize = 100; // Maximum length for contract title

#[program]
pub mod digital_contract {
    use super::*;

    pub fn create_contract(
        ctx: Context<CreateContract>,
        document_hash: String,
        title: String,
        parties: Vec<Pubkey>,
        mediator: Option<Pubkey>,
        expiry_timestamp: Option<i64>,
    ) -> Result<()> {
        require!(
            document_hash.len() <= MAX_DOCUMENT_HASH_LENGTH,
            ContractError::DocumentHashTooLong
        );
        require!(
            title.len() <= MAX_TITLE_LENGTH,
            ContractError::TitleTooLong
        );
        require!(
            parties.len() >= 2 && parties.len() <= MAX_PARTIES,
            ContractError::InvalidPartyCount
        );

        let contract = &mut ctx.accounts.contract;
        contract.creator = ctx.accounts.creator.key();
        contract.document_hash = document_hash;
        contract.title = title;
        contract.parties = parties;
        contract.mediator = mediator;
        contract.signatures = vec![false; contract.parties.len()];
        contract.status = ContractStatus::Active;
        contract.created_at = Clock::get()?.unix_timestamp;
        contract.expiry_timestamp = expiry_timestamp;
        contract.is_fully_signed = false;

        // Transfer platform fee
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.platform_fee_recipient.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, PLATFORM_FEE_LAMPORTS)?;

        emit!(ContractCreated {
            contract_id: contract.key(),
            creator: contract.creator,
            parties: contract.parties.clone(),
            document_hash: contract.document_hash.clone(),
            title: contract.title.clone(),
        });

        Ok(())
    }

    pub fn sign_contract(ctx: Context<SignContract>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let signer = ctx.accounts.signer.key();

        // Check if contract is still active
        require!(
            contract.status == ContractStatus::Active,
            ContractError::ContractNotActive
        );

        // Check if contract has expired
        if let Some(expiry) = contract.expiry_timestamp {
            require!(
                Clock::get()?.unix_timestamp <= expiry,
                ContractError::ContractExpired
            );
        }

        // Find the signer in the parties list
        let party_index = contract.parties.iter().position(|&party| party == signer)
            .ok_or(ContractError::UnauthorizedSigner)?;

        // Check if already signed
        require!(
            !contract.signatures[party_index],
            ContractError::AlreadySigned
        );

        // Mark as signed
        contract.signatures[party_index] = true;

        // Check if all parties have signed
        let all_signed = contract.signatures.iter().all(|&signed| signed);
        if all_signed {
            contract.is_fully_signed = true;
            contract.status = ContractStatus::Completed;
        }

        emit!(ContractSigned {
            contract_id: contract.key(),
            signer,
            party_index: party_index as u8,
            is_fully_signed: contract.is_fully_signed,
        });

        Ok(())
    }

    pub fn cancel_contract(ctx: Context<CancelContract>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let canceller = ctx.accounts.canceller.key();

        // Only creator or mediator can cancel
        require!(
            canceller == contract.creator ||
            (contract.mediator.is_some() && canceller == contract.mediator.unwrap()),
            ContractError::UnauthorizedCancellation
        );

        require!(
            contract.status == ContractStatus::Active,
            ContractError::ContractNotActive
        );

        contract.status = ContractStatus::Cancelled;

        emit!(ContractCancelled {
            contract_id: contract.key(),
            cancelled_by: canceller,
        });

        Ok(())
    }

    pub fn mediate_dispute(ctx: Context<MediateDispute>, resolution: String) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let mediator = ctx.accounts.mediator.key();

        require!(
            contract.mediator.is_some() && contract.mediator.unwrap() == mediator,
            ContractError::UnauthorizedMediator
        );

        require!(
            contract.status == ContractStatus::Active,
            ContractError::ContractNotActive
        );

        contract.status = ContractStatus::Disputed;

        emit!(DisputeMediated {
            contract_id: contract.key(),
            mediator,
            resolution,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateContract<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + // discriminator
                32 + // creator
                4 + MAX_DOCUMENT_HASH_LENGTH + // document_hash
                4 + MAX_TITLE_LENGTH + // title
                4 + (32 * MAX_PARTIES) + // parties
                1 + 32 + // mediator (Option<Pubkey>)
                4 + (1 * MAX_PARTIES) + // signatures
                1 + // status
                8 + // created_at
                1 + 8 + // expiry_timestamp (Option<i64>)
                1 // is_fully_signed
    )]
    pub contract: Account<'info, Contract>,
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK: This is the platform fee recipient, no constraints needed beyond being a valid account.
    #[account(mut)]
    pub platform_fee_recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SignContract<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelContract<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    pub canceller: Signer<'info>,
}

#[derive(Accounts)]
pub struct MediateDispute<'info> {
    #[account(mut)]
    pub contract: Account<'info, Contract>,
    pub mediator: Signer<'info>,
}

#[account]
pub struct Contract {
    pub creator: Pubkey,
    pub document_hash: String,
    pub title: String,
    pub parties: Vec<Pubkey>,
    pub mediator: Option<Pubkey>,
    pub signatures: Vec<bool>,
    pub status: ContractStatus,
    pub created_at: i64,
    pub expiry_timestamp: Option<i64>,
    pub is_fully_signed: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ContractStatus {
    Active,
    Completed,
    Cancelled,
    Expired,
    Disputed,
}

#[event]
pub struct ContractCreated {
    pub contract_id: Pubkey,
    pub creator: Pubkey,
    pub parties: Vec<Pubkey>,
    pub document_hash: String,
    pub title: String,
}

#[event]
pub struct ContractSigned {
    pub contract_id: Pubkey,
    pub signer: Pubkey,
    pub party_index: u8,
    pub is_fully_signed: bool,
}

#[event]
pub struct ContractCancelled {
    pub contract_id: Pubkey,
    pub cancelled_by: Pubkey,
}

#[event]
pub struct DisputeMediated {
    pub contract_id: Pubkey,
    pub mediator: Pubkey,
    pub resolution: String,
}

#[error_code]
pub enum ContractError {
    #[msg("The signer is not authorized to sign this contract.")]
    UnauthorizedSigner,
    #[msg("The contract is not in an active state.")]
    ContractNotActive,
    #[msg("The contract has expired.")]
    ContractExpired,
    #[msg("This party has already signed the contract.")]
    AlreadySigned,
    #[msg("Document hash is too long.")]
    DocumentHashTooLong,
    #[msg("Contract title is too long.")]
    TitleTooLong,
    #[msg("Invalid number of parties. Must be between 2 and 10.")]
    InvalidPartyCount,
    #[msg("Only the creator or mediator can cancel this contract.")]
    UnauthorizedCancellation,
    #[msg("Only the designated mediator can mediate disputes.")]
    UnauthorizedMediator,
}

