import React, { useState, useEffect } from 'react';
import { X, Sparkles, Package, AlertCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { INITIAL_UNITS } from '../data/initialData';

export const ItemFormModal: React.FC = () => {
  const {
    itemFormState,
    closeItemForm,
    addItem,
    updateItem,
    categories,
    addCategory,
  } = useInventory();

  const isEditing = Boolean(itemFormState.itemToEdit);
  const existing = itemFormState.itemToEdit;

  // Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // New category inline adder
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (existing) {
      setSku(existing.sku);
      setName(existing.name);
      setCategory(existing.category);
      setUnit(existing.unit);
      setStock(existing.stock);
      setMinStock(existing.minStock);
      setUnitPrice(existing.unitPrice);
      setSupplier(existing.supplier || '');
      setDescription(existing.description || '');
    } else {
      // Defaults for new item
      const randomCode = Math.floor(100 + Math.random() * 900);
      setSku(`BRG-${randomCode}`);
      setName('');
      setCategory(categories[0] || 'ATK & Kertas');
      setUnit(INITIAL_UNITS[0] || 'Pcs');
      setStock(0);
      setMinStock(5);
      setUnitPrice(0);
      setSupplier('');
      setDescription('');
    }
    setError(null);
  }, [existing, categories]);

  if (!itemFormState.isOpen) return null;

  const handleGenerateSKU = () => {
    const prefix = category ? category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') : 'BRG';
    const num = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${num}`);
  };

  const handleSaveNewCategory = () => {
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setCategory(newCatName.trim());
      setNewCatName('');
      setShowNewCatInput(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      setError('Kode SKU barang wajib diisi.');
      return;
    }
    if (!name.trim()) {
      setError('Nama barang wajib diisi.');
      return;
    }
    if (!category.trim()) {
      setError('Kategori barang wajib dipilih.');
      return;
    }

    if (isEditing && existing) {
      updateItem(existing.id, {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        unit,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        unitPrice: Number(unitPrice) || 0,
        supplier: supplier.trim(),
        description: description.trim(),
      });
    } else {
      addItem({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        unit,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        unitPrice: Number(unitPrice) || 0,
        supplier: supplier.trim(),
        description: description.trim(),
      });
    }

    closeItemForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={closeItemForm}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                {isEditing ? 'Ubah Data Barang Persediaan' : 'Tambah Barang Persediaan Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Perbarui informasi spesifikasi barang' : 'Daftarkan SKU dan data persediaan ke sistem'}
              </p>
            </div>
          </div>
          <button
            onClick={closeItemForm}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Row 1: SKU & Generate Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kode SKU / Barcode <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="misal: ATK-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm bg-slate-50 font-mono font-bold text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateSKU}
                  title="Generate SKU Acak"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Auto</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Barang Persediaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="misal: Kertas HVS A4 80gr"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCatInput((v) => !v)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                >
                  + Kategori Baru
                </button>
              </div>

              {showNewCatInput ? (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nama kategori..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-300 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewCategory}
                    className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                  >
                    Simpan
                  </button>
                </div>
              ) : null}

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Satuan Ukuran <span className="text-rose-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                {INITIAL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Supplier */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pemasok / Vendor Langganan
            </label>
            <input
              type="text"
              placeholder="misal: PT Sarana Grafika"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Row 4: Stocks & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isEditing ? 'Stok Saat Ini' : 'Stok Awal'} ({unit})
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 text-sm bg-white font-bold text-slate-900 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Minimum (Safety Stock)
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 text-sm bg-white font-bold text-amber-700 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Satuan (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 text-sm bg-white font-bold text-emerald-700 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Deskripsi & Catatan Spesifikasi
            </label>
            <textarea
              rows={2}
              placeholder="Catatan ukuran, merk, fungsi, atau instruksi penyimpanan khusus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={closeItemForm}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all"
            >
              {isEditing ? 'Simpan Perubahan' : 'Daftarkan Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
