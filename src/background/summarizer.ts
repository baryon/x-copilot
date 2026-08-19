import type { AIProvider, Language, ReplyStyle, LLMPrompt } from '@shared/types';
import { DEFAULT_BASE_URLS, DEFAULT_MODELS, DEFAULT_REPLY_STYLE, STORAGE_KEY_API_KEY, LANG_MAP, resolveReplyStyle, isLongPost } from '@shared/constants';
import { decryptApiKey } from '@shared/encryption';
import { callLLM } from './llm/index';

const REPLY_STYLE_PROMPTS: Record<ReplyStyle, string> = {
  sharpen: `Style: 替他说得更狠 — restating the author's point more cleanly and more sharply than they did.

Stay on their side. Compress their thesis into one hard sentence. Cut the hedging they left in. Do not add a new argument, a joke, or a disagreement.

If you could not tell this was supporting them, it is too far from the original.`,

  add: `Style: 补一块原帖没写的硬东西 — one missing piece of substance, not a vibe.

Add exactly one thing the tweet did not say: a number, an edge case, a mechanism, a receipt from doing the work, or the next step that is implied. Keep their thesis; fill the hole.

Do not use the extra detail as a way to flip the argument.`,

  riff: `Style: 顺着原格式接梗 — continue in the same shape as the original.

Match their syntax: list → next item, analogy → next mapping, punchline setup → the missing beat, catchphrase → a variation. You are in on the joke WITH them.

If the tweet has no riffable form, echo one concrete image from it in the same register. No dunking, no forced 哈哈.`,

  rebuttal: `Style: 一句钉死荒谬处 — one strike at the weakest point.

Find the most absurd claim, leap, contradiction, or missing premise. Name that exact bit and puncture it. No throat-clearing, no "I hear you, but".

Do: a number that does not add up, a category error, a hidden assumption, an internal contradiction.
Don't: insult the person, stack five objections, or write a generic "this is wrong" that could sit under any tweet.`,

  question: `Style: 一个楼主愿意回的问题 — one question the author would actually want to answer.

Ask about a missing step, a number's source, an edge case, or how they handled the hard part. The question should be answerable in one reply by someone who wrote this tweet.

Not "你怎么看？" / "thoughts?". Not a gotcha dressed as a question. Not a question that is secretly a speech.`,

  alternative: `Style: 给出手方案，而不只是反对 — disagree, then put a better move on the table.

In one breath: what specifically does not work, and what to do instead. The alternative must be concrete enough to try (a step, a rule, a tool, a framing) — not "be more careful".

If you cannot name a replacement, this style is the wrong choice; do not pad with a dunk.`,

  nod: `Style: 极短的站队 — one short beat of in-group agreement.

Name the specific phrase, number, or image you are standing with. Can be very short. Not empty applause: "This." / 说得太对了 / 完全同意 are banned unless they attach to that specific bit.

No twist ending, no extra take.`,
};

const COOPERATIVE_STYLES = new Set<ReplyStyle>(['sharpen', 'add', 'riff', 'nod']);
const CHALLENGE_STYLES = new Set<ReplyStyle>(['rebuttal', 'alternative']);

const REPLY_STANCE_RULES = `How to take a stance:
- Stay with the author's line. Do not default to a take-down.
- Openers like 不过 / 但是 / 其实 / Actually / "the real issue is" are usually wrong for this style.
- Ground the reply in one specific phrase, number, name, or step from the tweet. If this reply could sit under a different tweet, rewrite it.`;

const REPLY_HARD_RULES = `Hard rules for the reply:
- MUST be under 200 characters (it will be posted on X).
- Match the language of the original tweet (if the tweet is in English, reply in English; if Chinese, reply in Chinese).
- Write like a real person on X, not an AI assistant or a debate club.
- No cliché openers: "Great point!", "Well said!", "This is spot on!", 说得太对了, 很有道理, 完全同意, 作为一名...`;

function replyInstructions(style: ReplyStyle): string {
  const parts = [REPLY_STYLE_PROMPTS[style]];
  if (COOPERATIVE_STYLES.has(style)) parts.push(REPLY_STANCE_RULES);
  parts.push(REPLY_HARD_RULES);
  return parts.join('\n\n');
}

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
    replyStyle: DEFAULT_REPLY_STYLE,
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
    replyStyle: resolveReplyStyle(syncData.replyStyle),
    langName: LANG_MAP[syncData.language as Language] || '简体中文',
  };
}

interface SummarizeResult {
  summary: string;
  factCheck: string;
  reply: string;
}

