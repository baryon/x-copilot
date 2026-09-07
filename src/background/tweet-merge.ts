import type { SyncedTweet } from '@shared/types';
import { getTweetSyncedSources } from '../shared/tweet-sources.ts';

export interface MergeTweetsResult {
  tweets: SyncedTweet[];
  newCount: number;
  changed: boolean;
}

function mergeSources(existing: SyncedTweet, incoming: SyncedTweet): SyncedTweet {
  const syncedSources = [
    ...new Set([
      ...getTweetSyncedSources(existing),
      ...getTweetSyncedSources(incoming),
    ]),
  ];

  if (
    existing.syncedSources?.length === syncedSources.length &&
    existing.syncedSources.every((source, index) => source === syncedSources[index])
  ) {
    return existing;
  }

  return { ...existing, syncedSources };
}

export function mergeTweetCollections(
  existing: readonly SyncedTweet[],
  incoming: readonly SyncedTweet[],
): MergeTweetsResult {
  const existingTweets = [...existing];
  const newTweets: SyncedTweet[] = [];
  const locations = new Map<string, { list: 'existing' | 'new'; index: number }>();

  existingTweets.forEach((tweet, index) => {
    locations.set(tweet.tweetId, { list: 'existing', index });
  });

  let changed = false;

  for (const tweet of incoming) {
    const location = locations.get(tweet.tweetId);
    if (!location) {
      const normalizedTweet = {
        ...tweet,
        syncedSources: getTweetSyncedSources(tweet),
      };
      locations.set(tweet.tweetId, { list: 'new', index: newTweets.length });
      newTweets.push(normalizedTweet);
      changed = true;
      continue;
    }

    const list = location.list === 'existing' ? existingTweets : newTweets;
    const current = list[location.index];
    const merged = mergeSources(current, tweet);
    if (merged !== current) {
      list[location.index] = merged;
      changed = true;
    }
  }

  return {
    tweets: [...newTweets, ...existingTweets],
    newCount: newTweets.length,
    changed,
  };
}
