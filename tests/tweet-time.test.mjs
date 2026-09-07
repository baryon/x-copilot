import assert from 'node:assert/strict';
import test from 'node:test';

import { extractSingleTweet } from '../src/content/extractor/tweet-extractor.ts';
import { getTweetDisplayTime, sortTweetsByPublishedTime } from '../src/page/tweet-time.ts';

test('extractor stores the tweet publication time from the time element', async () => {
  const publishedAt = '2024-01-02T03:04:05.000Z';
  const timeElement = {
    getAttribute(name) {
      return name === 'datetime' ? publishedAt : null;
    },
  };
  const statusLink = {
    getAttribute(name) {
      return name === 'href' ? '/alice/status/123456789' : null;
    },
    querySelector(selector) {
      return selector === 'time' ? timeElement : null;
    },
  };
  const article = {
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      return selector === 'a[href*="/status/"]' ? [statusLink] : [];
    },
  };

  const tweet = await extractSingleTweet(article, 'bookmarks');

  assert.ok(tweet);
  assert.equal(tweet.publishedAt, Date.parse(publishedAt));
});

test('tweet cards prefer publication time and fall back for old stored tweets', () => {
  assert.equal(
    getTweetDisplayTime({
      tweetId: '999999999999999999',
      publishedAt: 1_704_164_645_000,
      syncedAt: 1_800_000_000_000,
    }),
    1_704_164_645_000,
  );
  assert.equal(
    getTweetDisplayTime({
      tweetId: '1742018897638326272',
      syncedAt: 1_800_000_000_000,
    }),
    1_704_164_645_000,
  );
  assert.equal(
    getTweetDisplayTime({
      tweetId: 'invalid',
      syncedAt: 1_800_000_000_000,
    }),
    1_800_000_000_000,
  );
});

test('tweet lists are sorted by publication time in descending order', () => {
  const tweets = [
    { tweetId: 'invalid-old', publishedAt: 100, syncedAt: 900 },
    { tweetId: '1742018897638326272', syncedAt: 1_000 },
    { tweetId: 'invalid-new', publishedAt: 200, syncedAt: 800 },
  ];

  const sorted = sortTweetsByPublishedTime(tweets);

  assert.deepEqual(sorted.map((tweet) => tweet.tweetId), [
    '1742018897638326272',
    'invalid-new',
    'invalid-old',
  ]);
  assert.deepEqual(tweets.map((tweet) => tweet.tweetId), [
    'invalid-old',
    '1742018897638326272',
    'invalid-new',
  ]);
});
