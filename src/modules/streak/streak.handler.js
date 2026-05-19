// ── 🔥 Streak + XP + Profile ──────────────────────────────────────────────────
const { Markup } = require('telegraf');
const { bar, planLabel } = require('../../utils/helpers');
const { IDENTITIES } = require('../../config/constants');

async function streakShow(ctx, user) {
  const identity = IDENTITIES.find(i => i.id === user.identity) || IDENTITIES[IDENTITIES.length - 1];
  const xpToNext = (Math.floor(user.xp / 100) + 1) * 100;
  await ctx.reply(
`⚡ *Streak & XP Dashboard*
━━━━━━━━━━━━━━━━━━
🧬 Identity: *${identity.label}*
🔥 Streak: *${user.streak} days*
⚡ XP: *${user.xp}* (next level: ${xpToNext})
${bar(user.xp % 100, 100)} ${user.xp % 100}/100

🎯 Aura Score: *${user.auraScore}/100*
━━━━━━━━━━━━━━━━━━
*XP Earn Karo:*
🗣️ AI Chat: +2 XP
💀 Survival Check: +3 XP
📄 Resume Roast: +5 XP
🎤 Interview: +15 XP
🤝 Refer Friend: +20 XP
📊 DSA Attempt: +8 XP
🔐 Daily Login: +5 XP
━━━━━━━━━━━━━━━━━━
_Roz login karo streak badhao!_ 🔥`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🎁 Refer & Earn', 'refer_show')],
        [Markup.button.callback('🏠 Dashboard',    'dash_home')],
      ]),
    }
  );
}

async function profileShow(ctx, user) {
  const identity = IDENTITIES.find(i => i.id === user.identity) || IDENTITIES[IDENTITIES.length - 1];
  await ctx.reply(
`👤 *Your Profile*
━━━━━━━━━━━━━━━━━━
Name:   ${user.firstName}
Branch: ${user.branch || 'Not set'}
Year:   ${user.year || 'Not set'}
Skill:  ${user.skill || 'Not set'}
Goal:   ${user.goal || 'Not set'}

🧬 Identity: ${identity.label}
📊 Plan: ${planLabel(user)}
🔥 Streak: ${user.streak} days
⚡ XP: ${user.xp}
🎯 Aura: ${user.auraScore}/100

📈 Stats:
• Total AI Chats: ${user.totalAiCalls || 0}
• Total Roasts: ${user.totalRoasts || 0}
• Referrals: ${user.referralCount || 0}

🔗 Referral Code: \`${user.referralCode || 'Generating...'}\`
━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Edit Profile', 'edit_profile')],
        [Markup.button.callback('⚡ Streak & XP',  'streak_show')],
        [Markup.button.callback('🏠 Dashboard',    'dash_home')],
      ]),
    }
  );
}

async function editProfile(ctx, user) {
  await ctx.reply('✏️ *Edit Profile — Kya update karna hai?*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📚 Branch', 'edit_branch'), Markup.button.callback('📅 Year', 'edit_year')],
      [Markup.button.callback('🎯 Goal',   'edit_goal'),   Markup.button.callback('⚡ Skill', 'edit_skill')],
      [Markup.button.callback('🔙 Back',   'profile_show')],
    ]),
  });
}

// Placeholder — actual set handlers are in bot.js
async function handleEditChoice(ctx, user, field, value) {
  user[field] = value;
  await user.save();
}

module.exports = { streakShow, profileShow, editProfile, handleEditChoice };
