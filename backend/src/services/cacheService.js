import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'plan_cache.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(CACHE_FILE))) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
}

// Load cache from disk
let planCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    planCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to load cache file:', err);
    planCache = {};
  }
}

function normalizeQuery(query) {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

function generateHash(query) {
  const normalized = normalizeQuery(query);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function getPlanFromCache(query) {
  const hash = generateHash(query);
  const entry = planCache[hash];
  
  if (entry) {
    entry.usage_count = (entry.usage_count || 0) + 1;
    // We don't necessarily need to save to disk on every hit, but we can if we want to track usage count long-term.
    console.log(`🎯 Cache HIT for query hash: ${hash.substring(0, 8)}... (Used ${entry.usage_count} times)`);
    return entry.plan;
  }
  
  console.log(`🔍 Cache MISS for query hash: ${hash.substring(0, 8)}...`);
  return null;
}

export function savePlanToCache(query, plan) {
  const hash = generateHash(query);
  planCache[hash] = {
    query: query,
    plan: plan,
    usage_count: (planCache[hash]?.usage_count || 0),
    timestamp: new Date().toISOString()
  };

  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(planCache, null, 2));
    console.log(`💾 Persisted new plan to cache: ${hash.substring(0, 8)}...`);
  } catch (err) {
    console.error('Failed to save cache to disk:', err);
  }
}

export function getFullCache() {
  return planCache;
}
