import { useState, useEffect } from 'react';
import type { SyncStatus } from '@shared/types';
import { STORAGE_KEY_SYNC_STATUS, DEFAULT_SYNC_STATUS } from '@shared/constants';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({ ...DEFAULT_SYNC_STATUS });

  useEffect(() => {
    // Load initial status
    chrome.storage.local.get(STORAGE_KEY_SYNC_STATUS, (result) => {
      if (result[STORAGE_KEY_SYNC_STATUS]) {
        setStatus(result[STORAGE_KEY_SYNC_STATUS] as SyncStatus);
      }
    });

    // Listen for changes
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes[STORAGE_KEY_SYNC_STATUS]) {
        setStatus(changes[STORAGE_KEY_SYNC_STATUS].newValue as SyncStatus);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return status;
}
