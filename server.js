import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, 'silkweave.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Migration: add api_key to existing profile tables
try { db.exec('ALTER TABLE profile ADD COLUMN api_key TEXT DEFAULT \'\''); } catch { /* column exists */ }

// ---- schema ----
db.exec(`
  CREATE TABLE IF NOT EXISTS patterns (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, dynasty TEXT DEFAULT '', meaning TEXT DEFAULT '',
    scene TEXT DEFAULT '', story TEXT DEFAULT '', source TEXT DEFAULT '',
    svg_id TEXT NOT NULL DEFAULT 'custom', custom_paths TEXT, custom_view_box TEXT,
    custom_image TEXT, author_name TEXT DEFAULT '', author_id TEXT DEFAULT '',
    published_at TEXT DEFAULT '', lang TEXT DEFAULT 'zh'
  );
  CREATE TABLE IF NOT EXISTS likes (pattern_id TEXT NOT NULL, user_id TEXT NOT NULL DEFAULT 'self', PRIMARY KEY (pattern_id, user_id));
  CREATE TABLE IF NOT EXISTS saves (pattern_id TEXT NOT NULL, user_id TEXT NOT NULL DEFAULT 'self', PRIMARY KEY (pattern_id, user_id));
  CREATE TABLE IF NOT EXISTS follows (user_id TEXT NOT NULL, follower_id TEXT NOT NULL DEFAULT 'self', PRIMARY KEY (user_id, follower_id));
  CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, pattern_id TEXT NOT NULL, viewed_at TEXT DEFAULT (datetime('now')), user_id TEXT NOT NULL DEFAULT 'self');
  CREATE TABLE IF NOT EXISTS profile (user_id TEXT PRIMARY KEY DEFAULT 'self', name TEXT DEFAULT '纹样爱好者', bio TEXT DEFAULT '你的纹样之旅', api_key TEXT DEFAULT '');
  CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, pattern_id TEXT NOT NULL, author_name TEXT DEFAULT '', author_id TEXT DEFAULT '', text TEXT DEFAULT '', created_at TEXT DEFAULT '');
`);

