import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'X Copilot',
  version: '4.4.0',
  description: 'Sync bookmarks, likes & own tweets, with AI summaries and smart replies for X (Twitter)',
  permissions: ['storage', 'unlimitedStorage', 'tabs', 'downloads'],
  host_permissions: [
    'https://x.com/*',
    'https://twitter.com/*',
    'https://*/*',
    'http://localhost/*',
    'http://127.0.0.1/*',
  ],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://x.com/*', 'https://twitter.com/*'],
      js: ['src/content/index.ts'],
    },
  ],
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'X Copilot',
  },
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
});
