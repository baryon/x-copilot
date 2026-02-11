import { useState, useEffect, useCallback } from 'react';
import type { AIProvider, Language, ReplyStyle, Settings } from '@shared/types';
import { STORAGE_KEY_API_KEY, parseXHandle } from '@shared/constants';
import { encryptApiKey, decryptApiKey } from '@shared/encryption';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    language: 'zh-CN',
    xHandle: '',
    provider: 'openai',
    baseUrl: '',
    model: '',
    replyStyle: 'professional',
  });
  const [apiKey, setApiKey] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(
      { language: 'zh-CN', xHandle: '', provider: 'openai', baseUrl: '', model: '', replyStyle: 'professional' },
      (syncData) => {
        setSettings({
          language: syncData.language as Language,
          xHandle: syncData.xHandle as string,
          provider: syncData.provider as AIProvider,
          baseUrl: syncData.baseUrl as string,
          model: syncData.model as string,
          replyStyle: syncData.replyStyle as ReplyStyle,
        });

        chrome.storage.local.get(STORAGE_KEY_API_KEY, async (localData) => {
          const encrypted = localData[STORAGE_KEY_API_KEY];
          if (encrypted) {
            try {
              const decrypted = await decryptApiKey(encrypted as { iv: number[]; data: number[] });
              setApiKey(decrypted);
            } catch {
              // corrupted key, ignore
            }
          }
          setLoaded(true);
        });
      },
    );
  }, []);

  const setLanguage = useCallback((v: Language) => {
    setSettings((s) => ({ ...s, language: v }));
  }, []);

  const setXHandle = useCallback((v: string) => {
    setSettings((s) => ({ ...s, xHandle: v }));
  }, []);

  const setProvider = useCallback((v: AIProvider) => {
    setSettings((s) => ({ ...s, provider: v }));
  }, []);

  const setBaseUrl = useCallback((v: string) => {
    setSettings((s) => ({ ...s, baseUrl: v }));
  }, []);

  const setModel = useCallback((v: string) => {
    setSettings((s) => ({ ...s, model: v }));
  }, []);

  const setReplyStyle = useCallback((v: ReplyStyle) => {
    setSettings((s) => ({ ...s, replyStyle: v }));
  }, []);

  const save = useCallback(async () => {
    const normalizedHandle = parseXHandle(settings.xHandle);
    setSettings((s) => ({ ...s, xHandle: normalizedHandle }));

    await chrome.storage.sync.set({
      language: settings.language,
      xHandle: normalizedHandle,
      provider: settings.provider,
      baseUrl: settings.baseUrl,
      model: settings.model,
      replyStyle: settings.replyStyle,
    });

    if (apiKey) {
      const encrypted = await encryptApiKey(apiKey);
      await chrome.storage.local.set({ [STORAGE_KEY_API_KEY]: encrypted });
    } else {
      await chrome.storage.local.remove(STORAGE_KEY_API_KEY);
    }

    return { ok: true };
  }, [settings, apiKey]);

  return {
    settings,
    loaded,
    apiKey,
    setLanguage,
    setXHandle,
    setProvider,
    setBaseUrl,
    setModel,
    setApiKey,
    setReplyStyle,
    save,
  };
}
