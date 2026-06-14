# 丝纹织影 (Silk Weave)

> AI-Powered Cross-Cultural Pattern Platform  
> 中国传统纹样 × AI 配色 × 全球社区

## Features

- 🏠 **Discover** — Curated landing page with trending community content
- 🌍 **Explore** — 9-language social feed with search, sort, and infinite scroll
- 📖 **Learn** — 4 classic Chinese pattern types with dynasty filters & Palace Museum palettes
- 🎨 **Create** — Pattern coloring + doodle mode with **AI palette generator** (any language prompt)
- 👤 **Profile** — Posts, likes, saves, follows, history, and comment management
- 🌐 **9 Languages** — ZH / ZH-TW / EN / JA / KO / FR / ES / RU / AR
- 🤖 **AI Translation** — Real-time translation of any post or comment
- 🌙 **Dark Mode** — Toggle light/dark theme

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
```

> **AI features** require a DeepSeek API key. Click the ⚙️ gear icon in the app header to set your key (free at [platform.deepseek.com](https://platform.deepseek.com)).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Tailwind CSS v4 |
| Backend | Express.js + better-sqlite3 |
| AI | DeepSeek API (palette generation + translation) |
| i18n | react-i18next (9 languages) |
| Desktop | Electron + electron-builder + electron-updater |

## Build & Publish

```bash
npm run electron:build:mac    # macOS .dmg
npm run electron:build:win    # Windows .exe
npm run electron:publish:win  # Build + publish to GitHub Releases
```

Set `GH_TOKEN` in your environment before publishing (GitHub classic token with `repo` scope).

## Disclaimer

- User data (names, avatars, posts, comments, likes, follows) is randomly generated for demo purposes.
- Pattern illustrations are schematic and do not represent actual artifacts.
- Pattern descriptions and color palette introductions are for reference only and may not be entirely accurate.
