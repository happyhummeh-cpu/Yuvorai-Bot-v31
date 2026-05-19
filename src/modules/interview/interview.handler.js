// ── 🎤 Mock Interview ─────────────────────────────────────────────────────────
const { Markup } = require('telegraf');
const ai = require('../../services/ai.service');
const cache = require('../../services/cache.service');
const env = require('../../config/env');
const { effectivePlan, addXP } = require('../../utils/helpers');

const TYPES = ['HR Round', 'Technical Round', 'DSA Round', 'Aptitude Round'];

async function interviewStart(ctx, user) {
  const plan = effectivePlan(user);
  if (plan === 'free') {
    return ctx.reply('🎤 *Mock Interview*\n\n_Interview practice free plan mein available nahi hai._\n\nUpgrade karo aur unlimited practice karo! 💪', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('💎 Upgrade', 'premium_show')]])
    });
  }
  await ctx.reply('🎤 *Mock Interview — Kaun sa round?*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(
      TYPES.map(t => Markup.button.callback(t, `interview_type_${t.replace(/ /g,'_')}`)),
      { columns: 2 }
    )
  });
}

async function startInterviewType(ctx, user, type) {
  const q = await ai.ask(`Ek ${type} interview question do for ${user.branch||'engineering'} student. Just the question, no extra text.`);
  await cache.set(`interview:${user.telegramId}`, { type, question: q, round: 1 }, 600);
  await cache.set(`waiting:${user.telegramId}`, 'interview_ans', 600);
  await ctx.reply(`🎤 *${type}*\n\n*Question:*\n${q}\n\n_Apna answer type karo:_`, { parse_mode: 'Markdown' });
}

async function handleInterviewAnswer(ctx, user, answer) {
  const session = await cache.get(`interview:${user.telegramId}`);
  if (!session) return ctx.reply('Session expire ho gayi — /interview se restart karo.');
  await cache.del(`waiting:${user.telegramId}`);
  await ctx.reply('⚡ *Feedback aa raha hai...*', { parse_mode: 'Markdown' });
  const feedback = await ai.mockInterview(session.type, session.question, answer);
  await addXP(user, 'interview');
  // Extract next question from feedback and save
  const round = session.round + 1;
  await cache.set(`interview:${user.telegramId}`, { ...session, round }, 600);
  await ctx.reply(`🎤 *Interview Feedback — Round ${session.round}*\n━━━━━━━━━━━━━━━━━━\n${feedback}\n━━━━━━━━━━━━━━━━━━`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('➡️ Next Question', 'interview_next')],
      [Markup.button.callback('🏁 End Interview', 'dash_home')],
    ])
  });
}

async function nextQuestion(ctx, user) {
  const session = await cache.get(`interview:${user.telegramId}`);
  if (!session) return interviewStart(ctx, user);
  const q = await ai.ask(`${session.type} interview ka next question do for ${user.branch||'engineering'} student. Round ${session.round}. Harder question. Just the question.`);
  session.question = q;
  await cache.set(`interview:${user.telegramId}`, session, 600);
  await cache.set(`waiting:${user.telegramId}`, 'interview_ans', 600);
  await ctx.reply(`🎤 *Round ${session.round}*\n\n*Question:*\n${q}\n\n_Apna answer type karo:_`, { parse_mode: 'Markdown' });
}

module.exports = { interviewStart, startInterviewType, handleInterviewAnswer, nextQuestion };
