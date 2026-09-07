export const KNOWN_TWEET_STREAK = 3;

export interface IncrementalSelection<T> {
  tweetsToSync: T[];
  observedCount: number;
  knownStreak: number;
  reachedBoundary: boolean;
}

export function selectIncrementalTweets<T extends { tweetId: string }>(
  tweets: readonly T[],
  seenIds: Set<string>,
  knownIds: ReadonlySet<string>,
  initialKnownStreak: number,
): IncrementalSelection<T> {
  const tweetsToSync: T[] = [];
  let observedCount = 0;
  let knownStreak = initialKnownStreak;

  for (const tweet of tweets) {
    if (seenIds.has(tweet.tweetId)) continue;

    seenIds.add(tweet.tweetId);
    observedCount++;

    if (knownIds.has(tweet.tweetId)) {
      knownStreak++;
      if (knownStreak >= KNOWN_TWEET_STREAK) {
        return {
          tweetsToSync,
          observedCount,
          knownStreak,
          reachedBoundary: true,
        };
      }
      continue;
    }

    knownStreak = 0;
    tweetsToSync.push(tweet);
  }

  return {
    tweetsToSync,
    observedCount,
    knownStreak,
    reachedBoundary: false,
  };
}
