const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');
let client = null;
async function connectRedis() {
  try {
    client = new Redis(env.redis.url, { retryStrategy: t => Math.min(t * 500, 5000), lazyConnect: true, enableOfflineQueue: true });
    await client.connect();
    logger.info('✅ Redis connected');
  } catch (err) { logger.warn('Redis not available (running without cache):', err.message); client = null; }
}
const getClient = () => client;
const getStatus = () => client ? (client.status === 'ready' ? 'connected' : client.status) : 'disconnected';
module.exports = { connectRedis, getClient, getStatus };
