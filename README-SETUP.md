# Digital Contract Platform - Setup Guide

This guide will help you set up and run the Digital Contract Platform on both Windows and Ubuntu/Linux systems.

## Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **MongoDB** (Optional - for local database) - [Download here](https://www.mongodb.com/try/download/community)

### Optional Software
- **Git** - For version control
- **Docker** - For containerized deployment

## Quick Start

### Windows

1. **Clone the repository** (if not already done):
   ```cmd
   git clone <repository-url>
   cd solana-contract
   ```

2. **Run the setup script**:
   ```cmd
   start-dev.bat
   ```

   This script will:
   - Check for Node.js and npm
   - Install dependencies for both frontend and backend
   - Create environment files from templates
   - Start both servers

### Ubuntu/Linux

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd solana-contract
   ```

2. **Make the script executable and run**:
   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

   This script will:
   - Check for Node.js and npm
   - Install dependencies for both frontend and backend
   - Create environment files from templates
   - Start both servers

## Manual Setup

If you prefer to set up manually or the scripts don't work:

### 1. Install Dependencies

**Frontend dependencies:**
```bash
npm install
```

**Backend dependencies:**
```bash
cd backend
npm install
cd ..
```

### 2. Environment Configuration

**Frontend (.env.local):**
```env
VITE_API_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:3001
VITE_SOLANA_CLUSTER=devnet
```

**Backend (backend/.env.local):**
```env
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://admin:password123@localhost:27017/digital_contracts?authSource=admin
SOLANA_CLUSTER=devnet
PLATFORM_FEE_RECIPIENT_PRIVATE_KEY=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]
RESEND_API_KEY=your_resend_api_key_here
JWT_SECRET=dev_jwt_secret_change_in_production
SESSION_SECRET=dev_session_secret_change_in_production
CORS_ORIGIN=http://localhost:5173
```

### 3. Start the Servers

**Start Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Start Frontend (Terminal 2):**
```bash
npm run dev
```

## Access the Application

Once both servers are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## Troubleshooting

### Common Issues

1. **Port already in use**:
   - Change the PORT in backend/.env.local
   - Update VITE_API_URL in .env.local accordingly

2. **MongoDB connection error**:
   - Install MongoDB locally, or
   - Use a cloud MongoDB service (MongoDB Atlas)
   - Update MONGO_URI in backend/.env.local

3. **Environment variables not loaded**:
   - Ensure .env.local files exist in both root and backend directories
   - Restart the servers after creating/modifying environment files

4. **Dependencies installation fails**:
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and package-lock.json, then reinstall

### Platform-Specific Issues

**Windows:**
- Use Command Prompt or PowerShell
- Ensure Node.js is in your PATH
- Run as Administrator if permission issues occur

**Ubuntu/Linux:**
- Ensure script has execute permissions: `chmod +x start-dev.sh`
- Install Node.js via NodeSource if package manager version is outdated
- Use `sudo` if permission issues occur

## Development Notes

- The application uses Solana Devnet by default (free test SOL)
- MongoDB is optional - the app will warn but continue without it
- Email notifications require a valid RESEND_API_KEY
- IPFS is optional for file storage

## Production Deployment

For production deployment, see:
- `DEPLOYMENT.md` - General deployment guide
- `docker-compose.production.yml` - Docker deployment
- `scripts/deploy-production.sh` - Production deployment script
