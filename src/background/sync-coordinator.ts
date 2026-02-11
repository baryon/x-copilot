import type { SyncSource, SyncedTweet, SyncStatus } from '@shared/types';
import { getSyncSourceUrl } from '@shared/constants';
import { sendTabMessage } from '@shared/messaging';
import { getSyncStatus, setSyncStatus, mergeTweets } from './storage';

let activeTabId: number | null = null;

export async function startSync(source: SyncSource, xHandle?: string): Promise<void> {
  const current = await getSyncStatus();
  if (current.state === 'syncing') return;

  // Use passed xHandle, fall back to storage
  const handle = xHandle || ((await chrome.storage.sync.get({ xHandle: '' })).xHandle as string);
  const targetUrl = getSyncSourceUrl(source, handle);

  const status: SyncStatus = {
    state: 'syncing',
    source,
    totalExtracted: 0,
    newCount: 0,
    startedAt: Date.now(),
    completedAt: null,
    error: null,
  };
  await setSyncStatus(status);
  const tab = await findOrCreateTab(targetUrl);
  activeTabId = tab.id!;

  // Wait for page + content script to be ready before sending message
  await waitForTabReady(activeTabId);
  await sendTabMessage(activeTabId, { type: 'BEGIN_EXTRACTION', source });
}

export async function handleProgress(tweets: SyncedTweet[]): Promise<void> {
  const newCount = await mergeTweets(tweets);
  const status = await getSyncStatus();
  if (status.state !== 'syncing') return;

  status.totalExtracted += tweets.length;
  status.newCount += newCount;
  await setSyncStatus(status);
}

export async function handleComplete(): Promise<void> {
  const status = await getSyncStatus();
  status.state = 'completed';
  status.completedAt = Date.now();
  await setSyncStatus(status);
  activeTabId = null;
}

export async function handleError(error: string): Promise<void> {
  const status = await getSyncStatus();
  status.state = 'error';
  status.error = error;
  status.completedAt = Date.now();
  await setSyncStatus(status);
  activeTabId = null;
}

export async function stopSync(): Promise<void> {
  if (activeTabId != null) {
    await sendTabMessage(activeTabId, { type: 'STOP_EXTRACTION' });
  }
  const status = await getSyncStatus();
  status.state = 'idle';
  status.completedAt = Date.now();
  await setSyncStatus(status);
  activeTabId = null;
}

async function findOrCreateTab(url: string): Promise<chrome.tabs.Tab> {
  const tabs = await chrome.tabs.query({ url: url + '*' });
  if (tabs.length > 0 && tabs[0].id != null) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    return tabs[0];
  }
  return chrome.tabs.create({ url, active: true });
}

function waitForTabReady(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    // Check if already loaded
    chrome.tabs.get(tabId, (tab) => {
      if (tab.status === 'complete') {
        // Extra delay for content script initialization
        setTimeout(resolve, 500);
        return;
      }
      // Wait for tab to finish loading
      const listener = (
        id: number,
        changeInfo: chrome.tabs.TabChangeInfo,
      ) => {
        if (id === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(resolve, 500);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  });
}
