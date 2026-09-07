import type { SyncSource, SyncedTweet } from '@shared/types';
import { SCROLL_WAIT_MS, MUTATION_TIMEOUT_MS, BATCH_SIZE, MAX_EMPTY_SCROLLS } from '@shared/constants';
import { sendMessage } from '@shared/messaging';
import { extractTweetsFromPage } from './tweet-extractor';
import { selectIncrementalTweets } from './incremental-boundary';

let running = false;

export function isRunning(): boolean {
  return running;
}

export function stopExtraction(): void {
  running = false;
}

export async function startExtraction(source: SyncSource, knownTweetIds: string[]): Promise<void> {
  if (running) return;
  running = true;

  const seenIds = new Set<string>();
  const knownIds = new Set(knownTweetIds);
  let emptyScrollCount = 0;
  let knownStreak = 0;
  let batch: SyncedTweet[] = [];

  try {
    await scrollToTop();

    while (running) {
      // Extract current visible tweets
      const tweets = await extractTweetsFromPage(source);
      const selection = selectIncrementalTweets(tweets, seenIds, knownIds, knownStreak);
      knownStreak = selection.knownStreak;

      for (const tweet of selection.tweetsToSync) {
        batch.push(tweet);

        if (batch.length >= BATCH_SIZE) {
          await sendBatch(batch);
          batch = [];
        }
      }

      if (selection.reachedBoundary) break;

      if (selection.observedCount === 0) {
        emptyScrollCount++;
        if (emptyScrollCount >= MAX_EMPTY_SCROLLS) break;
      } else {
        emptyScrollCount = 0;
      }

      // Scroll down
      window.scrollBy(0, window.innerHeight);

      // Wait for new content to load
      await waitForNewContent();
    }

    // Send remaining batch
    if (batch.length > 0) {
      await sendBatch(batch);
    }

    if (running) {
      await sendMessage({ type: 'SYNC_COMPLETE' });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown extraction error';
    await sendMessage({ type: 'SYNC_ERROR', error: msg });
  } finally {
    running = false;
  }
}

async function sendBatch(tweets: SyncedTweet[]): Promise<void> {
  await sendMessage({ type: 'SYNC_PROGRESS', tweets });
}

async function scrollToTop(): Promise<void> {
  if (window.scrollY === 0) return;

  const waitForTopContent = waitForNewContent();
  window.scrollTo(0, 0);
  await waitForTopContent;
}

function waitForNewContent(): Promise<void> {
  return new Promise((resolve) => {
    const timeline = document.querySelector('[aria-label]');
    if (!timeline) {
      setTimeout(resolve, SCROLL_WAIT_MS);
      return;
    }

    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      observer.disconnect();
      clearTimeout(timeout);
      // Small extra delay for rendering
      setTimeout(resolve, 500);
    };

    const observer = new MutationObserver(() => done());
    observer.observe(timeline, { childList: true, subtree: true });

    const timeout = setTimeout(done, MUTATION_TIMEOUT_MS);
  });
}
