require('dotenv').config();
const env = {
  telegram: {
    token:      process.env.TELEGRAM_TOKEN,
    adminId:    parseInt(process.env.ADMIN_TELEGRAM_ID || '0'),
    username:   process.env.BOT_USERNAME || 'Yuvorai_bot',
    webhookUrl: process.env.WEBHOOK_URL  || null,
  },
  db:    { uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/yuvorai' },
  redis: { url: process.env.REDIS_URL   || 'redis://localhost:6379' },
  ai: {
    groqKey:   process.env.GROQ_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
  },
  adzuna: { appId: process.env.ADZUNA_APP_ID, key: process.env.ADZUNA_APP_KEY },
  payment: {
    upiId:   process.env.UPI_ID   || 'yuvorai@ybl',
    upiName: process.env.UPI_NAME || 'YuvorAI',
    qrUrl:   process.env.QR_IMAGE_URL || '',
  },
  app: {
    port:       parseInt(process.env.PORT || '3000'),
    env:        process.env.NODE_ENV || 'development',
    websiteUrl: process.env.WEBSITE_URL || 'https://yuvorai-website.vercel.app',
  },
  limits: {
    free:     { ai: 3,   roast: 1,  opps: 5,  interview: 0,  dsa: 1  },
    trial:    { ai: 10,  roast: 5,  opps: 15, interview: 1,  dsa: 3  },
    pro:      { ai: 30,  roast: -1, opps: 50, interview: 3,  dsa: -1 },
    elite:    { ai: 100, roast: -1, opps: -1, interview: -1, dsa: -1 },
    advanced: { ai: -1,  roast: -1, opps: -1, interview: -1, dsa: -1 },
  },
};
if (!env.telegram.token) { console.error('❌ TELEGRAM_TOKEN missing in .env'); process.exit(1); }
module.exports = env;
