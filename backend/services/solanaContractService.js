const { Connection, PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL, Transaction } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');
const crypto = require('crypto');

class SolanaContractService {
  constructor(connection, program, platformFeeRecipient) {
    this.connection = connection;
    this.program = program;
    // Use the public key from environment variable if available
    this.platformFeeRecipient = process.env.PLATFORM_FEE_RECIPIENT_PUBLIC_KEY
      ? new PublicKey(process.env.PLATFORM_FEE_RECIPIENT_PUBLIC_KEY)
      : platformFeeRecipient;
    this.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.001'); // Default 0.1%
  }

  /**
   * Calculate document hash for contract data
   */
  calculateDocumentHash(contractData) {
    const dataString = JSON.stringify(contractData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Prepare a contract transaction for user signing (user pays fees)
   */
  async prepareContractTransaction(contractData, userPublicKey) {
    try {
      // Generate a unique contract account
      const contractAccount = Keypair.generate();

      // Calculate contract value (default to 0.1 SOL if not provided)
      const contractValueSOL = contractData.contractValue || 0.1;
      const contractValueLamports = contractValueSOL * LAMPORTS_PER_SOL;

      // Calculate platform fee (0.1% of contract value)
      const platformFeeSOL = contractValueSOL * this.platformFeePercentage;
      const platformFeeLamports = Math.max(
        Math.min(platformFeeSOL * LAMPORTS_PER_SOL, 100_000_000), // Max 0.1 SOL
        1_000_000 // Min 0.001 SOL
      );

      // Prepare parties array for the contract
      const parties = contractData.parties.map(party => ({
        publicKey: new PublicKey(party.publicKey),
        name: party.name,
        email: party.email,
        hasSigned: false
      }));

      // Extract public keys for the contract
      const partyPublicKeys = parties.map(party => party.publicKey);

      // Handle mediator
      let mediatorPubkey = null;
      if (contractData.mediator && contractData.mediator.publicKey) {
        mediatorPubkey = new PublicKey(contractData.mediator.publicKey);
      }

      // Handle expiry date
      let expiryTimestamp = null;
      if (contractData.expiryDate) {
        expiryTimestamp = new anchor.BN(Math.floor(new Date(contractData.expiryDate).getTime() / 1000));
      }

      // Calculate document hash
      const documentHash = this.calculateDocumentHash(contractData);

      // Debug logging
      console.log('🔍 Contract creation parameters:');
      console.log('  documentHash:', documentHash);
      console.log('  title:', contractData.title);
      console.log('  partyPublicKeys:', partyPublicKeys);
      console.log('  mediatorPubkey:', mediatorPubkey);
      console.log('  expiryTimestamp:', expiryTimestamp);

      // Create the transaction instruction
      const instruction = await this.program.methods
        .createContract(
          documentHash,
          contractData.title,
          partyPublicKeys,
          mediatorPubkey,
          expiryTimestamp,
          new anchor.BN(contractValueLamports) // Add the missing contract value parameter
        )
        .accounts({
          contract: contractAccount.publicKey,
          creator: new PublicKey(userPublicKey),
          platformFeeRecipient: this.platformFeeRecipient,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();
      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(userPublicKey);

      // Note: Contract account doesn't need to sign since it's created with init constraint

      // Serialize transaction for frontend
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      return {
        success: true,
        serializedTransaction: Buffer.from(serializedTransaction).toString('base64'),
        contractAccount: contractAccount.publicKey.toString(),
        platformFee: platformFeeLamports / LAMPORTS_PER_SOL,
        contractValue: contractValueSOL
      };

    } catch (error) {
      console.error('Error preparing contract transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a contract on the Solana blockchain
   */
  async createContract(contractData, creatorKeypair) {
    try {
      // Generate a unique contract account
      const contractAccount = Keypair.generate();
      
      // Calculate contract value (default to 0.1 SOL if not provided)
      const contractValueSOL = contractData.contractValue || 0.1;
      const contractValueLamports = contractValueSOL * LAMPORTS_PER_SOL;

      // Calculate platform fee (0.1% of contract value)
      const platformFeeSOL = contractValueSOL * this.platformFeePercentage;
      const platformFeeLamports = Math.max(
        Math.min(platformFeeSOL * LAMPORTS_PER_SOL, 100_000_000), // Max 0.1 SOL
        1_000_000 // Min 0.001 SOL
      );
      
      // Prepare parties array for the contract
      const parties = contractData.parties.map(party => ({
        publicKey: new PublicKey(party.publicKey),
        name: party.name,
        email: party.email,
        hasSigned: false
      }));

      // Prepare document hash (combine contract data into a hash)
      const documentData = {
        contractId: contractData.contractId,
        title: contractData.title,
        description: contractData.description,
        agreementText: contractData.agreementText,
        structuredClauses: contractData.structuredClauses || [],
        parties: contractData.parties,
        useMediator: contractData.useMediator || false,
        mediator: contractData.mediator
      };
      const documentHash = require('crypto').createHash('sha256').update(JSON.stringify(documentData)).digest('hex');

      // Prepare parties as public keys only
      const partyPublicKeys = parties.map(party => party.publicKey);

      // Prepare mediator public key
      const mediatorPubkey = contractData.useMediator && contractData.mediator
        ? new PublicKey(contractData.mediator.publicKey || parties[0].publicKey) // Fallback to first party if no mediator pubkey
        : null;

      // Prepare expiry timestamp
      const expiryTimestamp = contractData.expiryDate
        ? Math.floor(contractData.expiryDate.getTime() / 1000)
        : null;

      // Create the contract on-chain with correct parameters
      const tx = await this.program.methods
        .createContract(
          documentHash,
          contractData.title,
          partyPublicKeys,
          mediatorPubkey,
          expiryTimestamp,
          new anchor.BN(contractValueLamports) // Add the missing contract value parameter
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
        platformFee: platformFeeLamports / LAMPORTS_PER_SOL,
        contractValue: contractValueSOL,
        party1FeePaid: true,
        party2FeePaid: false
      };

    } catch (error) {
      console.error('Error creating contract on Solana:', error);
      throw new Error(`Failed to create contract on blockchain: ${error.message}`);
    }
  }

  /**
   * Prepare a contract signing transaction for user signing (user pays fees)
   */
  async prepareSigningTransaction(contractAddress, userPublicKey) {
    try {
      const contractPubkey = new PublicKey(contractAddress);

      // Create the signing instruction
      const instruction = await this.program.methods
        .signContract()
        .accounts({
          contract: contractPubkey,
          signer: new PublicKey(userPublicKey),
          platformFeeRecipient: this.platformFeeRecipient,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();
      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(userPublicKey);

      // Serialize transaction for frontend
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      return {
        success: true,
        serializedTransaction: Buffer.from(serializedTransaction).toString('base64')
      };

    } catch (error) {
      console.error('Error preparing signing transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sign a contract on the Solana blockchain
   */
  async signContract(contractAddress, signerKeypair) {
    try {
      const contractPubkey = new PublicKey(contractAddress);

      // Include platform fee recipient for Party 2 fee collection
      const tx = await this.program.methods
        .signContract()
        .accounts({
          contract: contractPubkey,
          signer: signerKeypair.publicKey,
          platformFeeRecipient: this.platformFeeRecipient,
          systemProgram: SystemProgram.programId,
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
