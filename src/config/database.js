const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');
let connected = false;
async function connectDB() {
  if (connected) return;
  try {
    await mongoose.connect(env.db.uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    connected = true;
    logger.info('✅ MongoDB connected');
    mongoose.connection.on('error', err => logger.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => { connected = false; setTimeout(connectDB, 5000); });
  } catch (err) { logger.error('MongoDB failed:', err.message); throw err; }
}
const getStatus = () => mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
module.exports = { connectDB, getStatus };
