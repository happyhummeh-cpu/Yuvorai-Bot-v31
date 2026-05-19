const { Markup } = require('telegraf');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const { Groq } = require('groq-sdk');
const cache = require('../../src/services/cache.service') || require('../services/cache.service');
const logger = require('../../src/config/logger') || require('../config/logger');
const { safeReply } = require('../../src/utils/helpers') || require('../utils/helpers');
const { 
  canUseResumeRoast, 
  incrementResumeRoast, 
  getUserType 
} = require('../../src/services/roastLimit.service') || require('../services/roastLimit.service');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Start Resume Roast - Request file (PDF/DOC/DOCX/Photo)
 */
async function resumeRoastStart(ctx, user) {
  try {
    const userType = getUserType(user);
    const limitCheck = await canUseResumeRoast(user.telegramId, userType);

    if (!limitCheck.canUse) {
      return await safeReply(ctx, 
        `❌ *Resume Roast - Daily Limit Exhausted!*\n\n📊 Your Plan: ${user.plan}\n🔴 Roasts Used: ${limitCheck.count}/${limitCheck.limit}\n\n💡 Use kar rahe ho, maja aa rha hai? Help v ho rahi hai teri!\n\n2 Options:\n\n1️⃣ 💎 Premium Le Le (Unlimited)\n2️⃣ 📺 Ads Dekh (40 sec, 1 bonus use)`,
        {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('💎 Premium', 'premium_show')],
            [Markup.button.callback('🏠 Dashboard', 'dash_home')]
          ])
        }
      );
    }

    // Set session
    await cache.set(`resume_roast_${user.telegramId}`, JSON.stringify({
      status: 'awaiting_file',
      userType,
      dailyLimit: limitCheck.limit,
      usedToday: limitCheck.count,
      remaining: limitCheck.remaining,
      isPremium: user.plan !== 'Free',
      fileType: null,
      startedAt: Date.now()
    }), 3600);

    await safeReply(ctx,
      `📝 *Resume Roast — 25yr HR Style*\n\n25 saal ka HR aaj tera resume dekh ke honest feedback dega!\n\n*Supported formats:*\n• PDF files\n• DOC/DOCX files\n• Screenshots/Photos\n\n📄 *Ab file bhej!*\n\n_Remaining today: ${limitCheck.remaining}/${limitCheck.limit}_`,
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Home', 'dash_home')]
        ])
      }
    );

    // Set waiting state
    await cache.set(`waiting:${user.telegramId}`, 'resume_roast', 3600);

  } catch (err) {
    logger.error('Resume roast start error:', err);
    await safeReply(ctx, '⚠️ Kuch gadbad ho gayi — thodi der baad try karo!');
  }
}

/**
 * Handle Resume File - Auto-detect and extract text
 */
async function handleResumeFile(ctx, user) {
  try {
    let fileId, fileType = 'unknown';
    let extractedText = '';

    // Detect file type
    if (ctx.message.document) {
      fileId = ctx.message.document.file_id;
      const mimeType = ctx.message.document.mime_type;
      
      if (mimeType === 'application/pdf') {
        fileType = 'pdf';
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileType = 'docx';
      } else if (mimeType === 'application/msword') {
        fileType = 'doc';
      }
    } else if (ctx.message.photo) {
      fileType = 'image';
      fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    }

    const processingMsg = await ctx.reply('🔄 *Processing...*\n⏳ Extracting text from file...', { parse_mode: 'Markdown' });

    // Get file link
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // Extract based on type
    if (fileType === 'pdf') {
      extractedText = await extractPDF(fileLink.href);
    } else if (fileType === 'docx') {
      extractedText = await extractDOCX(fileLink.href);
    } else if (fileType === 'image') {
      extractedText = await extractImage(fileLink.href);
    } else {
      await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, 
        '❌ Unsupported file format. PDF/DOCX/Photo bhej!');
      return;
    }

    if (!extractedText || extractedText.trim().length < 20) {
      await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, 
        '❌ Text extract nahi hua. Clear file/photo bhej!');
      return;
    }

    await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, 
      '🔄 *Processing...*\n🤖 Generating roast...', { parse_mode: 'Markdown' });

    // Generate roast using Groq
    const roastPrompt = `You are a 25-year-old experienced HR professional with honest feedback style.\n    \nUser sent resume:\n${extractedText}\n\nGenerate a roast in this EXACT format:\n\n🔥 BRUTAL ROAST\n[1-2 honest feedback lines in Hindi/Hinglish]\n\n⚠️ KYA GALAT HAI\n• Issue 1 (1 line)\n• Issue 2 (1 line)\n\n💡 25YR HR KA ADVICE\n1. Action point (practical)\n2. Practical tip\n\nKeep it funny, honest, and helpful. Use Hinglish. Max 200 words total.`;

    const groqResponse = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: roastPrompt }],
      max_tokens: 400,
      temperature: 0.7
    });

    const roast = groqResponse.choices[0].message.content;

    // Increment limit
    await incrementResumeRoast(user.telegramId);

    // Clear waiting state
    await cache.del(`waiting:${user.telegramId}`);
    await cache.del(`resume_roast_${user.telegramId}`);

    // Send roast
    await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null,
      `${roast}\n\n━━━━━━━━━━━━━━━\n🤖 @Yuvorai_bot`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📤 Share', 'resume_roast_share')],
          [Markup.button.callback('🔄 Another', 'resume_start')],
          [Markup.button.callback('🏠 Home', 'dash_home')]
        ])
      }
    );

  } catch (err) {
    logger.error('Resume file handling error:', err);
    await safeReply(ctx, '⚠️ File process mein error. Different file try kar ya /start kar!');
    await cache.del(`waiting:${user.telegramId}`);
  }
}

/**
 * Extract text from PDF
 */
async function extractPDF(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const data = await pdfParse(response.data);
    return data.text;
  } catch (err) {
    logger.error('PDF extraction error:', err);
    return '';
  }
}

/**
 * Extract text from DOCX
 */
async function extractDOCX(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const result = await mammoth.extractRawText({ arrayBuffer: response.data });
    return result.value;
  } catch (err) {
    logger.error('DOCX extraction error:', err);
    return '';
  }
}

/**
 * Extract text from Image using Tesseract
 */
async function extractImage(url) {
  try {
    const response = await Tesseract.recognize(url, 'eng');
    return response.data.text;
  } catch (err) {
    logger.error('Image extraction error:', err);
    return '';
  }
}

/**
 * Share Resume Roast
 */
async function shareResumeRoast(ctx, user) {
  ctx.answerCbQuery('📋 Copy karo message ko!');
}

/**
 * Existing Resume handler - Keep for backward compatibility
 */
async function handleResumeText(ctx, user, text) {
  // Deprecated - redirect to file handler
  await safeReply(ctx, '📄 Please send resume file (PDF/DOCX) or photo instead of text!');
  await cache.del(`waiting:${user.telegramId}`);
}

module.exports = {
  resumeRoastStart,
  handleResumeFile,
  shareResumeRoast,
  handleResumeText
};