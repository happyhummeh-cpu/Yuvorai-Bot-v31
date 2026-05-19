const { Markup } = require('telegraf');
async function helpShow(ctx) {
  await ctx.reply(
`❓ *YuvorAI — All Commands*
━━━━━━━━━━━━━━━━━━
🚀 /start — Dashboard
💀 /cooked — Survival Report
📡 /feed — Opportunities
💬 /ask — AI Coach
🎤 /interview — Mock Interview
📄 /resume — Resume Roast
💼 /linkedin — LinkedIn Roast
🗺️ /roadmap — Career Roadmap
💡 /tip — Daily Tip
📊 /dsa — DSA Practice
💰 /salary — Salary Advice
🎁 /refer — Refer & Earn
👤 /profile — Your Profile
⚡ /streak — XP & Streak
💎 /plan — Premium Plans
⚙️ /status — Bot Status
━━━━━━━━━━━━━━━━━━
_Koi issue? Directly message karo admin ko._`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Dashboard', 'dash_home')]])
  });
}
module.exports = { helpShow };
