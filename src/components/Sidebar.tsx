import React from 'react';
import {
  LayoutDashboard,
  Fuel,
  Package,
  Users,
  Receipt,
  Scale,
  BarChart3,
  Settings,
  CreditCard,
  HelpCircle,
  Database,
  ArrowUpRight,
  X,
  Truck,
} from 'lucide-react';
import { PumpProLogo } from './PumpProLogo';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  unpaidCreditsCount: number;
  lowStockCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  activeRole?: 'staff' | 'owner';
  onToggleRole?: (role: 'staff' | 'owner') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  unpaidCreditsCount,
  lowStockCount,
  isMobileOpen = false,
  onCloseMobile,
  activeRole = 'staff',
  onToggleRole,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard & Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'readings',
      label: 'Nozzle Meter Readings',
      icon: Fuel,
      sublabel: 'Daily Fuel Sales',
      badge: null,
    },
    {
      id: 'fuel-stock',
      label: 'Fuel Stock & Tankers',
      icon: Truck,
      sublabel: 'Opening, Inflow & Shortage',
      badge: 'Shortage Audit',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'lubricants',
      label: 'Lubricants & Inventory',
      icon: Package,
      sublabel: 'Oils, DEF, Grease',
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'credit',
      label: 'Credit & Fleet Ledger',
      icon: Users,
      sublabel: 'Transporters & Dues',
      badge: unpaidCreditsCount > 0 ? `${unpaidCreditsCount} Due` : null,
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
    {
      id: 'reconciliation',
      label: 'Shift Cash & UPI Tally',
      icon: Scale,
      sublabel: 'Drawer Balance & Shortage',
      badge: 'Vital',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'expenses',
      label: 'Daily Expenses',
      icon: Receipt,
      sublabel: 'Staff, Generator, Spares',
      badge: null,
    },
    {
      id: 'reports',
      label: 'Reports & P&L',
      icon: BarChart3,
      sublabel: 'DSR & Profit Margins',
      badge: null,
    },
    {
      id: 'subscription',
      label: 'SaaS Plan & Registration',
      icon: CreditCard,
      sublabel: 'Monthly ₹999 & Multi-Pumps',
      badge: '₹999/mo',
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
    {
      id: 'settings',
      label: 'Pump Setup & Tanks',
      icon: Settings,
      sublabel: 'Rates, Dips & Backup',
      badge: null,
    },
  ];

  const handleSelect = (tab: string) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-3.5 flex-1 overflow-y-auto">
          {/* Mobile Drawer Top Bar with Brand & Close Button */}
          <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
            <PumpProLogo size="sm" />
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dual Panel Switcher in Sidebar */}
          {onToggleRole && (
            <div className="mb-3 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 mb-1 flex items-center justify-between">
                <span>Access Mode</span>
                <span className="font-mono text-orange-400">Role View</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => onToggleRole('staff')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeRole === 'staff'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>⚡</span>
                  <span>Staff</span>
                </button>
                <button
                  onClick={() => onToggleRole('owner')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeRole === 'owner'
                      ? 'bg-sky-500 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>👔</span>
                  <span>Owner</span>
                </button>
              </div>
            </div>
          )}

          {/* Section Label */}
          <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Navigation Modules</span>
            <span className="text-[10px] text-slate-400 font-mono">PumpPro OS</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent text-white font-bold border-l-4 border-orange-500 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs truncate">{item.label}</div>
                      {item.sublabel && (
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor} ml-2 flex-shrink-0`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info Box */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Station Online</span>
              </span>
              <span className="text-[10px] text-orange-400 font-mono">DSR Active</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              All nozzle meters and counter transactions saved locally.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
