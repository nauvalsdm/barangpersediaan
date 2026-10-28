import React from 'react';
import {
  X,
  Package,
  QrCode,
  MapPin,
  Building2,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Edit,
  History,
  Tag,
  Clock,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah, formatDateTimeIndo, generateBarcodeLines } from '../utils/formatters';

export const ItemDetailModal: React.FC = () => {
  const {
    selectedItemForDetail,
    setSelectedItemForDetail,
    transactions,
    openTransactionModal,
    openItemForm,
            isAdmin,
            isPPNPN,
          } = useInventory();

          if (!selectedItemForDetail) return null;

          const item = selectedItemForDetail;
          const isLow = item.stock <= item.minStock && item.stock > 0;
          const isOut = item.stock === 0;

          // Ledger history for this item
          const itemTransactions = transactions.filter((t) => t.itemId === item.id);

          // Barcode pattern
          const barcodePattern = generateBarcodeLines(item.sku);

          const handlePrintLabel = () => {
            window.print();
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                onClick={() => setSelectedItemForDetail(null)}
              />

              {/* Modal Card */}
              <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                          {item.sku}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                          {item.category}
                        </span>
                      </div>
                      <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl mt-1">
                        {item.name}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItemForDetail(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                  {/* Key Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Stok Fisik
                      </span>
                      <span
                        className={`text-xl sm:text-2xl font-black mt-1 block ${
                          isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                        }`}
                      >
                        {item.stock} {item.unit}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isOut ? 'Habis Total' : isLow ? 'Perlu Restock' : 'Stok Aman'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Safety Stock
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-1 block">
                        {item.minStock} {item.unit}
                      </span>
                      <span className="text-[10px] text-slate-400">Batas Minimum</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Harga Satuan
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-800 mt-1 block truncate">
                        {formatRupiah(item.unitPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400">Per {item.unit}</span>
                    </div>

                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                        Nilai Persediaan
                      </span>
                      <span className="text-sm sm:text-base font-black text-emerald-700 mt-1 block truncate">
                        {formatRupiah(item.stock * item.unitPrice)}
                      </span>
                      <span className="text-[10px] text-emerald-600">Total Aset Fisik</span>
                    </div>
                  </div>

                  {/* Barcode Label Card (Printable) */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        <span>Label Barang & Barcode SKU</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Dapat ditempel pada boks arsip, kemasan, atau tempat penyimpanan barang.
                      </p>
                    </div>

                    {/* Visual Barcode */}
                    <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-xs flex flex-col items-center">
                      <div className="flex items-stretch h-10 gap-0.5 px-2">
                        {barcodePattern.map((isBar, idx) => (
                          <div
                            key={idx}
                            className={`w-0.5 h-full ${isBar ? 'bg-black' : 'bg-transparent'}`}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-xs font-bold tracking-widest text-slate-900 mt-1">
                        *{item.sku}*
                      </span>
                      <span className="text-[9px] text-slate-500 truncate max-w-[150px]">
                        {item.name}
                      </span>
                    </div>

                    <button
                      onClick={handlePrintLabel}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Label</span>
                    </button>
                  </div>

                  {/* Details Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200">
                      Informasi Barang & Pengadaan
                    </div>
                    <div className="divide-y divide-slate-100">
                      <div className="flex py-2 px-4">
                        <span className="w-1/3 text-slate-500">Pemasok / Vendor</span>
                        <span className="w-2/3 font-semibold text-slate-900 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {item.supplier || '-'}
                        </span>
                      </div>
                      {item.description && (
                        <div className="flex py-2 px-4">
                          <span className="w-1/3 text-slate-500">Deskripsi</span>
                          <span className="w-2/3 text-slate-700">{item.description}</span>
                        </div>
                      )}
                      <div className="flex py-2 px-4">
                        <span className="w-1/3 text-slate-500">Terakhir Diperbarui</span>
                        <span className="w-2/3 text-slate-600">{formatDateTimeIndo(item.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kartu Stok (Mutasi Khusus Barang Ini) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-blue-600" />
                        Kartu Stok (Riwayat Mutasi Barang)
                      </h3>
                      <span className="text-xs text-slate-500">
                        {itemTransactions.length} transaksi tercatat
                      </span>
                    </div>

                    {itemTransactions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">
                        Belum ada mutasi masuk/keluar untuk barang ini selain saldo awal.
                      </p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Tanggal</th>
                              <th className="py-2 px-3">Jenis</th>
                              <th className="py-2 px-3">Pihak / Keterangan</th>
                              <th className="py-2 px-3 text-right">Mutasi</th>
                              <th className="py-2 px-3 text-right">Sisa Stok</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {itemTransactions.map((trx) => (
                              <tr key={trx.id} className="hover:bg-slate-50/70">
                                <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                                  {formatDateTimeIndo(trx.date)}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      trx.type === 'MASUK'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : trx.type === 'PENYESUAIAN'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {trx.type}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-700">
                                  <div className="font-medium truncate max-w-[180px]">
                                    {trx.sourceOrDestination}
                                  </div>
                                  {trx.notes && (
                                    <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                      {trx.notes}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right font-bold whitespace-nowrap">
                                  <span
                                    className={
                                      trx.type === 'MASUK'
                                        ? 'text-emerald-700'
                                        : trx.type === 'PENYESUAIAN'
                                        ? 'text-purple-700'
                                        : 'text-amber-700'
                                    }
                                  >
                                    {trx.type === 'MASUK' ? '+' : trx.type === 'PENYESUAIAN' ? '±' : '-'}
                                    {trx.quantity} {trx.unit}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                                  {trx.stockAfter} {trx.unit}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
                    {isAdmin ? (
                      <button
                        onClick={() => {
                          setSelectedItemForDetail(null);
                          openItemForm(item);
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Data</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedItemForDetail(null);
                            openTransactionModal('MASUK', item);
                          }}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>+ Catat Masuk</span>
                        </button>
                      )}

                      {/* Both Admin and PPNPN can record Barang Keluar */}
                      <button
                        onClick={() => {
                          setSelectedItemForDetail(null);
                          openTransactionModal('KELUAR', item);
                        }}
                        disabled={item.stock === 0}
                        className={`px-4 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-xs transition-colors ${
                          item.stock === 0
                            ? 'opacity-40 cursor-not-allowed bg-slate-400'
                            : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Catat Barang Keluar</span>
                      </button>
                    </div>
                  </div>
        </div>
      </div>
    </div>
  );
};
