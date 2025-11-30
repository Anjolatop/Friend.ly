import { Pool } from 'pg';
import { createClient } from 'redis';

// PostgreSQL connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://friendly:friendly_password@localhost:5432/friendly',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Redis connection
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
};

export const disconnectRedis = async () => {
  try {
    await redisClient.disconnect();
    console.log('Disconnected from Redis');
  } catch (error) {
    console.error('Failed to disconnect from Redis:', error);
  }
};

// Database initialization
export const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // Read and execute schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('Database schema initialized');
    
    client.release();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

