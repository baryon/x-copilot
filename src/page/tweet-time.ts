interface TweetTimeFields {
  tweetId: string;
  syncedAt: number;
  publishedAt?: number;
}

const TWITTER_EPOCH_MS = 1_288_834_974_657n;

function getPublishedTimeFromTweetId(tweetId: string): number | null {
  try {
    const timestamp = Number((BigInt(tweetId) >> 22n) + TWITTER_EPOCH_MS);
    return Number.isSafeInteger(timestamp) ? timestamp : null;
  } catch {
    return null;
  }
}

export function getTweetDisplayTime(tweet: TweetTimeFields): number {
  return tweet.publishedAt ?? getPublishedTimeFromTweetId(tweet.tweetId) ?? tweet.syncedAt;
}

export function sortTweetsByPublishedTime<T extends TweetTimeFields>(tweets: T[]): T[] {
  return [...tweets].sort(
    (left, right) => getTweetDisplayTime(right) - getTweetDisplayTime(left),
  );
}
