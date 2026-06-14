import type { Pattern } from '../types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}

/* ---- patterns ---- */

export interface PaginatedPatterns {
  items: Pattern[];
  total: number;
  hasMore: boolean;
}

export async function fetchPatterns(limit?: number, offset?: number, sort?: string, seed?: number): Promise<PaginatedPatterns> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  if (sort) params.set('sort', sort);
  if (seed) params.set('seed', String(seed));

  if (limit) {
    const res = await get<PaginatedPatterns & { seed?: number }>(`/patterns?${params.toString()}`);
    return res;
  }
  const all = await get<Pattern[]>(`/patterns?${params.toString()}`);
  return { items: all, total: all.length, hasMore: false };
}

export async function savePatterns(patterns: Pattern[]): Promise<void> {
  await post('/patterns', patterns);
}

/* ---- likes ---- */

export async function fetchLikes(): Promise<string[]> {
  return get<string[]>('/likes');
}

export async function saveLikes(likes: string[]): Promise<void> {
  await post('/likes', likes);
}

/* ---- saves ---- */

export async function fetchSaves(): Promise<string[]> {
  return get<string[]>('/saves');
}

export async function saveSaves(saves: string[]): Promise<void> {
  await post('/saves', saves);
}

/* ---- follows ---- */

export async function fetchFollows(): Promise<string[]> {
  return get<string[]>('/follows');
}

export async function saveFollows(follows: string[]): Promise<void> {
  await post('/follows', follows);
}

/* ---- profile ---- */

export async function fetchProfile(): Promise<{ name: string; bio: string }> {
  return get<{ name: string; bio: string }>('/profile');
}

export async function saveProfile(profile: { name: string; bio: string }): Promise<void> {
  await post('/profile', profile);
}

/* ---- social graph ---- */

export async function fetchUserFollowing(userId: string): Promise<string[]> {
  return get<string[]>(`/social/${userId}/following`);
}

export async function fetchUserFollowers(userId: string): Promise<string[]> {
  return get<string[]>(`/social/${userId}/followers`);
}

export async function fetchUserCounts(userId: string): Promise<{ following: number; followers: number }> {
  return get<{ following: number; followers: number }>(`/social/${userId}/counts`);
}

/* ---- comments ---- */

export async function fetchComments(patternId: string): Promise<any[]> {
  return get<any[]>(`/comments/${patternId}`);
}

export async function sendComment(body: { patternId: string; authorName: string; authorId: string; text: string }): Promise<any> {
  return post<any>('/comments', body);
}

/* ---- history ---- */

export async function fetchHistory(): Promise<string[]> {
  return get<string[]>('/history');
}

export async function saveHistory(history: string[]): Promise<void> {
  await post('/history', history);
}
