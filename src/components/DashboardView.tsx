import React from 'react';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  QrCode,
  ClipboardCheck,
  FileText,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah, formatNumber, formatDateTimeIndo } from '../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    items,
    transactions,
    categories,
    setActiveTab,
    openTransactionModal,
    openItemForm,
    setIsScannerOpen,
    setSelectedItemForDetail,
    setPrintDoc,
    isAdmin,
    isPPNPN,
    currentUser,
  } = useInventory();

  // Metrics
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.stock, 0);
  const totalValue = items.reduce((sum, item) => sum + item.stock * item.unitPrice, 0);
  const lowStockItems = items.filter((item) => item.stock <= item.minStock);
  const outOfStockItems = items.filter((item) => item.stock === 0);

  // Today / recent transactions
  const recentTransactions = transactions.slice(0, 6);

  // Category breakdown calculation
  const categoryStats = categories.map((cat) => {
    const catItems = items.filter((i) => i.category === cat);
    const count = catItems.length;
    const value = catItems.reduce((acc, i) => acc + i.stock * i.unitPrice, 0);
    const totalQty = catItems.reduce((acc, i) => acc + i.stock, 0);
    return { category: cat, count, value, totalQty };
  }).filter((c) => c.count > 0).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-5 sm:p-7 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur-xs mb-2">
              <Boxes className="w-3.5 h-3.5" />
              Sistem Persediaan Terpadu • Akun {currentUser.role}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Manajemen Barang Persediaan
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-blue-100 max-w-xl">
              {isPPNPN
                ? `Selamat bertugas, ${currentUser.name}! Anda memiliki kewenangan untuk melayani dan mencatat pengeluaran barang persediaan untuk setiap divisi kantor.`
                : 'Pantau arus masuk & keluar logistik kantor, kontrol persediaan stok kritis, dan lakukan stock opname gudang dengan cepat.'}
            </p>
          </div>

          {/* Quick Actions buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => openTransactionModal('MASUK')}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Catat Masuk
              </button>
            )}

            {/* Both Admin & PPNPN can record Outgoing */}
            <button
              onClick={() => openTransactionModal('KELUAR')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 ${
                isPPNPN
                  ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-white/30'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Catat Barang Keluar</span>
            </button>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-xs transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              Scan SKU
            </button>
          </div>
        </div>

        {/* Decorative background circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-48 h-48 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total SKU */}
        <div
          onClick={() => setActiveTab('items')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Barang</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatNumber(totalItems)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            SKU aktif terdaftar di sistem
          </p>
        </div>

        {/* Total Quantity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Kuantitas</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatNumber(totalQuantity)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total unit fisik barang persediaan
          </p>
        </div>

        {/* Total Asset Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Nilai Aset Persediaan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 truncate">
            {formatRupiah(totalValue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Berdasarkan harga perolehan
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setActiveTab('items')}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all col-span-2 sm:col-span-1 ${
            lowStockItems.length > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Stok Kritis / Menipis
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                lowStockItems.length > 0
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold ${
              lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {lowStockItems.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {outOfStockItems.length > 0
              ? `${outOfStockItems.length} barang habis stok (0 unit)`
              : 'Perlu pengadaan kembali'}
          </p>
        </div>
      </div>

      {/* Main Section: Low Stock Warning + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide on desktop): Stok Kritis & Kategori */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stok Menipis Action List */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                    Perlu Pengadaan (Stok di Bawah Batas Minimum)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Segera lakukan pembelian atau restock barang berikut
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('items')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs sm:text-sm">
                <p className="font-semibold text-emerald-600">Alhamdulillah! Semua stok barang aman.</p>
                <p className="text-slate-400 mt-1">Tidak ada barang yang berada di bawah batas minimum.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.sku}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mt-1 truncate">
                        {item.name}
                      </h3>
                      {item.supplier && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Pemasok: {item.supplier}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right sm:pr-2">
                        <div className="text-sm font-extrabold text-rose-600">
                          {item.stock} {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Min: {item.minStock} {item.unit}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isAdmin && (
                          <button
                            onClick={() => openTransactionModal('MASUK', item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            Restock
                          </button>
                        )}
                        {isPPNPN && item.stock > 0 && (
                          <button
                            onClick={() => openTransactionModal('KELUAR', item)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Keluar
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedItemForDetail(item)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kategori & Sebaran Persediaan */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
              Sebaran Persediaan per Kategori
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Distribusi nilai aset dan total barang per kategori
            </p>

            <div className="space-y-3">
              {categoryStats.map((stat) => {
                const percentage = totalValue > 0 ? (stat.value / totalValue) * 100 : 0;
                return (
                  <div key={stat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{stat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-normal">
                          {stat.count} barang ({stat.totalQty} unit)
                        </span>
                        <span className="text-slate-900 font-bold">
                          {formatRupiah(stat.value)}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Riwayat Mutasi Terkini & Pintasan Cepat */}
        <div className="space-y-6">
          {/* Recent Activity Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  Mutasi Barang Terkini
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('stock-in')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Semua
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada transaksi mutasi tercatat.
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((trx) => {
                  const isMasuk = trx.type === 'MASUK';
                  const isOpname = trx.type === 'PENYESUAIAN';
                  return (
                    <div
                      key={trx.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            isMasuk
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOpname
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isMasuk ? 'MASUK' : isOpname ? 'OPNAME' : 'KELUAR'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDateTimeIndo(trx.date)}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {trx.itemName}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                        <span>
                          Jumlah:{' '}
                          <strong
                            className={
                              isMasuk
                                ? 'text-emerald-700'
                                : isOpname
                                ? 'text-purple-700'
                                : 'text-amber-700'
                            }
                          >
                            {isMasuk ? '+' : isOpname ? '±' : '-'}
                            {trx.quantity} {trx.unit}
                          </strong>
                        </span>
                        <span className="text-slate-500 font-medium text-[11px] truncate max-w-[130px]">
                          {trx.sourceOrDestination}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Tools & Shortcuts */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xs space-y-4">
            <h3 className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-400" />
              Pemeriksaan & Stock Opname
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Jadwalkan pemeriksaan berkala untuk mencocokkan stok fisik barang persediaan dengan data pada sistem.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => setActiveTab('opname')}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <ClipboardCheck className="w-4 h-4" />
                Buka Modul Stock Opname
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors text-slate-200"
              >
                <FileText className="w-4 h-4" />
                Cetak Lembar Laporan Fisik
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
