import type { LLMPrompt } from '@shared/types';

/**
 * Normalize OpenAI-compatible base URL.
 * Ensures the path ends with "/v1" so the endpoint is always {base}/...
 */
function normalizeBaseUrl(baseUrl: string): string {
  const stripped = baseUrl.replace(/\/+$/, '');
  if (!stripped.endsWith('/v1')) {
    return stripped + '/v1';
  }
  return stripped;
}

/**
 * gpt-5 / o1 models use the Responses API (/responses + input param).
 */
function usesResponsesApi(model: string): boolean {
  return /^gpt-5/.test(model) || /^o1/.test(model);
}

/**
 * Read an SSE stream and concatenate text content.
 * Handles both Chat Completions (delta.content) and Responses API (output_text.text) formats.
 */
async function readSSEStream(res: Response, responsesApi: boolean): Promise<string> {
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
        if (responsesApi) {
          // Responses API: type "response.output_text.delta" with { delta: "text" }
          if (chunk.type === 'response.output_text.delta' && chunk.delta) {
            result += chunk.delta;
          }
        } else {
          // Chat Completions: choices[0].delta.content
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) result += delta;
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return result;
}

function handleError(text: string, status: number): never {
  let msg = '';
  try {
    const err = JSON.parse(text);
    msg = err?.error?.message || err?.message || err?.detail || '';
  } catch {
    msg = text.slice(0, 200);
  }
  throw new Error(msg || 'OpenAI API error: ' + status);
}

export async function callOpenAI(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: LLMPrompt,
  maxTokens: number,
): Promise<string> {
  const normalized = normalizeBaseUrl(baseUrl);
  const responsesApi = usesResponsesApi(model);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + apiKey,
  };

  let url: string;
  let body: Record<string, unknown>;

  if (responsesApi) {
    // Responses API: /responses, uses "input" instead of "messages"
    url = normalized + '/responses';
    body = {
      model,
      input: [
        { role: 'developer', content: prompt.system },
        { role: 'user', content: [{ type: 'input_text', text: prompt.user }] },
      ],
      max_output_tokens: maxTokens,
      temperature: 0.3,
      stream: true,
    };
  } else {
    // Chat Completions API: /chat/completions, uses "messages"
    url = normalized + '/chat/completions';
    body = {
      model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: true,
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    handleError(text, res.status);
  }

  return readSSEStream(res, responsesApi);
}
