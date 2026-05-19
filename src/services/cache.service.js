const { getClient } = require('../config/redis');

const cache = {
  async get(key) {
    try { const c = getClient(); if (!c) return null; const v = await c.get(key); return v ? JSON.parse(v) : null; } catch { return null; }
  },
  async set(key, value, ttl = 300) {
    try { const c = getClient(); if (!c) return; await c.setex(key, ttl, JSON.stringify(value)); } catch {}
  },
  async del(key) {
    try { const c = getClient(); if (!c) return; await c.del(key); } catch {}
  },
  async incr(key, ttl = 86400) {
    try { const c = getClient(); if (!c) return 0; const v = await c.incr(key); if (v === 1) await c.expire(key, ttl); return v; } catch { return 0; }
  },
  async getCount(key) {
    try { const c = getClient(); if (!c) return 0; return parseInt(await c.get(key) || '0'); } catch { return 0; }
  },
  // Daily usage limit check
  async checkLimit(userId, action, limit) {
    if (limit === -1) return { ok: true, used: 0 };
    const key = `lim:${userId}:${action}:${new Date().toISOString().split('T')[0]}`;
    const used = await this.getCount(key);
    return { ok: used < limit, used, limit, key };
  },
  async useLimit(userId, action) {
    const key = `lim:${userId}:${action}:${new Date().toISOString().split('T')[0]}`;
    return this.incr(key, 86400);
  },
};
module.exports = cache;
