import { useState } from 'react';
import TabBar from './components/TabBar';
import SyncTab from './components/SyncTab';
import SettingsTab from './components/SettingsTab';
import { useSettings } from './hooks/useSettings';
import { useSyncStatus } from './hooks/useSyncStatus';

export default function App() {
  const [activeTab, setActiveTab] = useState('sync');
  const {
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
  } = useSettings();
  const syncStatus = useSyncStatus();

  if (!loaded) return null;

  return (
    <div className="w-[380px] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif] bg-white text-x-text p-4 px-[18px]">
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={activeTab === 'sync' ? 'block' : 'hidden'}>
        <SyncTab syncStatus={syncStatus} xHandle={settings.xHandle} />
      </div>

      <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
        <SettingsTab
          language={settings.language}
          xHandle={settings.xHandle}
          provider={settings.provider}
          baseUrl={settings.baseUrl}
          model={settings.model}
          apiKey={apiKey}
          replyStyle={settings.replyStyle}
          onLanguageChange={setLanguage}
          onXHandleChange={setXHandle}
          onProviderChange={setProvider}
          onBaseUrlChange={setBaseUrl}
          onModelChange={setModel}
          onApiKeyChange={setApiKey}
          onReplyStyleChange={setReplyStyle}
          onSave={save}
        />
      </div>
    </div>
  );
}
