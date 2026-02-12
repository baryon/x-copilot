import type { AIProvider, Language, ReplyStyle, LLMPrompt } from '@shared/types';
import { DEFAULT_BASE_URLS, DEFAULT_MODELS, STORAGE_KEY_API_KEY, LANG_MAP } from '@shared/constants';
import { decryptApiKey } from '@shared/encryption';
import { callLLM } from './llm/index';

const REPLY_STYLE_PROMPTS: Record<ReplyStyle, string> = {
  professional:
    'Write a reply in the tone of a thoughtful peer — add your own perspective, a follow-up question, or a concrete example. Avoid generic praise.',
  friendly:
    'Write a casual, warm reply like texting a friend — use natural reactions, personal anecdotes, or light humor. No stiff phrasing.',
  concise:
    'Write a very short reply (1 sentence max) — a quick take, a nod, or a punchy reaction. No filler.',
};

interface LLMConfig {
  provider: AIProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
  replyStyle: ReplyStyle;
  langName: string;
}

async function loadLLMConfig(): Promise<LLMConfig> {
  const syncData = await chrome.storage.sync.get({
    provider: 'openai',
    baseUrl: '',
    model: '',
    replyStyle: 'professional',
    language: 'zh-CN',
  });
  const provider = syncData.provider as AIProvider;

  const localData = await chrome.storage.local.get(STORAGE_KEY_API_KEY);
  const encrypted = localData[STORAGE_KEY_API_KEY];
  if (!encrypted) throw new Error('未设置 API Key，请在扩展设置中配置');

  return {
    provider,
    baseUrl: (syncData.baseUrl as string) || DEFAULT_BASE_URLS[provider],
    model: (syncData.model as string) || DEFAULT_MODELS[provider],
    apiKey: await decryptApiKey(encrypted),
    replyStyle: syncData.replyStyle as ReplyStyle,
    langName: LANG_MAP[syncData.language as Language] || '简体中文',
  };
}

interface SummarizeResult {
  summary: string;
  reply: string;
}

export async function summarizeTweet(tweetText: string, author: string, userPrompt?: string, onChunk?: (text: string) => void): Promise<SummarizeResult> {
  const cfg = await loadLLMConfig();

  const prompt: LLMPrompt = {
    system: `You are an expert content analyst. The user will give you a tweet. Respond in ${cfg.langName}.

## Part 1 — Summary

Provide a thorough, high-value summary:

**TLDR** — one sentence capturing the core thesis.

**Key Points**
- Extract 3-6 of the most valuable insights, claims, actionable takeaways, or data points.
- For substantial content (threads, long tweets with quotes), extract more points with specifics.
- Each point should be self-contained and useful even without reading the original.
- Use **bold** for key terms, names, numbers, and takeaways.

**Process / Steps** (only if the tweet describes a tutorial, method, or workflow)
- List numbered steps with specifics (tools, parameters, etc.).
- Skip this section entirely if the content is not instructional.

--- FACT CHECK ---

Use your knowledge to verify the accuracy of this tweet. Many tweets on X contain misinformation, exaggeration, or fabricated claims. Be skeptical by default.

1. **Extract claims**: List every factual claim (not opinions) made in the tweet.
2. **Verify each claim**: For each claim, state one of:
   - ✅ **Accurate** — consistent with well-established facts; briefly cite the basis.
   - ⚠️ **Misleading** — contains a kernel of truth but is distorted, out of context, cherry-picked, or exaggerated; explain what's wrong.
   - ❌ **Inaccurate** — contradicts well-established facts; state what is actually true.
   - ❓ **Unverifiable** — cannot be confirmed or denied with available knowledge.
3. **Red flags**: Note if any of these misinformation patterns are present:
   - Sensationalist or emotionally manipulative language
   - Statistics without sources or with misleading framing
   - Claims attributed to unnamed "experts" or "studies"
   - Screenshots or quotes taken out of context
   - Conspiracy-theory reasoning (unfalsifiable, connecting unrelated events)
   - Impersonating or misrepresenting an authority figure
4. **Credibility: X/10** — overall assessment with one-sentence justification. Be harsh: a tweet full of unverifiable or misleading claims should score ≤ 4.

## Part 2 — Suggested Reply

${REPLY_STYLE_PROMPTS[cfg.replyStyle]}

Hard rules for the reply:
- MUST be under 200 characters (it will be posted on X).
- Write like a real human, NOT an AI assistant. No "Great point!", "Well said!", "This is spot on!" or any similar cliché opener.
- Match the language of the original tweet (if the tweet is in English, reply in English; if Chinese, reply in Chinese).
- The reply should feel like it came from someone who actually read and thought about the content.

## Output Format

Use exactly this structure:

## 总结
<summary content here>

## 建议回复
<reply text here, under 200 chars>`,
    user: `Tweet by ${author}:\n\n${tweetText}${userPrompt ? `\n\n--- User instructions ---\n${userPrompt}` : ''}`,
  };

  const result = await callLLM(cfg.provider, cfg.baseUrl, cfg.apiKey, cfg.model, prompt, 3000, onChunk);

  const summaryMatch = result.match(/## 总结\s*\n([\s\S]*?)(?=\n## 建议回复|$)/);
  const replyMatch = result.match(/## 建议回复\s*\n([\s\S]*?)$/);

  return {
    summary: summaryMatch?.[1]?.trim() || result.trim(),
    reply: replyMatch?.[1]?.trim() || '',
  };
}

export async function regenerateReply(tweetText: string, author: string, userPrompt?: string): Promise<string> {
  const cfg = await loadLLMConfig();

  const prompt: LLMPrompt = {
    system: `You write tweet replies. Generate a single reply for the given tweet.

${REPLY_STYLE_PROMPTS[cfg.replyStyle]}

Hard rules:
- MUST be under 200 characters.
- Write like a real human, NOT an AI assistant. No "Great point!", "Well said!", "This is spot on!" or any similar cliché opener.
- Match the language of the original tweet.
- Output ONLY the reply text, nothing else — no labels, no quotes, no explanation.`,
    user: `Tweet by ${author}:\n\n${tweetText}${userPrompt ? `\n\n--- User instructions ---\n${userPrompt}` : ''}`,
  };

  const result = await callLLM(cfg.provider, cfg.baseUrl, cfg.apiKey, cfg.model, prompt, 300);
  return result.trim();
}
