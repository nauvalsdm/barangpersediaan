import React from 'react';
import {
  Boxes,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  isDesktopSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isDesktopSidebarOpen = true,
}) => {
  const { setActiveTab } = useInventory();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Left: Sidebar Toggle (Mobile & Desktop) & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-all cursor-pointer flex items-center gap-1.5"
              aria-label="Toggle Sidebar Navigasi"
              title={isDesktopSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
            >
              {/* Mobile icon */}
              <Menu className="w-5 h-5 md:hidden" />
              {/* Desktop icon */}
              {isDesktopSidebarOpen ? (
                <PanelLeftClose className="w-5 h-5 hidden md:block" />
              ) : (
                <PanelLeftOpen className="w-5 h-5 hidden md:block text-blue-600" />
              )}
            </button>

            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
                <Boxes className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                    Inventaris<span className="text-blue-600">Ku</span>
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded border border-blue-200">
                    Persediaan
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-none mt-0.5">
                  Gudang & Kantor
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
