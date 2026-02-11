import { useState, useCallback } from 'react';
import type { AIProvider, Language, ReplyStyle } from '@shared/types';
import { DEFAULT_BASE_URLS, DEFAULT_MODELS, REPLY_STYLE_LABELS } from '@shared/constants';
import { sendMessage } from '@shared/messaging';
import StatusMessage from './StatusMessage';

const INPUT_CLS = 'w-full py-2 px-2.5 border-[1.5px] border-[#cfd9de] rounded-lg text-[13px] outline-none bg-white text-x-text focus:border-x-blue transition-colors';

interface SettingsTabProps {
  language: Language;
  xHandle: string;
  provider: AIProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
  replyStyle: ReplyStyle;
  onLanguageChange: (v: Language) => void;
  onXHandleChange: (v: string) => void;
  onProviderChange: (v: AIProvider) => void;
  onBaseUrlChange: (v: string) => void;
  onModelChange: (v: string) => void;
  onApiKeyChange: (v: string) => void;
  onReplyStyleChange: (v: ReplyStyle) => void;
  onSave: () => Promise<{ ok: boolean; error?: string }>;
}

export default function SettingsTab({
  language,
  xHandle,
  provider,
  baseUrl,
  model,
  apiKey,
  replyStyle,
  onLanguageChange,
  onXHandleChange,
  onProviderChange,
  onBaseUrlChange,
  onModelChange,
  onApiKeyChange,
  onReplyStyleChange,
  onSave,
}: SettingsTabProps) {
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });

  const handleSave = useCallback(async () => {
    const result = await onSave();
    if (result.ok) {
      setStatus({ message: '设置已保存', type: 'success' });
    } else {
      setStatus({ message: result.error || '保存失败', type: 'error' });
    }
  }, [onSave]);

  const handleClear = useCallback(async () => {
    const result = await sendMessage({ type: 'CLEAR_SYNCED_DATA' });
    if (result.success) {
      setStatus({ message: '数据已清除', type: 'success' });
    } else {
      setStatus({ message: result.error || '清除失败', type: 'error' });
    }
  }, []);

  return (
    <div>
      {/* X Handle */}
      <div className="mb-3.5">
        <label className="block text-xs font-semibold mb-1 text-x-text-secondary">X 用户名</label>
        <input
          type="text"
          value={xHandle}
          onChange={(e) => onXHandleChange(e.target.value)}
          placeholder="@your_handle"
          className={INPUT_CLS}
        />
        <div className="text-[11px] text-x-text-muted mt-0.5">
          同步喜欢列表时需要填写
        </div>
      </div>

      {/* Language */}
      <div className="mb-3.5">
        <label className="block text-xs font-semibold mb-1 text-x-text-secondary">界面语言</label>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className={INPUT_CLS}
        >
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁體中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </div>

      {/* AI Configuration Section */}
      <div className="mt-4 mb-3.5 pt-3.5 border-t border-[#eff3f4]">
        <div className="text-xs font-bold text-x-text-secondary mb-2.5">AI 总结配置</div>

        {/* Provider */}
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1 text-x-text-secondary">AI 接口</label>
          <select
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as AIProvider)}
            className={INPUT_CLS}
          >
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
          </select>
        </div>

        {/* Base URL */}
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1 text-x-text-secondary">Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => onBaseUrlChange(e.target.value)}
            placeholder={DEFAULT_BASE_URLS[provider]}
            className={INPUT_CLS}
          />
          <div className="text-[11px] text-x-text-muted mt-0.5">
            留空则使用默认地址
          </div>
        </div>

        {/* API Key */}
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1 text-x-text-secondary">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="sk-..."
            className={INPUT_CLS}
          />
          <div className="text-[11px] text-x-text-muted mt-0.5">
            密钥加密存储，设置后推文将显示总结按钮
          </div>
        </div>

        {/* Model */}
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1 text-x-text-secondary">模型</label>
          <input
            type="text"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder={DEFAULT_MODELS[provider]}
            className={INPUT_CLS}
          />
          <div className="text-[11px] text-x-text-muted mt-0.5">
            留空则使用默认模型
          </div>
        </div>

        {/* Reply Style */}
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1 text-x-text-secondary">回复风格</label>
          <select
            value={replyStyle}
            onChange={(e) => onReplyStyleChange(e.target.value as ReplyStyle)}
            className={INPUT_CLS}
          >
            {(Object.entries(REPLY_STYLE_LABELS) as [ReplyStyle, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-2.5 bg-x-blue text-white border-none rounded-full text-[13px] font-bold cursor-pointer hover:bg-x-blue-hover active:bg-x-blue-active transition-colors"
      >
        保存设置
      </button>

      {/* Clear data */}
      <button
        onClick={handleClear}
        className="w-full py-2.5 mt-3 bg-white text-x-error border border-x-error rounded-full text-[13px] font-bold cursor-pointer hover:bg-red-50 transition-colors"
      >
        清除所有同步数据
      </button>

      <StatusMessage message={status.message} type={status.type} />
    </div>
  );
}
