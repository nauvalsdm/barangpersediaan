import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Download,
  Printer,
  FileText,
  Clock,
  X,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Package,
  Edit,
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
    openEditTransactionModal,
    exportTransactionsToCSV,
    setPrintDoc,
    deleteTransaction,
    transactionNotice,
    setTransactionNotice,
    setActiveTab,
    isAdmin,
    isPPNPN,
  } = useInventory();

  // If user is PPNPN and tries to view MASUK directly, default to KELUAR
  const [typeFilter, setTypeFilter] = useState<string>(
    isPPNPN && initialType === 'MASUK' ? 'KELUAR' : initialType || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [confirmTransaction, setConfirmTransaction] = useState<StockTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!confirmTransaction || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await deleteTransaction(confirmTransaction.id);
      setTransactionNotice({
        type: res.success ? 'success' : 'error',
        message: res.message,
        restoredToCatalog: res.success && confirmTransaction.type === 'KELUAR',
      });
      setConfirmTransaction(null);
    } catch (err) {
      setTransactionNotice({
        type: 'error',
        message:
          err instanceof Error
            ? `Terjadi kesalahan saat memproses transaksi: ${err.message}`
            : 'Gagal memproses pembatalan/penghapusan transaksi.',
      });
      setConfirmTransaction(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Feedback Notification Banner */}
      {transactionNotice && (
        <div
          className={`rounded-2xl border p-3.5 sm:p-4 flex items-start justify-between gap-3 shadow-xs ${
            transactionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {transactionNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5">
              <p className="text-xs sm:text-sm font-semibold leading-snug">
                {transactionNotice.message}
              </p>
              {transactionNotice.restoredToCatalog && (
                <button
                  onClick={() => setActiveTab('items')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Lihat di Katalog Barang</span>
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setTransactionNotice(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            title="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            {isPPNPN ? 'Riwayat Pengeluaran Barang Persediaan' : 'Riwayat Mutasi Barang Persediaan'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPPNPN
              ? 'Pencatatan distribusi & pembatalan barang keluar — barang yang tidak jadi diambil otomatis kembali ke katalog'
              : 'Mencatat arus barang masuk & keluar — barang keluar yang tidak jadi diambil/dihapus otomatis kembali ke katalog'}
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
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((trx) => {
                  const isMasuk = trx.type === 'MASUK';
                  const isKeluar = trx.type === 'KELUAR';
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

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handlePrint(trx)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Bukti Transaksi Resmi"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {isKeluar ? (
                            <>
                              {isAdmin && (
                                <button
                                  onClick={() => openEditTransactionModal(trx)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Edit / Ubah Data Barang Keluar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Ubah</span>
                                </button>
                              )}
                              <button
                                onClick={() => setConfirmTransaction(trx)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Tidak jadi diambil / Hapus & kembalikan stok ke Katalog Barang"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Batal / Hapus</span>
                              </button>
                            </>
                          ) : (
                            isAdmin && (
                              <button
                                onClick={() => setConfirmTransaction(trx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Transaksi Permanen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
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
      )}

      {/* Confirmation Modal for Cancel / Delete */}
      {confirmTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      confirmTransaction.type === 'KELUAR'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {confirmTransaction.type === 'KELUAR' ? (
                      <RotateCcw className="w-5 h-5" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {confirmTransaction.type === 'KELUAR'
                        ? 'Batalkan / Hapus Barang Keluar?'
                        : 'Hapus Transaksi Permanen?'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {confirmTransaction.referenceNo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isDeleting && setConfirmTransaction(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Barang:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {confirmTransaction.itemName} ({confirmTransaction.itemSku})
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Jumlah:</span>
                  <span className="font-extrabold text-amber-700">
                    {confirmTransaction.quantity} {confirmTransaction.unit}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Pihak / Pemohon:</span>
                  <span className="font-semibold text-slate-700 text-right">
                    {confirmTransaction.sourceOrDestination}
                  </span>
                </div>
              </div>

              {confirmTransaction.type === 'KELUAR' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                  <Package className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    Barang tidak jadi diambil atau dihapus. Stok sebanyak{' '}
                    <strong>
                      +{confirmTransaction.quantity} {confirmTransaction.unit}
                    </strong>{' '}
                    akan otomatis <strong>dikembalikan ke Katalog Barang Persediaan</strong> dan
                    tersimpan ke Firebase.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  Catatan transaksi ini akan dihapus permanen dari database Firebase dan tidak akan
                  ditampilkan lagi.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmTransaction(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                    confirmTransaction.type === 'KELUAR'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {confirmTransaction.type === 'KELUAR' ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isDeleting ? 'Mengembalikan...' : 'Ya, Kembalikan ke Katalog'}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

