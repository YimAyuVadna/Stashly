import React from 'react';
import { List } from '@phosphor-icons/react';

interface NavbarProps {
  title: string;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
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
    </header>
  );
};
