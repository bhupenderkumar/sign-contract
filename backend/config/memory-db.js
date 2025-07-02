// Simple in-memory database fallback for development
class MemoryDatabase {
  constructor() {
    this.contracts = new Map();
    this.users = new Map();
    this.connected = false;
  }

  connect() {
    this.connected = true;
    console.log('✅ Memory Database connected (fallback mode)');
    console.log('⚠️ Note: Data will be lost when server restarts');
    return Promise.resolve();
  }

  disconnect() {
    this.connected = false;
    this.contracts.clear();
    this.users.clear();
    console.log('🔌 Memory Database disconnected');
    return Promise.resolve();
  }

  isConnected() {
    return this.connected;
  }

  // Contract operations
  saveContract(contract) {
    this.contracts.set(contract.contractId, { ...contract, _id: contract.contractId });
    return Promise.resolve(contract);
  }

  findContract(contractId) {
    const contract = this.contracts.get(contractId);
    return Promise.resolve(contract || null);
  }

  findContractsByUser(publicKey) {
    const contracts = Array.from(this.contracts.values()).filter(contract =>
      contract.parties && contract.parties.some(party => party.publicKey === publicKey)
    );
    return Promise.resolve(contracts);
  }

  updateContract(contractId, updates) {
    const contract = this.contracts.get(contractId);
    if (contract) {
      const updated = { ...contract, ...updates };
      this.contracts.set(contractId, updated);
      return Promise.resolve(updated);
    }
    return Promise.resolve(null);
  }

  // User operations
  saveUser(user) {
    this.users.set(user.publicKey, { ...user, _id: user.publicKey });
    return Promise.resolve(user);
  }

  findUser(publicKey) {
    const user = this.users.get(publicKey);
    return Promise.resolve(user || null);
  }

  findUserByEmail(email) {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return Promise.resolve(user || null);
  }

  // Statistics
  getStats() {
    return {
      contracts: this.contracts.size,
      users: this.users.size,
      connected: this.connected
    };
  }
}

module.exports = new MemoryDatabase();