// ---- seed on first run ----
const row = db.prepare('SELECT COUNT(*) as n FROM patterns').get();
if (row.n === 0) {
  console.log('Seeding database...');

  // Patterns
  const seed = JSON.parse(readFileSync(join(__dirname, 'src', 'data', 'seed.json'), 'utf-8'));
  const insP = db.prepare(`INSERT OR IGNORE INTO patterns (id,name,dynasty,meaning,scene,story,source,svg_id,custom_paths,custom_view_box,custom_image,author_name,author_id,published_at,lang) VALUES (@id,@name,@dynasty,@meaning,@scene,@story,@source,@svgId,@cpaths,@cviewBox,@cimage,@authorName,@authorId,@publishedAt,@lang)`);
  const seedTx = db.transaction(() => {
    for (const p of seed) {
      insP.run({ ...p, cpaths: p.customPaths ? JSON.stringify(p.customPaths) : null, cviewBox: p.customViewBox || null, cimage: p.customImage || null });
    }
  });
  seedTx();
  console.log(`  Patterns: ${seed.length}`);

  // Comments
  const cmtPath = join(__dirname, 'server-comments.json');
  if (existsSync(cmtPath)) {
    const comments = JSON.parse(readFileSync(cmtPath, 'utf-8'));
    const insC = db.prepare('INSERT OR IGNORE INTO comments (id,pattern_id,author_name,author_id,text,created_at) VALUES (@id,@patternId,@authorName,@authorId,@text,@createdAt)');
    const cmtTx = db.transaction(() => { for (const c of comments) insC.run(c); });
    cmtTx();
    console.log(`  Comments: ${comments.length}`);
  }

  // Social graph (follows)
  let followCount = 0;
  const sgPath = join(__dirname, 'src', 'data', 'social-graph.json');
  if (existsSync(sgPath)) {
    const graph = JSON.parse(readFileSync(sgPath, 'utf-8'));
    const insFG = db.prepare('INSERT OR IGNORE INTO follows (user_id, follower_id) VALUES (?, ?)');
    for (const [followerId, followingIds] of Object.entries(graph)) {
      for (const userId of followingIds) {
        insFG.run(userId, followerId);
        followCount++;
      }
    }
  }

  // Seed likes and saves
  const allUserIds = db.prepare("SELECT DISTINCT author_id FROM patterns WHERE author_id != '' AND author_id != 'self'").all().map(r => r.author_id);
  const patternIds = db.prepare("SELECT id FROM patterns").all().map(r => r.id);
  const insLike = db.prepare('INSERT OR IGNORE INTO likes (pattern_id, user_id) VALUES (?, ?)');
  const insSave = db.prepare('INSERT OR IGNORE INTO saves (pattern_id, user_id) VALUES (?, ?)');
  let likeCount = 0, saveCount = 0;
  for (const pid of patternIds) {
    const s = parseInt(pid.split('-')[1] || '0', 10);
    const nLikes = 8 + (s % 35);
    const nSaves = 3 + (s % 20);
    const shuffled = [...allUserIds].sort(() => (s * 7) % 13 - 0.5);
    for (let i = 0; i < nLikes && i < shuffled.length; i++) { insLike.run(pid, shuffled[i]); likeCount++; }
    for (let i = 0; i < nSaves && i < shuffled.length; i++) { insSave.run(pid, shuffled[(i + 3) % shuffled.length]); saveCount++; }
  }
  console.log(`  Likes: ${likeCount}, Saves: ${saveCount}`);

  // Seed self user's social data (likes, saves, follows, followers, comments)
  const selfLikes = [...patternIds].sort(() => Math.random() - 0.5).slice(0, 15 + Math.floor(Math.random() * 15));
  for (const pid of selfLikes) { insLike.run(pid, 'self'); likeCount++; }

  const selfSaves = [...patternIds].sort(() => Math.random() - 0.5).slice(0, 8 + Math.floor(Math.random() * 12));
  for (const pid of selfSaves) { insSave.run(pid, 'self'); saveCount++; }

  // Self follows some users, and some users follow self
  const insF2 = db.prepare('INSERT OR IGNORE INTO follows (user_id, follower_id) VALUES (?, ?)');
  const shuffledUsers = [...allUserIds].sort(() => Math.random() - 0.5);
  const selfFollowing = shuffledUsers.slice(0, 8 + Math.floor(Math.random() * 12));
  const selfFollowers = shuffledUsers.slice(selfFollowing.length, selfFollowing.length + 6 + Math.floor(Math.random() * 10));
  for (const uid of selfFollowing) { insF2.run(uid, 'self'); followCount++; }
  for (const uid of selfFollowers) { insF2.run('self', uid); followCount++; }

  // Self comments
  const selfCommentTexts = [
    'Love this pattern! The colors are amazing.',
    'Beautiful work, saved for inspiration.',
    'This is so elegant! Great design sense.',
    'Amazing details, how did you do this?',
    'This pattern reminds me of traditional art.',
    'Really nice composition and color choices.',
    'Absolutely stunning! Keep creating.',
    'The palette here is so harmonious.',
    'Inspired by your work, thank you for sharing!',
    'This would look great as wallpaper.',
    'Simple yet beautiful, love the minimal approach.',
    'Great use of the traditional motif!',
    'The cultural fusion here is brilliant.',
    'Wow, this is next level! 🔥',
    'Such a unique take on the pattern.',
  ];
  const selfCommentTargets = [...patternIds].sort(() => Math.random() - 0.5).slice(0, 5 + Math.floor(Math.random() * 8));
  const insC = db.prepare('INSERT OR IGNORE INTO comments (id, pattern_id, author_name, author_id, text, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  for (const pid of selfCommentTargets) {
    const text = selfCommentTexts[Math.floor(Math.random() * selfCommentTexts.length)];
    const id = `cmt-self-${pid}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    // Random time in the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    insC.run(id, pid, 'self', 'self', text, createdAt);
  }

  console.log(`  Self: ${selfLikes.length} likes, ${selfSaves.length} saves, ${selfFollowing.length} following, ${selfFollowers.length} followers, ${selfCommentTargets.length} comments`);

  // Profile
  db.prepare("INSERT OR IGNORE INTO profile (user_id,name,bio) VALUES ('self','纹样爱好者','你的纹样之旅')").run();
  console.log('Database seeded.');
}

// ---- helpers ----
function parsePattern(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    dynasty: row.dynasty,
    meaning: row.meaning,
    scene: row.scene,
    story: row.story,
    source: row.source,
    svgId: row.svg_id,
    customPaths: row.custom_paths ? JSON.parse(row.custom_paths) : undefined,
    customViewBox: row.custom_view_box || undefined,
    customImage: row.custom_image || undefined,
    authorName: row.author_name,
    authorId: row.author_id,
    publishedAt: row.published_at,
    lang: row.lang,
    likesCount: row.likes_count || 0,
    savesCount: row.saves_count || 0,
    isLiked: !!row.is_liked,
    isSaved: !!row.is_saved,
  };
}

// ---- Express ----
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ---- patterns ----
const PATTERN_QUERY = `
  SELECT p.*,
    (SELECT COUNT(*) FROM likes WHERE pattern_id = p.id) as likes_count,
    (SELECT COUNT(*) FROM saves WHERE pattern_id = p.id) as saves_count,
    EXISTS(SELECT 1 FROM likes WHERE pattern_id = p.id AND user_id = 'self') as is_liked,
    EXISTS(SELECT 1 FROM saves WHERE pattern_id = p.id AND user_id = 'self') as is_saved
  FROM patterns p
`;

// In-memory shuffle cache: seed → shuffled pattern IDs
const shuffleCache = new Map();

function getShuffledIds(seed) {
  if (shuffleCache.has(seed)) return shuffleCache.get(seed);
  const ids = db.prepare('SELECT id FROM patterns').all().map(r => r.id);
  // Fisher-Yates with seeded pseudo-random
  let s = seed;
  const rng = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  shuffleCache.set(seed, ids);
  // Limit cache size
  if (shuffleCache.size > 20) {
    const first = shuffleCache.keys().next().value;
    shuffleCache.delete(first);
  }
  return ids;
}

app.get('/api/patterns', (req, res) => {
  const limit = parseInt(req.query.limit) || undefined;
  const offset = parseInt(req.query.offset) || 0;
  const sort = req.query.sort || 'newest';
  const seed = parseInt(req.query.seed) || Math.floor(Math.random() * 2147483647);
  const total = db.prepare('SELECT COUNT(*) as n FROM patterns').get().n;

  let rows;
  if (sort === 'random') {
    const shuffledIds = getShuffledIds(seed);
    const pageIds = shuffledIds.slice(offset, limit ? offset + limit : undefined);
    const placeholders = pageIds.map(() => '?').join(',');
    if (pageIds.length > 0) {
      rows = db.prepare(`${PATTERN_QUERY} WHERE p.id IN (${placeholders})`).all(...pageIds);
      // Reorder to match shuffled order
      const rowMap = new Map(rows.map(r => [r.id, r]));
      rows = pageIds.map(id => rowMap.get(id)).filter(Boolean);
    } else {
      rows = [];
    }
  } else {
    if (limit) {
      rows = db.prepare(`${PATTERN_QUERY} ORDER BY p.published_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
    } else {
      rows = db.prepare(`${PATTERN_QUERY} ORDER BY p.published_at DESC`).all();
    }
  }

  if (limit) {
    res.json({ items: rows.map(parsePattern), total, hasMore: offset + limit < total, seed: sort === 'random' ? seed : undefined });
  } else {
    res.json(rows.map(parsePattern));
  }
});

