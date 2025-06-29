// Development configuration and sample data
export const isDevelopment = import.meta.env.DEV;

// Sample Solana public keys for development (these are test keys, not real wallets)
export const DEV_SAMPLE_KEYS = {
  party1: "11111111111111111111111111111111",
  party2: "22222222222222222222222222222222",
  mediator: "33333333333333333333333333333333",
  additional1: "44444444444444444444444444444444",
  additional2: "55555555555555555555555555555555"
};

// Sample contract data for development
export const DEV_SAMPLE_CONTRACT = {
  contractTitle: "Sample Service Agreement",
  contractDescription: "A comprehensive service agreement between two parties for software development services",
  agreementText: `This Service Agreement ("Agreement") is entered into between the parties listed below for the provision of software development services.

SCOPE OF WORK:
The service provider agrees to develop a web application according to the specifications provided by the client.

PAYMENT TERMS:
Payment shall be made in installments as follows:
- 30% upon signing this agreement
- 40% upon completion of development phase
- 30% upon final delivery and acceptance

TIMELINE:
The project shall be completed within 90 days from the signing of this agreement.

INTELLECTUAL PROPERTY:
All intellectual property rights shall be transferred to the client upon full payment.

TERMINATION:
Either party may terminate this agreement with 30 days written notice.`,
  
  structuredClauses: [
    "Service provider will deliver high-quality code following industry best practices",
    "Client will provide timely feedback and necessary resources",
    "All communications will be conducted professionally and promptly",
    "Any changes to scope must be agreed upon in writing",
    "Confidentiality must be maintained by both parties"
  ],
  
  party1Name: "Alice Johnson",
  party1Email: "rajus9231@gmail.com",
  party1PublicKey: DEV_SAMPLE_KEYS.party1,
  
  party2Name: "Bob Smith",
  party2Email: "rajus9231@gmail.com",
  party2PublicKey: DEV_SAMPLE_KEYS.party2,
  
  mediatorName: "Carol Wilson",
  mediatorEmail: "carol.wilson@mediation.com",
  
  useMediator: false,
  acceptedTerms: true,
  expiryDate: null
};

// Additional sample parties for testing
export const DEV_ADDITIONAL_PARTIES = [
  {
    name: "David Brown",
    email: "david.brown@company.com",
    publicKey: DEV_SAMPLE_KEYS.additional1
  },
  {
    name: "Emma Davis",
    email: "emma.davis@business.com", 
    publicKey: DEV_SAMPLE_KEYS.additional2
  }
];

// Development utilities
export const DEV_UTILS = {
  // Auto-fill form with sample data
  autoFillContract: () => DEV_SAMPLE_CONTRACT,
  
  // Get random sample public key
  getRandomPublicKey: () => {
    const keys = Object.values(DEV_SAMPLE_KEYS);
    return keys[Math.floor(Math.random() * keys.length)];
  },
  
  // Generate sample contract ID for testing
  generateSampleContractId: () => {
    return 'dev_' + Math.random().toString(36).substr(2, 16);
  },
  
  // Sample contract lookup data
  getSampleContractLookup: () => ({
    contractId: 'dev_sample_contract_123',
    contractTitle: 'Sample Development Contract',
    contractDescription: 'A sample contract for testing purposes',
    status: 'active',
    parties: [
      { name: 'Alice Johnson', email: 'alice@test.com', publicKey: DEV_SAMPLE_KEYS.party1, hasSigned: false },
      { name: 'Bob Smith', email: 'bob@test.com', publicKey: DEV_SAMPLE_KEYS.party2, hasSigned: false }
    ],
    agreementText: 'This is a sample agreement for development testing.',
    createdAt: new Date().toISOString(),
    documentHash: 'sample_hash_123456789'
  })
};

// Environment check helper
export const getDevConfig = () => {
  if (!isDevelopment) {
    return null;
  }
  
  return {
    sampleData: DEV_SAMPLE_CONTRACT,
    additionalParties: DEV_ADDITIONAL_PARTIES,
    utils: DEV_UTILS,
    autoFillEnabled: true
  };
};
