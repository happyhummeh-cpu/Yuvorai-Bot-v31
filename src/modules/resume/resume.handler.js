// ── 📄 Resume Roast ───────────────────────────────────────────────────────────
const { Markup } = require('telegraf');
const ai = require('../../services/ai.service');
const cache = require('../../services/cache.service');
const env = require('../../config/env');
const { effectivePlan, addXP } = require('../../utils/helpers');

async function resumeStart(ctx, user) {
  const plan = effectivePlan(user);
  const limit = env.limits[plan].roast;
  // Check limit
  const check = await cache.checkLimit(user.telegramId, 'roast', limit);
  if (!check.ok) {
    return ctx.reply(`📄 *Resume Roast Limit*\n\nAaj ke liye limit ho gayi! (${check.used}/${check.limit})\n\n💎 Upgrade karo unlimited roasts ke liye!`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('💎 Upgrade Plan', 'premium_show')]])
    });
  }
  await ctx.reply('📄 *Resume Roast*\n\n_Apna resume text yahan paste karo_ (ya LinkedIn ke important sections):\n\nExperience, Projects, Skills — jo bhi hai woh bhejo!', { parse_mode: 'Markdown' });
  // Set waiting state
  await cache.set(`waiting:${user.telegramId}`, 'resume_roast', 300);
}

async function handleResumeText(ctx, user, text) {
  await cache.del(`waiting:${user.telegramId}`);
  await ctx.reply('🔥 *Roasting your resume...*\n\n_ATS scanner chal raha hai..._', { parse_mode: 'Markdown' });
  const roast = await ai.roastResume(text);
  await cache.useLimit(user.telegramId, 'roast');
  await addXP(user, 'resume_roast');
  user.totalRoasts = (user.totalRoasts || 0) + 1;
  await user.save();
  await ctx.reply(`📄 *RESUME ROAST REPORT*\n━━━━━━━━━━━━━━━━━━\n${roast}\n━━━━━━━━━━━━━━━━━━`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📝 Cover Letter Banao', 'cover_start')],
      [Markup.button.callback('🏠 Dashboard', 'dash_home')],
    ])
  });
}

module.exports = { resumeStart, handleResumeText };
