const { Markup } = require('telegraf');
const Tesseract = require('tesseract.js');
const { Groq } = require('groq-sdk');
const cache = require('../../src/services/cache.service') || require('../services/cache.service');
const logger = require('../../src/config/logger') || require('../config/logger');
const { safeReply } = require('../../src/utils/helpers') || require('../utils/helpers');
const { 
  canUseLinkedInRoast, 
  incrementLinkedInRoast, 
  getUserType 
} = require('../../src/services/roastLimit.service') || require('../services/roastLimit.service');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Start LinkedIn Roast - Request photo/screenshot
 */
async function linkedinRoastStart(ctx, user) {
  try {
    const userType = getUserType(user);
    const limitCheck = await canUseLinkedInRoast(user.telegramId, userType);

    if (!limitCheck.canUse) {
      return await safeReply(ctx, 
        `❌ *LinkedIn Roast - Daily Limit Exhausted!*\n\n📊 Your Plan: ${user.plan}\n🔴 Roasts Used: ${limitCheck.count}/${limitCheck.limit}\n\n💡 *Use kar rahe ho, maja aa rha hai?*\nHelp v ho rahi hai teri!\n\n2 Options:\n\n1️⃣ 💎 Premium Le Le (Unlimited)\n2️⃣ 📺 Ads Dekh (40 sec, 1 bonus use)`,
        {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('💎 Premium', 'premium_show')],
            [Markup.button.callback('🏠 Dashboard', 'dash_home')]
          ])
        }
      );
    }

    // Set session
    await cache.set(`linkedin_roast_${user.telegramId}`, {
      status: 'awaiting_photo',
      userType,
      dailyLimit: limitCheck.limit,
      usedToday: limitCheck.count,
      remaining: limitCheck.remaining,
      isPremium: user.plan !== 'Free',
      startedAt: Date.now()
    }, 3600);

    await safeReply(ctx,
      `🔥 *LinkedIn Roast — 35yr HR Style*\n\n35 saal ka experienced HR aaj tera LinkedIn profile dekh ke tera brutal roast dega! 😂\n\n*Rules:*\n• Screenshot ya photo bhej\n• Profile se text extract karunga\n• Honest feedback dega\n\n📸 *Ab photo bhej!*\n\n_Remaining today: ${limitCheck.remaining}/${limitCheck.limit}_`,
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Home', 'dash_home')]
        ])
      }
    );

    // Set waiting state
    await cache.set(`waiting:${user.telegramId}`, 'linkedin_roast_photo', 3600);

  } catch (err) {
    logger.error('LinkedIn roast start error:', err);
    await safeReply(ctx, '⚠️ Kuch gadbad ho gayi — thodi der baad try karo!');
  }
}

/**
 * Handle LinkedIn photo - Extract text via OCR and generate roast
 */
async function handleLinkedinPhoto(ctx, user) {
  try {
    // Get photo file
    const fileLink = await ctx.telegram.getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id);
    
    // Show processing message
    const processingMsg = await ctx.reply('🔄 *Processing...*\n⏳ Extracting text from photo...', { parse_mode: 'Markdown' });

    // Extract text using Tesseract
    const response = await Tesseract.recognize(fileLink.href, 'eng');
    const extractedText = response.data.text;

    if (!extractedText || extractedText.trim().length < 20) {
      await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, 
        '❌ Text extract nahi hua. Clear screenshot bhej!');
      return;
    }

    await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, 
      '🔄 *Processing...*\n🤖 Generating roast...', { parse_mode: 'Markdown' });

    // Generate roast using Groq
    const roastPrompt = `You are a 35-year-old experienced HR professional with brutally honest feedback style. \n    \nUser sent LinkedIn profile/resume text:\n${extractedText}\n\nGenerate a roast in this EXACT format:\n\n🔥 BRUTAL ROAST\n[1-2 funny but honest lines in Hindi/Hinglish]\n\n⚠️ KYA GALAT HAI\n• Issue 1 (1 line)\n• Issue 2 (1 line)\n\n💡 35YR HR KA ADVICE\n1. Action point (practical)\n2. Action point (practical)\n\nKeep it funny, honest, and helpful. Use Hinglish. Max 200 words total.`;

    const groqResponse = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: roastPrompt }],
      max_tokens: 400,
      temperature: 0.7
    });

    const roast = groqResponse.choices[0].message.content;

    // Increment limit
    await incrementLinkedInRoast(user.telegramId);

    // Clear waiting state
    await cache.del(`waiting:${user.telegramId}`);
    await cache.del(`linkedin_roast_${user.telegramId}`);

    // Send roast with buttons
    await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null,
      `${roast}\n\n━━━━━━━━━━━━━━━\n🤖 @Yuvorai_bot`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📤 Share', 'linkedin_roast_share')],
          [Markup.button.callback('🔄 Another', 'linkedin_roast_start')],
          [Markup.button.callback('🏠 Home', 'dash_home')]
        ])
      }
    );

  } catch (err) {
    logger.error('LinkedIn photo handling error:', err);
    await safeReply(ctx, '⚠️ Photo process mein error. Clear screenshot bhej ya /start kar!');
    await cache.del(`waiting:${user.telegramId}`);
  }
}

/**
 * Share LinkedIn Roast
 */
async function shareLinkedinRoast(ctx, user) {
  ctx.answerCbQuery('📋 Copy karo message ko!');
}

/**
 * Another LinkedIn Roast
 */
async function anotherLinkedinRoast(ctx, user) {
  ctx.answerCbQuery();
  await linkedinRoastStart(ctx, user);
}

module.exports = {
  linkedinRoastStart,
  handleLinkedinPhoto,
  shareLinkedinRoast,
  anotherLinkedinRoast
};