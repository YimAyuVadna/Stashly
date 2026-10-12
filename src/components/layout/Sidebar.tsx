import React from 'react';
import stashlyLogo from '../../assets/logo.png';
import {
  House,
  Heart,
  Lightning,
  Target,
  ChartBar,
  CalendarDots,
  ClockCounterClockwise,
  Gear,
  Sparkle,
  X,
} from '@phosphor-icons/react';

interface SidebarProps {
  currentPage: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  isMobileOpen = false,
  onCloseMobile,
  onNavigate,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: House },
    { id: 'wishlist', label: 'The Collection', icon: Heart },
    { id: 'dailygoals', label: 'Daily Mission', icon: Target },
    { id: 'analytics', label: 'Performance', icon: ChartBar },
    { id: 'heatmap', label: 'Yearly Heatmap', icon: CalendarDots },
    { id: 'transactions', label: 'The Ledger', icon: ClockCounterClockwise },
    { id: 'settings', label: 'Settings', icon: Gear },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#07080b]/90 border-r border-white/[0.06] flex flex-col justify-between shrink-0 h-screen select-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header with custom Stashly App Logo */}
          <div className="p-6 flex items-center justify-between border-b border-white/[0.05]">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center p-1.5 shadow-inner overflow-hidden">
                <img
                  src={stashlyLogo}
                  alt="Stashly"
                  className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
                />
              </div>
              <div>
                <h1 className="font-editorial text-lg tracking-tight font-semibold text-white leading-tight">
                  Stashly
                </h1>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-3.5 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-colors duration-200 group outline-none focus:outline-none focus:ring-0 focus-visible:outline-none select-none border ${
                    isActive
                      ? 'bg-white/[0.08] text-white font-semibold border-white/15'
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon
                    size={17}
                    weight={isActive ? 'fill' : 'light'}
                    className={`transition-colors duration-200 ${
                      isActive ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-neutral-200'
                    }`}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
