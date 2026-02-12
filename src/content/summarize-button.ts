import { STORAGE_KEY_API_KEY } from '@shared/constants';
import { sendMessage } from '@shared/messaging';
import { extractSingleTweet } from './extractor/tweet-extractor';
import { showStreaming, showError } from './summary-overlay';

const BUTTON_ATTR = 'data-xbs-summarize';

const SPARKLE_SVG = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/>
</svg>`;

function createSummarizeButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.setAttribute(BUTTON_ATTR, 'true');
  btn.title = 'AI 总结';
  Object.assign(btn.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#536471',
    transition: 'background-color 0.2s, color 0.2s',
    padding: '0',
  });
  btn.innerHTML = SPARKLE_SVG;

  btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = 'rgba(29,155,240,0.1)';
    btn.style.color = '#1d9bf0';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = 'transparent';
    btn.style.color = '#536471';
  });

  return btn;
}

function injectButton(article: Element): void {
  if (article.querySelector(`[${BUTTON_ATTR}]`)) return;

  // Find the action bar (the row with like, retweet, share buttons)
  const actionBar = article.querySelector('[role="group"]');
  if (!actionBar) return;

  const btn = createSummarizeButton();
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSummarizeClick(article);
  });

  actionBar.appendChild(btn);
}

async function handleSummarizeClick(article: Element): Promise<void> {
  const tweet = extractSingleTweet(article, 'bookmarks');
  if (!tweet) return;

  showStreaming();

  try {
    const res = await sendMessage({
      type: 'SUMMARIZE_TWEET',
      tweetText: tweet.text + (tweet.quotedText ? `\n\n[引用] ${tweet.quotedAuthor}: ${tweet.quotedText}` : ''),
      author: tweet.author || tweet.authorHandle,
      tweetUrl: tweet.tweetUrl,
    });
    if (!res.success && res.error) {
      showError(res.error);
    }
  } catch (e) {
    showError((e as Error).message || '发送消息失败');
  }
}

function scanAndInject(): void {
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  for (const article of articles) {
    injectButton(article);
  }
}

export async function initSummarizeButtons(): Promise<void> {
  // Only inject if user has configured an API key
  const data = await chrome.storage.local.get(STORAGE_KEY_API_KEY);
  if (!data[STORAGE_KEY_API_KEY]) return;

  // Inject into existing tweets
  scanAndInject();

  // Watch for new tweets
  const observer = new MutationObserver(() => {
    scanAndInject();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
