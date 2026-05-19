// ── Opportunity Sources: Adzuna + Internshala + Remotive ─────────────────────
const axios = require('axios');
const cheerio = require('cheerio');
const Opportunity = require('../../models/Opportunity');
const env = require('../../config/env');
const logger = require('../../config/logger');

// ── Adzuna API ────────────────────────────────────────────────────────────────
async function fetchAdzuna() {
  if (!env.adzuna.appId || !env.adzuna.key) return [];
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${env.adzuna.appId}&app_key=${env.adzuna.key}&results_per_page=20&what=software+engineer&where=India&content-type=application/json`;
    const { data } = await axios.get(url, { timeout: 10000 });
    return (data.results || []).map(j => ({
      title:    (j.title || 'Software Engineer').substring(0, 100),
      company:  (j.company?.display_name || 'Company').substring(0, 80),
      location: (j.location?.display_name || 'India').substring(0, 80),
      salary:   j.salary_min ? `₹${Math.round(j.salary_min / 12000)}K/mo` : 'Not disclosed',
      type:     j.contract_time === 'part_time' ? 'internship' : 'job',
      url:      j.redirect_url,
      source:   'Adzuna',
    })).filter(j => j.url);
  } catch (err) { logger.warn('Adzuna fetch failed:', err.message); return []; }
}

// ── Remotive API (no key needed) ──────────────────────────────────────────────
async function fetchRemotive() {
  try {
    const { data } = await axios.get('https://remotive.com/api/remote-jobs?category=software-dev&limit=15', { timeout: 10000 });
    return (data.jobs || []).map(j => ({
      title:    (j.title || 'Developer').substring(0, 100),
      company:  (j.company_name || 'Company').substring(0, 80),
      location: 'Remote 🌍',
      salary:   j.salary || 'Not disclosed',
      type:     'remote',
      url:      j.url,
      source:   'Remotive',
    })).filter(j => j.url);
  } catch (err) { logger.warn('Remotive fetch failed:', err.message); return []; }
}

// ── Internshala Scraper (robust selectors) ────────────────────────────────────
async function fetchInternshala() {
  try {
    const { data } = await axios.get('https://internshala.com/internships/computer-science-internship', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    });
    const $ = cheerio.load(data);
    const results = [];

    // Try multiple selectors for Internshala's changing HTML
    const containers = $('.individual_internship, .internship-item, [id^="internship_"]');
    containers.each((_, el) => {
      const title   = $(el).find('.profile, .job-title, h3').first().text().trim();
      const company = $(el).find('.company_name, .company-name, .company a').first().text().trim();
      const loc     = $(el).find('.location_link, .location, .city').first().text().trim() || 'Remote';
      const stipend = $(el).find('.stipend, .salary').first().text().trim() || 'Unpaid';
      const href    = $(el).find('a.view_detail_button, a.btn-primary, a[href*="/internship/detail"]').first().attr('href') || '';
      const link    = href ? (href.startsWith('http') ? href : 'https://internshala.com' + href) : '';
      if (title && company && link) {
        results.push({ title: title.substring(0, 100), company: company.substring(0, 80), location: loc.substring(0, 80), salary: stipend, type: 'internship', url: link, source: 'Internshala' });
      }
      if (results.length >= 10) return false;
    });
    return results;
  } catch (err) { logger.warn('Internshala fetch failed:', err.message); return []; }
}

// ── Hackathon listings (Devpost RSS) ─────────────────────────────────────────
async function fetchHackathons() {
  try {
    const { data } = await axios.get('https://devpost.com/api/hackathons?order_by=deadline&status=open', { timeout: 8000 });
    const hacks = (data.hackathons || []).slice(0, 5);
    return hacks.map(h => ({
      title:    (h.title || 'Hackathon').substring(0, 100),
      company:  'Devpost',
      location: h.themes?.map(t => t.name).join(', ') || 'Online',
      salary:   h.prize_amount ? `$${h.prize_amount} prize` : 'Prizes available',
      type:     'hackathon',
      url:      h.url,
      source:   'Devpost',
    })).filter(h => h.url);
  } catch (err) { logger.warn('Hackathons fetch failed:', err.message); return []; }
}

// ── Fetch all + dedup + save to DB ────────────────────────────────────────────
async function fetchAndSave() {
  const [a, r, i, h] = await Promise.allSettled([
    fetchAdzuna(), fetchRemotive(), fetchInternshala(), fetchHackathons()
  ]);
  const all = [
    ...(a.status === 'fulfilled' ? a.value : []),
    ...(r.status === 'fulfilled' ? r.value : []),
    ...(i.status === 'fulfilled' ? i.value : []),
    ...(h.status === 'fulfilled' ? h.value : []),
  ].filter(o => o.url && o.title && o.company);

  let saved = 0;
  for (const opp of all) {
    try {
      await Opportunity.findOneAndUpdate(
        { url: opp.url },
        { ...opp, isActive: true, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      saved++;
    } catch (err) {
      logger.debug('Opp save skip:', err.message);
    }
  }

  // Deactivate stale opps older than 7 days
  await Opportunity.updateMany(
    { updatedAt: { $lt: new Date(Date.now() - 7 * 86400000) } },
    { isActive: false }
  );

  logger.info(`Opportunities: ${saved}/${all.length} saved/updated`);
  return saved;
}

// ── Get opportunities for user ────────────────────────────────────────────────
async function getOpps(user, limit = 10, type = null) {
  const query = { isActive: true };
  if (type) query.type = type;
  const opps = await Opportunity.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  // Fallback: if DB empty, try fetching live
  if (opps.length === 0) {
    logger.info('DB empty, fetching fresh opps...');
    await fetchAndSave();
    return Opportunity.find({ isActive: true, ...(type ? { type } : {}) })
      .sort({ createdAt: -1 }).limit(limit).lean();
  }
  return opps;
}

module.exports = { fetchAndSave, getOpps, fetchAdzuna, fetchRemotive, fetchInternshala };
