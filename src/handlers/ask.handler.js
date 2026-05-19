// ── 💬 AI Coach ───────────────────────────────────────────────────────────────
const { Markup } = require('telegraf');
const ai = require('../services/ai.service');
const cache = require('../services/cache.service');
const env = require('../config/env');
const { effectivePlan, addXP } = require('../utils/helpers');

async function askPrompt(ctx, user) {
  const plan  = effectivePlan(user);
  const limit = env.limits[plan].ai;
  const check = await cache.checkLimit(user.telegramId, 'ai', limit);
  if (!check.ok) {
    return ctx.reply(`💬 *AI Coach Limit*\n\nAaj ke ${check.limit} AI chats use ho gaye!\n\nKal reset hoga ya upgrade karo 💎`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('💎 Upgrade', 'premium_show')]])
    });
  }
  await ctx.reply('💬 *AI Coach*\n\n_Koi bhi career/tech sawaal pooch!_\n\nJob prep, DSA, projects, resume — sab pe help milega.', {
    parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'dash_home')]])
  });
  await cache.set(`waiting:${user.telegramId}`, 'ask_ai', 300);
}

async function handleAskText(ctx, user, text) {
  await cache.del(`waiting:${user.telegramId}`);
  await ctx.sendChatAction('typing');
  const reply = await ai.ask(text);
  await cache.useLimit(user.telegramId, 'ai');
  await addXP(user, 'ask_ai');
  const plan  = effectivePlan(user);
  const limit = env.limits[plan].ai;
  const used  = await cache.getCount(`lim:${user.telegramId}:ai:${new Date().toISOString().split('T')[0]}`);
  await ctx.reply(`💬 ${reply}\n\n_[${used}/${limit === -1 ? '∞' : limit} chats used today]_`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('💬 Ask Again', 'ask_prompt')],
      [Markup.button.callback('🏠 Dashboard', 'dash_home')],
    ])
  });
}

module.exports = { askPrompt, handleAskText };
