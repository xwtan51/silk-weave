import type { Pattern } from '../types';
import { fetchPatterns, savePatterns as apiSavePatterns } from './api';

const STORAGE_KEY = 'silkweave-user-patterns';

/* ---- local fallback ---- */

function localLoad(): Pattern[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function localSave(patterns: Pattern[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
}

/* ---- primary: server, fallback: localStorage ---- */

export async function loadUserPatterns(limit?: number, offset?: number, sort?: string, seed?: number): Promise<{ items: Pattern[]; total: number; hasMore: boolean; seed?: number }> {
  try {
    const result = await fetchPatterns(limit, offset, sort, seed);
    localSave(result.items);
    return result;
  } catch {
    const all = localLoad();
    const start = offset || 0;
    const end = limit ? start + limit : all.length;
    return { items: all.slice(start, end), total: all.length, hasMore: end < all.length };
  }
}

/** Load all patterns at once (for wallpaper, profile, admin) */
export async function loadAllPatterns(): Promise<Pattern[]> {
  try {
    const result = await fetchPatterns();
    localSave(result.items);
    return result.items;
  } catch {
    return localLoad();
  }
}

export async function saveUserPatterns(patterns: Pattern[]): Promise<void> {
  localSave(patterns);
  try {
    await apiSavePatterns(patterns);
  } catch { /* offline — already saved locally */ }
}

export async function addUserPattern(pattern: Pattern): Promise<Pattern[]> {
  const localPatterns = localLoad().filter((p) => p.id !== pattern.id);
  const nextLocalPatterns = [...localPatterns, pattern];
  localSave(nextLocalPatterns);

  try {
    await apiSavePatterns([pattern]);
  } catch { /* offline — already saved locally */ }

  return nextLocalPatterns;
}
