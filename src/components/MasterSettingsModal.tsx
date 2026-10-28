import React, { useState, useRef } from 'react';
import {
  X,
  SlidersHorizontal,
  Tags,
  DatabaseBackup,
  RotateCcw,
  Plus,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Fuel,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  ClipboardCheck,
  ShieldAlert,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const MasterSettingsModal: React.FC = () => {
  const {
    isMasterSettingsOpen,
    setIsMasterSettingsOpen,
    canManageMasterData,
    currentUser,
    categories,
    addCategory,
    deleteCategory,
    resetToDefaultData,
    resetItemsToDefault,
    clearAllItems,
    resetStockInTransactions,
    resetStockOutTransactions,
    resetTransactions,
    resetFuelLogs,
    resetFuelLogsToDefault,
    resetOpnames,
    resetCategoriesToDefault,
    exportJSON,
    importJSON,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'reset-menu' | 'categories' | 'backup'>('reset-menu');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isMasterSettingsOpen) return null;

  if (!canManageMasterData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setIsMasterSettingsOpen(false)}
        />
        <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center z-10 border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Akses Khusus Administrator</h3>
          <p className="text-sm text-slate-600 mb-4">
            Sebagai user <strong>{currentUser.name} ({currentUser.role})</strong>, Anda tidak memiliki kewenangan mengubah master data atau mereset data operasional.
          </p>
          <button
            onClick={() => setIsMasterSettingsOpen(false)}
            className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const handleAction = async (action: () => Promise<{ success: boolean; message: string }>, confirmMsg: string) => {
    if (!window.confirm(confirmMsg)) return;
    try {
      setIsProcessing(true);
      const res = await action();
      setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message || 'Terjadi kesalahan sistem saat memproses reset.' });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryInput.trim()) {
      addCategory(newCategoryInput.trim());
      setNewCategoryInput('');
      setFeedback({ type: 'success', message: 'Kategori baru berhasil ditambahkan!' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importJSON(content);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
      setTimeout(() => setFeedback(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsMasterSettingsOpen(false)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                Pusat Reset Data & Master
              </h2>
              <p className="text-xs text-slate-500">
                Reset terstruktur per modul Menu Utama & pengelolaan cadangan sistem
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMasterSettingsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('reset-menu')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'reset-menu'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            Reset Sesuai Menu Utama
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'categories'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tags className="w-3.5 h-3.5 text-blue-600" />
            Master Kategori ({categories.length})
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DatabaseBackup className="w-3.5 h-3.5 text-emerald-600" />
            Cadangan & Impor JSON
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 max-h-[68vh] overflow-y-auto space-y-5">
          {/* TAB 1: RESET PER MENU UTAMA */}
          {activeTab === 'reset-menu' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Perhatian Administrator:</span> Modul reset di bawah ini disusun khusus mencocokkan setiap pilihan yang ada di <strong>Menu Utama</strong> aplikasi. Setiap aksi akan langsung disinkronkan ke basis data cloud Firebase Firestore.
                </div>
              </div>

              <div className="space-y-3">
                {/* 1. Menu Katalog Barang */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                          1. Menu Katalog Barang
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            Master Barang Persediaan
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Reset seluruh daftar barang persediaan ATK, pantry, komputer, dan cetakan.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-200/70">
                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleAction(
                          resetItemsToDefault,
                          '⚠️ RESET MASTER KATALOG BARANG:\nKatalog barang akan dikembalikan ke 10 barang standar Kanwil DJPb Riau beserta stok bawaannya.\n\nLanjutkan?'
                        )
                      }
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset ke Standar Awal
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleAction(
                          clearAllItems,
                          '⚠️ KOSONGKAN SELURUH KATALOG BARANG:\nSemua data barang persediaan akan dihapus dari sistem. Gunakan jika ingin input katalog baru dari awal.\n\nApakah Anda yakin?'
                        )
                      }
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 active:scale-95 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kosongkan Seluruh Katalog
                    </button>
                  </div>
                </div>

                {/* 2. Menu Barang Masuk */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                          2. Menu Barang Masuk
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Penerimaan / Pengadaan
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Hapus log mutasi penerimaan barang masuk. Data master katalog barang tetap aman.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/70">
                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleAction(
                          resetStockInTransactions,
                          '⚠️ HAPUS TRANSAKSI BARANG MASUK:\nSeluruh catatan mutasi penerimaan Barang Masuk akan dihapus. Master barang tetap utuh.\n\nLanjutkan?'
                        )
                      }
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kosongkan Riwayat Barang Masuk
                    </button>
                  </div>
                </div>

                {/* 3. Menu Barang Keluar */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                          3. Menu Barang Keluar
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Pengeluaran / Distribusi
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Hapus log mutasi pengeluaran barang keluar ke unit/seksi kantor.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/70">
                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleAction(
                          resetStockOutTransactions,
                          '⚠️ HAPUS TRANSAKSI BARANG KELUAR:\nSeluruh catatan mutasi pengeluaran Barang Keluar akan dihapus.\n\nLanjutkan?'
                        )
                      }
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kosongkan Riwayat Barang Keluar
                    </button>
                  </div>
                </div>

                {/* 4. Menu Pengisian BBM */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-orange-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                        <Fuel className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                          4. Menu Pengisian BBM
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                            9 Kendaraan Dinas
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Reset atau kosongkan log pengisian bensin/solar dan catatan odometer kendaraan.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-200/70">
                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleAction(
                          resetFuelLogs,
                          '⚠️ KOSONGKAN LOG BBM:\nSeluruh riwayat pengisian BBM kendaraan dinas akan dihapus/dikosongkan.\n\nLanjutkan?'
                        )
                      }
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kosongkan Riwayat BBM
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleAction(
                          resetFuelLogsToDefault,
                          '⚠️ RESET BBM KE CONTOH AWAL:\nRiwayat BBM akan dikembalikan ke data sampel bawaan.\n\nLanjutkan?'
                        )
                      }
                      className="px-3 py-1.5 bg-white hover:bg-orange-50 text-orange-800 border border-orange-300 active:scale-95 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset ke Data Contoh
                    </button>
                  </div>
                </div>

                {/* 5. Menu Stock Opname */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <ClipboardCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                          5. Menu Stock Opname
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                            Audit & Rekonsiliasi Fisik
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Hapus seluruh draf dan sesi rekonsiliasi hasil audit fisik barang persediaan.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/70">
                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleAction(
                          resetOpnames,
                          '⚠️ KOSONGKAN RIWAYAT STOCK OPNAME:\nSeluruh draf dan sesi perhitungan fisik stock opname akan dikosongkan.\n\nLanjutkan?'
                        )
                      }
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kosongkan Stock Opname
                    </button>
                  </div>
                </div>

                {/* 6. Master Kategori Persediaan */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <Tags className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                          6. Master Kategori Persediaan
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                            Pengelompokan Barang
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Reset daftar kategori ke standar bawaan (ATK, Kertas, Komputer, Pantry, Cetakan).
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/70">
                    <button
                      disabled={isProcessing}
                      onClick={() =>
                        handleAction(
                          resetCategoriesToDefault,
                          '⚠️ RESET MASTER KATEGORI:\nSeluruh kategori barang akan dikembalikan ke daftar bawaan standar sistem.\n\nLanjutkan?'
                        )
                      }
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Kategori ke Standar
                    </button>
                  </div>
                </div>

                {/* 7. Reset Menyeluruh Seluruh Menu Utama */}
                <div className="p-4 bg-rose-50/70 rounded-xl border-2 border-rose-300">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-950 text-sm">
                        Reset Total Seluruh Menu Utama (Setelan Pabrik)
                      </h4>
                      <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                        Mengembalikan <strong>seluruh modul operasional</strong> (Katalog Barang, Barang Masuk & Keluar, BBM, Stock Opname, serta Kategori) secara serentak ke data default awal Kanwil DJPb Riau.
                      </p>
                      <button
                        disabled={isProcessing}
                        onClick={() =>
                          handleAction(
                            resetToDefaultData,
                            '⚠️ PERINGATAN SISTEM ADMINISTRATOR:\nTindakan ini akan mengembalikan SELURUH database (barang, transaksi masuk/keluar, BBM, opname, kategori) ke data awal default pabrik.\n\nApakah Anda benar-benar yakin ingin melanjutkan?'
                          )
                        }
                        className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset Seluruh Modul Menu Utama
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER KATEGORI */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Kelola Daftar Master Kategori</h4>
                  <p className="text-xs text-slate-500">
                    Kategori digunakan untuk memfilter dan mengelompokkan barang pada katalog persediaan
                  </p>
                </div>
                <button
                  disabled={isProcessing}
                  onClick={() =>
                    handleAction(
                      resetCategoriesToDefault,
                      'Kembalikan daftar kategori barang ke standar awal?'
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                >
                  Reset ke Standar
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik nama kategori baru..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </button>
              </form>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs sm:text-sm"
                  >
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <button
                      onClick={() => deleteCategory(cat)}
                      title="Hapus Kategori"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP & IMPORT */}
          {activeTab === 'backup' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  Ekspor File Cadangan Lengkap (JSON)
                </h4>
                <p className="text-xs text-slate-500">
                  Unduh seluruh database (Katalog barang, mutasi transaksi barang masuk/keluar, log pengisian BBM, stock opname, dan kategori) untuk disimpan aman atau dipindahkan.
                </p>
                <button
                  onClick={exportJSON}
                  className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Cadangan (.json)
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Pulihkan dari File Cadangan (JSON)
                </h4>
                <p className="text-xs text-slate-500">
                  Unggah file cadangan JSON yang pernah diunduh untuk memulihkan seluruh data operasional kembali.
                </p>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border border-slate-300 shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  Pilih File Cadangan...
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Tersambung ke Cloud Firestore & Penyimpanan Lokal
          </span>
          <button
            onClick={() => setIsMasterSettingsOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
