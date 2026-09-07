import type { SyncSource } from '@shared/types';

export type TweetSourceFilter = 'all' | SyncSource;

const SOURCE_LABELS: Record<SyncSource, string> = {
  bookmarks: '书签',
  likes: '喜欢',
  own_tweets: '我的推文',
};

export const TWEET_SOURCE_FILTER_OPTIONS: ReadonlyArray<{
  value: TweetSourceFilter;
  label: string;
}> = [
  { value: 'all', label: '全部' },
  { value: 'likes', label: SOURCE_LABELS.likes },
  { value: 'bookmarks', label: SOURCE_LABELS.bookmarks },
  { value: 'own_tweets', label: SOURCE_LABELS.own_tweets },
];

export function getTweetSourceLabel(source: SyncSource): string {
  return SOURCE_LABELS[source];
}

export function filterTweetsBySource<T extends { source: SyncSource }>(
  tweets: readonly T[],
  sourceFilter: TweetSourceFilter,
): T[] {
  return sourceFilter === 'all'
    ? [...tweets]
    : tweets.filter((tweet) => tweet.source === sourceFilter);
}
