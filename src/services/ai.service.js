// ── AI Service — Groq (primary) + Gemini (fallback) ───────────────────────────
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const logger = require('../config/logger');

let groq = null, gemini = null;
if (env.ai.groqKey)   groq   = new Groq({ apiKey: env.ai.groqKey });
if (env.ai.geminiKey) gemini = new GoogleGenerativeAI(env.ai.geminiKey);

const SYSTEM = `Tu YuvorAI hai — India ka #1 AI career companion for engineering students.
Tone: Hinglish (Hindi+English mix), friendly senior bhai vibe, funny but actually useful.
Honest feedback — sugarcoat mat karo. Short responses jab tak detail nahi manga.
Engineering culture samajhta hai: placements, DSA, burnout, procrastination, CGPA anxiety.
Kabhi mat bolo "I am an AI" ya corporate disclaimers. Seedha helpful ban.`;

async function ask(prompt, system = SYSTEM, maxTokens = 500) {
  // Try Groq first
  if (groq) {
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        max_tokens: maxTokens, temperature: 0.8,
      });
      return res.choices[0]?.message?.content?.trim() || null;
    } catch (err) { logger.warn('Groq failed, trying Gemini:', err.message); }
  }
  // Fallback: Gemini
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const res = await model.generateContent(`${system}\n\nUser: ${prompt}`);
      return res.response.text()?.trim() || null;
    } catch (err) { logger.error('Gemini also failed:', err.message); }
  }
  return '⚡ AI thoda busy hai bhai, 2 min baad try karo!';
}

// Specialized functions
const ai = {
  ask,
  cookedReport: (u) => ask(`Engineering survival report banao:\nBranch:${u.branch}, Year:${u.year}, Skill:${u.skill}, Goal:${u.goal||'placement'}, Streak:${u.streak}d, XP:${u.xp}\n\nGenerate:\n1. Identity label (funny+relatable)\n2. Aura Score (0-100) + reason\n3. 3 brutal honest observations\n4. Future prediction agar habits same rahe\n5. 3 specific recovery actions\n6. Comeback probability %\n\nTone: savage but motivating. Emojis. 300 words max.`, SYSTEM, 600),

  roastResume: (text) => ask(`Resume roast karo — savage but helpful:\n"${text}"\n\n1. ATS Score /100\n2. Top 3 cringe things\n3. Kya acha hai\n4. 3 specific improvements\n5. Verdict\nHinglish, funny, genuinely useful.`, SYSTEM, 500),

  roastLinkedIn: (text) => ask(`LinkedIn profile roast:\n"${text}"\n\nGenerate:\n- Cringe Score /100\n- Corporate NPC Level\n- Buzzword Density\n- Skill Visibility Score\n- Top 3 roast lines (meme-worthy)\n- 3 improvement tips\nSavage+funny+helpful. Hinglish.`, SYSTEM, 500),

  mockInterview: (type, q, ans) => ask(`Mock interview feedback:\nType: ${type}\nQ: "${q}"\nStudent: "${ans}"\n\n1. Score /10 + reason\n2. Kya acha tha\n3. Kya weak tha\n4. Model answer (short)\n5. Next question\nHonest interviewer tone.`, SYSTEM, 600),

  roadmap: (u) => ask(`6-month career roadmap:\nBranch:${u.branch}, Year:${u.year}, Goal:${u.goal||'placement'}, Skill:${u.skill}\n\nMonthly breakdown — learn/build/apply/milestone.\nRealistic, specific, doable. Hinglish. 400 words.`, SYSTEM, 700),

  tip: (u) => ask(`Ek sharp actionable career tip do for ${u.branch||'engineering'} Y${u.year||'2'} student. Goal: ${u.goal||'placement'}. 2-3 lines max. Specific, useful. Hinglish.`, SYSTEM, 150),

  dsa: (diff, topic) => ask(`Ek ${diff} DSA question do${topic ? ` on ${topic}` : ''}.\nFormat: Problem statement + Input/Output example + Hint (spoiler tag mein).\nInterview style. No solution directly.`, SYSTEM, 400),

  salary: (role, exp, loc) => ask(`Salary negotiation:\nRole:${role}, Exp:${exp}, Location:${loc}\n\n1. Market range India\n2. Kitna maango\n3. Negotiation script (2-3 lines)\n4. Kya mat bolo\nHinglish, practical, 200 words.`, SYSTEM, 400),

  coverLetter: (job, u) => ask(`Cover letter:\nJob: ${job}\nStudent: ${u.branch} ${u.year}, ${u.skill} level, goal: ${u.goal}\nATS-optimized, professional but not robotic, 150-200 words.`, SYSTEM, 500),

  skillGap: (job, skills) => ask(`Skill gap analysis:\nJob: "${job}"\nMy skills: "${skills}"\n\n1. Match %\n2. Skills I have that match\n3. Missing skills (priority)\n4. Resources for top 2 missing\n5. Time to be ready\nHinglish, honest, 250 words.`, SYSTEM, 500),

  futureSimulator: (u) => ask(`Future self simulation 2027:\nCurrent: ${u.branch} ${u.year}, ${u.skill} level, streak: ${u.streak}d, XP:${u.xp}\n\nPredict:\n- Placement probability\n- Stress risk\n- Growth trajectory\n- Missed opportunity risk\n- Comeback chance\n\nTone: honest but never hopeless. Always show recovery path. Hinglish. 250 words.`, SYSTEM, 500),
};

module.exports = ai;
