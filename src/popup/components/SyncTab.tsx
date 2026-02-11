import { useState, useEffect } from 'react';
import type { SyncSource, SyncStatus } from '@shared/types';
import SyncButton from './SyncButton';
import SyncStatusBar from './SyncStatusBar';
import { useTweetCount } from '../hooks/useSyncedTweets';

const SOURCES: { id: SyncSource; label: string }[] = [
  { id: 'bookmarks', label: '书签' },
  { id: 'likes', label: '喜欢' },
];

interface SyncTabProps {
  syncStatus: SyncStatus;
  xHandle: string;
}

export default function SyncTab({ syncStatus, xHandle }: SyncTabProps) {
  const [source, setSource] = useState<SyncSource>(syncStatus.source);
  const [searchInput, setSearchInput] = useState('');
  const totalCount = useTweetCount();
  const isSyncing = syncStatus.state === 'syncing';

  // Keep source in sync with ongoing sync status
  useEffect(() => {
    if (isSyncing) setSource(syncStatus.source);
  }, [isSyncing, syncStatus.source]);

  const pageUrl = chrome.runtime.getURL('src/page/index.html');

  const openPage = (query?: string) => {
    const url = query ? `${pageUrl}?q=${encodeURIComponent(query)}` : pageUrl;
    chrome.tabs.create({ url });
  };

  const handleSearch = () => {
    openPage(searchInput.trim() || undefined);
  };

  return (
    <div>
      {/* Source selector */}
      <div className="flex gap-1.5 mb-2.5">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => !isSyncing && setSource(s.id)}
            disabled={isSyncing}
            className={`flex-1 py-1.5 text-[12px] font-semibold rounded-lg border transition-colors ${
              source === s.id
                ? 'bg-x-blue text-white border-x-blue'
                : 'bg-white text-x-text-secondary border-[#cfd9de] hover:border-x-blue'
            } ${isSyncing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <SyncButton source={source} syncState={syncStatus.state} xHandle={xHandle} />
      <SyncStatusBar status={syncStatus} />

      {/* Tweet count & search */}
      {totalCount > 0 && (
        <div className="mt-3 pt-3 border-t border-x-border">
          <div className="text-[12px] text-x-text-secondary mb-2">
            已同步 <span className="font-semibold text-x-text">{totalCount}</span> 条推文
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索推文..."
              className="flex-1 py-1.5 px-2.5 border border-[#cfd9de] rounded-lg text-[12px] outline-none focus:border-x-blue transition-colors"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1.5 bg-x-blue text-white text-[12px] font-semibold rounded-lg hover:bg-x-blue-hover transition-colors"
            >
              搜索
            </button>
          </div>
          <button
            onClick={() => openPage()}
            className="mt-1.5 text-[11px] text-x-blue hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            查看全部 &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
