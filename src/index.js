
const express = require('express');

const path = require('path');

const { connectDB } = require('./config/database');

const { connectRedis } = require('./config/redis');

const logger = require('./config/logger');

const env = require('./config/env');

const { bot, setWebhook } = require('./bot');

const apiRoutes = require('./api/api.routes');

const { startOppsJob } = require('./jobs/opportunities.job');

const { startDigestJob } = require('./jobs/digest.job');

const { startStreakJob } = require('./jobs/streak.job');

const app = express();

app.use((req, res, next) => {

  res.header('Access-Control-Allow-Origin', '*');

  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');

  res.header('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.sendStatus(200);

  next();

});

app.use(express.json());

app.locals.bot = bot;

app.use('/api', apiRoutes);

app.use('/dashboard', express.static(path.join(__dirname, '../dashboard')));

app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../dashboard/yuvorai-dashboard.html')));

app.get('/health', (_, res) => res.json({ status: 'ok', uptime: Math.floor(process.uptime()) }));

async function main() {

  logger.info(' YuvorAI starting...');

  await connectDB();

  await connectRedis();

  if (env.telegram.webhookUrl) {

    app.use(bot.webhookCallback('/telegram-webhook'));

    await setWebhook();

  }

  startOppsJob();

  startDigestJob();

  startStreakJob();

  app.listen(env.app.port, '0.0.0.0', () => logger.info(`Server: http://localhost:${env.app.port}`));

}

main().catch(logger.error);

