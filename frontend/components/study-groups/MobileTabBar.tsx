'use client';

interface MobileTabBarProps {
  activeTab: 'round' | 'reference' | 'cards';
  onTabChange: (tab: 'round' | 'reference' | 'cards') => void;
  sharedCardsCount?: number;
}

export function MobileTabBar({ activeTab, onTabChange, sharedCardsCount = 0 }: MobileTabBarProps) {
  const tabs = [
    { id: 'round' as const, label: 'Round', icon: '🎯' },
    { id: 'reference' as const, label: 'Reference', icon: '📄' },
    { id: 'cards' as const, label: 'Cards', icon: '💡', badge: sharedCardsCount },
  ];

  return (
    <div className="lg:hidden border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 px-4 py-3 text-sm font-medium text-center
              transition-colors duration-200
              ${activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">{tab.icon}</span>
              <span className="font-semibold">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px]">
                  {tab.badge}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
