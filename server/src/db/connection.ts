import dns from 'dns';
import mongoose from 'mongoose';
import { config } from '../config/env.js';

// Resolve MongoDB Atlas SRV records reliably even if local DNS rejects SRV lookups (ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', (e as Error).message);
}

let isConnected = false;
let isInMemoryFallback = !config.mongoUri;

export async function connectDB(): Promise<boolean> {
  if (isConnected) return true;

  if (!config.mongoUri) {
    console.warn('⚠️ [MongoDB] MONGODB_URI not set. Running in resilient In-Memory Store mode for development.');
    isInMemoryFallback = true;
    return false;
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      dbName: 'stratiq_db',
      serverSelectionTimeoutMS: 10000,
      autoIndex: true
    });
    isConnected = true;
    isInMemoryFallback = false;
    console.log(`✅ [MongoDB] Connected successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return true;
  } catch (error) {
    console.error('❌ [MongoDB] Connection error:', (error as Error).message);
    console.warn('⚠️ [MongoDB] Switching to In-Memory Store fallback to keep application fully functional.');
    isInMemoryFallback = true;
    return false;
  }
}

export function isUsingFallbackStore(): boolean {
  if (!config.mongoUri) return true;
  return isInMemoryFallback;
}