app.post('/api/patterns', (req, res) => {
  const patterns = req.body;
  const ins = db.prepare(`INSERT OR REPLACE INTO patterns (id,name,dynasty,meaning,scene,story,source,svg_id,custom_paths,custom_view_box,custom_image,author_name,author_id,published_at,lang) VALUES (@id,@name,@dynasty,@meaning,@scene,@story,@source,@svgId,@cpaths,@cviewBox,@cimage,@authorName,@authorId,@publishedAt,@lang)`);
  const tx = db.transaction(() => {
    for (const p of patterns) {
      ins.run({ ...p, cpaths: p.customPaths ? JSON.stringify(p.customPaths) : null, cviewBox: p.customViewBox || null, cimage: p.customImage || null });
    }
  });
  tx();
  res.json({ ok: true });
});

// ---- likes ----
app.get('/api/likes', (_req, res) => {
  res.json(db.prepare("SELECT pattern_id FROM likes WHERE user_id = 'self'").all().map(r => r.pattern_id));
});

app.post('/api/likes', (req, res) => {
  const ids = req.body;
  db.transaction(() => {
    db.prepare("DELETE FROM likes WHERE user_id = 'self'").run();
    const ins = db.prepare("INSERT OR IGNORE INTO likes (pattern_id, user_id) VALUES (?, 'self')");
    for (const id of ids) ins.run(id);
  })();
  res.json({ ok: true });
});

