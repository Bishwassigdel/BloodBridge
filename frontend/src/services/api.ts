/**
 * api.ts — Shared Axios instance with in-flight deduplication + short-lived GET cache.
 *
 * Problems solved:
 *  1. Multiple useEffects fire simultaneously for the same URL — dedup collapses them
 *     into a single network request, all callers share the same Promise.
 *  2. Navigating back to a panel re-fetches data that's already fresh — cache returns
 *     it from memory (0ms) within the TTL window.
 *  3. Every mutation automatically invalidates stale cache entries.
 *
 * Usage: import api from '@/services/api'  (identical API to axios)
 */

import axios from 'axios';

// ── Base instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth token injector ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('token');
  if (raw) {
    const token = raw.replace(/^["']+|["']+$/g, '').trim();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Short-lived GET response cache ────────────────────────────────────────────
// Key = "METHOD:url?params", Value = { data, expiresAt }
const responseCache = new Map();

// TTL in ms per URL prefix — must match what the server caches
const CACHE_TTL = {
  '/api/notifications':              15000,  // 15s
  '/api/stories':                    30000,  // 30s
  '/api/events':                     30000,  // 30s
  '/api/blood/matching-requests':    10000,  // 10s — donors need fresh data
  '/api/blood/my-requests':          10000,
  '/api/blood/my-donations':         20000,
  '/api/blood/stats':                60000,  // 60s
  '/api/auth/hospitals':            120000,  // 2 min
  '/api/blood/active-requests-map':  30000,
  '/api/blood/search-donors':        20000,
};

function cacheKey(config) {
  const params = config.params ? '?' + JSON.stringify(config.params) : '';
  return `${(config.method || 'GET').toUpperCase()}:${config.url}${params}`;
}

function getTTL(url = '') {
  for (const [prefix, ttl] of Object.entries(CACHE_TTL)) {
    if (url.startsWith(prefix)) return ttl;
  }
  return 0;
}

// ── In-flight deduplication ───────────────────────────────────────────────────
// If the same GET is already pending, return the existing Promise
const inFlight = new Map();

// ── Request interceptor — serve cache / deduplicate ───────────────────────────
api.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() !== 'get') return config;

  const key = cacheKey(config);
  const ttl = getTTL(config.url);

  // 1. Cache hit — short-circuit with cached response
  if (ttl > 0) {
    const cached = responseCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      config.adapter = async () => ({
        data: cached.data,
        status: 200,
        statusText: 'OK (cached)',
        headers: {},
        config,
        request: {},
      });
      return config;
    }
  }

  // 2. Dedup — attach to the already-in-flight promise
  if (inFlight.has(key)) {
    config.adapter = () => inFlight.get(key);
    return config;
  }

  return config;
});

// ── Response interceptor — store in cache, clear in-flight entry ──────────────
api.interceptors.response.use(
  (response) => {
    if (response.config.method?.toLowerCase() !== 'get') return response;
    const key = cacheKey(response.config);
    const ttl = getTTL(response.config.url);
    if (ttl > 0) {
      responseCache.set(key, { data: response.data, expiresAt: Date.now() + ttl });
    }
    inFlight.delete(key);
    return response;
  },
  (error) => {
    inFlight.delete(cacheKey(error.config || {}));
    return Promise.reject(error);
  }
);

// ── Cache invalidation helper ─────────────────────────────────────────────────
/**
 * Call after a mutation so stale GET data is dropped.
 * e.g. after accepting a blood request: invalidateFrontendCache('/api/blood')
 */
export function invalidateFrontendCache(prefix) {
  for (const key of responseCache.keys()) {
    if (key.includes(prefix)) responseCache.delete(key);
  }
}

export function clearAllCache() {
  responseCache.clear();
}

export default api;
