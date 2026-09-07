import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeTweetCollections } from '../src/background/tweet-merge.ts';
import { selectIncrementalTweets } from '../src/content/extractor/incremental-boundary.ts';
import { SYNC_SOURCE_OPTIONS } from '../src/shared/constants.ts';
import { getKnownTweetIdsForSource } from '../src/shared/tweet-sources.ts';

function tweet(tweetId, source, syncedSources) {
  return {
    tweetId,
    source,
    ...(syncedSources ? { syncedSources } : {}),
  };
}

test('known tweet IDs are tracked independently by source with legacy fallback', () => {
  const tweets = [
    tweet('bookmark-only', 'bookmarks'),
    tweet('both', 'bookmarks', ['bookmarks', 'likes']),
    tweet('own-only', 'own_tweets', ['own_tweets']),
  ];

  assert.deepEqual(getKnownTweetIdsForSource(tweets, 'bookmarks'), [
    'bookmark-only',
    'both',
  ]);
  assert.deepEqual(getKnownTweetIdsForSource(tweets, 'likes'), ['both']);
  assert.deepEqual(getKnownTweetIdsForSource(tweets, 'own_tweets'), ['own-only']);
});

test('tweet merging preserves first source and records cross-source membership', () => {
  const existing = [tweet('existing', 'bookmarks')];
  const incoming = [
    tweet('existing', 'likes'),
    tweet('new', 'likes'),
  ];

  const result = mergeTweetCollections(existing, incoming);

  assert.equal(result.newCount, 1);
  assert.equal(result.changed, true);
  assert.deepEqual(result.tweets.map((item) => item.tweetId), ['new', 'existing']);
  assert.equal(result.tweets[1].source, 'bookmarks');
  assert.deepEqual(result.tweets[1].syncedSources, ['bookmarks', 'likes']);
  assert.deepEqual(result.tweets[0].syncedSources, ['likes']);
  assert.equal(existing[0].syncedSources, undefined);
});

test('same-source duplicates do not create new tweets', () => {
  const existing = [tweet('existing', 'likes', ['likes'])];
  const result = mergeTweetCollections(existing, [tweet('existing', 'likes')]);

  assert.equal(result.newCount, 0);
  assert.equal(result.changed, false);
  assert.strictEqual(result.tweets[0], existing[0]);
});

test('incremental selection continues past one pinned known tweet', () => {
  const seenIds = new Set();
  const result = selectIncrementalTweets(
    [
      { tweetId: 'pinned' },
      { tweetId: 'new-1' },
      { tweetId: 'old-1' },
      { tweetId: 'old-2' },
      { tweetId: 'old-3' },
      { tweetId: 'unreached' },
    ],
    seenIds,
    new Set(['pinned', 'old-1', 'old-2', 'old-3']),
    0,
  );

  assert.deepEqual(result.tweetsToSync.map((item) => item.tweetId), ['new-1']);
  assert.equal(result.observedCount, 5);
  assert.equal(result.knownStreak, 3);
  assert.equal(result.reachedBoundary, true);
  assert.equal(seenIds.has('unreached'), false);
});

test('incremental selection carries the known streak across scrolls', () => {
  const seenIds = new Set();
  const knownIds = new Set(['old-1', 'old-2', 'old-3']);
  const first = selectIncrementalTweets(
    [{ tweetId: 'new' }, { tweetId: 'old-1' }, { tweetId: 'old-2' }],
    seenIds,
    knownIds,
    0,
  );
  const second = selectIncrementalTweets(
    [{ tweetId: 'old-2' }, { tweetId: 'old-3' }],
    seenIds,
    knownIds,
    first.knownStreak,
  );

  assert.deepEqual(first.tweetsToSync.map((item) => item.tweetId), ['new']);
  assert.equal(first.reachedBoundary, false);
  assert.deepEqual(second.tweetsToSync, []);
  assert.equal(second.observedCount, 1);
  assert.equal(second.reachedBoundary, true);
});

test('tweets unknown to the selected source are synchronized and reset the streak', () => {
  const result = selectIncrementalTweets(
    [
      { tweetId: 'known-1' },
      { tweetId: 'known-other-source' },
      { tweetId: 'known-2' },
      { tweetId: 'known-3' },
      { tweetId: 'known-4' },
    ],
    new Set(),
    new Set(['known-1', 'known-2', 'known-3', 'known-4']),
    0,
  );

  assert.deepEqual(result.tweetsToSync.map((item) => item.tweetId), [
    'known-other-source',
  ]);
  assert.equal(result.reachedBoundary, true);
});

test('popup exposes all synchronization sources', () => {
  assert.deepEqual(SYNC_SOURCE_OPTIONS.map((option) => option.id), [
    'bookmarks',
    'likes',
    'own_tweets',
  ]);
});
