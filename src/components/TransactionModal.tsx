import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  AlertTriangle,
  Building,
  User,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah, formatNumber } from '../utils/formatters';

const DEFAULT_DEPARTMENTS = [
  'Divisi Keuangan & Akuntansi',
  'Divisi SDM / HRD',
  'Divisi Teknologi Informasi (IT)',
  'Divisi Operasional & Umum',
  'Divisi Pemasaran & Humas',
  'Pantry & Hospitality',
  'Direksi & Manajemen',
];

export const TransactionModal: React.FC = () => {
  const {
    transactionModalState,
    closeTransactionModal,
    items,
    recordTransaction,
    setPrintDoc,
    currentUser,
    isPPNPN,
    isAdmin,
  } = useInventory();

  const { isOpen, type, item } = transactionModalState;
  const isMasuk = type === 'MASUK';

  // Form states
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [sourceOrDestination, setSourceOrDestination] = useState<string>('');
  const [recipientOrSignee, setRecipientOrSignee] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [trxDate, setTrxDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Selected item object
  const currentItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId);
  }, [items, selectedItemId]);

  useEffect(() => {
    if (isOpen) {
      const defaultItem = item || items[0];
      if (defaultItem) {
        setSelectedItemId(defaultItem.id);
        setUnitPrice(defaultItem.unitPrice);
      }
      setQuantity(1);
      setSourceOrDestination(isMasuk ? (defaultItem?.supplier || '') : DEFAULT_DEPARTMENTS[0]);
      // Default PIC/Officer based on role
      setRecipientOrSignee('');
      setNotes('');
      setTrxDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [isOpen, item, items, isMasuk, currentUser]);

  // When item changes
  const handleItemSelect = (id: string) => {
    setSelectedItemId(id);
    const target = items.find((i) => i.id === id);
    if (target) {
      setUnitPrice(target.unitPrice);
      if (isMasuk && target.supplier) {
        setSourceOrDestination(target.supplier);
      }
    }
  };

  if (!isOpen) return null;

  const currentStock = currentItem ? currentItem.stock : 0;
  const calculatedStockAfter = isMasuk
    ? currentStock + (Number(quantity) || 0)
    : currentStock - (Number(quantity) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setError('Silakan pilih barang terlebih dahulu.');
      return;
    }

    if (!quantity || quantity <= 0) {
      setError('Jumlah mutasi barang harus lebih besar dari 0.');
      return;
    }

    if (!isMasuk && quantity > currentItem.stock) {
      setError(
        `Stok tidak mencukupi! Persediaan saat ini hanya ${currentItem.stock} ${currentItem.unit}, permintaan ${quantity} ${currentItem.unit}.`
      );
      return;
    }

    if (!sourceOrDestination.trim()) {
      setError(
        isMasuk
          ? 'Nama supplier/pemasok wajib diisi.'
          : 'Divisi atau peruntukan barang wajib diisi.'
      );
      return;
    }

    if (!recipientOrSignee.trim()) {
      setError('Nama penanggung jawab / pemohon / penerima wajib diisi.');
      return;
    }

    const result = recordTransaction({
      type,
      itemId: currentItem.id,
      quantity: Number(quantity),
      sourceOrDestination: sourceOrDestination.trim(),
      recipientOrSignee: recipientOrSignee.trim(),
      notes: notes.trim(),
      unitPrice: isMasuk ? Number(unitPrice) || currentItem.unitPrice : currentItem.unitPrice,
      date: trxDate ? new Date(trxDate).toISOString() : new Date().toISOString(),
    });

    if (result.success) {
      // Prompt option to print Bukti Mutasi
      if (result.transaction) {
        const wantsPrint = window.confirm(
          `Transaksi ${isMasuk ? 'Masuk' : 'Keluar'} berhasil dicatat!\n\nApakah Anda ingin mencetak dokumen Bukti ${
            isMasuk ? 'Penerimaan' : 'Pengeluaran'
          } Barang (Surat Jalan/Permintaan)?`
        );
        if (wantsPrint) {
          setPrintDoc({
            type: isMasuk ? 'BUKTI_MASUK' : 'BUKTI_KELUAR',
            data: result.transaction,
          });
        }
      }
      closeTransactionModal();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={closeTransactionModal}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 sm:p-5 border-b ${
            isMasuk ? 'bg-emerald-50/70 border-emerald-100' : 'bg-amber-50/70 border-amber-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
                isMasuk ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
            >
              {isMasuk ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                {isMasuk ? 'Catat Barang Masuk (Penerimaan)' : 'Catat Barang Keluar (Pemakaian)'}
              </h2>
              <p className="text-xs text-slate-500">
                {isMasuk
                  ? 'Input barang masuk dari supplier / pengadaan baru'
                  : 'Distribusi barang persediaan ke unit kerja / pegawai'}
              </p>
            </div>
          </div>
          <button
            onClick={closeTransactionModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Officer Attribution Pill */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isPPNPN ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span className="text-slate-600">
                Petugas Pencatat: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.roleTitle})
              </span>
            </div>
          </div>

          {/* Item Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Barang Persediaan <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  [{i.sku}] {i.name} — (Tersedia: {i.stock} {i.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview & After Calculation */}
          {currentItem && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Stok Saat Ini:</span>
                <span className="font-extrabold text-sm text-slate-800">
                  {currentStock} {currentItem.unit}
                </span>
              </div>
              <div className="text-center font-bold text-slate-400 text-sm">
                &rarr;
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Stok Setelah Mutasi:</span>
                <span
                  className={`font-black text-sm ${
                    calculatedStockAfter < 0
                      ? 'text-rose-600'
                      : calculatedStockAfter <= currentItem.minStock
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {calculatedStockAfter} {currentItem.unit}
                </span>
              </div>
            </div>
          )}

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah {isMasuk ? 'Diterima' : 'Dikeluarkan'}{' '}
                {currentItem && `(${currentItem.unit})`} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-base font-extrabold text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Mutasi
              </label>
              <input
                type="date"
                value={trxDate}
                onChange={(e) => setTrxDate(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Masuk: Price Per Unit / Total */}
          {isMasuk && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Harga Perolehan Satuan (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm bg-slate-50 font-bold text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Total Nilai: <strong className="text-emerald-700">{formatRupiah((quantity || 0) * (unitPrice || 0))}</strong>
              </p>
            </div>
          )}

          {/* Source / Destination */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isMasuk ? 'Pemasok / Sumber Barang (Supplier / No PO)' : 'Unit Kerja / Divisi Pemohon'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                isMasuk
                  ? 'misal: PT Sinar Dunia (PO-2026/01)'
                  : 'misal: Divisi Keuangan / Ruang Rapat 2'
              }
              value={sourceOrDestination}
              onChange={(e) => setSourceOrDestination(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
            {!isMasuk && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {DEFAULT_DEPARTMENTS.slice(0, 4).map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSourceOrDestination(dept)}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors"
                  >
                    {dept.replace('Divisi ', '')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Penanggung Jawab / Penerima */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isMasuk ? 'Petugas Penerima Gudang' : 'Nama Pegawai Peminta / Penerima'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="misal: Budi Santoso"
              value={recipientOrSignee}
              onChange={(e) => setRecipientOrSignee(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Catatan / Keperluan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan / Keperluan Penggunaan
            </label>
            <textarea
              rows={2}
              placeholder="misal: Untuk persiapan rapat kerja tahunan / restock rutin..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                isMasuk ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Mutasi Stok</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
