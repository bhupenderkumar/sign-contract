const { Connection, PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');
const crypto = require('crypto');

class SolanaContractService {
  constructor(connection, program, platformFeeRecipient) {
    this.connection = connection;
    this.program = program;
    this.platformFeeRecipient = platformFeeRecipient;
  }

  /**
   * Create a contract on the Solana blockchain
   */
  async createContract(contractData, creatorKeypair) {
    try {
      // Generate a unique contract account
      const contractAccount = Keypair.generate();
      
      // Calculate platform fee (0.01 SOL)
      const platformFee = 0.01 * LAMPORTS_PER_SOL;
      
      // Prepare parties array for the contract
      const parties = contractData.parties.map(party => ({
        publicKey: new PublicKey(party.publicKey),
        name: party.name,
        email: party.email,
        hasSigned: false
      }));

      // Create the contract on-chain
      const tx = await this.program.methods
        .createContract(
          contractData.contractId,
          contractData.title,
          contractData.description,
          contractData.agreementText,
          contractData.structuredClauses || [],
          parties,
          contractData.useMediator || false,
          contractData.mediator ? contractData.mediator.name : "",
          contractData.mediator ? contractData.mediator.email : "",
          contractData.expiryDate ? new anchor.BN(contractData.expiryDate.getTime() / 1000) : new anchor.BN(0),
          new anchor.BN(platformFee)
        )
        .accounts({
          contract: contractAccount.publicKey,
          creator: creatorKeypair.publicKey,
          platformFeeRecipient: this.platformFeeRecipient,
          systemProgram: SystemProgram.programId,
        })
        .signers([contractAccount, creatorKeypair])
        .rpc();

      return {
        success: true,
        transactionId: tx,
        contractAddress: contractAccount.publicKey.toString(),
        platformFee: platformFee / LAMPORTS_PER_SOL
      };

    } catch (error) {
      console.error('Error creating contract on Solana:', error);
      throw new Error(`Failed to create contract on blockchain: ${error.message}`);
    }
  }

  /**
   * Sign a contract on the Solana blockchain
   */
  async signContract(contractAddress, signerKeypair) {
    try {
      const contractPubkey = new PublicKey(contractAddress);
      
      const tx = await this.program.methods
        .signContract()
        .accounts({
          contract: contractPubkey,
          signer: signerKeypair.publicKey,
        })
        .signers([signerKeypair])
        .rpc();

      return {
        success: true,
        transactionId: tx,
        signer: signerKeypair.publicKey.toString()
      };

    } catch (error) {
      console.error('Error signing contract on Solana:', error);
      throw new Error(`Failed to sign contract on blockchain: ${error.message}`);
    }
  }

  /**
   * Get contract data from the blockchain
   */
  async getContract(contractAddress) {
    try {
      const contractPubkey = new PublicKey(contractAddress);
      const contractAccount = await this.program.account.contract.fetch(contractPubkey);
      
      return {
        success: true,
        contract: {
          contractId: contractAccount.contractId,
          title: contractAccount.title,
          description: contractAccount.description,
          agreementText: contractAccount.agreementText,
          structuredClauses: contractAccount.structuredClauses,
          parties: contractAccount.parties.map(party => ({
            publicKey: party.publicKey.toString(),
            name: party.name,
            email: party.email,
            hasSigned: party.hasSigned,
            signedAt: party.signedAt ? new Date(party.signedAt.toNumber() * 1000) : null
          })),
          creator: contractAccount.creator.toString(),
          createdAt: new Date(contractAccount.createdAt.toNumber() * 1000),
          expiryDate: contractAccount.expiryDate.toNumber() > 0 ? 
            new Date(contractAccount.expiryDate.toNumber() * 1000) : null,
          isCompleted: contractAccount.isCompleted,
          completedAt: contractAccount.completedAt.toNumber() > 0 ? 
            new Date(contractAccount.completedAt.toNumber() * 1000) : null,
          useMediator: contractAccount.useMediator,
          mediatorName: contractAccount.mediatorName,
          mediatorEmail: contractAccount.mediatorEmail,
          platformFee: contractAccount.platformFee.toNumber() / LAMPORTS_PER_SOL
        }
      };

    } catch (error) {
      console.error('Error fetching contract from Solana:', error);
      throw new Error(`Failed to fetch contract from blockchain: ${error.message}`);
    }
  }

  /**
   * Check if a contract is fully signed
   */
  async isContractFullySigned(contractAddress) {
    try {
      const contractData = await this.getContract(contractAddress);
      if (!contractData.success) return false;
      
      return contractData.contract.parties.every(party => party.hasSigned);
    } catch (error) {
      console.error('Error checking contract signature status:', error);
      return false;
    }
  }

  /**
   * Validate that a public key can sign a contract
   */
  async canUserSignContract(contractAddress, userPublicKey) {
    try {
      const contractData = await this.getContract(contractAddress);
      if (!contractData.success) return false;
      
      const userParty = contractData.contract.parties.find(
        party => party.publicKey === userPublicKey
      );
      
      return userParty && !userParty.hasSigned;
    } catch (error) {
      console.error('Error checking if user can sign contract:', error);
      return false;
    }
  }

  /**
   * Get contract signature status
   */
  async getContractSignatureStatus(contractAddress) {
    try {
      const contractData = await this.getContract(contractAddress);
      if (!contractData.success) return null;
      
      const totalParties = contractData.contract.parties.length;
      const signedParties = contractData.contract.parties.filter(party => party.hasSigned).length;
      
      return {
        totalParties,
        signedParties,
        isFullySigned: signedParties === totalParties,
        signingProgress: (signedParties / totalParties) * 100
      };
    } catch (error) {
      console.error('Error getting contract signature status:', error);
      return null;
    }
  }

  /**
   * Create a keypair from a private key string
   */
  static createKeypairFromPrivateKey(privateKeyString) {
    try {
      // Handle different private key formats
      let privateKeyBytes;
      
      if (privateKeyString.startsWith('[') && privateKeyString.endsWith(']')) {
        // Array format: [1,2,3,...]
        privateKeyBytes = new Uint8Array(JSON.parse(privateKeyString));
      } else if (privateKeyString.length === 128) {
        // Hex format
        privateKeyBytes = new Uint8Array(
          privateKeyString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
        );
      } else {
        // Base58 format
        privateKeyBytes = anchor.utils.bytes.bs58.decode(privateKeyString);
      }
      
      return Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
      throw new Error(`Invalid private key format: ${error.message}`);
    }
  }

  /**
   * Generate a random contract ID
   */
  static generateContractId() {
    return crypto.randomBytes(16).toString('hex');
  }
}

module.exports = SolanaContractService;
