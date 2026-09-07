import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterTweetsBySource,
  getTweetSourceLabel,
} from '../src/page/tweet-source.ts';

test('tweet source labels use the first synchronized source value', () => {
  assert.equal(getTweetSourceLabel('bookmarks'), '书签');
  assert.equal(getTweetSourceLabel('likes'), '喜欢');
  assert.equal(getTweetSourceLabel('own_tweets'), '我的推文');
});

test('tweet source filters support all four options without mutating input', () => {
  const tweets = [
    { tweetId: '1', source: 'likes', text: 'match' },
    { tweetId: '2', source: 'bookmarks', text: 'match' },
    { tweetId: '3', source: 'own_tweets', text: 'other' },
  ];

  assert.deepEqual(
    filterTweetsBySource(tweets, 'all').map((tweet) => tweet.tweetId),
    ['1', '2', '3'],
  );
  assert.deepEqual(
    filterTweetsBySource(tweets, 'likes').map((tweet) => tweet.tweetId),
    ['1'],
  );
  assert.deepEqual(
    filterTweetsBySource(tweets, 'bookmarks').map((tweet) => tweet.tweetId),
    ['2'],
  );
  assert.deepEqual(
    filterTweetsBySource(tweets, 'own_tweets').map((tweet) => tweet.tweetId),
    ['3'],
  );

  const searched = filterTweetsBySource(tweets, 'bookmarks')
    .filter((tweet) => tweet.text.includes('match'));
  assert.deepEqual(searched.map((tweet) => tweet.tweetId), ['2']);
  assert.deepEqual(tweets.map((tweet) => tweet.tweetId), ['1', '2', '3']);
});
