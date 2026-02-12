import { STORAGE_KEY_API_KEY } from '@shared/constants';
import { sendMessage } from '@shared/messaging';
import { extractSingleTweet } from './extractor/tweet-extractor';
import { showStreaming, showError } from './summary-overlay';

const BUTTON_ATTR = 'data-xbs-summarize';
const TOPBAR_ATTR = 'data-xbs-summarize-topbar';

const SPARKLE_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

/**
 * Inject our button into the tweet/article bottom action bar.
 * Wraps in a <div> to match native action‐item flex structure so vertical
 * alignment stays consistent with reply / retweet / like / etc.
 */
function injectButton(article: Element): void {
  if (article.querySelector(`[${BUTTON_ATTR}]`)) return;

  const actionBar = article.querySelector('[role="group"]');
  if (!actionBar) return;

  const btn = createSummarizeButton();
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSummarizeClick(article);
  });

  // Wrap in a flex container matching native action‐item wrappers
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
  });
  wrapper.appendChild(btn);
  actionBar.appendChild(wrapper);
}

/**
 * Inject our button into the sticky top‐bar of an X Article page.
 * The top bar lives outside <article> and contains back / share / bookmark / more.
 */
function injectIntoArticleTopBar(): void {
  // Only on article detail pages
  const isArticlePage = !!document.querySelector(
    '[data-testid="twitterArticleReadView"], [data-testid="longformRichTextComponent"], [data-testid="twitter-article-title"]',
  );
  if (!isArticlePage) return;

  // Already injected
  if (document.querySelector(`[${TOPBAR_ATTR}]`)) return;

  // Find the back button – present on all X detail pages
  const backBtn =
    document.querySelector('[data-testid="app-bar-back"]') ??
    document.querySelector('[data-testid="app-bar-close"]');
  if (!backBtn) return;

  // Walk up from the back button to find the header row that also contains
  // the right‐side action buttons (share / bookmark / more).
  let headerRow: Element | null = backBtn.parentElement;
  for (let i = 0; i < 5 && headerRow; i++) {
    const btns = headerRow.querySelectorAll('button');
    // The header row has at least the back button + 2–3 action buttons
    if (btns.length >= 3) break;
    headerRow = headerRow.parentElement;
  }
  if (!headerRow) return;

  // Collect all buttons that are NOT the back button
  const allBtns = Array.from(headerRow.querySelectorAll('button'));
  const actionBtns = allBtns.filter((b) => b !== backBtn && !backBtn.contains(b));
  if (actionBtns.length === 0) return;

  const btn = createSummarizeButton();
  btn.setAttribute(TOPBAR_ATTR, 'true');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const article = document.querySelector('article[data-testid="tweet"]');
    if (article) handleSummarizeClick(article);
  });

  // Insert before the first action button (puts it left of share/bookmark/more)
  const firstActionBtn = actionBtns[0];
  const insertTarget = firstActionBtn.closest('[class]')?.parentElement ?? firstActionBtn.parentElement;
  if (insertTarget) {
    insertTarget.insertBefore(btn, firstActionBtn.closest('[class]') ?? firstActionBtn);
  }
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
  // Bottom action bars inside tweet articles
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  for (const article of articles) {
    injectButton(article);
  }

  // Top bar on article detail pages
  injectIntoArticleTopBar();
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
