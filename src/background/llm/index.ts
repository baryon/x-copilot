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
): Promise<string> {
  const resolvedUrl = baseUrl || DEFAULT_BASE_URLS[provider];
  const resolvedModel = model || DEFAULT_MODELS[provider];

  switch (provider) {
    case 'openai':
      return callOpenAI(resolvedUrl, apiKey, resolvedModel, prompt, maxTokens);
    case 'claude':
      return callClaude(resolvedUrl, apiKey, resolvedModel, prompt, maxTokens);
    default:
      throw new Error('不支持的接口: ' + provider);
  }
}
