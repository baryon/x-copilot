// ── Sync source & state ─────────────────────────────────────────────────────

export type SyncSource = 'bookmarks' | 'likes' | 'own_tweets';

export type SyncState = 'idle' | 'syncing' | 'completed' | 'error';

export interface SyncStatus {
  state: SyncState;
  source: SyncSource;
  totalExtracted: number;
  newCount: number;
  startedAt: number;
  completedAt: number | null;
  error: string | null;
}

// ── Tweet data ──────────────────────────────────────────────────────────────

export interface SyncedTweet {
  tweetId: string;
  author: string;
  authorHandle: string;
  text: string;
  quotedText: string;
  quotedAuthor: string;
  cardText: string;
  cardTitle: string;
  cardDescription: string;
  cardUrl: string;
  cardImageUrl: string;
  tweetUrl: string;
  mediaCount: number;
  mediaUrls: string[];
  hasArticle: boolean;
  syncedAt: number;
  source: SyncSource;
}

// ── Settings ────────────────────────────────────────────────────────────────

export type Language = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko';

export type ReplyStyle = 'professional' | 'friendly' | 'concise';

export interface Settings {
  language: Language;
  xHandle: string;
  provider: AIProvider;
  baseUrl: string;
  model: string;
  replyStyle: ReplyStyle;
}

// ── AI Provider types (dormant — kept for LLM module) ───────────────────────

export type AIProvider = 'openai' | 'claude';

export interface LLMPrompt {
  system: string;
  user: string;
}

// ── Encryption ──────────────────────────────────────────────────────────────

export interface EncryptedData {
  iv: number[];
  data: number[];
}

// ── Chrome messaging ────────────────────────────────────────────────────────

export interface StartSyncMessage {
  type: 'START_SYNC';
  source: SyncSource;
  xHandle?: string;
}

export interface StopSyncMessage {
  type: 'STOP_SYNC';
}

export interface GetSyncStatusMessage {
  type: 'GET_SYNC_STATUS';
}

export interface GetSyncedTweetsMessage {
  type: 'GET_SYNCED_TWEETS';
}

export interface ClearSyncedDataMessage {
  type: 'CLEAR_SYNCED_DATA';
}

// Content → Background
export interface SyncProgressMessage {
  type: 'SYNC_PROGRESS';
  tweets: SyncedTweet[];
}

export interface SyncCompleteMessage {
  type: 'SYNC_COMPLETE';
}

export interface SyncErrorMessage {
  type: 'SYNC_ERROR';
  error: string;
}

// Content → Background: summarize
export interface SummarizeTweetMessage {
  type: 'SUMMARIZE_TWEET';
  tweetText: string;
  author: string;
  tweetUrl: string;
  userPrompt?: string;
}

// Background → Content: summarize result
export interface SummarizeResultMessage {
  type: 'SUMMARIZE_RESULT';
  summary: string;
  reply: string;
  tweetText: string;
  author: string;
  tweetUrl: string;
  error?: string;
}

// Content → Background: regenerate reply only
export interface RegenerateReplyMessage {
  type: 'REGENERATE_REPLY';
  tweetText: string;
  author: string;
  userPrompt?: string;
}

// Background → Content: stream chunk
export interface SummarizeStreamChunkMessage {
  type: 'SUMMARIZE_STREAM_CHUNK';
  chunk: string;
}

// Content → Background: export markdown
export interface ExportMarkdownMessage {
  type: 'EXPORT_MARKDOWN';
  tweetText: string;
  author: string;
  tweetUrl: string;
  summary: string;
  reply: string;
}

// Background → Content
export interface BeginExtractionMessage {
  type: 'BEGIN_EXTRACTION';
  source: SyncSource;
}

export interface StopExtractionMessage {
  type: 'STOP_EXTRACTION';
}

export type ExtensionMessage =
  | StartSyncMessage
  | StopSyncMessage
  | GetSyncStatusMessage
  | GetSyncedTweetsMessage
  | ClearSyncedDataMessage
  | SyncProgressMessage
  | SyncCompleteMessage
  | SyncErrorMessage
  | BeginExtractionMessage
  | StopExtractionMessage
  | SummarizeTweetMessage
  | SummarizeResultMessage
  | SummarizeStreamChunkMessage
  | RegenerateReplyMessage
  | ExportMarkdownMessage;

export interface MessageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}
