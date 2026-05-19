const cache = require('./cache.service');
const logger = require('../config/logger');

const WEBSITE_UPSELL_URL = process.env.WEBSITE_URL || 'https://yuvorai-ad-web.vercel.app';
const AD_RECOVERY_URL = process.env.AD_RECOVERY_URL || 'https://molecularshindy.com/s7ze6tpvd?key=d5d00e3e7c5b68210eb36ea8a46d3a3c';

/**
 * Check if Link 1 (website) should be shown
 */
async function shouldShowLink1(userId) {
  try {
    const lastLink1 = await cache.get(`link1_shown_${userId}`);
    if (!lastLink1) return true;
    
    const timeDiff = Date.now() - parseInt(lastLink1);
    return timeDiff > 30 * 60 * 1000; // 30 min cooldown
  } catch (err) {
    logger.error('Error checking Link1:', err);
    return true;
  }
}

/**
 * Record Link 1 shown
 */
async function recordLink1Shown(userId) {
  try {
    await cache.set(`link1_shown_${userId}`, Date.now().toString(), 3600);
  } catch (err) {
    logger.error('Error recording Link1:', err);
  }
}

/**
 * Check if user can use ad recovery for feature
 */
async function canUseAdRecovery(userId, feature) {
  try {
    const adTracking = await cache.get(`ad_recovery_${userId}`);
    
    if (!adTracking) {
      return { canUse: true, alreadyUsed: false };
    }

    const tracking = JSON.parse(adTracking);
    const featureAd = tracking[feature] || { ad_used: false, bonus_used: false };

    return {
      canUse: !featureAd.ad_used,
      alreadyUsed: featureAd.ad_used && featureAd.bonus_used
    };
  } catch (err) {
    logger.error('Error checking ad recovery:', err);
    return { canUse: true, alreadyUsed: false };
  }
}

/**
 * Mark ad as used for feature
 */
async function markAdUsed(userId, feature) {
  try {
    let tracking = {};
    const existing = await cache.get(`ad_recovery_${userId}`);
    
    if (existing) {
      tracking = JSON.parse(existing);
    }

    if (!tracking[feature]) {
      tracking[feature] = {};
    }

    tracking[feature].ad_used = true;
    tracking[feature].bonus_used = true;
    tracking[feature].used_at = Date.now();

    await cache.set(`ad_recovery_${userId}`, JSON.stringify(tracking), 86400);
  } catch (err) {
    logger.error('Error marking ad used:', err);
  }
}

/**
 * Get upsell/ad links
 */
function getUpsellLinks() {
  return {
    website: WEBSITE_UPSELL_URL,
    ads: AD_RECOVERY_URL
  };
}

module.exports = {
  shouldShowLink1,
  recordLink1Shown,
  canUseAdRecovery,
  markAdUsed,
  getUpsellLinks,
  WEBSITE_UPSELL_URL,
  AD_RECOVERY_URL
};