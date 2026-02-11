import type { SyncedTweet, SyncStatus } from '@shared/types';
import { STORAGE_KEY_TWEETS, STORAGE_KEY_SYNC_STATUS, DEFAULT_SYNC_STATUS } from '@shared/constants';

export async function getSyncedTweets(): Promise<SyncedTweet[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY_TWEETS);
  return (result[STORAGE_KEY_TWEETS] as SyncedTweet[]) ?? [];
}

export async function mergeTweets(incoming: SyncedTweet[]): Promise<number> {
  const existing = await getSyncedTweets();
  const existingIds = new Set(existing.map((t) => t.tweetId));

  const newTweets = incoming.filter((t) => !existingIds.has(t.tweetId));
  if (newTweets.length === 0) return 0;

  const merged = [...newTweets, ...existing];
  await chrome.storage.local.set({ [STORAGE_KEY_TWEETS]: merged });
  return newTweets.length;
}

export async function clearSyncedTweets(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY_TWEETS);
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const result = await chrome.storage.local.get(STORAGE_KEY_SYNC_STATUS);
  return (result[STORAGE_KEY_SYNC_STATUS] as SyncStatus) ?? { ...DEFAULT_SYNC_STATUS };
}

export async function setSyncStatus(status: SyncStatus): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_SYNC_STATUS]: status });
}
