// ── YuvorAI Bot — Main Router ─────────────────────────────────────────────────
const { Telegraf, Markup } = require('telegraf');
const env = require('./config/env');
const logger = require('./config/logger');
const cache = require('./services/cache.service');
const { getOrCreateUser, addXP, safeReply } = require('./utils/helpers');

// Handlers
const { startHandler, handleOnboarding, showDashboard } = require('./handlers/start.handler');
const { askPrompt, handleAskText }                       = require('./handlers/ask.handler');
const { roadmapShow }                                    = require('./handlers/roadmap.handler');
const { dsaShow, sendDSA }                               = require('./handlers/dsa.handler');
const { tipShow }                                        = require('./handlers/tip.handler');
const { statusShow }                                     = require('./handlers/status.handler');
const { helpShow }                                       = require('./handlers/help.handler');
const { salaryStart, handleSalaryText, coverStart, handleCoverText, skillGapStart, handleSkillGapText } = require('./handlers/misc.handler');
const {

  linkedinRoastStart,

  handleLinkedInPhoto

} = require('./modules/linkedin/linkedin.handler');

// Modules
const { cookedStart, futureSimulator }   = require('./modules/cooked/cooked.handler');
const { resumeStart, handleResumeText }  = require('./modules/resume/resume.handler');
const { interviewStart, startInterviewType, handleInterviewAnswer, nextQuestion } = require('./modules/interview/interview.handler');
const { linkedinStart, handleLinkedinText } = require('./modules/linkedin/linkedin.handler');
const { oppsShow }                       = require('./modules/opportunities/opportunities.handler');
const { premiumShow, buyPlan, handlePaymentScreenshot, approvePayment, rejectPayment } = require('./modules/premium/premium.handler');
const { streakShow, profileShow, editProfile, handleEditChoice } = require('./modules/streak/streak.handler');
const { referShow, handleReferral }      = require('./modules/referral/referral.handler');
const { isAdmin, adminStats, broadcastMsg, pendingPayments, addOpp } = require('./modules/admin/admin.handler');
const { sendWebsiteUpsell }              = require('./handlers/upsell.handler');
const { BRANCHES, YEARS, GOALS } = require('./config/constants');

const bot = new Telegraf(env.telegram.token);

// ── Global Error Handler ──────────────────────────────────────────────────────
bot.catch((err, ctx) => {
  logger.error(`Bot error for ${ctx.updateType}:`, err.message);
  try { ctx.reply('⚠️ Kuch gadbad ho gayi — thodi der baad try karo!'); } catch {}
});

// ── Middleware — Get User ─────────────────────────────────────────────────────
bot.use(async (ctx, next) => {
  if (!ctx.from) return next();
  try {
    ctx.user = await getOrCreateUser(ctx);
    await addXP(ctx.user, 'daily_login');
  } catch (err) { logger.error('User middleware error:', err.message); }
  return next();
});

// ── Commands ──────────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  const payload = ctx.startPayload;
  if (payload?.startsWith('ref_')) {
    const code = payload.replace('ref_', '');
    await handleReferral(ctx.user, code);
  }
  startHandler(ctx);
});

bot.command('cooked',    ctx => cookedStart(ctx, ctx.user));
bot.command('feed',      ctx => oppsShow(ctx, ctx.user));
bot.command('ask',       ctx => askPrompt(ctx, ctx.user));
bot.command('interview', ctx => interviewStart(ctx, ctx.user));
bot.command('resume',    ctx => resumeStart(ctx, ctx.user));
bot.command('linkedin',  ctx => linkedinStart(ctx, ctx.user));
bot.command('roadmap',   ctx => roadmapShow(ctx, ctx.user));
bot.command('tip',       ctx => tipShow(ctx, ctx.user));
bot.command('dsa',       ctx => dsaShow(ctx, ctx.user));
bot.command('salary',    ctx => salaryStart(ctx, ctx.user));
bot.command('refer',     ctx => referShow(ctx, ctx.user));
bot.command('profile',   ctx => profileShow(ctx, ctx.user));
bot.command('streak',    ctx => streakShow(ctx, ctx.user));
bot.command('plan',      ctx => premiumShow(ctx, ctx.user));
bot.command('status',    ctx => statusShow(ctx));
bot.command('help',      ctx => helpShow(ctx));

// Aliases
bot.command('opportunities', ctx => oppsShow(ctx, ctx.user));
bot.command('dashboard',     ctx => showDashboard(ctx, ctx.user));
bot.command('website',       ctx => sendWebsiteUpsell(ctx.user, bot));

