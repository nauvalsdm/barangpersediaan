import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Edit,
  Trash2,
  FileSpreadsheet,
  LayoutGrid,
  List,
  AlertTriangle,
  QrCode,
  MapPin,
  Building2,
  X,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { InventoryItem } from '../types/inventory';
import { formatRupiah, formatNumber } from '../utils/formatters';

export const ItemCatalogView: React.FC = () => {
  const {
    items,
    categories,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStockStatus,
    setFilterStockStatus,
    openItemForm,
    openTransactionModal,
    setSelectedItemForDetail,
    deleteItem,
    exportItemsToCSV,
    setIsScannerOpen,
    isAdmin,
    isPPNPN,
    currentUser,
  } = useInventory();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'stock-desc' | 'stock-asc' | 'value-desc' | 'sku'>('name');

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.supplier && item.supplier.toLowerCase().includes(q));

      // Category
      const matchCategory = !filterCategory || item.category === filterCategory;

      // Status
      let matchStatus = true;
      if (filterStockStatus === 'low') {
        matchStatus = item.stock <= item.minStock && item.stock > 0;
      } else if (filterStockStatus === 'out') {
        matchStatus = item.stock === 0;
      } else if (filterStockStatus === 'safe') {
        matchStatus = item.stock > item.minStock;
      }

      return matchSearch && matchCategory && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'sku') return a.sku.localeCompare(b.sku);
      if (sortBy === 'stock-desc') return b.stock - a.stock;
      if (sortBy === 'stock-asc') return a.stock - b.stock;
      if (sortBy === 'value-desc') return (b.stock * b.unitPrice) - (a.stock * a.unitPrice);
      return 0;
    });
  }, [items, searchQuery, filterCategory, filterStockStatus, sortBy]);

  const handleDelete = (item: InventoryItem) => {
    if (
      window.confirm(
        `Yakin ingin menghapus barang persediaan "${item.name}" (SKU: ${item.sku})? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      deleteItem(item.id);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Katalog Barang Persediaan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Menampilkan {filteredItems.length} dari {items.length} jenis barang persediaan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={exportItemsToCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          {/* Scanner Button */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Pindai</span>
          </button>

          {/* If PPNPN: Direct Catat Barang Keluar button */}
          {isPPNPN && (
            <button
              onClick={() => openTransactionModal('KELUAR')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Catat Keluar</span>
            </button>
          )}

          {/* Add Item Button (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => openItemForm()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Barang</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SKU, nama, pemasok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Condition */}
          <div>
            <select
              value={filterStockStatus}
              onChange={(e) => setFilterStockStatus(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Semua Status Stok</option>
              <option value="low">⚠️ Menipis (Di Bawah Min)</option>
              <option value="out">⛔ Stok Habis (0 Unit)</option>
              <option value="safe">✅ Stok Aman</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="name">Urut: Nama (A-Z)</option>
              <option value="sku">Urut: Kode SKU</option>
              <option value="stock-asc">Urut: Stok Terkecil</option>
              <option value="stock-desc">Urut: Stok Terbanyak</option>
              <option value="value-desc">Urut: Total Nilai Terbesar</option>
            </select>
          </div>
        </div>

        {/* View Mode Switcher & Quick Pills */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
          {/* Quick Filter Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setFilterStockStatus('all');
                setFilterCategory('');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStockStatus === 'all' && !filterCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              onClick={() => setFilterStockStatus('low')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStockStatus === 'low'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Stok Menipis ({items.filter((i) => i.stock <= i.minStock && i.stock > 0).length})
            </button>
            <button
              onClick={() => setFilterStockStatus('out')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStockStatus === 'out'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Habis ({items.filter((i) => i.stock === 0).length})
            </button>
          </div>

          {/* Toggle Table vs Grid */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Listing */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Tidak ada barang yang cocok</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Coba ubah kata kunci pencarian atau sesuaikan filter kategori/status stok.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterCategory('');
              setFilterStockStatus('all');
            }}
            className="mt-4 px-3.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Standard Responsive with horizontal scroll on small devices) */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Barang & SKU</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Stok / Min</th>
                  <th className="py-3 px-4 text-right">Harga Satuan</th>
                  <th className="py-3 px-4 text-right">Total Nilai</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLow = item.stock <= item.minStock && item.stock > 0;
                  const isOut = item.stock === 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => setSelectedItemForDetail(item)}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-100 transition-colors"
                            title="Lihat Detail & Barcode"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <div>
                            <span
                              onClick={() => setSelectedItemForDetail(item)}
                              className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-xs sm:text-sm block"
                            >
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                {item.sku}
                              </span>
                              {item.supplier && (
                                <span className="text-[10px] text-slate-400 hidden xl:inline">
                                  {item.supplier}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Stock & Status */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-extrabold text-sm ${
                                isOut
                                  ? 'text-rose-600'
                                  : isLow
                                  ? 'text-amber-600'
                                  : 'text-slate-900'
                              }`}
                            >
                              {item.stock} {item.unit}
                            </span>
                            {isOut ? (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                                Habis
                              </span>
                            ) : isLow ? (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">
                                Menipis
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Min: {item.minStock} {item.unit}
                          </span>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {formatRupiah(item.unitPrice)}
                      </td>

                      {/* Total Value */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(item.stock * item.unitPrice)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick In (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => openTransactionModal('MASUK', item)}
                              title="Catat Barang Masuk (+)"
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Out (Both Admin and PPNPN - PPNPN authority) */}
                          <button
                            onClick={() => openTransactionModal('KELUAR', item)}
                            disabled={item.stock === 0}
                            title={item.stock === 0 ? 'Stok habis' : 'Catat Barang Keluar (-)'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.stock === 0
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                : isPPNPN
                                ? 'text-amber-800 bg-amber-100 hover:bg-amber-200 font-bold px-2'
                                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              {isPPNPN && <span className="text-[11px]">Keluar</span>}
                            </div>
                          </button>

                          {/* Detail (Both) */}
                          <button
                            onClick={() => setSelectedItemForDetail(item)}
                            title="Detail & Barcode"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => openItemForm(item)}
                              title="Edit Data"
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(item)}
                              title="Hapus"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARD VIEW (Optimized for mobile touch & visual scanning) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            const isLow = item.stock <= item.minStock && item.stock > 0;
            const isOut = item.stock === 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isOut
                    ? 'border-rose-200'
                    : isLow
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200/90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {item.sku}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {item.category}
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedItemForDetail(item)}
                    className="font-bold text-sm sm:text-base text-slate-900 mt-2 hover:text-blue-600 cursor-pointer line-clamp-2"
                  >
                    {item.name}
                  </h3>

                  {item.supplier && (
                    <div className="mt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.supplier}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400">Stok Tersedia</p>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-lg font-black ${
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.stock} {item.unit}
                        </span>
                        {isOut ? (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">
                            Habis
                          </span>
                        ) : isLow ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">
                            Menipis
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-slate-400">Min: {item.minStock} {item.unit}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Nilai Aset</p>
                      <p className="font-bold text-sm text-slate-800">
                        {formatRupiah(item.stock * item.unitPrice)}
                      </p>
                      <p className="text-[10px] text-slate-400">{formatRupiah(item.unitPrice)}/{item.unit}</p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  {isAdmin ? (
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      <button
                        onClick={() => openTransactionModal('MASUK', item)}
                        className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1"
                        title="Barang Masuk"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Masuk</span>
                      </button>

                      <button
                        onClick={() => openTransactionModal('KELUAR', item)}
                        disabled={item.stock === 0}
                        className={`py-1.5 px-2 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 ${
                          item.stock === 0
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                        }`}
                        title="Barang Keluar"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Keluar</span>
                      </button>

                      <button
                        onClick={() => setSelectedItemForDetail(item)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs flex items-center justify-center gap-1"
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>

                      <button
                        onClick={() => openItemForm(item)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs flex items-center justify-center gap-1"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  ) : (
                    /* PPNPN Card Actions: prominent Catat Keluar and Detail */
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => openTransactionModal('KELUAR', item)}
                        disabled={item.stock === 0}
                        className={`py-2 px-3 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                          item.stock === 0
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95'
                        }`}
                        title="Catat Barang Keluar"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Catat Keluar</span>
                      </button>

                      <button
                        onClick={() => setSelectedItemForDetail(item)}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                        title="Lihat Detail Barang"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                        <span>Lihat Detail</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
