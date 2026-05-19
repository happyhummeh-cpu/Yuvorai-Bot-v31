const PLANS = {
  free:     { label: '🆓 Free',     price: 0,  days: null },
  trial:    { label: '⚡ Trial',    price: 9,  days: 7   },
  pro:      { label: '💎 Pro',      price: 19, days: 30  },
  elite:    { label: '🔥 Elite',    price: 39, days: 30  },
  advanced: { label: '👑 Advanced', price: 69, days: 30  },
};
const IDENTITIES = [
  { id:'campus_legend',     label:'🌟 Campus Legend',       min:90 },
  { id:'comeback_king',     label:'👑 Comeback King',        min:75 },
  { id:'silent_grinder',    label:'🔇 Silent Grinder',       min:60 },
  { id:'hidden_potential',  label:'💎 Hidden Potential',     min:50 },
  { id:'placement_survivor',label:'🛡️ Placement Survivor',  min:40 },
  { id:'recovery_candidate',label:'📈 Recovery Candidate',   min:30 },
  { id:'tutorial_warrior',  label:'📺 Tutorial Warrior',     min:20 },
  { id:'burnout_coder',     label:'😮‍💨 Burnout Coder',      min:10 },
  { id:'lost_momentum',     label:'💨 Lost Momentum',        min:5  },
  { id:'confused_beginner', label:'😵 Confused Beginner',    min:0  },
];
const BRANCHES  = ['CSE','IT','ECE','EEE','ME','CE','MCA','Other'];
const YEARS     = ['Y1','Y2','Y3','Y4','Passout'];
const GOALS     = ['Software Job','Startup','Higher Studies','Government Job','Freelancing'];
const INTERESTS = ['Web Dev','App Dev','AI/ML','DSA/CP','Cybersecurity','Data Science','Cloud','Other'];
const XP = { daily_login:5, ask_ai:2, resume_roast:5, interview:15, refer_friend:20, dsa_attempt:8, apply_opp:10, cooked_check:3 };
const WHATSAPP = { general:'https://t.me/yuvorai_community', placement:'https://t.me/yuvorai_placement', aiml:'https://t.me/yuvorai_aiml', webdev:'https://t.me/yuvorai_webdev' };
module.exports = { PLANS, IDENTITIES, BRANCHES, YEARS, GOALS, INTERESTS, XP, WHATSAPP };
