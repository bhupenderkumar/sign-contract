import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { DigitalContract } from "../target/types/digital_contract";
import { expect } from "chai";

describe("digital_contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.DigitalContract as Program<DigitalContract>;
  const provider = anchor.AnchorProvider.env();

  // Test accounts
  let contractAccount: Keypair;
  let creator: Keypair;
  let party1: Keypair;
  let party2: Keypair;
  let party3: Keypair;
  let mediator: Keypair;
  let platformFeeRecipient: Keypair;

  beforeEach(async () => {
    contractAccount = Keypair.generate();
    creator = Keypair.generate();
    party1 = Keypair.generate();
    party2 = Keypair.generate();
    party3 = Keypair.generate();
    mediator = Keypair.generate();
    platformFeeRecipient = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(party1.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(party2.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(party3.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(mediator.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL)
    );
  });

  it("Creates a contract successfully", async () => {
    const documentHash = "QmTestHash123456789";
    const title = "Test Service Agreement";
    const parties = [party1.publicKey, party2.publicKey];
    const mediatorPubkey = mediator.publicKey;

    const tx = await program.methods
      .createContract(
        documentHash,
        title,
        parties,
        mediatorPubkey,
        null, // no expiry
        new anchor.BN(100_000_000) // 0.1 SOL in lamports
      )
      .accounts({
        contract: contractAccount.publicKey,
        creator: creator.publicKey,
        platformFeeRecipient: platformFeeRecipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contractAccount, creator])
      .rpc();

    console.log("Contract creation transaction signature:", tx);

    // Fetch the contract account
    const contract = await program.account.contract.fetch(contractAccount.publicKey);

    expect(contract.creator.toString()).to.equal(creator.publicKey.toString());
    expect(contract.documentHash).to.equal(documentHash);
    expect(contract.title).to.equal(title);
    expect(contract.parties.length).to.equal(2);
    expect(contract.parties[0].toString()).to.equal(party1.publicKey.toString());
    expect(contract.parties[1].toString()).to.equal(party2.publicKey.toString());
    expect(contract.mediator.toString()).to.equal(mediator.publicKey.toString());
    expect(contract.signatures.length).to.equal(2);
    expect(contract.signatures[0]).to.be.false;
    expect(contract.signatures[1]).to.be.false;
    expect(contract.isFullySigned).to.be.false;
  });

  it("Allows parties to sign the contract", async () => {
    // First create a contract
    const documentHash = "QmTestHash123456789";
    const title = "Test Service Agreement";
    const parties = [party1.publicKey, party2.publicKey];

    await program.methods
      .createContract(
        documentHash,
        title,
        parties,
        null, // no mediator
        null, // no expiry
        new anchor.BN(100_000_000) // 0.1 SOL in lamports
      )
      .accounts({
        contract: contractAccount.publicKey,
        creator: creator.publicKey,
        platformFeeRecipient: platformFeeRecipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contractAccount, creator])
      .rpc();

    // Party 1 signs
    await program.methods
      .signContract()
      .accounts({
        contract: contractAccount.publicKey,
        signer: party1.publicKey,
      })
      .signers([party1])
      .rpc();

    let contract = await program.account.contract.fetch(contractAccount.publicKey);
    expect(contract.signatures[0]).to.be.true;
    expect(contract.signatures[1]).to.be.false;
    expect(contract.isFullySigned).to.be.false;

    // Party 2 signs
    await program.methods
      .signContract()
      .accounts({
        contract: contractAccount.publicKey,
        signer: party2.publicKey,
      })
      .signers([party2])
      .rpc();

    contract = await program.account.contract.fetch(contractAccount.publicKey);
    expect(contract.signatures[0]).to.be.true;
    expect(contract.signatures[1]).to.be.true;
    expect(contract.isFullySigned).to.be.true;
  });

  it("Prevents unauthorized signers", async () => {
    // Create a contract
    const documentHash = "QmTestHash123456789";
    const title = "Test Service Agreement";
    const parties = [party1.publicKey, party2.publicKey];

    await program.methods
      .createContract(
        documentHash,
        title,
        parties,
        null,
        null,
        new anchor.BN(100_000_000) // 0.1 SOL in lamports
      )
      .accounts({
        contract: contractAccount.publicKey,
        creator: creator.publicKey,
        platformFeeRecipient: platformFeeRecipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contractAccount, creator])
      .rpc();

    // Try to sign with unauthorized party
    try {
      await program.methods
        .signContract()
        .accounts({
          contract: contractAccount.publicKey,
          signer: party3.publicKey,
        })
        .signers([party3])
        .rpc();

      expect.fail("Should have thrown an error for unauthorized signer");
    } catch (error) {
      expect(error.message).to.include("UnauthorizedSigner");
    }
  });

  it("Prevents double signing", async () => {
    // Create and sign once
    const documentHash = "QmTestHash123456789";
    const title = "Test Service Agreement";
    const parties = [party1.publicKey, party2.publicKey];

    await program.methods
      .createContract(
        documentHash,
        title,
        parties,
        null,
        null,
        new anchor.BN(100_000_000) // 0.1 SOL in lamports
      )
      .accounts({
        contract: contractAccount.publicKey,
        creator: creator.publicKey,
        platformFeeRecipient: platformFeeRecipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contractAccount, creator])
      .rpc();

    // First signature
    await program.methods
      .signContract()
      .accounts({
        contract: contractAccount.publicKey,
        signer: party1.publicKey,
      })
      .signers([party1])
      .rpc();

    // Try to sign again
    try {
      await program.methods
        .signContract()
        .accounts({
          contract: contractAccount.publicKey,
          signer: party1.publicKey,
        })
        .signers([party1])
        .rpc();

      expect.fail("Should have thrown an error for double signing");
    } catch (error) {
      expect(error.message).to.include("AlreadySigned");
    }
  });
});
