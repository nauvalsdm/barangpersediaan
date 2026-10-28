import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  Building,
  User,
  Plus,
  FileText,
  Clock,
  X,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StockTransaction, TransactionType } from '../types/inventory';
import { formatRupiah, formatDateTimeIndo } from '../utils/formatters';

interface TransactionsViewProps {
  initialType?: TransactionType;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ initialType }) => {
  const {
    transactions,
    openTransactionModal,
    exportTransactionsToCSV,
    setPrintDoc,
    isAdmin,
    isPPNPN,
  } = useInventory();

  // If user is PPNPN and tries to view MASUK directly, default to KELUAR
  const [typeFilter, setTypeFilter] = useState<string>(
    isPPNPN && initialType === 'MASUK' ? 'KELUAR' : initialType || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;

      // Date
      if (dateFilter) {
        const tDate = t.date ? t.date.slice(0, 10) : '';
        if (tDate !== dateFilter) return false;
      }

      // Search
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        t.referenceNo.toLowerCase().includes(q) ||
        t.itemName.toLowerCase().includes(q) ||
        t.itemSku.toLowerCase().includes(q) ||
        t.sourceOrDestination.toLowerCase().includes(q) ||
        t.recipientOrSignee.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    });
  }, [transactions, typeFilter, dateFilter, searchQuery]);

  const handlePrint = (trx: StockTransaction) => {
    setPrintDoc({
      type: trx.type === 'MASUK' ? 'BUKTI_MASUK' : 'BUKTI_KELUAR',
      data: trx,
    });
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            {isPPNPN ? 'Riwayat Pengeluaran Barang Persediaan' : 'Riwayat Mutasi Barang Persediaan'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPPNPN
              ? 'Pencatatan distribusi dan bukti pengeluaran barang persediaan ke unit kerja'
              : 'Mencatat seluruh arus barang masuk dari pemasok dan pengeluaran ke unit kerja'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportTransactionsToCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          {/* Barang Masuk: Admin only */}
          {isAdmin && (
            <button
              onClick={() => openTransactionModal('MASUK')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Barang Masuk</span>
            </button>
          )}

          {/* Barang Keluar: Both Admin and PPNPN */}
          <button
            onClick={() => openTransactionModal('KELUAR')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Catat Barang Keluar</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No. Referensi, nama barang, pemohon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
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

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Jenis Mutasi</option>
              <option value="MASUK">Hanya Barang Masuk (Penerimaan)</option>
              <option value="KELUAR">Hanya Barang Keluar (Pemakaian)</option>
              <option value="PENYESUAIAN">Penyesuaian / Stock Opname</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                title="Hapus filter tanggal"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction List / Table */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Tidak ada transaksi ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Belum ada data mutasi yang sesuai dengan kriteria filter Anda.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">No. Ref & Tanggal</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Barang & SKU</th>
                  <th className="py-3 px-4 text-center">Kuantitas</th>
                  <th className="py-3 px-4">Pihak / Pemohon</th>
                  <th className="py-3 px-4">Petugas / PIC</th>
                  <th className="py-3 px-4 text-right">Stok Riil</th>
                  <th className="py-3 px-4 text-center">Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((trx) => {
                  const isMasuk = trx.type === 'MASUK';
                  const isOpname = trx.type === 'PENYESUAIAN';

                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ref & Date */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-600 text-xs block">
                          {trx.referenceNo}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTimeIndo(trx.date)}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isMasuk
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOpname
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isMasuk ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : isOpname ? (
                            <span>±</span>
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {trx.type}
                        </span>
                      </td>

                      {/* Item */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                          {trx.itemName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {trx.itemSku}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-black text-sm ${
                            isMasuk
                              ? 'text-emerald-700'
                              : isOpname
                              ? 'text-purple-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {isMasuk ? '+' : isOpname ? '±' : '-'}
                          {trx.quantity} {trx.unit}
                        </span>
                        {trx.unitPrice > 0 && (
                          <span className="block text-[10px] text-slate-400">
                            {formatRupiah(trx.totalPrice)}
                          </span>
                        )}
                      </td>

                      {/* Source/Destination */}
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-semibold block truncate max-w-[180px]">
                          {trx.sourceOrDestination}
                        </span>
                        {trx.notes && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                            {trx.notes}
                          </span>
                        )}
                      </td>

                      {/* Officer */}
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {trx.recipientOrSignee}
                      </td>

                      {/* Stock Before -> After */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="text-slate-400 text-xs">{trx.stockBefore}</span>
                        <span className="text-slate-300 mx-1">&rarr;</span>
                        <span className="font-black text-slate-900">{trx.stockAfter}</span>
                        <span className="text-slate-500 text-[10px] ml-1">{trx.unit}</span>
                      </td>

                      {/* Print Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handlePrint(trx)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Cetak Bukti Transaksi Resmi"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
