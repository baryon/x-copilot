import type { ExtensionMessage, MessageResponse } from '@shared/types';
import { onMessage, sendTabMessage } from '@shared/messaging';
import { getSyncStatus, getSyncedTweets, clearSyncedTweets, setSyncStatus } from './storage';
import { startSync, handleProgress, handleComplete, handleError, stopSync } from './sync-coordinator';
import { DEFAULT_SYNC_STATUS } from '@shared/constants';
import { summarizeTweet, regenerateReply } from './summarizer';
import { exportMarkdown } from './markdown-export';

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
      summarizeTweet(message.tweetText, message.author, message.userPrompt)
        .then((result) => {
          if (tabId) {
            sendTabMessage(tabId, {
              type: 'SUMMARIZE_RESULT',
              summary: result.summary,
              reply: result.reply,
              tweetText: message.tweetText,
              author: message.author,
              tweetUrl: message.tweetUrl,
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
              tweetText: message.tweetText,
              author: message.author,
              tweetUrl: message.tweetUrl,
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

    case 'EXPORT_MARKDOWN':
      exportMarkdown(
        message.tweetText,
        message.author,
        message.tweetUrl,
        message.summary,
        message.reply,
      );
      sendResponse({ success: true });
      return true;
  }
});