// ── Admin Commands ────────────────────────────────────────────────────────────
bot.command('stats',   ctx => adminStats(ctx));
bot.command('pending', ctx => pendingPayments(ctx));
bot.hears(/^\/approve_(.+)$/, ctx => { if (isAdmin(ctx)) approvePayment(ctx, ctx.match[1]); });
bot.hears(/^\/reject_(.+)$/,  ctx => { if (isAdmin(ctx)) rejectPayment(ctx, ctx.match[1]); });
bot.hears(/^\/broadcast (.+)$/s, ctx => { if (isAdmin(ctx)) broadcastMsg(ctx, ctx.match[1]); });
bot.hears(/^\/addopp (.+)$/s,   ctx => { if (isAdmin(ctx)) addOpp(ctx, ctx.match[1]); });

// ── Callback Actions ──────────────────────────────────────────────────────────
bot.action('dash_home',      ctx => { ctx.answerCbQuery(); showDashboard(ctx, ctx.user); });
bot.action('cooked_start',   ctx => { ctx.answerCbQuery('💀 Generating...'); cookedStart(ctx, ctx.user); });
bot.action('future_sim',     ctx => { ctx.answerCbQuery('🔮 Simulating...'); futureSimulator(ctx, ctx.user); });
bot.action('opps_show',      ctx => { ctx.answerCbQuery('📡 Loading...'); oppsShow(ctx, ctx.user); });
bot.action('ask_prompt',     ctx => { ctx.answerCbQuery(); askPrompt(ctx, ctx.user); });
bot.action('interview_start',ctx => { ctx.answerCbQuery(); interviewStart(ctx, ctx.user); });
bot.action('interview_next', ctx => { ctx.answerCbQuery(); nextQuestion(ctx, ctx.user); });
bot.action('resume_start',   ctx => { ctx.answerCbQuery(); resumeStart(ctx, ctx.user); });
bot.action('roadmap_show',   ctx => { ctx.answerCbQuery('🗺️ Loading...'); roadmapShow(ctx, ctx.user); });
bot.action('premium_show',   ctx => { ctx.answerCbQuery(); premiumShow(ctx, ctx.user); });
bot.action('refer_show',     ctx => { ctx.answerCbQuery(); referShow(ctx, ctx.user); });
bot.action('profile_show',   ctx => { ctx.answerCbQuery(); profileShow(ctx, ctx.user); });
bot.action('streak_show',    ctx => { ctx.answerCbQuery(); streakShow(ctx, ctx.user); });
bot.action('edit_profile',   ctx => { ctx.answerCbQuery(); editProfile(ctx, ctx.user); });
bot.action('help_show',      ctx => { ctx.answerCbQuery(); helpShow(ctx); });
bot.action('dsa_show',       ctx => { ctx.answerCbQuery(); dsaShow(ctx, ctx.user); });
bot.action('cover_start',    ctx => { ctx.answerCbQuery(); coverStart(ctx, ctx.user); });
bot.action('skill_gap_start',ctx => { ctx.answerCbQuery(); skillGapStart(ctx, ctx.user); });
bot.action('upsell_dismiss', ctx => { ctx.answerCbQuery('Ok bhai! 👍'); });
bot.action('copy_ref',       ctx => { ctx.answerCbQuery('Code copy karo upar se! 📋'); });

// Opportunity type filters
bot.action(/^opps_type_(.+)$/, ctx => { ctx.answerCbQuery(); oppsShow(ctx, ctx.user, ctx.match[1]); });

// DSA difficulty
bot.action('dsa_easy',   ctx => { ctx.answerCbQuery(); sendDSA(ctx, ctx.user, 'Easy'); });
bot.action('dsa_medium', ctx => { ctx.answerCbQuery(); sendDSA(ctx, ctx.user, 'Medium'); });
bot.action('dsa_hard',   ctx => { ctx.answerCbQuery(); sendDSA(ctx, ctx.user, 'Hard'); });

// Buy plans
bot.action(/^buy_(.+)$/, ctx => { ctx.answerCbQuery(); buyPlan(ctx, ctx.user, ctx.match[1]); });

// Onboarding callbacks
bot.action(/^ob_/, async ctx => {
  ctx.answerCbQuery('✅');
  const data = ctx.callbackQuery.data.replace('ob_', '');
  await handleOnboarding(ctx, ctx.user, data);
});

// Interview type selection
bot.action(/^interview_type_(.+)$/, ctx => {
  ctx.answerCbQuery();
  startInterviewType(ctx, ctx.user, ctx.match[1].replace(/_/g, ' '));
});