// ---- saves ----
app.get('/api/saves', (_req, res) => {
  res.json(db.prepare("SELECT pattern_id FROM saves WHERE user_id = 'self'").all().map(r => r.pattern_id));
});

app.post('/api/saves', (req, res) => {
  const ids = req.body;
  db.transaction(() => {
    db.prepare("DELETE FROM saves WHERE user_id = 'self'").run();
    const ins = db.prepare("INSERT OR IGNORE INTO saves (pattern_id, user_id) VALUES (?, 'self')");
    for (const id of ids) ins.run(id);
  })();
  res.json({ ok: true });
});

// ---- follows ----
app.get('/api/follows', (_req, res) => {
  res.json(db.prepare("SELECT user_id FROM follows WHERE follower_id = 'self'").all().map(r => r.user_id));
});

app.post('/api/follows', (req, res) => {
  const ids = req.body;
  db.transaction(() => {
    db.prepare("DELETE FROM follows WHERE follower_id = 'self'").run();
    const ins = db.prepare("INSERT OR IGNORE INTO follows (user_id, follower_id) VALUES (?, 'self')");
    for (const id of ids) ins.run(id);
  })();
  res.json({ ok: true });
});

// ---- profile ----
app.get('/api/profile', (_req, res) => {
  const p = db.prepare("SELECT name, bio FROM profile WHERE user_id = 'self'").get();
  res.json(p || { name: '纹样爱好者', bio: '你的纹样之旅' });
});

app.post('/api/profile', (req, res) => {
  const { name, bio } = req.body;
  db.prepare("INSERT OR REPLACE INTO profile (user_id, name, bio) VALUES ('self', ?, ?)").run(name, bio);
  res.json({ ok: true });
});

// ---- social graph ----
app.get('/api/social/:userId/following', (req, res) => {
  const rows = db.prepare('SELECT user_id FROM follows WHERE follower_id = ?').all(req.params.userId);
  res.json(rows.map(r => r.user_id));
});

app.get('/api/social/:userId/followers', (req, res) => {
  const rows = db.prepare('SELECT follower_id FROM follows WHERE user_id = ?').all(req.params.userId);
  res.json(rows.map(r => r.follower_id));
});

app.get('/api/social/:userId/counts', (req, res) => {
  const following = db.prepare('SELECT COUNT(*) as n FROM follows WHERE follower_id = ?').get(req.params.userId).n;
  const followers = db.prepare('SELECT COUNT(*) as n FROM follows WHERE user_id = ?').get(req.params.userId).n;
  res.json({ following, followers });
});

