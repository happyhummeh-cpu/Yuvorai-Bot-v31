// ── /start — Onboarding ───────────────────────────────────────────────────────
const { Markup } = require('telegraf');
const { getOrCreateUser, safeReply, addXP } = require('../utils/helpers');
const { BRANCHES, YEARS, GOALS } = require('../config/constants');

async function startHandler(ctx) {
  const user = await getOrCreateUser(ctx);
  if (!user.onboardingDone) return startOnboarding(ctx, user);
  return showDashboard(ctx, user);
}

async function startOnboarding(ctx, user) {
  user.onboardingStep = 1;
  await user.save();
  await ctx.reply(
`🚀 *YuvorAI — AI Career OS*

Naya chapter shuru ho raha hai, ${ctx.from.first_name}! ⚡

_India ka sabse smart engineering career companion._

━━━━━━━━━━━━━━━━━━
🧠 Quick setup karte hain — 4 simple questions.
Iss data se tera personalized career system activate hoga.
━━━━━━━━━━━━━━━━━━`, { parse_mode: 'Markdown' });

  await ctx.reply('📚 *Step 1/4 — Branch kya hai tera?*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(
      BRANCHES.map(b => Markup.button.callback(b, `ob_branch_${b}`)),
      { columns: 4 }
    ),
  });
}

async function handleOnboarding(ctx, user, data) {
  const parts = data.split('_');
  const type  = parts[0];
  const value = parts.slice(1).join('_');

  if (type === 'branch') {
    user.branch = value; user.onboardingStep = 2; await user.save();
    return ctx.editMessageText('📅 *Step 2/4 — Kaunsa year?*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(YEARS.map(y => Markup.button.callback(y, `ob_year_${y}`)), { columns: 3 }),
    });
  }
  if (type === 'year') {
    user.year = value; user.onboardingStep = 3; await user.save();
    return ctx.editMessageText('🎯 *Step 3/4 — Main goal kya hai?*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(GOALS.map(g => Markup.button.callback(g, `ob_goal_${g.replace(/ /g, '_')}`)), { columns: 2 }),
    });
  }
  if (type === 'goal') {
    user.goal = value.replace(/_/g, ' '); user.onboardingStep = 4; await user.save();
    return ctx.editMessageText('⚡ *Step 4/4 — Current skill level?*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('🌱 Beginner',     'ob_skill_Beginner'),
        Markup.button.callback('🔥 Intermediate', 'ob_skill_Intermediate'),
        Markup.button.callback('💎 Advanced',     'ob_skill_Advanced'),
      ], { columns: 3 }),
    });
  }
  if (type === 'skill') {
    user.skill = value; user.onboardingDone = true; user.onboardingStep = 5; await user.save();
    await addXP(user, 'daily_login');
    await ctx.editMessageText('⚡ *Profile saving...*', { parse_mode: 'Markdown' });
    await sleep(800);
    await ctx.editMessageText(
`🧠 *Analyzing Student Profile...*
⚡ *Detecting Career Direction...*
📡 *Syncing CampusRadar...*
🔥 *Initializing StudentOS...*`, { parse_mode: 'Markdown' });
    await sleep(1500);
    const identity = getIdentityLabel(user.identity);
    await ctx.editMessageText(
`✅ *StudentOS Activated!*

🧬 *Identity Detected:*
*${identity}*

━━━━━━━━━━━━━━━━━━
⚠️ Tera pehla Engineering Survival Report ready hai!
━━━━━━━━━━━━━━━━━━

Welcome to YuvorAI, ${user.firstName}! 🚀`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💀 Check Survival Report', 'cooked_start')],
          [Markup.button.callback('📡 CampusRadar — Opportunities', 'opps_show')],
        ]),
      }
    );

    // Website upsell — 3 min baad (after user explores a bit)
    setTimeout(async () => {
      try {
        const { sendWebsiteUpsell } = require('./upsell.handler');
        const { bot } = require('../bot');
        await sendWebsiteUpsell(user, bot);
      } catch {}
    }, 3 * 60 * 1000);
  }
}

function getIdentityLabel(id) {
  const { IDENTITIES } = require('../config/constants');
  return IDENTITIES.find(i => i.id === id)?.label || '😵 Confused Beginner';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function showDashboard(ctx, user) {



  const { planLabel, bar } = require('../utils/helpers');



  await safeReply(

    ctx,

`*\u{1F680} YuvorAI — AI Career OS*

\u{1F464} ${user.firstName} · ${user.branch || '?'} ${user.year || ''}

\u{1F30A} ${getIdentityLabel(user.identity)}

\u{1F48E} ${planLabel(user)} · \u{1F525} ${user.streak}d streak · \u26A1 ${user.xp} XP

XP: ${bar(user.xp % 100, 100)} ${user.xp % 100}/100

_Kya karna hai aaj? \u{1F4AA}_`,

    {

      ...Markup.inlineKeyboard([

        [



          Markup.button.callback('\u{1F480} How Cooked?', 'cooked_start'),



          Markup.button.callback('\u{1F50D} Opportunities', 'opps_show')



        ],



        [



          Markup.button.callback('\u{1F4AC} AI Coach', 'ask_prompt'),



          Markup.button.callback('\u{1F3A4} Interview', 'interview_start')



        ],



        [



          Markup.button.callback('\u{1F4DD} Resume Roast', 'resume_start'),



          Markup.button.callback('\u{1F4BC} Roadmap', 'roadmap_show')



        ],



        [



          Markup.button.callback('\u{1F48E} Premium', 'premium_show'),



          Markup.button.callback('\u{1F381} Refer', 'refer_show')



        ],



        [



          Markup.button.callback('\u{1F464} Profile', 'profile_show'),



          Markup.button.callback('\u{1F517} LinkedIn Roast', 'linkedin_photo_start')



        ],



        [



          Markup.button.callback('\u{1F4B0} Salary Advice', 'salary'),



          Markup.button.callback('\u{1F4BB} DSA', 'dsa_show')



        ],



        [



          Markup.button.callback('\u2753 Help', 'help_show'),



          Markup.button.url(

            '\u{1F680} Community',

            'https://chat.whatsapp.com/H8dgrU0rcEG94I5AZw57Ji'

          )



        ]



      ]),

    }



  );



}
module.exports = { startHandler, handleOnboarding, showDashboard };




