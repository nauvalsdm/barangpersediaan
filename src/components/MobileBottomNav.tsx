import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Plus,
  ClipboardCheck,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  QrCode,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ActiveTab } from '../types/inventory';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openTransactionModal,
    openItemForm,
    setIsScannerOpen,
    isAdmin,
    isPPNPN,
  } = useInventory();

  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const tabs: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = isPPNPN
    ? [
        { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
        { id: 'items', label: 'Barang', icon: Package },
        { id: 'stock-out', label: 'Keluar', icon: ArrowUpRight },
        { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
      ]
    : [
        { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
        { id: 'items', label: 'Barang', icon: Package },
        { id: 'opname', label: 'Opname', icon: ClipboardCheck },
        { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
      ];

  return (
    <>
      {/* Quick Action Bottom Sheet Modal */}
      {isQuickActionOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsQuickActionOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-2xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isPPNPN ? 'Aksi Persediaan (PPNPN)' : 'Aksi Cepat Persediaan'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isPPNPN ? 'Kewenangan mencatat pengeluaran barang' : 'Akses penuh administrator'}
                </p>
              </div>
              <button
                onClick={() => setIsQuickActionOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`grid ${isPPNPN ? 'grid-cols-2' : 'grid-cols-2'} gap-3`}>
              {/* Barang Keluar (Both Admin and PPNPN) */}
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  openTransactionModal('KELUAR');
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${
                  isPPNPN
                    ? 'col-span-2 bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-amber-50 hover:bg-amber-100/80 rounded-xl border-amber-200 text-amber-800'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-xs ${
                    isPPNPN ? 'bg-white text-amber-700' : 'bg-amber-600 text-white'
                  }`}
                >
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">Catat Barang Keluar</span>
                <span className={`text-[11px] ${isPPNPN ? 'text-amber-100' : 'text-amber-600'}`}>
                  Pemakaian Unit Kerja / Pegawai
                </span>
              </button>

              {/* Barang Masuk (Admin only) */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsQuickActionOpen(false);
                    openTransactionModal('MASUK');
                  }}
                  className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200 text-emerald-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs">Barang Masuk</span>
                  <span className="text-[10px] text-emerald-600">Terima dari Supplier</span>
                </button>
              )}

              {/* Tambah Barang (Admin only) */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsQuickActionOpen(false);
                    openItemForm();
                  }}
                  className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100/80 rounded-xl border border-blue-200 text-blue-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs">Barang Baru</span>
                  <span className="text-[10px] text-blue-600">Daftarkan SKU Baru</span>
                </button>
              )}

              {/* Kelola Akses Admin */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsQuickActionOpen(false);
                    setActiveTab('user-access');
                  }}
                  className="col-span-2 flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 text-blue-900 transition-colors text-xs font-bold cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Pengelolaan Akses Admin & Pengguna</span>
                </button>
              )}
              {/* Scan Barcode (Both) */}
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setIsScannerOpen(true);
                }}
                className={`flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100/80 rounded-xl border border-purple-200 text-purple-800 transition-colors ${
                  isPPNPN ? 'col-span-2' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mb-2 shadow-xs">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs">Scan Barcode / QR</span>
                <span className="text-[10px] text-purple-600">Cek Cepat Persediaan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-bottom shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {/* First 2 tabs */}
          {tabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] font-semibold mt-1">{tab.label}</span>
              </button>
            );
          })}

          {/* Center Floating Plus Action */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              onClick={() => setIsQuickActionOpen(true)}
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg border-2 border-white transition-all"
              aria-label="Aksi Cepat"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Last 2 tabs */}
          {tabs.slice(2, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] font-semibold mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
