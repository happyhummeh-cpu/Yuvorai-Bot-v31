const { getStatus: dbStatus } = require('../config/database');
const { getStatus: redisStatus } = require('../config/redis');

async function statusShow(ctx) {
  const db    = dbStatus();
  const redis = redisStatus();
  const uptime = Math.floor(process.uptime());
  const mem    = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  await ctx.reply(
`⚙️ *YuvorAI — System Status*
━━━━━━━━━━━━━━━━━━
🟢 Bot: Online
${db === 'connected' ? '🟢' : '🔴'} Database: ${db}
${redis === 'connected' ? '🟢' : '🟡'} Cache: ${redis}
━━━━━━━━━━━━━━━━━━
⏱️ Uptime: ${Math.floor(uptime/3600)}h ${Math.floor((uptime%3600)/60)}m
💾 Memory: ${mem} MB
🕐 IST: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
━━━━━━━━━━━━━━━━━━
_Sab theek hai bhai!_ ✅`, { parse_mode: 'Markdown' }
  );
}
module.exports = { statusShow };
