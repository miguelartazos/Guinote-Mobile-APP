import { createClient } from 'redis';

let redisClient;

export async function connectRedis() {
  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = createClient({ url });

    redisClient.on('error', err => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}
