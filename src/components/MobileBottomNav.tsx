import React from 'react';
import {
  LayoutDashboard,
  Fuel,
  Package,
  Users,
  Scale,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  unpaidCreditsCount: number;
  lowStockCount: number;
  onToggleMenu: () => void;
  isMenuOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  unpaidCreditsCount,
  lowStockCount,
  onToggleMenu,
  isMenuOpen,
}) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Home',
      labelAssamese: 'ডেচব’ৰ্ড',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'readings',
      label: 'Readings',
      labelAssamese: 'মিটাৰ',
      icon: Fuel,
      badge: null,
    },
    {
      id: 'lubricants',
      label: 'Lubes',
      labelAssamese: 'মবিল',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'credit',
      label: 'Credit',
      labelAssamese: 'বাকী',
      icon: Users,
      badge: unpaidCreditsCount > 0 ? unpaidCreditsCount : null,
      badgeColor: 'bg-orange-500 text-white',
    },
    {
      id: 'reconciliation',
      label: 'Tally',
      labelAssamese: 'কেচ মিলোৱা',
      icon: Scale,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 lg:hidden px-2 py-1 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id && !isMenuOpen;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer min-w-[56px] ${
                isActive
                  ? 'text-orange-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-400 stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2 text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[58px]">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-0.5" />
              )}
            </button>
          );
        })}

        {/* All Modules / Hamburger Menu Button */}
        <button
          onClick={onToggleMenu}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer min-w-[56px] ${
            isMenuOpen
              ? 'text-orange-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <Menu className={`w-5 h-5 ${isMenuOpen ? 'text-orange-400 stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight truncate">
            More
          </span>
          {isMenuOpen && (
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
