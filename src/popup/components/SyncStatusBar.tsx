import type { SyncStatus } from '@shared/types';

interface SyncStatusBarProps {
  status: SyncStatus;
}

export default function SyncStatusBar({ status }: SyncStatusBarProps) {
  if (status.state === 'idle' && status.startedAt === 0) return null;

  const stateLabel: Record<string, string> = {
    idle: '就绪',
    syncing: '同步中...',
    completed: '同步完成',
    error: '同步出错',
  };

  const stateColor: Record<string, string> = {
    idle: 'text-x-text-secondary',
    syncing: 'text-x-blue',
    completed: 'text-x-success',
    error: 'text-x-error',
  };

  return (
    <div className="text-xs mt-2 mb-2 flex items-center justify-between">
      <span className={stateColor[status.state]}>
        {status.state === 'syncing' && (
          <span className="inline-block w-3 h-3 border-2 border-x-blue border-t-transparent rounded-full animate-spin mr-1 align-middle" />
        )}
        {stateLabel[status.state]}
      </span>
      <span className="text-x-text-muted">
        {status.totalExtracted > 0 && `已提取 ${status.totalExtracted} 条`}
        {status.newCount > 0 && ` / 新增 ${status.newCount} 条`}
      </span>
      {status.state === 'error' && status.error && (
        <span className="text-x-error text-[11px] block w-full mt-0.5">{status.error}</span>
      )}
    </div>
  );
}
