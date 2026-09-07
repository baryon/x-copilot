import type { SyncSource, SyncedTweet } from './types';

type TweetSourceFields = Pick<SyncedTweet, 'source' | 'syncedSources'>;

export function getTweetSyncedSources(tweet: TweetSourceFields): SyncSource[] {
  return [...new Set([tweet.source, ...(tweet.syncedSources ?? [])])];
}

export function isTweetKnownForSource(
  tweet: TweetSourceFields,
  source: SyncSource,
): boolean {
  return getTweetSyncedSources(tweet).includes(source);
}

export function getKnownTweetIdsForSource(
  tweets: readonly SyncedTweet[],
  source: SyncSource,
): string[] {
  return tweets
    .filter((tweet) => isTweetKnownForSource(tweet, source))
    .map((tweet) => tweet.tweetId);
}
