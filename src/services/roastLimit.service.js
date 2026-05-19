const LinkedInRoastLimit = require('../models/LinkedInRoastLimit');
const ResumeRoastLimit = require('../models/ResumeRoastLimit');
const logger = require('../config/logger');

// Daily limits by plan
const LIMITS = {
  linkedin_roast: {
    free: 5,
    trial: 6,
    pro: 7,
    elite: 8,
    advanced: 10
  },
  resume_roast: {
    free: 3,
    trial: 4,
    pro: 5,
    elite: 6,
    advanced: 7
  }
};

/**
 * Get user type based on plan
 */
function getUserType(user) {
  return user.plan?.toLowerCase() || 'free';
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if user can use LinkedIn Roast
 */
async function canUseLinkedInRoast(userId, userType) {
  try {
    const today = getTodayDate();
    const dailyLimit = LIMITS.linkedin_roast[userType] || LIMITS.linkedin_roast.free;

    let limit = await LinkedInRoastLimit.findOne({
      userId,
      date: today
    });

    if (!limit) {
      // Create new limit record
      limit = new LinkedInRoastLimit({
        userId,
        date: today,
        userType,
        count: 0,
        limit: dailyLimit,
        isPremium: userType !== 'free',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await limit.save();
    }

    const canUse = limit.count < limit.limit;
    const remaining = Math.max(0, limit.limit - limit.count);

    return {
      canUse,
      count: limit.count,
      limit: limit.limit,
      remaining,
      userType
    };
  } catch (err) {
    logger.error('Error checking LinkedIn roast limit:', err);
    return { canUse: true, count: 0, limit: 5, remaining: 5, userType };
  }
}

/**
 * Increment LinkedIn Roast usage
 */
async function incrementLinkedInRoast(userId) {
  try {
    const today = getTodayDate();
    await LinkedInRoastLimit.findOneAndUpdate(
      { userId, date: today },
      { $inc: { count: 1 } },
      { new: true }
    );
    return true;
  } catch (err) {
    logger.error('Error incrementing LinkedIn roast:', err);
    return false;
  }
}

/**
 * Check if user can use Resume Roast
 */
async function canUseResumeRoast(userId, userType) {
  try {
    const today = getTodayDate();
    const dailyLimit = LIMITS.resume_roast[userType] || LIMITS.resume_roast.free;

    let limit = await ResumeRoastLimit.findOne({
      userId,
      date: today
    });

    if (!limit) {
      // Create new limit record
      limit = new ResumeRoastLimit({
        userId,
        date: today,
        userType,
        count: 0,
        limit: dailyLimit,
        isPremium: userType !== 'free',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await limit.save();
    }

    const canUse = limit.count < limit.limit;
    const remaining = Math.max(0, limit.limit - limit.count);

    return {
      canUse,
      count: limit.count,
      limit: limit.limit,
      remaining,
      userType
    };
  } catch (err) {
    logger.error('Error checking Resume roast limit:', err);
    return { canUse: true, count: 0, limit: 3, remaining: 3, userType };
  }
}

/**
 * Increment Resume Roast usage
 */
async function incrementResumeRoast(userId) {
  try {
    const today = getTodayDate();
    await ResumeRoastLimit.findOneAndUpdate(
      { userId, date: today },
      { $inc: { count: 1 } },
      { new: true }
    );
    return true;
  } catch (err) {
    logger.error('Error incrementing Resume roast:', err);
    return false;
  }
}

module.exports = {
  getUserType,
  getTodayDate,
  canUseLinkedInRoast,
  incrementLinkedInRoast,
  canUseResumeRoast,
  incrementResumeRoast,
  LIMITS
};