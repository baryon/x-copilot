import type { SyncedTweet, SyncSource } from '@shared/types';

export function extractTweetsFromPage(source: SyncSource): SyncedTweet[] {
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  const tweets: SyncedTweet[] = [];

  for (const article of articles) {
    const tweet = extractSingleTweet(article, source);
    if (tweet) tweets.push(tweet);
  }

  return tweets;
}

export function extractSingleTweet(article: Element, source: SyncSource): SyncedTweet | null {
  // Extract tweet URL and ID from the time link
  let tweetUrl = '';
  let tweetId = '';
  const quotedTweet = article.querySelector('[data-testid="quoteTweet"]');

  const statusLinks = article.querySelectorAll('a[href*="/status/"]');
  for (const link of statusLinks) {
    if (quotedTweet?.contains(link)) continue;
    if (link.querySelector('time')) {
      const href = link.getAttribute('href') || '';
      tweetUrl = href.startsWith('/') ? 'https://x.com' + href : href;
      const match = href.match(/\/status\/(\d+)/);
      if (match) tweetId = match[1];
      break;
    }
  }

  if (!tweetId) return null;

  // Author info
  const userNameEl = article.querySelector('[data-testid="User-Name"]') as HTMLElement | null;
  let author = '';
  let authorHandle = '';
  if (userNameEl) {
    const spans = userNameEl.querySelectorAll('span');
    for (const span of spans) {
      const text = span.textContent || '';
      if (text.startsWith('@')) {
        authorHandle = text;
        break;
      }
    }
    author = userNameEl.innerText.split('\n')[0];
  }

  // Tweet text
  const tweetTextEl = article.querySelector('[data-testid="tweetText"]') as HTMLElement | null;
  let text = tweetTextEl?.innerText ?? '';
  let hasArticle = false;

  // Fallback: X Article (long-form) content
  if (!text) {
    const articleTitle = article.querySelector('[data-testid="twitter-article-title"]') as HTMLElement | null;
    const articleBody = article.querySelector('[data-testid="longformRichTextComponent"]') as HTMLElement | null;
    if (articleTitle || articleBody) {
      hasArticle = true;
      const titleText = articleTitle?.innerText?.trim() ?? '';
      const bodyText = articleBody?.innerText?.trim() ?? '';
      text = [titleText, bodyText].filter(Boolean).join('\n\n');
    }
  }

  // Quoted tweet
  const quotedText = quotedTweet
    ? ((quotedTweet.querySelector('[data-testid="tweetText"]') as HTMLElement | null)?.innerText ?? '')
    : '';
  const quotedAuthorEl = quotedTweet
    ? (quotedTweet.querySelector('[data-testid="User-Name"]') as HTMLElement | null)
    : null;
  const quotedAuthor = quotedAuthorEl ? quotedAuthorEl.innerText.split('\n')[0] : '';

  // ── Card / Article extraction ────────────────────────────────────────────
  let cardText = '';
  let cardTitle = '';
  let cardDescription = '';
  let cardUrl = '';
  let cardImageUrl = '';

  // 1. X Article format (data-testid="article-cover-image")
  const articleCoverEl = article.querySelector('[data-testid="article-cover-image"]') as HTMLElement | null;
  if (articleCoverEl) {
    hasArticle = true;

    // Cover image
    const coverImg = articleCoverEl.querySelector('img[src]');
    if (coverImg) {
      const src = coverImg.getAttribute('src') || '';
      if (src.startsWith('http')) cardImageUrl = src;
    }

    // Title & description are in sibling div(s) after the cover image container
    // Walk up to the cover image's parent, then find [dir="auto"] text blocks
    const articleContainer = articleCoverEl.closest('[class]')?.parentElement;
    if (articleContainer) {
      const textBlocks = articleContainer.querySelectorAll('[dir="auto"]');
      for (const block of textBlocks) {
        // Skip blocks inside the cover image or action buttons
        if (articleCoverEl.contains(block)) continue;
        const t = (block as HTMLElement).innerText?.trim();
        if (!t) continue;
        if (!cardTitle) {
          cardTitle = t;
        } else if (!cardDescription) {
          cardDescription = t;
        }
      }
    }
    cardText = [cardTitle, cardDescription].filter(Boolean).join('\n');
  }

  // 2. Link card format (data-testid="card.wrapper")
  const cardEl = article.querySelector('[data-testid="card.wrapper"]') as HTMLElement | null;
  if (cardEl && !hasArticle) {
    hasArticle = true;
    cardText = cardEl.innerText ?? '';

    // Card link URL
    const cardLink = cardEl.querySelector('a[href]');
    if (cardLink) cardUrl = cardLink.getAttribute('href') || '';

    // Card image
    const cardImg = cardEl.querySelector('img[src]');
    if (cardImg) {
      const src = cardImg.getAttribute('src') || '';
      if (src.startsWith('http')) cardImageUrl = src;
    }

    // Extract text blocks: typically [domain, title, description]
    const textBlocks = cardEl.querySelectorAll('[dir="auto"], [dir="ltr"]');
    const texts: string[] = [];
    for (const block of textBlocks) {
      const t = (block as HTMLElement).innerText?.trim();
      if (t && !texts.includes(t)) texts.push(t);
    }
    // Heuristic: first is domain, second is title, rest is description
    if (texts.length >= 2) {
      cardTitle = texts[1];
      if (texts.length >= 3) cardDescription = texts.slice(2).join(' ');
    } else if (texts.length === 1) {
      cardTitle = texts[0];
    }
  }

  // ── Media ──────────────────────────────────────────────────────────────
  const photos = article.querySelectorAll('[data-testid="tweetPhoto"]');
  const videos = article.querySelectorAll('[data-testid="videoPlayer"]');
  const mediaCount = photos.length + videos.length;
  const mediaUrls: string[] = [];
  for (const photo of photos) {
    const img = photo.querySelector('img[src]');
    if (img) {
      const src = img.getAttribute('src') || '';
      if (src.includes('pbs.twimg.com')) mediaUrls.push(src);
    }
  }

  return {
    tweetId,
    author,
    authorHandle,
    text,
    quotedText,
    quotedAuthor,
    cardText,
    cardTitle,
    cardDescription,
    cardUrl,
    cardImageUrl,
    tweetUrl,
    mediaCount,
    mediaUrls,
    hasArticle,
    syncedAt: Date.now(),
    source,
  };
}
