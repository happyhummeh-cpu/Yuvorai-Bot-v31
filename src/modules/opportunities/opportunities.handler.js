// ── 📡 CampusRadar — Opportunity Feed ────────────────────────────────────────
const { Markup } = require('telegraf');
const { getOpps } = require('./opportunities.service');
const cache = require('../../services/cache.service');
const env = require('../../config/env');
const { effectivePlan } = require('../../utils/helpers');

const EMOJIS = { internship:'🎓', job:'💼', hackathon:'🏆', fellowship:'🌟', remote:'🌍' };

async function oppsShow(ctx, user, type = null) {
  const plan  = effectivePlan(user);
  const limit = env.limits[plan].opps === -1 ? 20 : env.limits[plan].opps;

  await ctx.reply('📡 *CampusRadar — Scanning opportunities...*', { parse_mode: 'Markdown' });

  const opps = await getOpps(user, limit, type);
  if (!opps.length) {
    return ctx.reply('📭 *Abhi koi opportunity nahi hai.*\n\nKal subah 6 AM pe fresh listings aayengi! 🔔', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Dashboard', 'dash_home')]])
    });
  }

  let text = `📡 *CampusRadar — ${type ? type.toUpperCase() : 'ALL'} OPPORTUNITIES*\n`;
  text += `_(${opps.length} results — ${plan === 'free' ? `Free tier: ${limit} max` : 'Full access'})_\n\n`;

  opps.forEach((opp, i) => {
    const em = EMOJIS[opp.type] || '📌';
    text += `${i+1}. ${em} *${opp.title}* @ *${opp.company}*\n`;
    text += `📍 ${opp.location} | 💰 ${opp.salary}\n`;
    text += `🔗 [Apply Now](${opp.url}) · 📡 ${opp.source}\n\n`;
  });

  if (plan === 'free') text += `\n🔒 _Pro plan pe 50+ daily opportunities!_ → /plan`;

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🎓 Internships', 'opps_type_internship'), Markup.button.callback('💼 Jobs', 'opps_type_job')],
      [Markup.button.callback('🌍 Remote', 'opps_type_remote'),          Markup.button.callback('🏆 Hackathons', 'opps_type_hackathon')],
      [Markup.button.callback('🏠 Dashboard', 'dash_home')],
    ])
  });
}

module.exports = { oppsShow };
