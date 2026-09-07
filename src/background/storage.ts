import type { SyncSource, SyncedTweet, SyncStatus } from '@shared/types';
import { STORAGE_KEY_TWEETS, STORAGE_KEY_SYNC_STATUS, DEFAULT_SYNC_STATUS } from '@shared/constants';
import { getKnownTweetIdsForSource } from '@shared/tweet-sources';
import { mergeTweetCollections } from './tweet-merge';

export async function getSyncedTweets(): Promise<SyncedTweet[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY_TWEETS);
  return (result[STORAGE_KEY_TWEETS] as SyncedTweet[]) ?? [];
}

export async function mergeTweets(incoming: SyncedTweet[]): Promise<number> {
  const existing = await getSyncedTweets();
  const result = mergeTweetCollections(existing, incoming);

  if (result.changed) {
    await chrome.storage.local.set({ [STORAGE_KEY_TWEETS]: result.tweets });
  }
  return result.newCount;
}

export async function getKnownTweetIds(source: SyncSource): Promise<string[]> {
  return getKnownTweetIdsForSource(await getSyncedTweets(), source);
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
