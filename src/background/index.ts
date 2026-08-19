import type { ExtensionMessage, MessageResponse } from '@shared/types';
import { onMessage, sendTabMessage } from '@shared/messaging';
import { getSyncStatus, getSyncedTweets, clearSyncedTweets, setSyncStatus } from './storage';
import { startSync, handleProgress, handleComplete, handleError, stopSync } from './sync-coordinator';
import { DEFAULT_SYNC_STATUS, isLongPost } from '@shared/constants';
import { summarizeTweet, regenerateReply, factCheckTweet } from './summarizer';
import { exportMarkdown } from './markdown-export';
import { testLLM } from './llm/index';

onMessage((message: ExtensionMessage, sender, sendResponse: (r: MessageResponse) => void) => {
  switch (message.type) {
    case 'START_SYNC':
      startSync(message.source, message.xHandle)
        .then(() => sendResponse({ success: true }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'STOP_SYNC':
      stopSync()
        .then(() => sendResponse({ success: true }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'GET_SYNC_STATUS':
      getSyncStatus()
        .then((data) => sendResponse({ success: true, data }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'GET_SYNCED_TWEETS':
      getSyncedTweets()
        .then((data) => sendResponse({ success: true, data }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'CLEAR_SYNCED_DATA':
      Promise.all([clearSyncedTweets(), setSyncStatus({ ...DEFAULT_SYNC_STATUS })])
        .then(() => sendResponse({ success: true }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'TEST_MODEL':
      testLLM(message.provider, message.baseUrl, message.apiKey, message.model)
        .then(() => sendResponse({ success: true }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'SYNC_PROGRESS':
      handleProgress(message.tweets)
        .then(() => sendResponse({ success: true }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'SYNC_COMPLETE':
      handleComplete()
        .then(() => sendResponse({ success: true }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'SYNC_ERROR':
      handleError(message.error)
        .then(() => sendResponse({ success: true }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'SUMMARIZE_TWEET': {
      const tabId = sender.tab?.id;
      const onChunk = tabId && isLongPost(message.tweetText)
        ? (chunk: string) => { sendTabMessage(tabId, { type: 'SUMMARIZE_STREAM_CHUNK', chunk }); }
        : undefined;
      summarizeTweet(message.tweetText, message.author, message.userPrompt, onChunk)
        .then((result) => {
          if (tabId) {
            sendTabMessage(tabId, {
              type: 'SUMMARIZE_RESULT',
              summary: result.summary,
              reply: result.reply,
              factCheck: result.factCheck,
              tweetText: message.tweetText,
              author: message.author,
              tweetUrl: message.tweetUrl,
              mediaUrls: message.mediaUrls,
              cardImageUrl: message.cardImageUrl,
            });
          }
          sendResponse({ success: true, data: result });
        })
        .catch((e: Error) => {
          if (tabId) {
            sendTabMessage(tabId, {
              type: 'SUMMARIZE_RESULT',
              summary: '',
              reply: '',
              factCheck: '',
              tweetText: message.tweetText,
              author: message.author,
              tweetUrl: message.tweetUrl,
              mediaUrls: message.mediaUrls,
              cardImageUrl: message.cardImageUrl,
              error: e.message,
            });
          }
          sendResponse({ success: false, error: e.message });
        });
      return true;
    }

    case 'REGENERATE_REPLY':
      regenerateReply(message.tweetText, message.author, message.userPrompt)
        .then((reply) => sendResponse({ success: true, data: reply }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'FACT_CHECK_TWEET':
      factCheckTweet(message.tweetText, message.author)
        .then((text) => sendResponse({ success: true, data: text }))
        .catch((e: Error) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'EXPORT_MARKDOWN':
      exportMarkdown(
        message.tweetText,
        message.author,
        message.tweetUrl,
        message.summary,
        message.reply,
        message.factCheck,
        message.mediaUrls,
        message.cardImageUrl,
      );
      sendResponse({ success: true });
      return true;
  }
});
