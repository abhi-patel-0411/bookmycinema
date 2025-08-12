# MongoDB Atlas Setup Documentation

## 📋 Table of Contents
1. [MongoDB Atlas Account Setup](#mongodb-atlas-account-setup)
2. [Cluster Configuration](#cluster-configuration)
3. [Database User Setup](#database-user-setup)
4. [Network Access Configuration](#network-access-configuration)
5. [Connection String Setup](#connection-string-setup)
6. [Files to Modify](#files-to-modify)
7. [Environment Variables](#environment-variables)
8. [Testing Connection](#testing-connection)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 MongoDB Atlas Account Setup

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Sign Up"
3. Create account with email or Google/GitHub
4. Verify your email address
5. Complete the welcome questionnaire

### Step 2: Create Organization (Optional)
1. Click "Create Organization"
2. Enter organization name: `BookMyCinema`
3. Add team members if needed
4. Set billing preferences

---

## 🏗 Cluster Configuration

### Step 1: Create New Cluster
1. Click "Build a Database"
2. Choose deployment option:
   - **Shared (Free)** - M0 Sandbox (512 MB storage)
   - **Dedicated** - For production use
   - **Serverless** - Pay per operation

### Step 2: Configure Cluster Settings
```
Cluster Name: bookmycinema-cluster
Cloud Provider: AWS (recommended)
Region: Choose closest to your users
  - US East (N. Virginia) us-east-1
  - Europe (Ireland) eu-west-1
  - Asia Pacific (Mumbai) ap-south-1
Cluster Tier: M0 Sandbox (Free)
Additional Settings: Keep defaults
```

### Step 3: Create Cluster
1. Click "Create Cluster"
2. Wait 3-5 minutes for cluster creation
3. Cluster will show "Active" status when ready

---

## 👤 Database User Setup

### Step 1: Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Configure user:
```
Authentication Method: Password
Username: bookmycinema-user
Password: Generate secure password (save it!)
Database User Privileges: Read and write to any database
```

### Step 2: User Configuration
```javascript
// Recommended user setup
Username: bookmycinema-admin
Password: [Generate strong password - save securely]
Built-in Role: Atlas admin
Restrict Access: No restrictions (for development)
```

### Step 3: Save User Credentials
```
Username: bookmycinema-admin
Password: [Your generated password]
```
**⚠️ Important: Save these credentials securely!**

---

## 🌐 Network Access Configuration

### Step 1: Configure IP Whitelist
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"

### Step 2: Development Setup
```
Access List Entry: 0.0.0.0/0
Comment: Allow access from anywhere (development only)
```
**⚠️ Warning: This allows access from any IP. Use specific IPs for production.**

### Step 3: Production Setup (Recommended)
```
Access List Entry: [Your server IP]
Comment: Production server access
```

### Step 4: Add Multiple IPs
- Your development machine IP
- Production server IP
- CI/CD pipeline IPs
- Team member IPs

---

## 🔗 Connection String Setup

### Step 1: Get Connection String
1. Go to "Clusters" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select driver: "Node.js" version "4.1 or later"

### Step 2: Connection String Format
```
mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority
```

### Step 3: Your Specific Connection String
```
mongodb+srv://bookmycinema-admin:<password>@bookmycinema-cluster.xxxxx.mongodb.net/bookmycinema?retryWrites=true&w=majority
```

Replace:
- `<password>` with your database user password
- `xxxxx` with your actual cluster identifier
- `bookmycinema` with your database name

---

## 📁 Files to Modify

### 1. Backend Environment Files

#### File: `backend/.env`
```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://bookmycinema-admin:YOUR_PASSWORD@bookmycinema-cluster.xxxxx.mongodb.net/bookmycinema?retryWrites=true&w=majority

# Alternative for local development
# MONGODB_URI=mongodb://localhost:27017/bookmycinema

# Other environment variables
JWT_SECRET=your_jwt_secret_key_here
CLERK_SECRET_KEY=your_clerk_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
PORT=5000
FRONTEND_URL=http://localhost:3000
```

#### File: `backend/.env.production`
```env
# Production MongoDB Atlas
MONGODB_URI=mongodb+srv://bookmycinema-admin:PRODUCTION_PASSWORD@bookmycinema-cluster.xxxxx.mongodb.net/bookmycinema-prod?retryWrites=true&w=majority

# Production environment variables
JWT_SECRET=production_jwt_secret
CLERK_SECRET_KEY=production_clerk_secret
STRIPE_SECRET_KEY=production_stripe_secret
EMAIL_USER=production_email@domain.com
EMAIL_PASS=production_email_password
PORT=10000
FRONTEND_URL=https://your-domain.com
```

#### File: `backend/.env.example`
```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_jwt_secret_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Payment
STRIPE_SECRET_KEY=your_stripe_secret_key

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 2. Server Configuration

#### File: `backend/server.js` (No changes needed)
The current server.js already uses `process.env.MONGODB_URI` which will work with Atlas:

```javascript
// MongoDB Connection (already configured correctly)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    console.log("📊 Database:", mongoose.connection.name);
    // ... rest of the connection logic
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
```

### 3. Package.json Scripts (Optional Enhancement)

#### File: `backend/package.json`
Add database-related scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js",
    "db:connect": "node -e \"require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected to Atlas')).catch(console.error)\"",
    "db:status": "node -e \"require('mongoose').connect(process.env.MONGODB_URI).then(() => {console.log('Database:', require('mongoose').connection.name); process.exit(0);}).catch(console.error)\""
  }
}
```

### 4. Database Connection Utility (Optional)

#### File: `backend/config/database.js` (Create new file)
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### 5. Deployment Configuration

#### File: `backend/render.yaml` (Update if exists)
```yaml
services:
  - type: web
    name: bookmycinema-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CLERK_SECRET_KEY
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
```

---

## 🔧 Environment Variables

### Development Environment
```bash
# In backend/.env
MONGODB_URI=mongodb+srv://bookmycinema-admin:DEV_PASSWORD@bookmycinema-cluster.xxxxx.mongodb.net/bookmycinema-dev?retryWrites=true&w=majority
```

### Production Environment
```bash
# In production deployment
MONGODB_URI=mongodb+srv://bookmycinema-admin:PROD_PASSWORD@bookmycinema-cluster.xxxxx.mongodb.net/bookmycinema-prod?retryWrites=true&w=majority
```

### Environment-Specific Databases
- **Development**: `bookmycinema-dev`
- **Testing**: `bookmycinema-test`
- **Production**: `bookmycinema-prod`

---

## 🧪 Testing Connection

### 1. Test Connection Script
Create `backend/test-connection.js`:
```javascript
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    console.log('📍 Connection URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🏠 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

### 2. Run Connection Test
```bash
cd backend
node test-connection.js
```

### 3. Expected Output
```
🔄 Testing MongoDB Atlas connection...
📍 Connection URI: mongodb+srv://***:***@bookmycinema-cluster.xxxxx.mongodb.net/bookmycinema?retryWrites=true&w=majority
✅ Successfully connected to MongoDB Atlas!
📊 Database: bookmycinema
🏠 Host: bookmycinema-cluster-shard-00-02.xxxxx.mongodb.net
🔌 Port: 27017
📁 Collections: ['movies', 'theaters', 'shows', 'bookings', 'users']
🔌 Disconnected from MongoDB Atlas
```

---

## 🔒 Security Best Practices

### 1. Password Security
- Use strong, unique passwords
- Store passwords in environment variables
- Never commit passwords to version control
- Rotate passwords regularly

### 2. Network Security
```javascript
// Recommended IP whitelist for production
Production Server IP: xxx.xxx.xxx.xxx/32
Office Network: xxx.xxx.xxx.0/24
CI/CD Pipeline: xxx.xxx.xxx.xxx/32
```

### 3. Database Security
- Create separate users for different environments
- Use principle of least privilege
- Enable database auditing
- Regular security updates

### 4. Connection Security
```javascript
// Enhanced connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  ssl: true,
  sslValidate: true
};
```

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Connection Timeout
```
Error: MongooseServerSelectionError: connection timed out
```
**Solutions:**
- Check network access whitelist
- Verify internet connection
- Check firewall settings
- Verify cluster is active

#### 2. Authentication Failed
```
Error: Authentication failed
```
**Solutions:**
- Verify username and password
- Check user permissions
- Ensure user exists in correct database
- Check for special characters in password

#### 3. Database Not Found
```
Error: Database not found
```
**Solutions:**
- Database is created automatically on first write
- Check database name in connection string
- Verify user has access to database

#### 4. IP Not Whitelisted
```
Error: IP address not allowed
```
**Solutions:**
- Add your IP to Atlas whitelist
- Use 0.0.0.0/0 for development (not recommended for production)
- Check current IP address

### Debug Connection Issues
```javascript
// Add to server.js for debugging
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB Atlas');
});
```

---

## 📊 Monitoring and Maintenance

### 1. Atlas Monitoring
- Monitor connection metrics
- Set up alerts for high usage
- Track query performance
- Monitor storage usage

### 2. Database Maintenance
- Regular backups (automatic in Atlas)
- Index optimization
- Query performance analysis
- Storage cleanup

### 3. Cost Optimization
- Monitor data transfer costs
- Optimize queries
- Use appropriate cluster tier
- Regular usage review

---

## 🚀 Next Steps After Setup

1. **Test the connection** using the test script
2. **Run your application** and verify data operations
3. **Set up monitoring** in Atlas dashboard
4. **Configure backups** (automatic in Atlas)
5. **Set up alerts** for important metrics
6. **Document your setup** for team members

---

This documentation provides complete setup instructions for MongoDB Atlas integration with your BookMyCinema project. Follow these steps carefully and test thoroughly before deploying to production.