import { fetchLikes, saveLikes, fetchSaves, saveSaves, fetchFollows, saveFollows, fetchHistory, saveHistory, fetchProfile, saveProfile, fetchUserFollowing, fetchUserFollowers, fetchUserCounts, fetchComments, sendComment } from './api';

const LIKES_KEY = 'silkweave-likes';
const SAVES_KEY = 'silkweave-saves';
const HISTORY_KEY = 'silkweave-history';

/* ---- local fallback ---- */

function localLoad(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function localSave(key: string, data: string[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ---- likes ---- */

async function loadLikes(): Promise<string[]> {
  try {
    const server = await fetchLikes();
    localSave(LIKES_KEY, server);
    return server;
  } catch { return localLoad(LIKES_KEY); }
}

async function persistLikes(likes: string[]): Promise<void> {
  localSave(LIKES_KEY, likes);
  try { await saveLikes(likes); } catch { /* offline */ }
}

export async function getLikes(): Promise<string[]> {
  return loadLikes();
}

export async function toggleLike(patternId: string): Promise<boolean> {
  const likes = await loadLikes();
  const idx = likes.indexOf(patternId);
  if (idx >= 0) { likes.splice(idx, 1); await persistLikes(likes); return false; }
  likes.push(patternId);
  await persistLikes(likes);
  return true;
}

export async function isLiked(patternId: string): Promise<boolean> {
  return (await loadLikes()).includes(patternId);
}

/* ---- saves ---- */

async function loadSaves(): Promise<string[]> {
  try {
    const server = await fetchSaves();
    localSave(SAVES_KEY, server);
    return server;
  } catch { return localLoad(SAVES_KEY); }
}

async function persistSaves(saves: string[]): Promise<void> {
  localSave(SAVES_KEY, saves);
  try { await saveSaves(saves); } catch { /* offline */ }
}

export async function getSaves(): Promise<string[]> {
  return loadSaves();
}

export async function toggleSave(patternId: string): Promise<boolean> {
  const saves = await loadSaves();
  const idx = saves.indexOf(patternId);
  if (idx >= 0) { saves.splice(idx, 1); await persistSaves(saves); return false; }
  saves.push(patternId);
  await persistSaves(saves);
  return true;
}

export async function isSaved(patternId: string): Promise<boolean> {
  return (await loadSaves()).includes(patternId);
}

/* ---- history ---- */

async function loadHistory(): Promise<string[]> {
  try {
    const server = await fetchHistory();
    localSave(HISTORY_KEY, server);
    return server;
  } catch { return localLoad(HISTORY_KEY); }
}

async function persistHistory(history: string[]): Promise<void> {
  localSave(HISTORY_KEY, history);
  try { await saveHistory(history); } catch { /* offline */ }
}

export async function getHistory(): Promise<string[]> {
  return loadHistory();
}

const FOLLOWS_KEY = 'silkweave-follows';

async function loadFollows(): Promise<string[]> {
  try { const s = await fetchFollows(); localSave(FOLLOWS_KEY, s); return s; }
  catch { return localLoad(FOLLOWS_KEY); }
}

async function persistFollows(follows: string[]): Promise<void> {
  localSave(FOLLOWS_KEY, follows);
  try { await saveFollows(follows); } catch { /* offline */ }
}

export async function getFollows(): Promise<string[]> {
  return loadFollows();
}

export async function toggleFollow(userId: string): Promise<boolean> {
  const follows = await loadFollows();
  const idx = follows.indexOf(userId);
  if (idx >= 0) { follows.splice(idx, 1); await persistFollows(follows); return false; }
  follows.push(userId);
  await persistFollows(follows);
  return true;
}

export async function isFollowing(userId: string): Promise<boolean> {
  return (await loadFollows()).includes(userId);
}

/* ---- profile ---- */

export async function getProfile(): Promise<{ name: string; bio: string }> {
  try { return await fetchProfile(); }
  catch { return { name: '纹样爱好者', bio: '你的纹样之旅' }; }
}

export async function updateProfile(profile: { name: string; bio: string }): Promise<void> {
  try { await saveProfile(profile); } catch { /* offline */ }
}

/* ---- social graph ---- */

export async function getUserFollowing(userId: string): Promise<string[]> {
  try { return await fetchUserFollowing(userId); } catch { return []; }
}

export async function getUserFollowers(userId: string): Promise<string[]> {
  try { return await fetchUserFollowers(userId); } catch { return []; }
}

export async function getUserCounts(userId: string): Promise<{ following: number; followers: number }> {
  try { return await fetchUserCounts(userId); } catch { return { following: 0, followers: 0 }; }
}

/* ---- comments ---- */

export async function getComments(patternId: string): Promise<any[]> {
  try { return await fetchComments(patternId); } catch { return []; }
}

export async function addComment(patternId: string, authorName: string, authorId: string, text: string): Promise<any> {
  return sendComment({ patternId, authorName, authorId, text });
}

export async function getUserPatterns(userId: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/user/${userId}/patterns`);
    if (!res.ok) throw new Error('failed');
    return res.json();
  } catch { return []; }
}

export async function getUserLikes(userId: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/user/${userId}/likes`);
    if (!res.ok) throw new Error('failed');
    return res.json();
  } catch { return []; }
}

export async function getUserSaves(userId: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/user/${userId}/saves`);
    if (!res.ok) throw new Error('failed');
    return res.json();
  } catch { return []; }
}

export async function getUserComments(userId: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/user/${userId}/comments`);
    if (!res.ok) throw new Error('failed');
    return res.json();
  } catch { return []; }
}

/* ---- delete ---- */

export async function deletePattern(patternId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/patterns/${patternId}`, { method: 'DELETE' });
    return res.ok;
  } catch { return false; }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    return res.ok;
  } catch { return false; }
}

/* ---- history ---- */

export async function addToHistory(patternId: string): Promise<void> {
  const history = await loadHistory();
  const filtered = history.filter((id) => id !== patternId);
  filtered.unshift(patternId);
  await persistHistory(filtered.slice(0, 20));
}