function parseComment(row) {
  return {
    id: row.id, patternId: row.pattern_id, authorName: row.author_name,
    authorId: row.author_id, text: row.text, createdAt: row.created_at,
  };
}

// ---- comments ----
app.get('/api/comments/:patternId', (req, res) => {
  const rows = db.prepare('SELECT * FROM comments WHERE pattern_id = ? ORDER BY created_at DESC').all(req.params.patternId);
  res.json(rows.map(parseComment));
});

app.post('/api/comments', (req, res) => {
  const { patternId, authorName, authorId, text } = req.body;
  const id = `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO comments (id, pattern_id, author_name, author_id, text, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, patternId, authorName, authorId, text, createdAt);
  res.json({ id, patternId, authorName, authorId, text, createdAt });
});

// ---- delete pattern ----
app.delete('/api/patterns/:id', (req, res) => {
  const p = db.prepare('SELECT author_id FROM patterns WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  db.prepare('DELETE FROM patterns WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM likes WHERE pattern_id = ?').run(req.params.id);
  db.prepare('DELETE FROM saves WHERE pattern_id = ?').run(req.params.id);
  db.prepare('DELETE FROM comments WHERE pattern_id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- delete comment ----
app.delete('/api/comments/:id', (req, res) => {
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- user patterns ----
app.get('/api/user/:userId/patterns', (req, res) => {
  const rows = db.prepare(`${PATTERN_QUERY} WHERE p.author_id = ? OR p.author_name = ? ORDER BY p.published_at DESC`).all(req.params.userId, req.params.userId);
  res.json(rows.map(parsePattern));
});

// ---- user likes/saves ----
app.get('/api/user/:userId/likes', (req, res) => {
  const rows = db.prepare("SELECT pattern_id FROM likes WHERE user_id = ?").all(req.params.userId);
  res.json(rows.map(r => r.pattern_id));
});
app.get('/api/user/:userId/saves', (req, res) => {
  const rows = db.prepare("SELECT pattern_id FROM saves WHERE user_id = ?").all(req.params.userId);
  res.json(rows.map(r => r.pattern_id));
});

// ---- user comments ----
app.get('/api/user/:userId/comments', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, p.name as pattern_name FROM comments c
    JOIN patterns p ON c.pattern_id = p.id
    WHERE c.author_id = ? OR c.author_name = ?
    ORDER BY c.created_at DESC
    LIMIT 50
  `).all(req.params.userId, req.params.userId);
  res.json(rows.map(r => ({
    ...parseComment(r),
    patternName: r.pattern_name,
  })));
});

// ---- history ----
app.get('/api/history', (_req, res) => {
  res.json(db.prepare("SELECT pattern_id FROM history WHERE user_id = 'self' ORDER BY id DESC LIMIT 20").all().map(r => r.pattern_id));
});

app.post('/api/history', (req, res) => {
  const ids = req.body;
  db.transaction(() => {
    db.prepare("DELETE FROM history WHERE user_id = 'self'").run();
    const ins = db.prepare("INSERT INTO history (pattern_id, user_id) VALUES (?, 'self')");
    for (const id of ids) ins.run(id);
  })();
  res.json({ ok: true });
});

// ---- full data (backward compat) ----
app.get('/api/data', (_req, res) => {
  const patterns = db.prepare('SELECT * FROM patterns').all().map(parsePattern);
  const likes = db.prepare("SELECT pattern_id FROM likes WHERE user_id = 'self'").all().map(r => r.pattern_id);
  const saves = db.prepare("SELECT pattern_id FROM saves WHERE user_id = 'self'").all().map(r => r.pattern_id);
  const follows = db.prepare("SELECT user_id FROM follows WHERE follower_id = 'self'").all().map(r => r.user_id);
  const history = db.prepare("SELECT pattern_id FROM history WHERE user_id = 'self' ORDER BY id DESC LIMIT 20").all().map(r => r.pattern_id);
  res.json({ patterns, likes, saves, follows, history });
});

