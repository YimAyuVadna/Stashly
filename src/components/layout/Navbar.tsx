import React from 'react';
import { List, Sun, Moon } from '@phosphor-icons/react';

interface NavbarProps {
  title: string;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  isDark = true,
  onToggleTheme,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="h-16 border-b border-white/[0.05] bg-[#07080b]/70 backdrop-blur-2xl px-5 sm:px-8 flex items-center justify-between shrink-0 select-none sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition"
            title="Toggle Menu"
          >
            <List size={20} weight="bold" />
          </button>
        )}
        <h2 className="font-editorial text-lg sm:text-xl font-medium tracking-tight text-white truncate">
          {title}
        </h2>
      </div>

      <div className="flex items-center space-x-3">
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs font-medium transition-all"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? (
              <>
                <Sun size={15} weight="bold" className="text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon size={15} weight="bold" className="text-emerald-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
