import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Calendar,
  User,
  Search,
  ArrowRight,
  RotateCcw,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { OpnameEntry, OpnameSession } from '../types/inventory';
import { formatDateIndo, formatDateTimeIndo } from '../utils/formatters';

export const StockOpnameView: React.FC = () => {
  const {
    items,
    opnames,
    saveOpname,
    setPrintDoc,
    isAdmin,
    isPPNPN,
    setActiveTab,
    openTransactionModal,
  } = useInventory();

  // Mode: list or active opname session
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [opnameTitle, setOpnameTitle] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [opnameNotes, setOpnameNotes] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [applyLiveStock, setApplyLiveStock] = useState(true);

  // Entries for the new session
  const [sessionEntries, setSessionEntries] = useState<OpnameEntry[]>([]);

  // Start new session
  const handleStartNewSession = () => {
    const today = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    setOpnameTitle(`Stock Opname Fisik Periode ${today}`);
    setOfficerName('Tim Pemeriksa Persediaan');
    setOpnameNotes('Pemeriksaan berkala stok fisik gudang dan lemari kerja.');

    // Populate initial entries
    const initialEntries: OpnameEntry[] = items.map((i) => ({
      itemId: i.id,
      itemName: i.name,
      itemSku: i.sku,
      unit: i.unit,
      systemStock: i.stock,
      physicalStock: i.stock, // defaults to current system stock
      difference: 0,
      notes: '',
      checked: true,
    }));

    setSessionEntries(initialEntries);
    setIsCreatingNew(true);
  };

  const handlePhysicalStockChange = (itemId: string, val: number) => {
    setSessionEntries((prev) =>
      prev.map((e) => {
        if (e.itemId === itemId) {
          const diff = val - e.systemStock;
          return {
            ...e,
            physicalStock: val,
            difference: diff,
          };
        }
        return e;
      })
    );
  };

  const handleNotesChange = (itemId: string, text: string) => {
    setSessionEntries((prev) =>
      prev.map((e) => (e.itemId === itemId ? { ...e, notes: text } : e))
    );
  };

  const handleSaveOpname = () => {
    if (!opnameTitle.trim()) {
      alert('Nama kegiatan stock opname wajib diisi.');
      return;
    }
    if (!officerName.trim()) {
      alert('Nama petugas pemeriksa wajib diisi.');
      return;
    }

    const totalDiscrepancy = sessionEntries.reduce((sum, e) => sum + Math.abs(e.difference), 0);

    saveOpname(
      {
        title: opnameTitle.trim(),
        date: new Date().toISOString(),
        officerName: officerName.trim(),
        notes: opnameNotes.trim(),
        status: 'SELESAI',
        entries: sessionEntries,
        totalDiscrepancy,
      },
      applyLiveStock
    );

    setIsCreatingNew(false);
  };

  const handlePrintSheet = (opname?: OpnameSession) => {
    const dataToPrint = opname || {
      title: opnameTitle || 'Lembar Pemeriksaan Fisik (Stock Opname)',
      referenceNo: 'OPN-DRAFT',
      date: new Date().toISOString(),
      officerName: officerName || 'Petugas Gudang',
      entries: sessionEntries.length > 0 ? sessionEntries : items.map((i) => ({
        itemId: i.id,
        itemName: i.name,
        itemSku: i.sku,
        unit: i.unit,
        systemStock: i.stock,
        physicalStock: i.stock,
        difference: 0,
        notes: '',
      })),
    };

    setPrintDoc({
      type: 'OPNAME_SHEET',
      data: dataToPrint,
    });
  };

  if (isPPNPN) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl">
          Akses Terbatas untuk Akun PPNPN
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Modul Stock Opname, audit persediaan, dan penyesuaian saldo buku merupakan wewenang khusus <strong>Administrator Pengelola Barang</strong>.
        </p>
        <p className="text-xs text-amber-800 font-medium mt-3 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
          Kewenangan Anda sebagai PPNPN adalah melayani dan mencatat <strong>Barang Keluar</strong> (distribusi pemakaian unit kerja).
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab('stock-out')}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
          >
            Buka Halaman Barang Keluar
          </button>
          <button
            onClick={() => openTransactionModal('KELUAR')}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            + Catat Barang Keluar Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            Stock Opname & Penyesuaian Fisik
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cek kesesuaian fisik barang persediaan dengan sistem dan sesuaikan selisih secara otomatis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrintSheet()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Cetak Formulir Cek Fisik</span>
            <span className="sm:hidden">Cetak Form</span>
          </button>

          {!isCreatingNew && (
            <button
              onClick={handleStartNewSession}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Mulai Opname Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* CREATE NEW OPNAME WORKFLOW */}
      {isCreatingNew ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-bold text-slate-900 text-base">
                Sesi Pemeriksaan Fisik Sedang Berjalan
              </h2>
            </div>
            <button
              onClick={() => setIsCreatingNew(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Batalkan Sesi
            </button>
          </div>

          {/* Form Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Judul Kegiatan Opname
              </label>
              <input
                type="text"
                value={opnameTitle}
                onChange={(e) => setOpnameTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Petugas Pemeriksa
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Catatan Pemeriksaan
              </label>
              <input
                type="text"
                value={opnameNotes}
                onChange={(e) => setOpnameNotes(e.target.value)}
                placeholder="misal: Cek kondisi barang rusak..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Table of Entries */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Daftar Barang & Input Stok Fisik ({sessionEntries.length} Barang)
              </span>
              <span className="text-xs text-slate-500">
                Ubah angka di kolom &quot;Stok Fisik&quot; jika ada perbedaan
              </span>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/90 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Kode & Nama Barang</th>
                    <th className="py-2.5 px-3 text-center">Stok Sistem</th>
                    <th className="py-2.5 px-3 text-center w-32">Stok Fisik Riil</th>
                    <th className="py-2.5 px-3 text-center">Selisih</th>
                    <th className="py-2.5 px-3">Alasan / Catatan Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessionEntries.map((entry) => {
                    const isDiff = entry.difference !== 0;
                    return (
                      <tr
                        key={entry.itemId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isDiff ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                            {entry.itemName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {entry.itemSku}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                          {entry.systemStock} {entry.unit}
                        </td>

                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={entry.physicalStock}
                            onChange={(e) =>
                              handlePhysicalStockChange(
                                entry.itemId,
                                Math.max(0, parseInt(e.target.value) || 0)
                              )
                            }
                            className="w-20 px-2 py-1 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-black px-2 py-0.5 rounded text-[11px] ${
                              entry.difference === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : entry.difference < 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {entry.difference > 0 ? `+${entry.difference}` : entry.difference}{' '}
                            {entry.unit}
                          </span>
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder={
                              isDiff ? 'Wajib isi alasan selisih (rusak/hilang)...' : 'Catatan opsional'
                            }
                            value={entry.notes}
                            onChange={(e) => handleNotesChange(entry.itemId, e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Options & Action Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyLiveStock}
                onChange={(e) => setApplyLiveStock(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                Otomatis sesuaikan stok di sistem dengan stok fisik nyata (Buat Jurnal Penyesuaian)
              </span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveOpname}
                className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan & Simpan Opname</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* LIST OF PREVIOUS SESSIONS */
        <div className="space-y-4">
          {opnames.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">
                Belum ada riwayat stock opname
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Lakukan stock opname secara rutin (bulanan atau triwulan) untuk menjaga keakuratan persediaan fisik.
              </p>
              <button
                onClick={handleStartNewSession}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                Mulai Sesi Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opnames.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {session.referenceNo}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {session.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mt-2">
                      {session.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateIndo(session.date)} • Petugas: {session.officerName}
                    </p>

                    {session.notes && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {session.notes}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Barang Diperiksa</span>
                        <span className="font-bold text-slate-800">
                          {session.entries.length} jenis
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Total Selisih</span>
                        <span
                          className={`font-bold ${
                            session.totalDiscrepancy !== 0 ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {session.totalDiscrepancy === 0
                            ? 'Cocok 100%'
                            : `${Math.abs(session.totalDiscrepancy)} unit selisih`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handlePrintSheet(session)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Hasil</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Disimpan {formatDateTimeIndo(session.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
