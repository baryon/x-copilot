export function exportMarkdown(
  tweetText: string,
  author: string,
  tweetUrl: string,
  summary: string,
  reply: string,
): void {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const content = `# 推文总结

> 作者: ${author}
> 链接: ${tweetUrl}
> 日期: ${dateStr}

## 原文

${tweetText}

## AI 总结

${summary}

## 建议回复

${reply}
`;

  // Service worker has no DOM, so use data URL instead of Blob + createObjectURL
  const base64 = btoa(unescape(encodeURIComponent(content)));
  const url = 'data:text/markdown;base64,' + base64;
  const filename = `tweet-summary-${author.replace(/[^a-zA-Z0-9_]/g, '')}-${dateStr}.md`;

  chrome.downloads.download({
    url,
    filename,
    saveAs: true,
  });
}
