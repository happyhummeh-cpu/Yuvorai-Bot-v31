// ── 💀 How Cooked Are You? ────────────────────────────────────────────────────
const { Markup } = require('telegraf');
const ai = require('../../services/ai.service');
const cache = require('../../services/cache.service');
const { addXP } = require('../../utils/helpers');

async function cookedStart(ctx, user) {
  await ctx.reply('💀 *How Cooked Are You?*\n\n_Tera Engineering Survival Report generate ho raha hai..._\n\n🧠 Analyzing profile...\n⚡ Running AI scan...\n📊 Calculating survival probability...', { parse_mode: 'Markdown' });
  const cacheKey = `cooked:${user.telegramId}:${new Date().toISOString().split('T')[0]}`;
  let report = await cache.get(cacheKey);
  if (!report) {
    report = await ai.cookedReport(user);
    await cache.set(cacheKey, report, 3600);
  }
  await addXP(user, 'cooked_check');
  await ctx.reply(`💀 *ENGINEERING SURVIVAL REPORT*\n━━━━━━━━━━━━━━━━━━\n${report}\n━━━━━━━━━━━━━━━━━━\n\n📸 _Screenshot le aur dosto ko bhej — dekho kitne cooked hain woh!_ 😂`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔮 Future Simulator', 'future_sim')],
      [Markup.button.callback('🗺️ Recovery Roadmap', 'roadmap_show'), Markup.button.callback('🏠 Dashboard', 'dash_home')],
    ])
  });
}

async function futureSimulator(ctx, user) {
  await ctx.reply('🔮 *Future Self Simulator — 2027*\n\n_Calculating your trajectory..._', { parse_mode: 'Markdown' });
  const report = await ai.futureSimulator(user);
  await ctx.reply(`🔮 *FUTURE SELF SIMULATION — 2027*\n━━━━━━━━━━━━━━━━━━\n${report}\n━━━━━━━━━━━━━━━━━━\n\n_Abhi bhi badal sakta hai — bas shuru karna hai._ 💪`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('🗺️ Get My Roadmap', 'roadmap_show')]])
  });
}

module.exports = { cookedStart, futureSimulator };
