import type { ReplyStyle, SummarizeResultMessage } from '@shared/types';
import { REPLY_STYLE_LABELS } from '@shared/constants';
import { sendMessage } from '@shared/messaging';

const OVERLAY_ID = 'xbs-summary-overlay';

let currentData: { tweetText: string; author: string; tweetUrl: string; summary: string; reply: string } | null = null;
let streamBuffer = '';

/** All child elements inside overlay need explicit color-scheme to fight X dark mode */
const RESET_CSS = 'color-scheme:light;color:#0f1419;background-color:#fff;';

const SELECT_CSS = 'padding:6px 8px;border:1.5px solid #cfd9de;border-radius:8px;font-size:13px;color:#0f1419;background-color:#fff;outline:none;color-scheme:light;cursor:pointer;';
const BTN_SECONDARY_CSS = 'padding:6px 14px;background:#fff;color:#536471;border:1.5px solid #cfd9de;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;text-align:center;white-space:nowrap;';

function getOrCreateOverlay(): HTMLElement {
  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      width: '400px',
      height: '100vh',
      backgroundColor: '#ffffff',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      zIndex: '999999',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
      display: 'none',
      colorScheme: 'light',
    });
    document.body.appendChild(overlay);
  }
  return overlay;
}

function headerHtml(title: string): string {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eff3f4;${RESET_CSS}">
      <span style="font-size:16px;font-weight:700;color:#0f1419;">✨ ${title}</span>
      <button id="xbs-overlay-close" style="background:none;border:none;cursor:pointer;padding:4px 6px;font-size:20px;color:#536471;line-height:1;">✕</button>
    </div>`;
}

function styleOptionsHtml(): string {
  const options = (Object.entries(REPLY_STYLE_LABELS) as [ReplyStyle, string][])
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
  return `<select id="xbs-style-select" style="${SELECT_CSS}">${options}</select>`;
}

export function showError(message: string): void {
  const overlay = getOrCreateOverlay();
  overlay.style.display = 'block';
  overlay.innerHTML = `
    ${headerHtml('AI 总结')}
    <div style="padding:20px;${RESET_CSS}">
      <div style="color:#f4212e;font-size:13px;padding:10px 14px;background:#fef2f2;border-radius:8px;line-height:1.5;">${escapeHtml(message)}</div>
      <div style="margin-top:12px;font-size:12px;color:#536471;">如果扩展刚更新，请刷新此页面后重试。</div>
    </div>
  `;
  overlay.querySelector('#xbs-overlay-close')?.addEventListener('click', hideOverlay);
}

export function showLoading(): void {
  const overlay = getOrCreateOverlay();
  overlay.style.display = 'block';
  overlay.innerHTML = `
    ${headerHtml('AI 总结')}
    <div style="padding:20px;${RESET_CSS}">
      <div style="display:flex;align-items:center;gap:10px;padding:40px 0;">
        <div style="width:20px;height:20px;border:2.5px solid #1d9bf0;border-top-color:transparent;border-radius:50%;animation:xbs-spin 0.8s linear infinite;"></div>
        <span style="color:#536471;font-size:14px;">AI 正在分析...</span>
      </div>
    </div>
    <style>@keyframes xbs-spin { to { transform: rotate(360deg); } }</style>
  `;
  overlay.querySelector('#xbs-overlay-close')?.addEventListener('click', hideOverlay);
}

export function showStreaming(): void {
  streamBuffer = '';
  const overlay = getOrCreateOverlay();
  overlay.style.display = 'block';
  overlay.innerHTML = `
    ${headerHtml('AI 总结')}
    <div style="padding:20px;height:calc(100vh - 57px);overflow-y:auto;box-sizing:border-box;${RESET_CSS}">
      <div style="margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:#536471;margin-bottom:8px;">总结</div>
        <div id="xbs-stream-content" style="font-size:14px;color:#0f1419;line-height:1.6;padding:12px 14px;background:#f7f9f9;border-radius:10px;min-height:40px;">
          <span style="display:inline-block;width:2px;height:14px;background:#1d9bf0;animation:xbs-blink 1s step-end infinite;vertical-align:text-bottom;"></span>
        </div>
      </div>
    </div>
    <style>@keyframes xbs-blink { 50% { opacity: 0; } }</style>
  `;
  overlay.querySelector('#xbs-overlay-close')?.addEventListener('click', hideOverlay);
}

export function appendStreamChunk(chunk: string): void {
  streamBuffer += chunk;
  const el = document.getElementById('xbs-stream-content');
  if (el) {
    el.innerHTML = renderMarkdown(streamBuffer);
    el.scrollTop = el.scrollHeight;
  }
}

export function updateOverlay(msg: SummarizeResultMessage): void {
  streamBuffer = '';
  const overlay = getOrCreateOverlay();
  overlay.style.display = 'block';

  if (msg.error) {
    overlay.innerHTML = `
      ${headerHtml('AI 总结')}
      <div style="padding:20px;${RESET_CSS}">
        <div style="color:#f4212e;font-size:13px;padding:10px 14px;background:#fef2f2;border-radius:8px;line-height:1.5;">${escapeHtml(msg.error)}</div>
      </div>
    `;
    overlay.querySelector('#xbs-overlay-close')?.addEventListener('click', hideOverlay);
    return;
  }

  currentData = {
    tweetText: msg.tweetText,
    author: msg.author,
    tweetUrl: msg.tweetUrl,
    summary: msg.summary,
    reply: msg.reply,
  };

  overlay.innerHTML = `
    ${headerHtml('AI 总结')}
    <div style="padding:20px;height:calc(100vh - 57px);overflow-y:auto;box-sizing:border-box;${RESET_CSS}">

      <div style="margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:#536471;margin-bottom:8px;">总结</div>
        <div style="font-size:14px;color:#0f1419;line-height:1.6;padding:12px 14px;background:#f7f9f9;border-radius:10px;">${renderMarkdown(msg.summary)}</div>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:#536471;margin-bottom:8px;">建议回复</div>
        <div id="xbs-reply-text" contenteditable="true" style="width:100%;padding:12px 14px;border:1.5px solid #cfd9de;border-radius:10px;font-size:14px;color:#0f1419;background-color:#ffffff;line-height:1.6;font-family:inherit;outline:none;box-sizing:border-box;color-scheme:light;white-space:pre-wrap;word-break:break-word;">${escapeHtml(msg.reply)}</div>
      </div>

      <div style="margin-bottom:20px;padding:12px 14px;background:#f7f9f9;border-radius:10px;">
        <div style="font-size:13px;font-weight:600;color:#536471;margin-bottom:8px;">重新生成</div>
        <input id="xbs-user-prompt" type="text" placeholder="输入额外指令，如：用英文回复、更幽默一点..." style="width:100%;padding:8px 12px;border:1.5px solid #cfd9de;border-radius:8px;font-size:13px;color:#0f1419;background-color:#fff;outline:none;box-sizing:border-box;color-scheme:light;font-family:inherit;margin-bottom:10px;" />
        <div style="display:flex;align-items:center;gap:8px;">
          ${styleOptionsHtml()}
          <button id="xbs-regenerate" style="${BTN_SECONDARY_CSS}">重新生成</button>
        </div>
      </div>

      <div style="display:flex;gap:10px;">
        <button id="xbs-copy-reply" style="flex:1;padding:10px 0;background:#1d9bf0;color:#fff;border:none;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;text-align:center;">复制回复</button>
        <button id="xbs-save-md" style="flex:1;padding:10px 0;background:#ffffff;color:#0f1419;border:1.5px solid #cfd9de;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;text-align:center;">保存 Markdown</button>
      </div>
    </div>
  `;

  // Restore current replyStyle from storage
  chrome.storage.sync.get({ replyStyle: 'professional' }, (data) => {
    const select = document.getElementById('xbs-style-select') as HTMLSelectElement | null;
    if (select) select.value = data.replyStyle as string;
  });

  overlay.querySelector('#xbs-overlay-close')?.addEventListener('click', hideOverlay);
  overlay.querySelector('#xbs-copy-reply')?.addEventListener('click', handleCopyReply);
  overlay.querySelector('#xbs-save-md')?.addEventListener('click', handleSaveMarkdown);
  overlay.querySelector('#xbs-regenerate')?.addEventListener('click', handleRegenerate);
}

async function handleRegenerate(): Promise<void> {
  if (!currentData) return;

  const select = document.getElementById('xbs-style-select') as HTMLSelectElement | null;
  const newStyle = (select?.value || 'professional') as ReplyStyle;
  const promptInput = document.getElementById('xbs-user-prompt') as HTMLInputElement | null;
  const userPrompt = promptInput?.value.trim() || undefined;

  // Persist selected style
  chrome.storage.sync.set({ replyStyle: newStyle });

  // Show inline loading on the reply area
  const replyEl = document.getElementById('xbs-reply-text');
  const regenBtn = document.getElementById('xbs-regenerate');
  if (replyEl) {
    replyEl.setAttribute('contenteditable', 'false');
    replyEl.style.opacity = '0.5';
    replyEl.innerText = '正在生成...';
  }
  if (regenBtn) {
    regenBtn.textContent = '生成中...';
    (regenBtn as HTMLButtonElement).disabled = true;
  }

  try {
    const res = await sendMessage({
      type: 'REGENERATE_REPLY',
      tweetText: currentData.tweetText,
      author: currentData.author,
      userPrompt,
    });
    if (res.success && res.data) {
      const newReply = res.data as string;
      if (replyEl) {
        replyEl.innerText = newReply;
        replyEl.setAttribute('contenteditable', 'true');
        replyEl.style.opacity = '1';
      }
      currentData.reply = newReply;
    } else {
      if (replyEl) {
        replyEl.innerText = res.error || '生成失败';
        replyEl.style.opacity = '1';
        replyEl.style.color = '#f4212e';
      }
    }
  } catch (e) {
    if (replyEl) {
      replyEl.innerText = (e as Error).message || '发送消息失败';
      replyEl.style.opacity = '1';
      replyEl.style.color = '#f4212e';
    }
  } finally {
    if (regenBtn) {
      regenBtn.textContent = '重新生成';
      (regenBtn as HTMLButtonElement).disabled = false;
    }
  }
}

function handleCopyReply(): void {
  const el = document.getElementById('xbs-reply-text');
  if (el) {
    navigator.clipboard.writeText(el.innerText);
    const btn = document.getElementById('xbs-copy-reply');
    if (btn) {
      btn.textContent = '已复制';
      setTimeout(() => { btn.textContent = '复制回复'; }, 1500);
    }
  }
}

function handleSaveMarkdown(): void {
  if (!currentData) return;
  const el = document.getElementById('xbs-reply-text');
  const reply = el?.innerText || currentData.reply;

  sendMessage({
    type: 'EXPORT_MARKDOWN',
    tweetText: currentData.tweetText,
    author: currentData.author,
    tweetUrl: currentData.tweetUrl,
    summary: currentData.summary,
    reply,
  });
}

export function hideOverlay(): void {
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay) overlay.style.display = 'none';
  currentData = null;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Lightweight markdown → HTML for summary display */
function renderMarkdown(md: string): string {
  const escaped = escapeHtml(md);
  return escaped
    .split('\n')
    .map((line) => {
      // Horizontal rule
      if (/^-{3,}/.test(line.trim())) return '<hr style="border:none;border-top:1px solid #eff3f4;margin:10px 0;">';
      // H3
      if (line.startsWith('### ')) return `<div style="font-size:13px;font-weight:700;color:#0f1419;margin:12px 0 4px;">${inline(line.slice(4))}</div>`;
      // H2
      if (line.startsWith('## ')) return `<div style="font-size:14px;font-weight:700;color:#0f1419;margin:14px 0 6px;">${inline(line.slice(3))}</div>`;
      // Unordered list
      if (/^[-*] /.test(line.trimStart())) {
        const content = line.replace(/^\s*[-*] /, '');
        return `<div style="padding-left:14px;text-indent:-14px;margin:3px 0;">• ${inline(content)}</div>`;
      }
      // Numbered list
      const olMatch = line.trimStart().match(/^(\d+)[.)]\s+(.*)/);
      if (olMatch) return `<div style="padding-left:18px;text-indent:-18px;margin:3px 0;">${olMatch[1]}. ${inline(olMatch[2])}</div>`;
      // Empty line → spacer
      if (!line.trim()) return '<div style="height:6px;"></div>';
      // Normal paragraph
      return `<div style="margin:3px 0;">${inline(line)}</div>`;
    })
    .join('');
}

/** Inline markdown: bold, italic, inline code */
function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f0f2f5;padding:1px 4px;border-radius:3px;font-size:12px;">$1</code>');
}
