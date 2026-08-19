import type { AIProvider, LLMPrompt } from '@shared/types';
import { DEFAULT_MODELS, DEFAULT_BASE_URLS } from '@shared/constants';
import { callOpenAI } from './openai';
import { callClaude } from './claude';

export async function callLLM(
  provider: AIProvider,
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: LLMPrompt,
  maxTokens: number,
  onChunk?: (text: string) => void,
): Promise<string> {
  const resolvedUrl = baseUrl || DEFAULT_BASE_URLS[provider];
  const resolvedModel = model || DEFAULT_MODELS[provider];

  switch (provider) {
    case 'openai':
      return callOpenAI(resolvedUrl, apiKey, resolvedModel, prompt, maxTokens, onChunk);
    case 'claude':
      return callClaude(resolvedUrl, apiKey, resolvedModel, prompt, maxTokens, onChunk);
    default:
      throw new Error('不支持的接口: ' + provider);
  }
}

/**
 * Probe the current provider / base URL / API key / model with a tiny completion.
 * Throws if the credentials or endpoint are invalid.
 */
export async function testLLM(
  provider: AIProvider,
  baseUrl: string,
  apiKey: string,
  model: string,
): Promise<void> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error('请先填写 API Key');
  }

  try {
    await callLLM(
      provider,
      baseUrl.trim(),
      key,
      model.trim(),
      {
        system: 'You are a connectivity probe. Reply with a single word.',
        user: 'ping',
      },
      64,
    );
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    if (!raw || /failed to fetch|networkerror|load failed/i.test(raw)) {
      throw new Error('无法连接到接口，请检查 Base URL 或网络');
    }
    throw e instanceof Error ? e : new Error(raw);
  }
}