// ---- settings (API key) ----
app.get('/api/settings', (_req, res) => {
  const p = db.prepare("SELECT api_key FROM profile WHERE user_id = 'self'").get();
  res.json({ apiKey: p?.api_key || '' });
});

app.post('/api/settings', (req, res) => {
  const { apiKey } = req.body;
  db.prepare("INSERT OR REPLACE INTO profile (user_id, name, bio, api_key) VALUES ('self', COALESCE((SELECT name FROM profile WHERE user_id='self'),'纹样爱好者'), COALESCE((SELECT bio FROM profile WHERE user_id='self'),'你的纹样之旅'), ?)").run(apiKey || '');
  res.json({ ok: true });
});

function getDeepSeekKey() {
  // Priority: DB user setting > .deepseek-key file > env var
  const dbKey = db.prepare("SELECT api_key FROM profile WHERE user_id = 'self'").get()?.api_key;
  if (dbKey) return dbKey;
  if (existsSync(keyPath)) return readFileSync(keyPath, 'utf-8').trim();
  return process.env.DEEPSEEK_API_KEY || '';
}

// ---- AI ----
const keyPath = join(__dirname, '.deepseek-key');

// ---- AI palette generation ----
app.post('/api/generate-palette', async (req, res) => {
  const key = getDeepSeekKey();
  if (!key) return res.status(400).json({ error: 'No API key configured. Please set your DeepSeek API key in Settings.' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'missing prompt' });

  const isCJK = /[一-鿿぀-ヿ가-힯]/.test(prompt);
  const lang = isCJK ? 'Chinese' : 'English';

  try {
    const openai = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: key });
    const completion = await openai.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [{
        role: 'system',
        content: `You are a color expert. Generate a 5-color palette from the user description. You MUST write ALL output (name and every color name) in ${lang} only. No other language. Return ONLY JSON: {"name":"...","colors":[{"name":"...","hex":"#XXXXXX"}]}`
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.9,
      max_tokens: 300,
      // @ts-ignore — deepseek param: disable thinking
      thinking: { type: 'disabled' },
    });
    const text = completion.choices[0].message.content || '';
    const json = JSON.parse(text.replace(/```json\n?|```/g, '').trim());
    res.json(json);
  } catch (e) {
    console.error('AI palette error:', e.message);
    res.status(500).json({ error: 'palette generation failed' });
  }
});

// ---- AI translation ----
app.post('/api/translate', async (req, res) => {
  const key = getDeepSeekKey();
  if (!key) return res.status(400).json({ error: 'No API key configured.' });

  const { text, target } = req.body;
  if (!text || !target) return res.status(400).json({ error: 'missing text or target' });
  try {
    const langNames = { zh: 'Simplified Chinese', 'zh-TW': 'Traditional Chinese', en: 'English', ja: 'Japanese', ko: 'Korean', fr: 'French', es: 'Spanish', ru: 'Russian', ar: 'Arabic' };
    const langName = langNames[target] || target;
    const openai = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: key });
    const completion = await openai.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [{
        role: 'system',
        content: `Translate the user text to ${langName}. Return ONLY the translated text, no explanation, no quotes around it.`
      }, { role: 'user', content: text }],
      temperature: 0.3,
      max_tokens: 500,
      // @ts-ignore — deepseek param: disable thinking
      thinking: { type: 'disabled' },
    });
    res.json({ translation: completion.choices[0].message.content?.trim() || text });
  } catch (e) {
    res.json({ translation: text });
  }
});

// ---- serve built frontend in production ----
const DIST = join(__dirname, 'dist');
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  // Express 5 catch-all: serve index.html for non-API routes
  app.get('/{*splat}', (_req, res) => {
    if (!_req.path.startsWith('/api')) {
      res.sendFile(join(DIST, 'index.html'));
    }
  });
}

// ---- start server ----
const PORT = process.env.ELECTRON ? 0 : (process.env.PORT || 3001);
const server = app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${server.address().port}`);
});

export { app, server };
