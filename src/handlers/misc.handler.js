// ── Salary, Cover Letter, Skill Gap ──────────────────────────────────────────
const { Markup } = require('telegraf');
const ai = require('../services/ai.service');
const cache = require('../services/cache.service');

async function salaryStart(ctx, user) {
  await ctx.reply('💰 *Salary Advisor*\n\nFormat mein bhejo:\n`Role, Experience, City`\n\nExample: _Software Engineer, 0 years, Bangalore_', { parse_mode: 'Markdown' });
  await cache.set(`waiting:${user.telegramId}`, 'salary', 300);
}
async function handleSalaryText(ctx, user, text) {
  await cache.del(`waiting:${user.telegramId}`);
  const [role, exp, loc] = text.split(',').map(s => s.trim());
  await ctx.sendChatAction('typing');
  const advice = await ai.salary(role || text, exp || '0 years', loc || 'India');
  await ctx.reply(`💰 *Salary Analysis*\n━━━━━━━━━━━━━━━━━━\n${advice}`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Dashboard', 'dash_home')]])
  });
}

async function coverStart(ctx, user) {
  await ctx.reply('📝 *Cover Letter Generator*\n\nJob description paste karo (ya role name bhejo):', { parse_mode: 'Markdown' });
  await cache.set(`waiting:${user.telegramId}`, 'cover_letter', 300);
}
async function handleCoverText(ctx, user, text) {
  await cache.del(`waiting:${user.telegramId}`);
  await ctx.sendChatAction('typing');
  const letter = await ai.coverLetter(text, user);
  await ctx.reply(`📝 *Cover Letter*\n━━━━━━━━━━━━━━━━━━\n${letter}`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Dashboard', 'dash_home')]])
  });
}

async function skillGapStart(ctx, user) {
  await ctx.reply('📊 *Skill Gap Analyzer*\n\nJob description paste karo aur apni skills batao.\n\nFormat:\n`Job: [job desc]\nSkills: [your skills]`', { parse_mode: 'Markdown' });
  await cache.set(`waiting:${user.telegramId}`, 'skill_gap', 300);
}
async function handleSkillGapText(ctx, user, text) {
  await cache.del(`waiting:${user.telegramId}`);
  const [job, skills] = text.includes('Skills:') ? text.split('Skills:') : [text, user.skill || 'beginner'];
  await ctx.sendChatAction('typing');
  const analysis = await ai.skillGap(job, skills);
  await ctx.reply(`📊 *Skill Gap Analysis*\n━━━━━━━━━━━━━━━━━━\n${analysis}`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('🗺️ Get Roadmap', 'roadmap_show')]])
  });
}

module.exports = { salaryStart, handleSalaryText, coverStart, handleCoverText, skillGapStart, handleSkillGapText };