// Edit profile field selections (FIX: was missing these handlers)
bot.action('edit_branch', ctx => {
  ctx.answerCbQuery();
  return ctx.editMessageText('📚 *Branch select karo:*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(
      BRANCHES.map(b => Markup.button.callback(b, `set_branch_${b}`)), { columns: 4 }
    ),
  });
});
bot.action('edit_year', ctx => {
  ctx.answerCbQuery();
  return ctx.editMessageText('📅 *Year select karo:*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(
      YEARS.map(y => Markup.button.callback(y, `set_year_${y}`)), { columns: 3 }
    ),
  });
});
bot.action('edit_goal', ctx => {
  ctx.answerCbQuery();
  return ctx.editMessageText('🎯 *Goal select karo:*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(
      GOALS.map(g => Markup.button.callback(g, `set_goal_${g.replace(/ /g, '_')}`)), { columns: 2 }
    ),
  });
});
bot.action('edit_skill', ctx => {
  ctx.answerCbQuery();
  return ctx.editMessageText('⚡ *Skill level select karo:*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🌱 Beginner', 'set_skill_Beginner')],
      [Markup.button.callback('🔥 Intermediate', 'set_skill_Intermediate')],
      [Markup.button.callback('💎 Advanced', 'set_skill_Advanced')],
    ]),
  });
});

// Set profile field handlers
bot.action(/^set_branch_(.+)$/, async ctx => {
  ctx.answerCbQuery('✅ Branch updated!');
  ctx.user.branch = ctx.match[1];
  await ctx.user.save();
  await ctx.editMessageText(`✅ Branch updated: *${ctx.match[1]}*`, { parse_mode: 'Markdown' });
  setTimeout(() => profileShow(ctx, ctx.user), 800);
});
bot.action(/^set_year_(.+)$/, async ctx => {
  ctx.answerCbQuery('✅ Year updated!');
  ctx.user.year = ctx.match[1];
  await ctx.user.save();
  await ctx.editMessageText(`✅ Year updated: *${ctx.match[1]}*`, { parse_mode: 'Markdown' });
  setTimeout(() => profileShow(ctx, ctx.user), 800);
});
bot.action(/^set_goal_(.+)$/, async ctx => {
  ctx.answerCbQuery('✅ Goal updated!');
  ctx.user.goal = ctx.match[1].replace(/_/g, ' ');
  await ctx.user.save();
  await ctx.editMessageText(`✅ Goal updated: *${ctx.user.goal}*`, { parse_mode: 'Markdown' });
  setTimeout(() => profileShow(ctx, ctx.user), 800);
});
bot.action(/^set_skill_(.+)$/, async ctx => {
  ctx.answerCbQuery('✅ Skill updated!');
  ctx.user.skill = ctx.match[1];
  await ctx.user.save();
  await ctx.editMessageText(`✅ Skill updated: *${ctx.match[1]}*`, { parse_mode: 'Markdown' });
  setTimeout(() => profileShow(ctx, ctx.user), 800);
});

// ── Text Message Router ───────────────────────────────────────────────────────
bot.on('text', async (ctx) => {
  const text    = ctx.message.text;
  const waiting = await cache.get(`waiting:${ctx.user.telegramId}`);

  if (!waiting) {
    if (!text.startsWith('/')) {
      await askPrompt(ctx, ctx.user);
    }
    return;
  }

  const routes = {
    ask_ai:         () => handleAskText(ctx, ctx.user, text),
    resume_roast:   () => handleResumeText(ctx, ctx.user, text),
    linkedin_roast: () => handleLinkedinText(ctx, ctx.user, text),
    interview_ans:  () => handleInterviewAnswer(ctx, ctx.user, text),
    salary:         () => handleSalaryText(ctx, ctx.user, text),
    cover_letter:   () => handleCoverText(ctx, ctx.user, text),
    skill_gap:      () => handleSkillGapText(ctx, ctx.user, text),
  };

  if (routes[waiting]) routes[waiting]();
});

// ── Photo Handler (Payment screenshots) ──────────────────────────────────────

bot.on('photo', async (ctx) => {

  await paymentScreenshot(ctx, ctx.user);

});



// ── Launch Bot ───────────────────────────────────────────────────────────────

bot.launch();



logger.info('������ YuvorAI bot launched');



// Graceful stop

process.once('SIGINT',  () => bot.stop('SIGINT'));

process.once('SIGTERM', () => bot.stop('SIGTERM'));



