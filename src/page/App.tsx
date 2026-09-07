import { useState, useEffect, useCallback, useRef } from 'react';
import type { SyncedTweet } from '@shared/types';
import { STORAGE_KEY_TWEETS } from '@shared/constants';
import {
  filterTweetsBySource,
  getTweetSourceLabel,
  TWEET_SOURCE_FILTER_OPTIONS,
  type TweetSourceFilter,
} from './tweet-source';
import { getTweetDisplayTime, sortTweetsByPublishedTime } from './tweet-time';

function getInitialQuery(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('q') ?? '';
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function App() {
  const [allTweets, setAllTweets] = useState<SyncedTweet[]>([]);
  const [query, setQuery] = useState(getInitialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [sourceFilter, setSourceFilter] = useState<TweetSourceFilter>('all');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load tweets and listen for changes
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY_TWEETS, (result) => {
      if (result[STORAGE_KEY_TWEETS]) {
        setAllTweets(result[STORAGE_KEY_TWEETS] as SyncedTweet[]);
      }
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes[STORAGE_KEY_TWEETS]) {
        setAllTweets((changes[STORAGE_KEY_TWEETS].newValue as SyncedTweet[]) ?? []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(value), 200);
  }, []);

  // Filter and sort tweets
  const sourceTweets = filterTweetsBySource(allTweets, sourceFilter);
  const matchingTweets = debouncedQuery
    ? sourceTweets.filter((t) => {
        const q = debouncedQuery.toLowerCase();
        return (
          t.text.toLowerCase().includes(q) ||
          t.author.toLowerCase().includes(q) ||
          t.authorHandle.toLowerCase().includes(q) ||
          t.quotedText.toLowerCase().includes(q) ||
          t.cardText.toLowerCase().includes(q)
        );
      })
    : sourceTweets;
  const filtered = sortTweetsByPublishedTime(matchingTweets);
  const countText = debouncedQuery
    ? `找到 ${filtered.length} 条结果（共 ${allTweets.length} 条）`
    : sourceFilter === 'all'
      ? `共 ${allTweets.length} 条推文`
      : `显示 ${filtered.length} 条（共 ${allTweets.length} 条）`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-x-text mb-2">
            X Bookmark Sync
          </h1>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索推文内容、作者..."
              className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-x-blue focus:ring-1 focus:ring-x-blue transition-colors"
              autoFocus
            />
            {query && (
              <button
                onClick={() => handleSearch('')}
                className="px-3 py-2 text-sm text-x-text-secondary hover:text-x-text rounded-lg hover:bg-gray-100 transition-colors"
              >
                清除
              </button>
            )}
          </div>
          <div
            className="mt-2 grid grid-cols-4 gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5"
            role="group"
            aria-label="筛选推文来源"
          >
            {TWEET_SOURCE_FILTER_OPTIONS.map((option) => {
              const selected = sourceFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSourceFilter(option.value)}
                  className={`min-w-0 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-x-blue ${
                    selected
                      ? 'bg-x-blue text-white shadow-sm'
                      : 'text-x-text-secondary hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-x-text-muted mt-1.5">
            {countText}
          </div>
        </div>
      </div>

      {/* Tweet list */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center text-x-text-muted text-sm py-16">
            {allTweets.length === 0 ? '还没有同步的推文' : '没有匹配的结果'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tweet) => (
              <TweetCard key={tweet.tweetId} tweet={tweet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TweetCard({ tweet }: { tweet: SyncedTweet }) {
  // Backward compat: old tweets may not have new fields
  const mediaUrls = tweet.mediaUrls ?? [];
  const cardTitle = tweet.cardTitle ?? '';
  const cardDescription = tweet.cardDescription ?? '';
  const cardImageUrl = tweet.cardImageUrl ?? '';
  const hasCard = cardTitle || cardDescription || cardImageUrl || tweet.cardText;

  return (
    <a
      href={tweet.tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-x-blue hover:shadow-sm transition-all no-underline text-x-text"
    >
      {/* Author */}
      <div className="flex items-center gap-2 mb-2 min-w-0">
        <span className="text-sm font-semibold truncate">{tweet.author}</span>
        <span className="text-xs text-x-text-muted truncate">{tweet.authorHandle}</span>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-x-text-muted">
            {getTweetSourceLabel(tweet.source)}
          </span>
          <span className="text-xs text-x-text-muted">{formatTime(getTweetDisplayTime(tweet))}</span>
        </div>
      </div>

      {/* Main text */}
      {tweet.text && (
        <p className="text-sm leading-relaxed text-x-text-secondary whitespace-pre-line mb-2">
          {tweet.text}
        </p>
      )}

      {/* Quoted tweet */}
      {tweet.quotedText && (
        <div className="border-l-2 border-x-blue pl-3 mb-2">
          {tweet.quotedAuthor && (
            <div className="text-xs font-medium text-x-text-muted mb-0.5">
              引用 {tweet.quotedAuthor}
            </div>
          )}
          <p className="text-xs leading-relaxed text-x-text-muted">
            {tweet.quotedText}
          </p>
        </div>
      )}

      {/* Link / article card */}
      {hasCard && (
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-2">
          {cardImageUrl && (
            <img
              src={cardImageUrl}
              alt=""
              loading="lazy"
              className="w-full h-[160px] object-cover"
            />
          )}
          <div className="px-3 py-2">
            {cardTitle && (
              <div className="text-sm font-medium text-x-text leading-snug">
                {cardTitle}
              </div>
            )}
            {cardDescription && (
              <div className="text-xs text-x-text-secondary mt-0.5 line-clamp-2">
                {cardDescription}
              </div>
            )}
            {!cardTitle && !cardDescription && tweet.cardText && (
              <div className="text-xs text-x-text-secondary leading-relaxed">
                {tweet.cardText}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media images */}
      {mediaUrls.length > 0 ? (
        <div className={`grid gap-1.5 mb-2 ${mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {mediaUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              loading="lazy"
              className="w-full rounded-lg object-cover max-h-[280px]"
            />
          ))}
        </div>
      ) : tweet.mediaCount > 0 && !hasCard ? (
        <div className="text-xs text-x-text-muted mb-2">
          {'\u{1F5BC}'} {tweet.mediaCount} 张图片
        </div>
      ) : null}

      {/* Article indicator (only for old data without structured card) */}
      {tweet.hasArticle && !hasCard && (
        <div className="text-xs text-x-text-muted">
          {'\u{1F517}'} 含链接
        </div>
      )}
    </a>
  );
}
