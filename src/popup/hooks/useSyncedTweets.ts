import { useState, useEffect } from 'react';
import type { SyncedTweet } from '@shared/types';
import { STORAGE_KEY_TWEETS } from '@shared/constants';

export function useTweetCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY_TWEETS, (result) => {
      if (result[STORAGE_KEY_TWEETS]) {
        setCount((result[STORAGE_KEY_TWEETS] as SyncedTweet[]).length);
      }
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes[STORAGE_KEY_TWEETS]) {
        setCount(((changes[STORAGE_KEY_TWEETS].newValue as SyncedTweet[]) ?? []).length);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return count;
}
