/**
 * Generate a URL-friendly slug from text
 * Takes first 5-6 words and converts to lowercase with hyphens
 */
function slugify(text: string, maxLength: number = 40): string {
  // Remove URLs
  const cleaned = text.replace(/https?:\/\/\S+/g, '');

  // Split into words and take first few
  const words = cleaned
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(' ');

  // Convert to slug
  let slug = words
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-') // Keep Chinese, English, numbers
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .slice(0, maxLength);

  // Ensure doesn't end with hyphen
  return slug.replace(/-+$/, '') || 'tweet';
}

export function exportMarkdown(
  tweetText: string,
  author: string,
  tweetUrl: string,
  summary: string,
  reply: string,
  factCheck?: string,
  mediaUrls?: string[],
  cardImageUrl?: string,
): void {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  // Build images section
  let imagesSection = '';
  if (cardImageUrl) {
    imagesSection += `\n### 文章封面\n\n![Article Cover](${cardImageUrl})\n`;
  }
  if (mediaUrls && mediaUrls.length > 0) {
    imagesSection += `\n### 媒体图片\n\n`;
    mediaUrls.forEach((url, index) => {
      imagesSection += `![Media ${index + 1}](${url})\n\n`;
    });
  }

  const content = `# 推文总结

> 作者: ${author}
> 链接: ${tweetUrl}
> 日期: ${dateStr}

## 原文

${tweetText}${imagesSection}
${summary ? `\n## AI 总结\n\n${summary}\n` : ''}${factCheck ? `\n## 事实查验\n\n${factCheck}\n` : ''}
## 建议回复

${reply}
`;

  // Service worker has no DOM, so use data URL instead of Blob + createObjectURL
  const base64 = btoa(unescape(encodeURIComponent(content)));
  const url = 'data:text/markdown;base64,' + base64;

  // Generate filename: YYYY-MM-DD-author-text-slug.md
  const authorSlug = author.replace(/[@\s]/g, '').replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '-').slice(0, 20);
  const textSlug = slugify(tweetText);
  const filename = `${dateStr}-${authorSlug}-${textSlug}.md`;

  chrome.downloads.download({
    url,
    filename,
    saveAs: true,
  });
}
