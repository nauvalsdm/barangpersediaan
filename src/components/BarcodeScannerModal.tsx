import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Search,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Camera,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { InventoryItem } from '../types/inventory';
import { formatRupiah } from '../utils/formatters';

export const BarcodeScannerModal: React.FC = () => {
  const {
    isScannerOpen,
    setIsScannerOpen,
    items,
    setSelectedItemForDetail,
    openTransactionModal,
  } = useInventory();

  const [inputCode, setInputCode] = useState('');
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isScannerOpen) {
      setInputCode('');
      setMatchedItem(null);
      setHasSearched(false);
    } else {
      stopCamera();
    }
  }, [isScannerOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch {
      alert('Kamera tidak dapat diakses atau izin kamera ditolak. Silakan masukkan Kode SKU secara manual.');
      setIsCameraActive(false);
    }
  };

  if (!isScannerOpen) return null;

  const handleScan = (codeToScan?: string) => {
    const targetCode = (codeToScan !== undefined ? codeToScan : inputCode).trim().toUpperCase();
    if (!targetCode) return;

    setHasSearched(true);
    const found = items.find(
      (item) => item.sku.toUpperCase() === targetCode || item.id === targetCode
    );

    if (found) {
      setMatchedItem(found);
    } else {
      setMatchedItem(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsScannerOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                Pemindai Barcode & QR Persediaan
              </h2>
              <p className="text-xs text-slate-500">
                Pindai label SKU atau ketik barcode barang
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsScannerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Camera Simulation */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border-2 border-slate-800 shadow-inner">
            {isCameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">
                  Kamera Standby / Mode Scanner Barcode Gun
                </p>
                <button
                  onClick={startCamera}
                  className="mt-2.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Aktifkan Kamera Ponsel/Webcam</span>
                </button>
              </div>
            )}

            {/* Viewfinder crosshairs & Laser line */}
            <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-purple-400/60 rounded-xl pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
            </div>
          </div>

          {/* Manual Input & Barcode Gun Listener */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Input Kode SKU / Barcode Gun
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScan();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Ketik atau scan barcode (misal: KRT-A4-01)..."
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 font-mono font-bold text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                Cari SKU
              </button>
            </form>
          </div>

          {/* Quick SKU click samples for rapid testing */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
              Pintasan Coba SKU Barang:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(0, 5).map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    setInputCode(i.sku);
                    handleScan(i.sku);
                  }}
                  className="text-[11px] font-mono px-2 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  {i.sku}
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          {hasSearched && (
            <div className="pt-2">
              {matchedItem ? (
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          {matchedItem.sku}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">
                          {matchedItem.category}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mt-1">
                        {matchedItem.name}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-500 block">Stok Tersedia</span>
                      <span className="font-black text-lg text-slate-900">
                        {matchedItem.stock} {matchedItem.unit}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsScannerOpen(false);
                        setSelectedItemForDetail(matchedItem);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </button>

                    <button
                      onClick={() => {
                        setIsScannerOpen(false);
                        openTransactionModal('MASUK', matchedItem);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      Masuk
                    </button>

                    <button
                      onClick={() => {
                        setIsScannerOpen(false);
                        openTransactionModal('KELUAR', matchedItem);
                      }}
                      disabled={matchedItem.stock === 0}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs ${
                        matchedItem.stock === 0
                          ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-600'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Keluar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center text-xs text-rose-700">
                  <AlertCircle className="w-5 h-5 mx-auto mb-1 text-rose-500" />
                  <p className="font-bold">Barang tidak ditemukan!</p>
                  <p className="text-rose-600 mt-0.5">
                    Tidak ada barang dengan kode SKU &quot;{inputCode}&quot;.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
