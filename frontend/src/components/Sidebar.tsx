import React from 'react';
import { BarChart3, Scan, ShieldAlert, BookOpen, Layers, Cpu, Settings } from 'lucide-react';

interface SidebarProps {
  currentTab: 'DASHBOARD' | 'SCANNER' | 'RISK' | 'JOURNAL' | 'OPTIONS' | 'STRATEGY';
  onSelectTab: (tab: 'DASHBOARD' | 'SCANNER' | 'RISK' | 'JOURNAL' | 'OPTIONS' | 'STRATEGY') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Terminal', icon: BarChart3 },
    { id: 'SCANNER', label: 'SMC Scanner', icon: Scan },
    { id: 'RISK', label: 'Risk Planner', icon: ShieldAlert },
    { id: 'JOURNAL', label: 'Journal', icon: BookOpen },
    { id: 'OPTIONS', label: 'Options Chain', icon: Layers },
    { id: 'STRATEGY', label: 'Backtest Lab', icon: Cpu },
  ] as const;

  return (
    <aside className="w-16 md:w-48 bg-[#0b0e14] border-r border-[#1e2638] flex flex-col justify-between py-3 select-none">
      <div className="space-y-1 px-2">
        <div className="hidden md:block px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#131a29]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Session Profile Footer */}
      <div className="px-2 pt-3 border-t border-[#1e2638]">
        <div className="flex items-center space-x-2 px-2 py-1.5 rounded bg-[#111724]">
          <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/40">
            PT
          </div>
          <div className="hidden md:block min-w-0">
            <div className="text-[11px] font-bold text-white truncate">Pro Trader</div>
            <div className="text-[9px] text-emerald-400 font-mono">NSE Live Session</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
