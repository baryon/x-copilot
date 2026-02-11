import type { SyncSource, SyncState } from '@shared/types';
import { SYNC_SOURCE_LABELS } from '@shared/constants';
import { sendMessage } from '@shared/messaging';

interface SyncButtonProps {
  source: SyncSource;
  syncState: SyncState;
  xHandle: string;
}

export default function SyncButton({ source, syncState, xHandle }: SyncButtonProps) {
  const isSyncing = syncState === 'syncing';

  const handleClick = async () => {
    if (isSyncing) {
      await sendMessage({ type: 'STOP_SYNC' });
    } else {
      await sendMessage({ type: 'START_SYNC', source, xHandle: xHandle || undefined });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full py-2.5 border-none rounded-full text-[13px] font-bold cursor-pointer transition-colors ${
        isSyncing
          ? 'bg-x-error text-white hover:bg-red-600 active:bg-red-700'
          : 'bg-x-blue text-white hover:bg-x-blue-hover active:bg-x-blue-active'
      }`}
    >
      {isSyncing ? '停止同步' : `同步${SYNC_SOURCE_LABELS[source]}`}
    </button>
  );
}
