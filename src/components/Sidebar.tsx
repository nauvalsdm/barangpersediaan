import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  FileSpreadsheet,
  QrCode,
  SlidersHorizontal,
  X,
  AlertCircle,
  Layers,
  Shield,
  ShieldCheck,
  UserCheck,
  LogOut,
  Fuel,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ActiveTab } from '../types/inventory';
import { formatRupiah } from '../utils/formatters';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isDesktopOpen?: boolean;
  onToggleDesktop?: () => void;
  onOpenMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isDesktopOpen = true,
  onToggleDesktop,
  onOpenMobile,
}) => {
  const {
    activeTab,
    setActiveTab,
    items,
    transactions,
    opnames,
    fuelLogs,
    setIsScannerOpen,
    setIsMasterSettingsOpen,
    openTransactionModal,
    currentUser,
    switchUser,
    users,
    isAdmin,
    isPPNPN,
    logout,
  } = useInventory();

  // Metrics
  const lowStockCount = items.filter((i) => i.stock <= i.minStock).length;
  const totalValue = items.reduce((acc, curr) => acc + curr.stock * curr.unitPrice, 0);

  // Operational Main Navigation (Menu Utama Operasional Gudang & Persediaan)
  // NOTE: 'user-access' is moved outside this primary menu to comply with role separation
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
    requiresAdmin?: boolean;
    subtitle?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Beranda',
      icon: LayoutDashboard,
    },
    {
      id: 'items',
      label: 'Katalog Barang',
      icon: Package,
      badge: items.length,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'stock-out',
      label: 'Barang Keluar',
      icon: ArrowUpRight,
      badge: transactions.filter((t) => t.type === 'KELUAR').length,
      badgeColor: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'fuel-log',
      label: 'Pengisian BBM',
      icon: Fuel,
      badge: fuelLogs.length,
      badgeColor: 'bg-orange-50 text-orange-700',
    },
    ...(isAdmin
      ? [
          {
            id: 'stock-in' as ActiveTab,
            label: 'Barang Masuk',
            icon: ArrowDownLeft,
            badge: transactions.filter((t) => t.type === 'MASUK').length,
            badgeColor: 'bg-emerald-50 text-emerald-700',
          },
          {
            id: 'opname' as ActiveTab,
            label: 'Stock Opname',
            icon: ClipboardCheck,
            badge: opnames.length > 0 ? opnames.length : undefined,
            badgeColor: 'bg-indigo-50 text-indigo-700',
          },
        ]
      : []),
    {
      id: 'reports',
      label: 'Laporan & Mutasi',
      icon: FileSpreadsheet,
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const content = (
    <div className="h-full flex flex-col justify-between p-4 bg-white select-none overflow-y-auto">
      <div>
        {/* Mobile Header in Drawer */}
        <div className="md:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">InventarisKu</p>
              <p className="text-[11px] text-slate-500">Menu Navigasi</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card in Sidebar */}
        <div
          className={`mb-4 p-3 rounded-2xl border text-xs ${
            isAdmin
              ? 'bg-blue-50/70 border-blue-200 text-blue-950'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-blue-600' : 'bg-emerald-600'
                }`}
              >
                {isAdmin ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate leading-tight">{currentUser.name}</p>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                    isAdmin ? 'bg-blue-200 text-blue-800' : 'bg-emerald-200 text-emerald-800'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
            </div>
            {onToggleDesktop && (
              <button
                onClick={onToggleDesktop}
                className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors cursor-pointer"
                title="Sembunyikan Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dedicated Quick Outgoing button for PPNPN */}
          {isPPNPN && (
            <button
              onClick={() => {
                onCloseMobile();
                openTransactionModal('KELUAR');
              }}
              className="mt-2.5 w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Catat Barang Keluar</span>
            </button>
          )}
        </div>

        {/* Section title: Menu Utama Operasional */}
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </p>
          <span className="text-[10px] text-slate-400">Operasional</span>
        </div>

        {/* Primary Operational Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                  />
                  <div>
                    <span className="block text-left leading-tight">{item.label}</span>
                    {item.subtitle && (
                      <span className={`block text-[10px] text-left font-normal ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* KHUSUS ADMINISTRASI & HAK AKSES */}
        {isAdmin && (
          <div className="mt-5 pt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Administrasi Sistem</span>
              </p>
            </div>

            {/* Elevated Admin Access Management Card / Button */}
            <button
              onClick={() => handleSelectTab('user-access')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'user-access'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950 hover:bg-indigo-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                    activeTab === 'user-access' ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block leading-tight font-bold">Pengelolaan Akses Admin</span>
                  <span
                    className={`block text-[10px] font-normal mt-0.5 ${
                      activeTab === 'user-access' ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    Kewenangan Admin & PPNPN
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === 'user-access' ? 'bg-white/20 text-white' : 'bg-indigo-200 text-indigo-900'
                }`}
              >
                {users.length} User
              </span>
            </button>

            {/* Direct Admin Reset Data Button */}
            <button
              onClick={() => {
                onCloseMobile();
                setIsMasterSettingsOpen(true);
              }}
              className="mt-2 w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border bg-rose-50/70 border-rose-200/80 text-rose-950 hover:bg-rose-100/70"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 bg-rose-600 text-white">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block leading-tight font-bold">Reset Data & Master</span>
                  <span className="block text-[10px] font-normal mt-0.5 text-rose-700/80">
                    Reset Database & Kategori
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-900">
                Admin
              </span>
            </button>
          </div>
        )}

        {/* Utility Shortcuts */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Alat Cepat
          </p>
          <div className="space-y-1">
            <button
              onClick={() => {
                onCloseMobile();
                setIsScannerOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Pemindai Barcode / QR</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  onCloseMobile();
                  setIsMasterSettingsOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                <span>Master Kategori & Data</span>
              </button>
            )}

            {/* Logout Button under Alat Cepat */}
            <button
              onClick={() => {
                onCloseMobile();
                logout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Keluar / Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Inventory Health & Asset Summary Widget */}
      <div className="pt-4 border-t border-slate-100 space-y-3 mt-4">
        {lowStockCount > 0 && (
          <div
            onClick={() => handleSelectTab('items')}
            className="p-3 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition-colors"
          >
            <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{lowStockCount} Barang Menipis</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-snug">
              Ada stok yang berada di bawah safety stock. Perlu pengadaan ulang.
            </p>
          </div>
        )}

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <p className="text-[11px] text-slate-500 font-medium">Estimasi Nilai Persediaan</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
            {formatRupiah(totalValue)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {items.length} jenis • {items.reduce((s, i) => s + i.stock, 0)} total unit
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden md:block shrink-0 bg-white min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out overflow-hidden ${
          isDesktopOpen ? 'w-64 border-r border-slate-200 opacity-100' : 'w-0 border-r-0 opacity-0'
        }`}
      >
        <div className="w-64 h-full">{content}</div>
      </aside>

      {/* Floating Side-Edge Unhide Button when Sidebar is Hidden (Desktop & Mobile) */}
      {!isDesktopOpen && onToggleDesktop && (
        <button
          onClick={onToggleDesktop}
          className="hidden md:flex fixed left-0 top-24 z-40 items-center gap-1.5 pl-2 pr-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-r-xl shadow-lg transition-all cursor-pointer"
          title="Tampilkan Sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span>Menu</span>
        </button>
      )}

      {!isMobileOpen && onOpenMobile && (
        <button
          onClick={onOpenMobile}
          className="md:hidden fixed left-0 top-24 z-40 flex items-center gap-1 pl-1.5 pr-2.5 py-2 bg-blue-600/95 hover:bg-blue-700 text-white text-[11px] font-bold rounded-r-xl shadow-md transition-all cursor-pointer"
          title="Buka Menu Samping"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      {/* Mobile Off-canvas Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[82vw] bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
