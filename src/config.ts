const ENV_POLL_INTERVAL = "INK_PICTURE_POLL_INTERVAL";
const ENV_POSITION_POLL_INTERVAL = "INK_PICTURE_POSITION_POLL_INTERVAL";
const ENV_CACHE_SIZE = "INK_PICTURE_CACHE_SIZE";

let _pollInterval: number | undefined;
let _positionPollInterval: number | undefined;
let _cacheSize: number | undefined;

function parseNumber(
  raw: string | undefined,
  fallback: number,
  min: number,
): number {
  const n = raw ? parseInt(raw, 10) : fallback;
  return Number.isFinite(n) && n >= min ? n : fallback;
}

export function getPollInterval(): number {
  if (_pollInterval !== undefined) return _pollInterval;
  return parseNumber(process.env[ENV_POLL_INTERVAL], 16, 1);
}

export function getPositionPollInterval(): number {
  if (_positionPollInterval !== undefined) return _positionPollInterval;
  return parseNumber(process.env[ENV_POSITION_POLL_INTERVAL], 16, 1);
}

export function getCacheSize(): number {
  if (_cacheSize !== undefined) return _cacheSize;
  return parseNumber(process.env[ENV_CACHE_SIZE], 10, 0);
}

export interface Config {
  pollInterval: number;
  positionPollInterval: number;
  cacheSize: number;
}

export function setConfig(updates: Partial<Config>): void {
  if (updates.pollInterval !== undefined) {
    _pollInterval = Math.max(1, updates.pollInterval);
  }
  if (updates.positionPollInterval !== undefined) {
    _positionPollInterval = Math.max(1, updates.positionPollInterval);
  }
  if (updates.cacheSize !== undefined) {
    _cacheSize = Math.max(0, updates.cacheSize);
  }
}
