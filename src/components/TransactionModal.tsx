import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Edit,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah } from '../utils/formatters';

export const TransactionModal: React.FC = () => {
  const {
    transactionModalState,
    closeTransactionModal,
    items,
    recordTransaction,
    updateStockOutTransaction,
    setPrintDoc,
    currentUser,
    isPPNPN,
  } = useInventory();

  const { isOpen, type, item, transactionToEdit } = transactionModalState;
  const isEditing = Boolean(transactionToEdit && transactionToEdit.type === 'KELUAR');
  const isMasuk = !isEditing && type === 'MASUK';

  // Form states
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [sourceOrDestination, setSourceOrDestination] = useState<string>('');
  const [recipientOrSignee, setRecipientOrSignee] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [trxDate, setTrxDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected item object
  const currentItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId);
  }, [items, selectedItemId]);

  const isSameEditedItem = useMemo(() => {
    if (!isEditing || !transactionToEdit) return false;
    if (selectedItemId === transactionToEdit.itemId) return true;
    if (
      currentItem &&
      transactionToEdit.itemSku &&
      currentItem.sku.trim().toLowerCase() === transactionToEdit.itemSku.trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  }, [isEditing, transactionToEdit, selectedItemId, currentItem]);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit && transactionToEdit.type === 'KELUAR') {
        const matchedItem =
          items.find((i) => i.id === transactionToEdit.itemId) ||
          items.find(
            (i) =>
              transactionToEdit.itemSku &&
              i.sku.trim().toLowerCase() === transactionToEdit.itemSku.trim().toLowerCase()
          );
        setSelectedItemId(matchedItem ? matchedItem.id : transactionToEdit.itemId);
        setQuantity(transactionToEdit.quantity);
        setSourceOrDestination(transactionToEdit.sourceOrDestination || '');
        setRecipientOrSignee(transactionToEdit.recipientOrSignee || '');
        setNotes(transactionToEdit.notes || '');
        setUnitPrice(transactionToEdit.unitPrice || matchedItem?.unitPrice || 0);
        setTrxDate(
          transactionToEdit.date
            ? transactionToEdit.date.slice(0, 10)
            : new Date().toISOString().slice(0, 10)
        );
        setError(null);
        setIsSubmitting(false);
        return;
      }

      const defaultItem = item || items[0];
      if (defaultItem) {
        setSelectedItemId(defaultItem.id);
        setUnitPrice(defaultItem.unitPrice);
      }
      setQuantity(1);
      setSourceOrDestination(isMasuk ? defaultItem?.supplier || '' : '');
      setRecipientOrSignee('');
      setNotes('');
      setTrxDate(new Date().toISOString().slice(0, 10));
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, item, items, isMasuk, currentUser, transactionToEdit]);

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
  const oldEditQty = isEditing && transactionToEdit ? transactionToEdit.quantity : 0;
  const maxAllowedQty = isEditing
    ? isSameEditedItem
      ? currentStock + oldEditQty
      : currentStock
    : currentStock;
  const calculatedStockAfter = isMasuk
    ? currentStock + (Number(quantity) || 0)
    : isEditing && isSameEditedItem
    ? currentStock + oldEditQty - (Number(quantity) || 0)
    : currentStock - (Number(quantity) || 0);

  const unitLabel = currentItem?.unit || transactionToEdit?.unit || 'Unit';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isEditing && !currentItem) {
      setError('Silakan pilih barang terlebih dahulu.');
      return;
    }

    if (!quantity || quantity <= 0) {
      setError('Jumlah mutasi barang harus lebih besar dari 0.');
      return;
    }

    if (!isMasuk && quantity > maxAllowedQty) {
      setError(
        isEditing && isSameEditedItem
          ? `Stok tidak mencukupi! Maksimal jumlah keluar adalah ${maxAllowedQty} ${unitLabel} (stok katalog ${currentStock} + keluar sebelumnya ${oldEditQty}).`
          : `Stok tidak mencukupi! Persediaan saat ini hanya ${currentStock} ${unitLabel}, permintaan ${quantity} ${unitLabel}.`
      );
      return;
    }

    if (!sourceOrDestination.trim()) {
      setError(
        isMasuk
          ? 'Nama supplier/pemasok wajib diisi.'
          : 'Bagian/Bidang atau peruntukan barang wajib diisi.'
      );
      return;
    }

    if (!recipientOrSignee.trim()) {
      setError('Nama penanggung jawab / pemohon / penerima wajib diisi.');
      return;
    }

    if (isEditing && transactionToEdit) {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await updateStockOutTransaction(transactionToEdit.id, {
          itemId: selectedItemId,
          quantity: Number(quantity),
          sourceOrDestination: sourceOrDestination.trim(),
          recipientOrSignee: recipientOrSignee.trim(),
          notes: notes.trim(),
          date: trxDate ? new Date(trxDate).toISOString() : transactionToEdit.date,
        });
        if (result.success) {
          closeTransactionModal();
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? `Gagal menyimpan perubahan: ${err.message}`
            : 'Gagal menyimpan perubahan transaksi.'
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!currentItem) return;

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
        onClick={() => !isSubmitting && closeTransactionModal()}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 sm:p-5 border-b ${
            isEditing
              ? 'bg-blue-50/80 border-blue-100'
              : isMasuk
              ? 'bg-emerald-50/70 border-emerald-100'
              : 'bg-amber-50/70 border-amber-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
                isEditing ? 'bg-blue-600' : isMasuk ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
            >
              {isEditing ? (
                <Edit className="w-4 h-4" />
              ) : isMasuk ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                {isEditing
                  ? 'Ubah Data Barang Keluar'
                  : isMasuk
                  ? 'Catat Barang Masuk (Penerimaan)'
                  : 'Catat Barang Keluar (Pemakaian)'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing && transactionToEdit ? (
                  <span>
                    No. Ref: <strong className="font-mono text-blue-700">{transactionToEdit.referenceNo}</strong> • Perubahan stok otomatis disesuaikan ke Katalog
                  </span>
                ) : isMasuk ? (
                  'Input barang masuk dari supplier / pengadaan baru'
                ) : (
                  'Distribusi barang persediaan ke Bagian/Bidang'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => !isSubmitting && closeTransactionModal()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors cursor-pointer"
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
                {isEditing ? 'Diubah oleh Admin:' : 'Petugas Pencatat:'}{' '}
                <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.roleTitle})
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
              {isEditing && transactionToEdit && !currentItem && (
                <option value={transactionToEdit.itemId}>
                  [{transactionToEdit.itemSku}] {transactionToEdit.itemName} — (Tidak ada di katalog saat ini)
                </option>
              )}
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  [{i.sku}] {i.name} — (Tersedia: {i.stock} {i.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview & After Calculation */}
          {(currentItem || (isEditing && transactionToEdit)) && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">
                    {isEditing ? 'Stok Katalog Saat Ini:' : 'Stok Saat Ini:'}
                  </span>
                  <span className="font-extrabold text-sm text-slate-800">
                    {currentStock} {unitLabel}
                  </span>
                </div>
                <div className="text-center font-bold text-slate-400 text-sm">&rarr;</div>
                <div className="text-right">
                  <span className="text-slate-500 block">
                    {isEditing ? 'Stok Katalog Setelah Diubah:' : 'Stok Setelah Mutasi:'}
                  </span>
                  <span
                    className={`font-black text-sm ${
                      calculatedStockAfter < 0
                        ? 'text-rose-600'
                        : calculatedStockAfter === 0
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {calculatedStockAfter} {unitLabel}
                  </span>
                </div>
              </div>

              {isEditing && transactionToEdit && (
                <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
                  {isSameEditedItem ? (
                    quantity === oldEditQty ? (
                      <span>Jumlah keluar tetap ({oldEditQty} {unitLabel}) — stok katalog tidak berubah.</span>
                    ) : quantity < oldEditQty ? (
                      <span className="text-emerald-700 font-semibold">
                        Selisih +{oldEditQty - quantity} {unitLabel} akan otomatis dikembalikan ke Katalog Barang.
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold">
                        Tambahan -{quantity - oldEditQty} {unitLabel} akan dikurangi dari Katalog Barang (Maksimal keluar: {maxAllowedQty} {unitLabel}).
                      </span>
                    )
                  ) : (
                    <span className="text-blue-700 font-semibold">
                      Barang diganti: +{oldEditQty} {transactionToEdit.unit} ({transactionToEdit.itemName}) akan dikembalikan ke katalog, dan -{quantity} {unitLabel} dikurangi dari barang baru.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quantity & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah {isMasuk ? 'Diterima' : 'Dikeluarkan'}{' '}
                {unitLabel && `(${unitLabel})`} <span className="text-rose-500">*</span>
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
              {isMasuk ? 'Pemasok / Sumber Barang (Supplier / No PO)' : 'Bagian/Bidang'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                isMasuk
                  ? 'misal: PT Sinar Dunia (PO-2026/01)'
                  : 'misal: Bagian Umum'
              }
              value={sourceOrDestination}
              onChange={(e) => setSourceOrDestination(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
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
              disabled={isSubmitting}
              onClick={closeTransactionModal}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isEditing
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : isMasuk
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : isEditing
                  ? 'Simpan Perubahan'
                  : 'Simpan & Mutasi Stok'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
