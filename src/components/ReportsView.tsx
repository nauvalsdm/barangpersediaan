import React, { useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  TrendingUp,
  Package,
  Layers,
  Building,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah, formatNumber } from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const { items, transactions, categories, exportItemsToCSV, setPrintDoc } = useInventory();

  // Metrics
  const totalItems = items.length;
  const totalStockQty = items.reduce((s, i) => s + i.stock, 0);
  const totalAssetValue = items.reduce((s, i) => s + i.stock * i.unitPrice, 0);

  // Category analysis
  const categoryReport = useMemo(() => {
    return categories
      .map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        const count = catItems.length;
        const totalQty = catItems.reduce((s, i) => s + i.stock, 0);
        const totalVal = catItems.reduce((s, i) => s + i.stock * i.unitPrice, 0);
        return {
          category: cat,
          count,
          totalQty,
          totalVal,
          percentage: totalAssetValue > 0 ? (totalVal / totalAssetValue) * 100 : 0,
        };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.totalVal - a.totalVal);
  }, [items, categories, totalAssetValue]);

  // Division / Department outgoing usage analysis
  const divisionReport = useMemo(() => {
    const map = new Map<string, { count: number; totalQty: number; totalVal: number }>();
    transactions
      .filter((t) => t.type === 'KELUAR')
      .forEach((t) => {
        const div = t.sourceOrDestination || 'Lainnya / Umum';
        const existing = map.get(div) || { count: 0, totalQty: 0, totalVal: 0 };
        map.set(div, {
          count: existing.count + 1,
          totalQty: existing.totalQty + t.quantity,
          totalVal: existing.totalVal + t.totalPrice,
        });
      });

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalVal - a.totalVal);
  }, [transactions]);

  // Fast moving items (highest total quantity out)
  const fastMovingItems = useMemo(() => {
    const map = new Map<string, { itemSku: string; itemName: string; unit: string; totalOut: number; totalVal: number }>();
    transactions
      .filter((t) => t.type === 'KELUAR')
      .forEach((t) => {
        const existing = map.get(t.itemId) || {
          itemSku: t.itemSku,
          itemName: t.itemName,
          unit: t.unit,
          totalOut: 0,
          totalVal: 0,
        };
        map.set(t.itemId, {
          ...existing,
          totalOut: existing.totalOut + t.quantity,
          totalVal: existing.totalVal + t.totalPrice,
        });
      });

    return Array.from(map.values())
      .sort((a, b) => b.totalOut - a.totalOut)
      .slice(0, 5);
  }, [transactions]);

  const handlePrintFullReport = () => {
    setPrintDoc({
      type: 'REKAP_MUTASI',
      data: {
        totalItems,
        totalStockQty,
        totalAssetValue,
        categoryReport,
        divisionReport,
        items,
      },
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Laporan Rekapitulasi & Nilai Persediaan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis nilai persediaan barang, konsumsi per divisi, dan pergerakan mutasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportItemsToCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor Spreadsheet (CSV)</span>
          </button>

          <button
            onClick={handlePrintFullReport}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Resmi</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Nilai Persediaan</p>
          <p className="text-2xl font-black text-emerald-700 mt-1 truncate">
            {formatRupiah(totalAssetValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Berdasarkan harga perolehan fisik</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kuantitas Fisik</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatNumber(totalStockQty)} Unit
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Dari {totalItems} jenis barang aktif</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transaksi Mutasi</p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {transactions.length} Mutasi
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {transactions.filter((t) => t.type === 'MASUK').length} Masuk •{' '}
            {transactions.filter((t) => t.type === 'KELUAR').length} Keluar
          </p>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Rekapitulasi Persediaan per Kategori
          </h2>
          <span className="text-xs text-slate-400">{categoryReport.length} kategori aktif</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Kategori</th>
                <th className="py-3 px-4 text-center">Jumlah SKU</th>
                <th className="py-3 px-4 text-center">Total Kuantitas</th>
                <th className="py-3 px-4 text-right">Nilai Total (Rp)</th>
                <th className="py-3 px-4 text-right">Porsi (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryReport.map((cat) => (
                <tr key={cat.category} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-slate-900">{cat.category}</td>
                  <td className="py-3 px-4 text-center font-medium text-slate-600">
                    {cat.count} barang
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">
                    {formatNumber(cat.totalQty)} unit
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    {formatRupiah(cat.totalVal)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-xs border-t border-slate-200">
              <tr>
                <td className="py-3 px-4">TOTAL KESELURUHAN</td>
                <td className="py-3 px-4 text-center">{totalItems} barang</td>
                <td className="py-3 px-4 text-center">{formatNumber(totalStockQty)} unit</td>
                <td className="py-3 px-4 text-right text-emerald-700 font-black">
                  {formatRupiah(totalAssetValue)}
                </td>
                <td className="py-3 px-4 text-right">100.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Grid: Pemakaian per Divisi & Fast Moving Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outgoing by Division */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 mb-1">
            <Building className="w-4 h-4 text-amber-600" />
            Distribusi Pemakaian per Unit Kerja / Divisi
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Rekapitulasi alokasi logistik barang keluar kepada unit pemohon
          </p>

          {divisionReport.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada riwayat pengeluaran barang ke divisi.
            </p>
          ) : (
            <div className="space-y-3">
              {divisionReport.map((div) => (
                <div
                  key={div.name}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{div.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {div.count} kali permintaan • {div.totalQty} total unit
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-700">
                      {formatRupiah(div.totalVal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fast Moving Items */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Barang Paling Sering Digunakan (Fast-Moving)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Daftar persediaan dengan perputaran pemakaian tertinggi
          </p>

          {fastMovingItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada perputaran barang keluar yang signifikan.
            </p>
          ) : (
            <div className="space-y-3">
              {fastMovingItems.map((item, idx) => (
                <div
                  key={item.itemSku}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 truncate max-w-[200px]">
                        {item.itemName}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        {item.itemSku}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {item.totalOut} {item.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatRupiah(item.totalVal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
