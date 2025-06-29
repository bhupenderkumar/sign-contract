# 🚀 Digital Contract Platform - Complete Deployment Guide

This guide provides step-by-step instructions for deploying the Digital Contract Platform from development to production.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+ recommended) or macOS
- **Node.js**: Version 18 or higher
- **Docker**: Version 20.10+ with Docker Compose
- **Git**: Latest version
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Storage**: Minimum 20GB free space

### Required Tools
```bash
# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🔧 Development Setup

### 1. Clone and Initial Setup
```bash
# Clone the repository
git clone <your-repository-url>
cd sign-contract

# Make scripts executable
chmod +x scripts/*.sh

# Run the automated setup
./scripts/setup-development.sh
```

### 2. Manual Development Setup (Alternative)

If the automated script fails, follow these manual steps:

```bash
# 1. Environment Configuration
cp .env.example .env
cp .env.example backend/.env

# 2. Install Dependencies
npm install
cd backend && npm install && cd ..

# 3. Start Database Services
docker-compose up -d mongodb redis ipfs

# 4. Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 5. Install Anchor CLI (requires Rust)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest && avm use latest

# 6. Configure Solana
solana config set --url https://api.devnet.solana.com
solana-keygen new --no-bip39-passphrase
solana airdrop 2

# 7. Deploy Smart Contract
./scripts/deploy-contract.sh

# 8. Start Development Servers
cd backend && npm run dev &
npm run dev
```

## 🌐 Production Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx certbot python3-certbot-nginx

# Create application user
sudo useradd -m -s /bin/bash digitalcontract
sudo usermod -aG docker digitalcontract
```

### 2. Application Deployment

```bash
# Switch to application user
sudo su - digitalcontract

# Clone repository
git clone <your-repository-url>
cd sign-contract

# Set production environment
cp .env.example .env
# Edit .env with production values:
# - Set NODE_ENV=production
# - Configure production MongoDB URI
# - Set secure JWT secrets
# - Configure email settings

# Deploy to production
./scripts/deploy-production.sh
```

### 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/digitalcontract
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL Certificate Setup

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/digitalcontract /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔗 Solana Smart Contract Deployment

### 1. Devnet Deployment (Development)

```bash
# Set to devnet
solana config set --url https://api.devnet.solana.com

# Deploy contract
cd solana-contract/digital_contract
anchor build
anchor deploy --provider.cluster devnet

# Test deployment
anchor test --skip-local-validator
```

### 2. Mainnet Deployment (Production)

```bash
# Set to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Ensure sufficient SOL for deployment
solana balance
# If needed: solana transfer <amount> <your-address> --from <funded-keypair>

# Deploy to mainnet
anchor deploy --provider.cluster mainnet-beta

# Update environment variables
# Set SOLANA_CLUSTER=mainnet-beta in production .env
```

## 📊 Database Setup

### 1. Development (Docker)
```bash
# Start MongoDB with Docker
docker-compose up -d mongodb

# Access MongoDB shell
docker exec -it digital_contract_mongodb mongosh -u admin -p password123
```

### 2. Production (MongoDB Atlas or Self-hosted)

#### MongoDB Atlas (Recommended)
1. Create account at https://cloud.mongodb.com
2. Create cluster
3. Configure network access
4. Create database user
5. Get connection string
6. Update MONGO_URI in production .env

#### Self-hosted MongoDB
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB
sudo mongo
> use admin
> db.createUser({user:"admin", pwd:"secure_password", roles:["root"]})
> exit

# Enable authentication
sudo nano /etc/mongod.conf
# Add: security: authorization: enabled
sudo systemctl restart mongod
```

## 🔐 Security Configuration

### 1. Environment Variables
```bash
# Generate secure secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For SESSION_SECRET

# Platform fee recipient keypair
solana-keygen new --outfile platform-fee-keypair.json --no-bip39-passphrase
# Copy the array from the JSON file to PLATFORM_FEE_RECIPIENT_PRIVATE_KEY
```

### 2. Firewall Configuration
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. Application Security
- Use HTTPS only in production
- Set secure session cookies
- Enable CORS only for trusted domains
- Use rate limiting
- Regular security updates

## 📈 Monitoring and Maintenance

### 1. Health Checks
```bash
# Backend health
curl https://your-domain.com/api/health

# Database connection
docker exec digital_contract_mongodb mongosh --eval "db.adminCommand('ping')"

# Smart contract status
solana program show <PROGRAM_ID> --url mainnet-beta
```

### 2. Logs
```bash
# Application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### 3. Backup Strategy
```bash
# Database backup
docker exec digital_contract_mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/digital_contracts?authSource=admin" --out=/backup

# Application backup
tar -czf app-backup-$(date +%Y%m%d).tar.gz /home/digitalcontract/sign-contract
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 3001, 5173, 27017 are available
2. **Permission errors**: Ensure proper file permissions and user groups
3. **Memory issues**: Monitor RAM usage, consider upgrading server
4. **SSL certificate issues**: Check domain DNS and certificate validity
5. **Smart contract deployment fails**: Ensure sufficient SOL balance

### Debug Commands
```bash
# Check running services
docker-compose ps
sudo systemctl status nginx
sudo systemctl status mongod

# Check ports
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :5173

# Check logs
docker-compose logs backend
tail -f /var/log/nginx/error.log
```

## 📞 Support

For deployment issues:
1. Check logs first
2. Verify all prerequisites are met
3. Ensure environment variables are correctly set
4. Test each component individually
5. Contact support with specific error messages

## 🎉 Success Verification

After deployment, verify:
- [ ] Frontend loads at https://your-domain.com
- [ ] Backend API responds at https://your-domain.com/api/health
- [ ] Database connection works
- [ ] Wallet connection functions
- [ ] Contract creation and signing work
- [ ] SSL certificate is valid
- [ ] All services start automatically on reboot

Your Digital Contract Platform is now live! 🚀
