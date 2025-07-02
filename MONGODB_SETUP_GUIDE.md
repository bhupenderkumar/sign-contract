# MongoDB Setup Guide

Your MongoDB is not working because it's not installed or not running. Here are your options:

## 🚀 Option 1: Install MongoDB Locally (Recommended)

### For Windows:
1. **Download MongoDB Community Server:**
   - Go to: https://www.mongodb.com/try/download/community
   - Select "Windows" and "msi" package
   - Download the installer

2. **Install MongoDB:**
   - Run the downloaded .msi file
   - Choose "Complete" installation
   - ✅ **Check "Install MongoDB as a Service"**
   - ✅ **Check "Install MongoDB Compass"** (GUI tool)

3. **Start MongoDB:**
   - MongoDB should start automatically as a Windows service
   - If not, open Command Prompt as Administrator:
   ```cmd
   net start MongoDB
   ```

4. **Verify Installation:**
   ```cmd
   mongod --version
   mongosh
   ```

### For Ubuntu/Linux:
```bash
# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## ☁️ Option 2: Use MongoDB Atlas (Cloud) - Easiest!

1. **Sign up for MongoDB Atlas:**
   - Go to: https://www.mongodb.com/atlas
   - Create a free account

2. **Create a Cluster:**
   - Choose "Build a Database"
   - Select "M0 Sandbox" (FREE)
   - Choose your preferred region
   - Create cluster

3. **Create Database User:**
   - Go to "Database Access"
   - Add new database user
   - Choose username/password authentication
   - Remember your credentials!

4. **Configure Network Access:**
   - Go to "Network Access"
   - Add IP Address
   - Choose "Allow access from anywhere" (0.0.0.0/0) for development

5. **Get Connection String:**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string

6. **Update your .env file:**
   ```env
   MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/digital_contracts?retryWrites=true&w=majority
   ```

---

## 🔧 Option 3: Quick Scripts

### Run the setup script:
```cmd
start-backend.bat
```

### Test MongoDB connection:
```cmd
cd backend
node test-mongodb.js
```

---

## 🐳 Option 4: Docker (If Docker is working)

If you can get Docker working, use the provided docker-compose:

```cmd
docker-compose up mongodb
```

---

## 🚨 Troubleshooting

### MongoDB Service Issues:
```cmd
# Check if MongoDB service exists
sc query MongoDB

# Start MongoDB service
net start MongoDB

# Stop MongoDB service
net stop MongoDB
```

### Connection Issues:
- Check if port 27017 is available
- Verify MongoDB is running: `tasklist | findstr mongod`
- Check MongoDB logs in: `C:\Program Files\MongoDB\Server\7.0\log\`

### Atlas Connection Issues:
- Verify username/password in connection string
- Check network access settings
- Ensure IP address is whitelisted

---

## 📝 Current Status

Run this to check your current MongoDB status:
```cmd
cd backend
node test-mongodb.js
```

---

## 🎯 Recommended Next Steps

1. **For Development:** Install MongoDB locally (Option 1)
2. **For Quick Start:** Use MongoDB Atlas (Option 2)
3. **For Testing:** Run `start-backend.bat` and choose option

After setting up MongoDB, your backend server should start successfully with:
```cmd
cd backend
npm run dev
```
