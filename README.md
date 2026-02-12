# X Copilot

A Chrome extension for X (Twitter) power users — sync bookmarks & likes to local storage, search them offline, and use AI to summarize tweets and generate smart replies.

[English](#english) | [中文](#中文)

[![Demo Video](https://img.youtube.com/vi/F5G4D01L98s/hqdefault.jpg)](https://youtu.be/F5G4D01L98s)

---

<a name="english"></a>

## Features

### Bookmark & Likes Sync
- **One-click sync** — Sync your X bookmarks, likes, or own tweets with a single click
- **Full-page search** — Search all synced tweets by content, author, or handle in a dedicated full-screen page
- **Rich content extraction** — Captures tweet text, quoted tweets, article cards (title + cover image + description), and media images
- **Real-time updates** — Open the search page during sync and watch tweets appear as they're extracted
- **Offline browsing** — All data stored locally in `chrome.storage`, no server required

### AI-Powered Analysis
- **Tweet summarization** — Click the ✨ button on any tweet to get a structured summary with TLDR, key points, and fact-check
- **Streaming output** — AI response streams in real-time with live markdown rendering, no more waiting for the full result
- **Smart replies** — AI generates a suggested reply matching the tweet's language and your chosen style
- **Reply styles** — Professional discussion, friendly interaction, or concise agreement
- **Regenerate** — Switch styles or add custom instructions to regenerate just the reply without re-summarizing
- **Markdown export** — Save the summary + reply as a `.md` file with one click
- **Supports OpenAI & Claude** — Bring your own API key, with configurable base URL and model

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)

### Build from source

```bash
git clone git@github.com:baryon/x-copilot.git
cd x-copilot
pnpm install
pnpm run build
```

### Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the `dist/` folder
4. Pin the extension icon in the toolbar

## Usage

### 1. Configure AI (optional)

Click the extension icon → **Settings** tab → under "AI 总结配置":
- Select your **AI provider** (OpenAI or Claude)
- Enter your **API Key** (encrypted and stored locally)
- Optionally set a custom **Base URL** and **Model**
- Choose your preferred **reply style**

> Once an API key is saved, the ✨ summarize button will appear on tweets.

### 2. Summarize a tweet

On any X page, click the ✨ icon in a tweet's action bar. A side panel will open and stream the AI analysis in real-time:
- **Summary** — TLDR, key points, fact-check with credibility score (streams as it generates)
- **Suggested reply** — editable, with copy-to-clipboard button (appears when streaming completes)
- **Regenerate** — pick a different style or add instructions to regenerate the reply
- **Save Markdown** — export everything as a `.md` file

### 3. Sync bookmarks & likes

Click the extension icon → **Sync** tab → choose **Bookmarks**, **Likes**, or **My Tweets** → click sync.

> Set your X handle in Settings first (required for likes/tweets sync).

### 4. Search and browse

- **Quick search** — Type a keyword in the popup and click "Search"
- **Browse all** — Click "View all" to open the full-page view
- **Click any tweet** to open the original post on X

## Tech Stack

- TypeScript + React + Tailwind CSS
- Vite + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) (Chrome Extension MV3)
- OpenAI / Claude API with SSE streaming
- AES-GCM encryption for API key storage

## Project Structure

```
src/
├── background/          # Service worker (sync, AI summarizer, markdown export)
│   └── llm/             # OpenAI & Claude API clients
├── content/             # Content script (tweet extraction, summarize button, overlay)
│   └── extractor/       # DOM-based tweet/article/card extractors
├── page/                # Full-page search view (extension page)
├── popup/               # Popup UI (sync controls, AI settings)
└── shared/              # Shared types, constants, messaging, encryption
```

## License

MIT

---

<a name="中文"></a>

## 中文说明

一个面向 X (Twitter) 重度用户的 Chrome 扩展 — 书签和喜欢同步到本地离线搜索，AI 一键总结推文并生成智能回复。

### 功能

**书签同步**
- 一键同步书签、喜欢、我的推文，全页面搜索，离线浏览
- 丰富内容提取：推文、引用、文章卡片、媒体图片

**AI 智能分析**
- 点击推文上的 ✨ 按钮，获取结构化总结（TLDR + 关键点 + 事实核查）
- 流式输出：AI 分析结果实时渲染，无需等待完整响应
- 自动生成建议回复，匹配原推语言，支持三种风格
- 可输入自定义指令重新生成回复，不重复调用总结
- 一键导出 Markdown

### 安装

```bash
git clone git@github.com:baryon/x-copilot.git
cd x-copilot
pnpm install
pnpm run build
```

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**，选择 `dist/` 文件夹

### 使用

1. **配置 AI** — 扩展设置中选择 AI 接口（OpenAI / Claude），填入 API Key，选择回复风格
2. **总结推文** — 在 X 页面点击推文操作栏的 ✨ 按钮，右侧面板实时流式显示总结，完成后展示建议回复
3. **同步** — 点击扩展图标 → 同步 → 选择「书签」或「喜欢」→ 开始同步
4. **搜索** — 输入关键词搜索，或查看全部同步推文
