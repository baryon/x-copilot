interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'sync', label: '书签' },
  { id: 'settings', label: '设置' },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex border-b border-x-border mb-3.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 bg-transparent border-none py-2 text-[13px] font-semibold cursor-pointer border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'text-x-blue border-b-x-blue'
              : 'text-x-text-secondary border-b-transparent hover:text-x-text'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
