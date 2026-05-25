/**
 * cache.js — Tiny in-process TTL cache
 *
 * Avoids hammering MongoDB for data that barely changes between requests.
 * Uses a plain Map so there are zero extra dependencies.
 *
 * Usage:
 *   import { getCache, setCache, invalidateCache } from '../config/cache.js';
 *
 *   // In your controller:
 *   const cached = getCache('platform_stats');
 *   if (cached) return res.json(cached);
 *   const data = await expensiveQuery();
 *   setCache('platform_stats', data, 30); // cache 30 seconds
 *   return res.json(data);
 */

const store = new Map(); // key → { value, expiresAt }

/**
 * Read a cached value. Returns null on miss or expiry.
 */
export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Store a value with a TTL in seconds (default 60s).
 */
export function setCache(key, value, ttlSeconds = 60) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Manually invalidate one or more keys (call after a write that changes the data).
 * Accepts a string, regex, or array of strings/regexes.
 */
export function invalidateCache(pattern) {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  for (const p of patterns) {
    if (typeof p === 'string') {
      store.delete(p);
    } else if (p instanceof RegExp) {
      for (const key of store.keys()) {
        if (p.test(key)) store.delete(key);
      }
    }
  }
}

/**
 * Middleware factory: wrap a route handler with automatic TTL caching.
 *
 *   router.get('/stats', cacheMiddleware('platform_stats', 30), getPlatformStats);
 */
export function cacheMiddleware(key, ttlSeconds = 60) {
  return (req, res, next) => {
    const cached = getCache(key);
    if (cached) {
      // Serve stale-while-revalidate feel: tell browser it can cache too
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }
    res.set('X-Cache', 'MISS');

    // Intercept res.json so we can cache the payload
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
}
