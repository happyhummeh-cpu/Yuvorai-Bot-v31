const { Markup } = require('telegraf');
const ai = require('../services/ai.service');
const cache = require('../services/cache.service');
const env = require('../config/env');
const { effectivePlan, addXP } = require('../utils/helpers');

async function dsaShow(ctx, user) {
  const plan  = effectivePlan(user);
  const limit = env.limits[plan].dsa;
  const check = await cache.checkLimit(user.telegramId, 'dsa', limit);
  if (!check.ok) {
    return ctx.reply(`📊 *DSA Limit*\n\nAaj ki limit ho gayi! Upgrade karo unlimited ke liye.`, {
      parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💎 Upgrade', 'premium_show')]])
    });
  }
  await ctx.reply('📊 *DSA Question — Difficulty?*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🟢 Easy', 'dsa_easy'), Markup.button.callback('🟡 Medium', 'dsa_medium'), Markup.button.callback('🔴 Hard', 'dsa_hard')]
    ])
  });
}

async function sendDSA(ctx, user, diff) {
  await ctx.reply(`📊 *${diff} DSA Question aa raha hai...* ⚡`, { parse_mode: 'Markdown' });
  const q = await ai.dsa(diff.toLowerCase(), null);
  await cache.useLimit(user.telegramId, 'dsa');
  await addXP(user, 'dsa_attempt');
  await ctx.reply(`📊 *DSA — ${diff}*\n━━━━━━━━━━━━━━━━━━\n${q}\n━━━━━━━━━━━━━━━━━━`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('➡️ Another Question', 'dsa_show')],
      [Markup.button.callback('🏠 Dashboard',        'dash_home')],
    ])
  });
}
module.exports = { dsaShow, sendDSA };
