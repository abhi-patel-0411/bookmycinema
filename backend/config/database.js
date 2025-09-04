// Shared database configuration for cross-environment seat locking
const getDatabaseConfig = () => {
  // Use the same production database for both localhost and deployed environments
  // This ensures seat locks are shared across all instances
  const SHARED_DB_URI = process.env.MONGODB_URI || process.env.SHARED_MONGODB_URI;
  
  if (!SHARED_DB_URI) {
    console.warn('⚠️ No shared database URI found. Seat locking may not work across environments.');
  }
  
  return {
    uri: SHARED_DB_URI,
    options: {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5
    }
  };
};

module.exports = { getDatabaseConfig };