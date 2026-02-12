import type { LLMPrompt } from '@shared/types';

/**
 * Normalize Anthropic base URL.
 * Default: https://api.anthropic.com → endpoint: /v1/messages
 */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

/**
 * Read Anthropic SSE stream and concatenate text content.
 * Event format: content_block_delta with delta.type "text_delta"
 */
async function readSSEStream(res: Response, onChunk?: (text: string) => void): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error('Response body is not readable');

  const decoder = new TextDecoder();
  let result = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') break;
      try {
        const chunk = JSON.parse(data);
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          result += chunk.delta.text;
          onChunk?.(chunk.delta.text);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return result;
}

export async function callClaude(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: LLMPrompt,
  maxTokens: number,
  onChunk?: (text: string) => void,
): Promise<string> {
  const normalized = normalizeBaseUrl(baseUrl);
  const url = normalized + '/v1/messages';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = '';
    try {
      const err = JSON.parse(text);
      msg = err?.error?.message || err?.message || '';
    } catch {
      msg = text.slice(0, 200);
    }
    throw new Error(msg || 'Claude API error: ' + res.status);
  }

  return readSSEStream(res, onChunk);
}
