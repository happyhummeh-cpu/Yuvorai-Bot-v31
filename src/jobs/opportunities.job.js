// ── Daily Opportunity Fetch — runs at 6:00 AM IST ────────────────────────────
const cron = require('node-cron');
const { fetchAndSave } = require('../modules/opportunities/opportunities.service');
const logger = require('../config/logger');

function startOppsJob() {
  // 6:00 AM IST = 00:30 UTC
  cron.schedule('30 0 * * *', async () => {
    logger.info('🔄 Fetching fresh opportunities (6 AM IST)...');
    try {
      const n = await fetchAndSave();
      logger.info(`✅ ${n} opportunities saved/updated`);
    } catch (err) {
      logger.error('Opportunities job failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  logger.info('📡 Opportunities job scheduled (6:00 AM IST daily)');
}

module.exports = { startOppsJob };
