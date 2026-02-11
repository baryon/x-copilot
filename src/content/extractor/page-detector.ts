import type { SyncSource } from '@shared/types';

export function detectPageType(url: string): SyncSource | null {
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host !== 'x.com' && host !== 'twitter.com') return null;

    const path = u.pathname;
    if (path === '/i/bookmarks' || path.startsWith('/i/bookmarks/')) return 'bookmarks';
    if (path.endsWith('/likes')) return 'likes';

    return null;
  } catch {
    return null;
  }
}
