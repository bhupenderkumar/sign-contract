import axios from 'axios';

// Test data matching the payload from the error
const testPayload = {
  "contractTitle": "Sample Service Agreement",
  "contractDescription": "A comprehensive service agreement between two parties for software development services",
  "agreementText": "This Service Agreement (\"Agreement\") is entered into between the parties listed below for the provision of software development services.\n\nSCOPE OF WORK:\nThe service provider agrees to develop a web application according to the specifications provided by the client.\n\nPAYMENT TERMS:\nPayment shall be made in installments as follows:\n- 30% upon signing this agreement\n- 40% upon completion of development phase\n- 30% upon final delivery and acceptance\n\nTIMELINE:\nThe project shall be completed within 90 days from the signing of this agreement.\n\nINTELLECTUAL PROPERTY:\nAll intellectual property rights shall be transferred to the client upon full payment.\n\nTERMINATION:\nEither party may terminate this agreement with 30 days written notice.",
  "structuredClauses": [
    "Service provider will deliver high-quality code following industry best practices",
    "Client will provide timely feedback and necessary resources",
    "All communications will be conducted professionally and promptly",
    "Any changes to scope must be agreed upon in writing",
    "Confidentiality must be maintained by both parties"
  ],
  "party1Name": "Alice Johnson",
  "party1Email": "alice.johnson@example.com",
  "party1PublicKey": "BcSXav3jcBKRbN6woZsqPMJGYrS2MXwVEdtUx1ZzD9Xo",
  "party1Signature": "ke9woIcQwCzJGxkGWsqe7HjtngPXSizx+rw6Qz1qJW+hNUIKNYutggskYPywwvYnNfe6GiTBpZJKOYuDxmS2DQ==",
  "party1Message": "Digital Contract CREATE\n\nContract ID: contract_1751518476995\nTimestamp: 1751518476995\n\nBy signing this message, you confirm your intent to create this contract.",
  "party2Name": "Bob Smith",
  "party2Email": "bob.smith@example.com",
  "party2PublicKey": "BcSXav3jcBKRbN6woZsqPMJGYrS2MXwVEdtUx1ZzD9Xo",
  "additionalParties": [],
  "useMediator": false,
  "expiryDate": null,
  "contractValue": 0.1
};

async function testContractCreation() {
  try {
    console.log('🧪 Testing contract creation with the problematic payload...');
    
    const response = await axios.post('http://localhost:3001/api/contracts/prepare-transaction', testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Contract creation successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Contract creation failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test server health first
async function testServerHealth() {
  try {
    console.log('🏥 Testing server health...');
    const response = await axios.get('http://localhost:3001/api/health', { timeout: 5000 });
    console.log('✅ Server is healthy:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting contract creation tests...\n');
  
  const isHealthy = await testServerHealth();
  if (!isHealthy) {
    console.log('❌ Server is not running or not healthy. Please start the backend server first.');
    return;
  }
  
  console.log('');
  await testContractCreation();
}

runTests();