function parseGeneratedSections(raw: string, longPost: boolean): SummarizeResult {
  const replyMatch = raw.match(/## 建议回复\s*\n([\s\S]*?)$/);
  const factMatch = raw.match(/## 事实查验\s*\n([\s\S]*?)(?=\n## 建议回复|$)/);
  const summaryMatch = raw.match(/## 总结\s*\n([\s\S]*?)(?=\n## 事实查验|\n## 建议回复|$)/);

  if (!replyMatch && !factMatch && !summaryMatch) {
    return longPost
      ? { summary: raw.trim(), factCheck: '', reply: '' }
      : { summary: '', factCheck: '', reply: raw.trim() };
  }

  return {
    summary: summaryMatch?.[1]?.trim() || '',
    factCheck: factMatch?.[1]?.trim() || '',
    reply: replyMatch?.[1]?.trim() || '',
  };
}

export async function summarizeTweet(tweetText: string, author: string, userPrompt?: string, onChunk?: (text: string) => void): Promise<SummarizeResult> {
  const cfg = await loadLLMConfig();
  const longPost = isLongPost(tweetText);
  const prompt = longPost
    ? longPostPrompt(cfg, author, tweetText, userPrompt)
    : shortPostPrompt(cfg, author, tweetText, userPrompt);
  const result = await callLLM(cfg.provider, cfg.baseUrl, cfg.apiKey, cfg.model, prompt, longPost ? 1600 : 300, onChunk);
  return parseGeneratedSections(result, longPost);
}

function longPostPrompt(cfg: LLMConfig, author: string, tweetText: string, userPrompt?: string): LLMPrompt {
  const replyBleedNote = CHALLENGE_STYLES.has(cfg.replyStyle)
    ? 'If the fact-check found a real problem, the reply may use that same weak point — still as a tweet reply, not as a scorecard.'
    : 'The fact-check is for the 事实查验 section only. Do not turn the reply into a verdict.';

  return {
    system: `You are an expert content analyst. The user will give you a long post. Respond in ${cfg.langName}. Keep every section short.

## Part 1 — Summary

- **TLDR**: one sentence.
- **要点**: at most 3 bullets, one line each.
- **步骤**: only if the post is a tutorial; numbered, one line each. Otherwise omit.

No credibility scores. No extra headings.

## Part 2 — Fact check

Only if there are checkable factual claims. At most 2 items, each one line:
- ✅ / ⚠️ / ❌ / ❓ <claim> — <short reason>

If the post is opinion, a joke, or a mood, omit the 事实查验 section entirely.

## Part 3 — Suggested Reply

${replyBleedNote}

${replyInstructions(cfg.replyStyle)}

## Output Format

Use exactly this structure. Omit ## 事实查验 when there is nothing to check.

## 总结
<summary>

## 事实查验
<fact check>

## 建议回复
<reply, under 200 chars>`,
    user: `Post by ${author}:\n\n${tweetText}${userPrompt ? `\n\n--- User instructions ---\n${userPrompt}` : ''}`,
  };
}

function shortPostPrompt(cfg: LLMConfig, author: string, tweetText: string, userPrompt?: string): LLMPrompt {
  return {
    system: `You write tweet replies. The tweet is short — do not summarize it, do not fact-check it.

${replyInstructions(cfg.replyStyle)}

Output ONLY this structure:

## 建议回复
<reply, under 200 chars>`,
    user: `Tweet by ${author}:\n\n${tweetText}${userPrompt ? `\n\n--- User instructions ---\n${userPrompt}` : ''}`,
  };
}

export async function factCheckTweet(tweetText: string, author: string): Promise<string> {
  const cfg = await loadLLMConfig();
  const prompt: LLMPrompt = {
    system: `You fact-check a tweet. Respond in ${cfg.langName}. Keep it short.

Only check 1–2 verifiable claims. Each item is one line:
- ✅ / ⚠️ / ❌ / ❓ <claim> — <short reason>

If the tweet is opinion, a joke, or a mood, reply with one line: 无明显可核查事实。

No summary. No suggested reply. No preamble. No credibility score.`,
    user: `Tweet by ${author}:\n\n${tweetText}`,
  };
  const result = await callLLM(cfg.provider, cfg.baseUrl, cfg.apiKey, cfg.model, prompt, 400);
  return result.trim();
}

export async function regenerateReply(tweetText: string, author: string, userPrompt?: string): Promise<string> {
  const cfg = await loadLLMConfig();

  const prompt: LLMPrompt = {
    system: `You write tweet replies. Generate a single reply for the given tweet.

${replyInstructions(cfg.replyStyle)}

Output ONLY the reply text, nothing else — no labels, no quotes, no explanation.`,
    user: `Tweet by ${author}:\n\n${tweetText}${userPrompt ? `\n\n--- User instructions ---\n${userPrompt}` : ''}`,
  };

  const result = await callLLM(cfg.provider, cfg.baseUrl, cfg.apiKey, cfg.model, prompt, 300);
  return result.trim();
}
