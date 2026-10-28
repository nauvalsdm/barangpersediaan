import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  QrCode,
  Search,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  SwitchCamera,
  Plus,
  Barcode,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
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
    openItemForm,
    isAdmin,
  } = useInventory();

  // Mode: 'camera' | 'upload' | 'manual'
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [inputCode, setInputCode] = useState('');
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [scannedRawCode, setScannedRawCode] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Beep sound on detection
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(80);
      }
    } catch {
      // Ignore audio context autoplay restrictions
    }
  }, [soundEnabled]);

  // Intelligent SKU / Item matching
  const findItemByCode = useCallback(
    (code: string): InventoryItem | null => {
      let target = code.trim();
      if (!target) return null;

      // 1. If JSON payload: { "sku": "...", "id": "..." }
      if (target.startsWith('{') && target.endsWith('}')) {
        try {
          const parsed = JSON.parse(target);
          if (parsed.sku) target = String(parsed.sku).trim();
          else if (parsed.id) target = String(parsed.id).trim();
        } catch {
          // not json
        }
      }

      // 2. If URL format: https://...?sku=KRT-A4-01 or ...#item-1
      if (target.includes('http://') || target.includes('https://') || target.includes('?sku=')) {
        try {
          const url = new URL(target, window.location.origin);
          const qSku = url.searchParams.get('sku');
          const qId = url.searchParams.get('id');
          if (qSku) target = qSku.trim();
          else if (qId) target = qId.trim();
          else if (url.hash) target = url.hash.replace('#', '').trim();
        } catch {
          // not URL
        }
      }

      const cleanUpper = target.toUpperCase().replace(/\s+/g, '');

      // Check exact SKU match
      let found = items.find((i) => i.sku.toUpperCase().replace(/\s+/g, '') === cleanUpper);
      if (found) return found;

      // Check exact ID match
      found = items.find((i) => i.id.toUpperCase() === cleanUpper);
      if (found) return found;

      // Check partial / contains SKU match
      found = items.find(
        (i) =>
          cleanUpper.includes(i.sku.toUpperCase().replace(/\s+/g, '')) ||
          i.sku.toUpperCase().replace(/\s+/g, '').includes(cleanUpper)
      );
      if (found) return found;

      // Check item name match
      found = items.find((i) => i.name.toUpperCase().includes(cleanUpper));
      if (found) return found;

      return null;
    },
    [items]
  );

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error clearing scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Process decoded code
  const handleDecodedText = useCallback(
    (decodedText: string) => {
      const clean = decodedText.trim();
      if (!clean) return;

      playBeep();
      setScannedRawCode(clean);
      setInputCode(clean);
      setHasScanned(true);

      const found = findItemByCode(clean);
      setMatchedItem(found);

      // Temporarily stop camera so user can inspect and act
      stopCamera();
    },
    [findItemByCode, playBeep, stopCamera]
  );

  // Start camera helper
  const startCamera = useCallback(async (cameraIdToUse?: string) => {
    setCameraError(null);
    try {
      // Ensure element exists in DOM
      const readerElem = document.getElementById('qr-scanner-viewport');
      if (!readerElem) return;

      // Stop previous instance if any
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {
          // ignore
        }
        scannerRef.current = null;
      }

      // Query available video devices
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
      }

      const targetCamera = cameraIdToUse || (devices && devices.length > 0 ? devices[0].id : { facingMode: 'environment' });

      const scanner = new Html5Qrcode('qr-scanner-viewport', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        targetCamera,
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.max(180, Math.floor(minEdge * 0.72));
            return { width: edge, height: edge };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // frame not containing barcode, normal
        }
      );

      if (isMountedRef.current) {
        setIsCameraActive(true);
        if (typeof targetCamera === 'string') {
          setSelectedCameraId(targetCamera);
        }
      }
    } catch (err: any) {
      console.error('Camera start error:', err);
      if (isMountedRef.current) {
        setCameraError(
          err?.message ||
            'Kamera tidak dapat diakses atau izin kamera ditolak oleh browser. Anda dapat menggunakan mode "Unggah Gambar" atau ketik SKU.'
        );
        setIsCameraActive(false);
      }
    }
  }, [handleDecodedText]);

  // Switch camera front/back
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    startCamera(nextCamera.id);
  };

  // Image file scan
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError(null);

    try {
      // Create temporary scanner instance if not present
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode('qr-scanner-viewport-hidden');
      }

      const decodedText = await scanner.scanFile(file, false);
      handleDecodedText(decodedText);
    } catch (err: any) {
      console.warn('File scan error:', err);
      setCameraError('Tidak ditemukan Barcode atau QR Code yang valid pada gambar tersebut. Coba gunakan foto yang lebih jelas atau tegak lurus.');
    } finally {
      setIsProcessingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    if (isScannerOpen) {
      setInputCode('');
      setMatchedItem(null);
      setScannedRawCode('');
      setHasScanned(false);
      setCameraError(null);

      if (scanMode === 'camera') {
        const timer = setTimeout(() => {
          startCamera();
        }, 150);
        return () => clearTimeout(timer);
      }
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isScannerOpen, scanMode, startCamera, stopCamera]);

  if (!isScannerOpen) return null;

  // Handle manual input search
  const handleManualSearch = (codeToSearch?: string) => {
    const target = (codeToSearch !== undefined ? codeToSearch : inputCode).trim();
    if (!target) return;

    playBeep();
    setScannedRawCode(target);
    setHasScanned(true);
    const found = findItemByCode(target);
    setMatchedItem(found);
  };

  const handleResetScanner = () => {
    setInputCode('');
    setMatchedItem(null);
    setScannedRawCode('');
    setHasScanned(false);
    setCameraError(null);
    if (scanMode === 'camera') {
      startCamera();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Hidden container for file scan processing */}
      <div id="qr-scanner-viewport-hidden" className="hidden" />

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          stopCamera();
          setIsScannerOpen(false);
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5 text-purple-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  Pemindai Barcode & QR Persediaan
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pindai label barang dari kamera, file foto, atau barcode gun USB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Bunyi Deteksi Aktif' : 'Bunyi Deteksi Senyap'}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Close */}
            <button
              onClick={() => {
                stopCamera();
                setIsScannerOpen(false);
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-4 pt-2 gap-1.5">
          <button
            onClick={() => {
              setScanMode('camera');
              setCameraError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              scanMode === 'camera'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Kamera Langsung
          </button>

          <button
            onClick={() => {
              stopCamera();
              setScanMode('upload');
              setCameraError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              scanMode === 'upload'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Unggah Foto Barcode
          </button>

          <button
            onClick={() => {
              stopCamera();
              setScanMode('manual');
              setCameraError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              scanMode === 'manual'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            Barcode Gun / Manual
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* CAMERA MODE */}
          {scanMode === 'camera' && !hasScanned && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square sm:aspect-4/3 flex flex-col items-center justify-center border-2 border-slate-800 shadow-inner">
                {/* HTML5 QR Code Container */}
                <div
                  id="qr-scanner-viewport"
                  className="w-full h-full flex items-center justify-center overflow-hidden"
                />

                {/* Crosshairs & Scanning Laser Overlay */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-dashed border-purple-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-purple-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-purple-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-purple-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-purple-400 rounded-br-lg" />

                      {/* Moving Laser Line */}
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_rgba(244,63,94,0.9)] absolute top-1/2 -translate-y-1/2 animate-pulse" />
                    </div>

                    <div className="absolute bottom-3 px-3 py-1 bg-slate-900/80 backdrop-blur-xs rounded-full text-[11px] text-white font-medium flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Arahkan kamera ke QR Code atau Barcode barang</span>
                    </div>
                  </div>
                )}

                {/* Standby / Permission error overlay */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white z-10">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-purple-400 flex items-center justify-center mb-3">
                      <Camera className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm mb-1">Kamera Belum Aktif</h4>
                    <p className="text-xs text-slate-400 max-w-xs mb-4">
                      Izinkan browser mengakses webcam atau kamera ponsel Anda untuk memindai barcode fisik secara langsung.
                    </p>
                    <button
                      onClick={() => startCamera()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Mulai Pemindaian Kamera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Controls Bar */}
              {isCameraActive && (
                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-800">Kamera Aktif & Memindai...</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {cameras.length > 1 && (
                      <button
                        onClick={handleSwitchCamera}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <SwitchCamera className="w-3.5 h-3.5 text-purple-600" />
                        <span>Ganti Kamera</span>
                      </button>
                    )}
                    <button
                      onClick={stopCamera}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      Jeda
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD IMAGE MODE */}
          {scanMode === 'upload' && !hasScanned && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50/80 rounded-2xl p-8 text-center cursor-pointer transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Pilih Foto / Gambar Barcode
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  Unggah gambar atau screenshot label persediaan, faktur, stiker SKU, atau QR code barang (PNG, JPG, JPEG, WebP).
                </p>
                <button
                  type="button"
                  disabled={isProcessingFile}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isProcessingFile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Membaca Kode...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Pilih File dari Perangkat</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* MANUAL / BARCODE GUN MODE */}
          {(scanMode === 'manual' || !hasScanned) && (
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ketik Kode SKU / Pindai dengan Barcode Gun USB
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleManualSearch();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Scan barcode gun atau ketik misal: KRT-A4-01..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 font-mono font-bold text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Cari SKU
                </button>
              </form>
            </div>
          )}

          {/* Error Message */}
          {cameraError && (
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Informasi Pemindaian:</p>
                <p className="mt-0.5">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Quick SKU Test Chips */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Pintasan Coba SKU (Klik untuk simulasi scan):</span>
              <span className="text-[10px] text-purple-700 font-bold">{items.length} SKU Terdaftar</span>
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
              {items.slice(0, 8).map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    setInputCode(i.sku);
                    handleManualSearch(i.sku);
                  }}
                  className="text-[11px] font-mono px-2.5 py-1 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer shadow-2xs font-semibold"
                >
                  {i.sku}
                </button>
              ))}
            </div>
          </div>

          {/* SCAN RESULT CARD */}
          {hasScanned && (
            <div className="pt-2 border-t border-slate-200/80 animate-in fade-in duration-200">
              {matchedItem ? (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border-2 border-emerald-300 space-y-3.5 shadow-sm">
                  {/* Status Tag */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Barcode Ditemukan & Cocok</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      Raw: {scannedRawCode}
                    </span>
                  </div>

                  {/* Item Details */}
                  <div className="flex items-start justify-between gap-3 bg-white p-3.5 rounded-xl border border-emerald-200">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          {matchedItem.sku}
                        </span>
                        <span className="text-xs text-slate-600 font-medium px-2 py-0.5 rounded bg-slate-100">
                          {matchedItem.category}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mt-1.5">
                        {matchedItem.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Harga: {formatRupiah(matchedItem.unitPrice)} / {matchedItem.unit}
                      </p>
                    </div>

                    <div className="text-right shrink-0 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Stok Fisik
                      </span>
                      <span className="font-black text-xl text-emerald-900 block leading-tight">
                        {matchedItem.stock}
                      </span>
                      <span className="text-[11px] text-slate-600 font-semibold">
                        {matchedItem.unit}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      onClick={handleResetScanner}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                      <span>Pindai Ulang</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsScannerOpen(false);
                          setSelectedItemForDetail(matchedItem);
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-200" />
                        <span>Detail</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsScannerOpen(false);
                          openTransactionModal('MASUK', matchedItem);
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Catat Masuk</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsScannerOpen(false);
                          openTransactionModal('KELUAR', matchedItem);
                        }}
                        disabled={matchedItem.stock === 0}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors ${
                          matchedItem.stock === 0
                            ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-600'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Catat Keluar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50/90 rounded-2xl border border-rose-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Barang Tidak Ditemukan</h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Kode barcode &quot;<span className="font-mono font-bold">{scannedRawCode}</span>&quot; belum terdaftar dalam katalog persediaan kantor.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      onClick={handleResetScanner}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                      <span>Pindai Ulang</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsScannerOpen(false);
                          openItemForm({
                            id: '',
                            sku: scannedRawCode,
                            name: '',
                            category: 'Alat Tulis & Kantor',
                            unit: 'Pcs',
                            stock: 0,
                            minStock: 5,
                            unitPrice: 0,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          });
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Daftarkan Barang Baru</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Format: QR Code, Code 128, Code 39, EAN-13, UPC
          </span>
          <button
            onClick={() => {
              stopCamera();
              setIsScannerOpen(false);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
