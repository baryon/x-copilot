import type { AIProvider, ReplyStyle, SyncSource, SyncStatus } from './types';

// ── AI defaults (dormant — kept for LLM module) ────────────────────────────

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-5.2',
  claude: 'claude-sonnet-4-20250514',
};

export const DEFAULT_BASE_URLS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com',
};

export const REPLY_STYLE_LABELS: Record<ReplyStyle, string> = {
  sharpen: '替他说得更狠',
  add: '补一块原帖没写的硬东西',
  riff: '顺着原格式接梗',
  rebuttal: '一句钉死荒谬处',
  question: '一个楼主愿意回的问题',
  alternative: '给出手方案，而不只是反对',
  nod: '极短的站队',
};

const LEGACY_REPLY_STYLES: Record<string, ReplyStyle> = {
  professional: 'add',
  friendly: 'sharpen',
  concise: 'nod',
  witty: 'riff',
};

export const DEFAULT_REPLY_STYLE: ReplyStyle = 'sharpen';

export const LONG_POST_MIN_CHARS = 288;

export function isLongPost(text: string): boolean {
  return [...text].length > LONG_POST_MIN_CHARS;
}

export function resolveReplyStyle(value: unknown): ReplyStyle {
  if (typeof value === 'string' && value in REPLY_STYLE_LABELS) {
    return value as ReplyStyle;
  }
  if (typeof value === 'string' && value in LEGACY_REPLY_STYLES) {
    return LEGACY_REPLY_STYLES[value];
  }
  return DEFAULT_REPLY_STYLE;
}

export const STORAGE_KEY_API_KEY = 'encryptedApiKey';

export const SYNC_SOURCE_LABELS: Record<SyncSource, string> = {
  bookmarks: '书签',
  likes: '喜欢',
  own_tweets: '我的推文',
};

/**
 * Extract bare handle from various input formats:
 * "lilong", "@lilong", "https://x.com/lilong", "https://x.com/lilong/likes"
 */
export function parseXHandle(raw: string): string {
  let s = raw.trim();
  // Strip URL prefix
  s = s.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, '');
  // Strip trailing path segments (e.g. /likes, /with_replies)
  s = s.replace(/\/.*$/, '');
  // Strip leading @
  s = s.replace(/^@/, '');
  return s;
}

export function getSyncSourceUrl(source: SyncSource, xHandle?: string): string {
  switch (source) {
    case 'bookmarks':
      return 'https://x.com/i/bookmarks';
    case 'likes': {
      const handle = parseXHandle(xHandle || '');
      if (!handle) throw new Error('同步喜欢需要先在设置中填写 X 用户名');
      return `https://x.com/${handle}/likes`;
    }
    case 'own_tweets': {
      const handle = parseXHandle(xHandle || '');
      if (!handle) throw new Error('同步推文需要先在设置中填写 X 用户名');
      return `https://x.com/${handle}`;
    }
  }
}

export const SCROLL_WAIT_MS = 2000;
export const MUTATION_TIMEOUT_MS = 3000;
export const BATCH_SIZE = 20;
export const MAX_EMPTY_SCROLLS = 3;

export const STORAGE_KEY_TWEETS = 'syncedTweets';
export const STORAGE_KEY_SYNC_STATUS = 'syncStatus';

export const DEFAULT_SYNC_STATUS: SyncStatus = {
  state: 'idle',
  source: 'bookmarks',
  totalExtracted: 0,
  newCount: 0,
  startedAt: 0,
  completedAt: null,
  error: null,
};

export const LANG_MAP: Record<string, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};
