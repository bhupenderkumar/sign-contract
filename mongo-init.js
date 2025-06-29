// MongoDB initialization script
db = db.getSiblingDB('digital_contracts');

// Create collections
db.createCollection('contracts');
db.createCollection('users');

// Create indexes for better performance
db.contracts.createIndex({ "contractId": 1 }, { unique: true });
db.contracts.createIndex({ "documentHash": 1 });
db.contracts.createIndex({ "parties.publicKey": 1 });
db.contracts.createIndex({ "parties.email": 1 });
db.contracts.createIndex({ "status": 1, "createdAt": -1 });
db.contracts.createIndex({ "expiryDate": 1 });
db.contracts.createIndex({ "solanaTransactionId": 1 });
db.contracts.createIndex({ "solanaContractAddress": 1 });

db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "publicKey": 1 }, { unique: true });
db.users.createIndex({ "status": 1 });
db.users.createIndex({ "stats.lastActivity": -1 });

// Insert sample data for development
db.users.insertMany([
  {
    name: "Alice Johnson",
    email: "rajus9231@gmail.com",
    publicKey: "11111111111111111111111111111111",
    organization: "Tech Corp",
    status: "active",
    stats: {
      contractsCreated: 5,
      contractsSigned: 12,
      contractsCompleted: 10,
      totalFeePaid: 0.05,
      lastActivity: new Date()
    },
    preferences: {
      emailNotifications: {
        contractCreated: true,
        contractSigned: true,
        contractCompleted: true,
        contractExpiring: true,
        contractDisputed: true
      },
      language: "en",
      timezone: "UTC"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Bob Smith",
    email: "rajus9231@gmail.com",
    publicKey: "22222222222222222222222222222222",
    organization: "Design Studio",
    status: "active",
    stats: {
      contractsCreated: 3,
      contractsSigned: 8,
      contractsCompleted: 7,
      totalFeePaid: 0.03,
      lastActivity: new Date()
    },
    preferences: {
      emailNotifications: {
        contractCreated: true,
        contractSigned: true,
        contractCompleted: true,
        contractExpiring: true,
        contractDisputed: false
      },
      language: "en",
      timezone: "UTC"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Database initialized successfully with indexes and sample data');
