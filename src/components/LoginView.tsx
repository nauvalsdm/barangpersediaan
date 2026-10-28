import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Boxes,
  Lock,
  User,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Building2,
  FileText,
  PackageMinus,
  Sparkles,
  Database,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users, isFirebaseConnected, checkFirebaseConnection } = useInventory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Otomatis pastikan Firebase Firestore terhubung saat halaman login dibuka
  useEffect(() => {
    if (!isFirebaseConnected) {
      setIsCheckingConnection(true);
      checkFirebaseConnection().finally(() => {
        setIsCheckingConnection(false);
      });
    }
  }, [isFirebaseConnected, checkFirebaseConnection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim()) {
      setErrorMessage('Silakan masukkan Username Anda.');
      return;
    }

    setIsLoading(true);

    // Pastikan Firebase terhubung sebelum login
    let connected = isFirebaseConnected;
    if (!connected) {
      setIsCheckingConnection(true);
      connected = await checkFirebaseConnection();
      setIsCheckingConnection(false);
    }

    if (!connected) {
      setIsLoading(false);
      setErrorMessage('Database cloud Firebase Firestore belum terhubung. Pastikan jaringan internet aktif lalu coba lagi.');
      return;
    }

    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message);
      } else {
        setSuccessMessage(res.message);
      }
    }, 250);
  };

  const handleSelectDemoAccount = (accUsername: string, accPassword = 'admin123') => {
    setUsername(accUsername);
    setPassword(accPassword);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/40 relative z-10">
        {/* Left / Info Panel (Enterprise / Gov Branding) */}
        <div className="lg:col-span-5 bg-linear-to-b from-blue-700 via-blue-800 to-slate-900 p-6 sm:p-8 text-white flex flex-col justify-between relative">
          <div>
            {/* Top Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                <Boxes className="w-7 h-7 text-blue-200" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-tight">InventarisKu</h1>
                <p className="text-xs text-blue-200 font-medium">Sistem Persediaan Barang</p>
              </div>
            </div>

            {/* Title & Desc */}
            <h2 className="text-2xl font-bold text-white mb-2 leading-snug">
              Portal Log In Sistem Pengelolaan Persediaan
            </h2>
            <p className="text-xs text-blue-100/90 leading-relaxed mb-6">
              Aplikasi pencatatan barang habis pakai, mutasi stok masuk dan keluar, serta stock opname persediaan instansi.
            </p>

            {/* SOP Role Division Callout */}
            <div className="space-y-3 bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-xs text-xs">
              <div className="font-semibold text-blue-100 flex items-center gap-1.5 pb-2 border-b border-white/10">
                <Building2 className="w-4 h-4 text-amber-300" />
                <span>Pembagian Kewenangan (SOP)</span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/30 text-blue-200 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">Akun Administrator</p>
                  <p className="text-[11px] text-blue-100/80 leading-normal">
                    Akses penuh master barang, persetujuan penerimaan, stock opname fisik, dan pengelolaan hak akses pengguna.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/30 text-emerald-200 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Akun PPNPN</span>
                    <span className="text-[10px] bg-emerald-400 text-emerald-950 font-black px-1.5 py-0.2 rounded">
                      Operasional
                    </span>
                  </p>
                  <p className="text-[11px] text-blue-100/80 leading-normal">
                    Kewenangan khusus mencatat pengeluaran barang (Barang Keluar) untuk melayani permintaan unit kerja.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-white/10 text-[11px] text-blue-200/70 flex items-center justify-between mt-6">
            <span>Versi Produksi v2.4</span>
            <span>Subbag Tata Usaha</span>
          </div>
        </div>

        {/* Right / Login Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-slate-50/50">
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Masuk ke Akun Anda</h3>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan kredensial akun terdaftar untuk mengakses modul persediaan.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="font-medium">{successMessage}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  USERNAME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-3 focus:ring-blue-100 outline-none transition-all text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-3 focus:ring-blue-100 outline-none transition-all text-slate-900 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>Ingat sesi di peramban ini</span>
                </label>
                <span className="text-slate-400 text-[11px]">Sesi aman terenkripsi</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[#0B3B70] hover:bg-[#082B52] active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 cursor-pointer uppercase tracking-wider"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>MASUK LAYANAN</span>
                )}
              </button>
            </form>

            {/* Admin Management Notice */}
            <div className="mt-4 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
              <div className="p-1 rounded-lg bg-blue-100/70 text-blue-700 shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penambahan akun pengguna dan reset kata sandi dikelola secara terpusat oleh{' '}
                <strong className="font-semibold text-slate-800">Administrator Bagian Umum</strong>.
              </p>
            </div>

            {/* Status Database Real Card */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 tracking-wide">
                  <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>STATUS DATABASE REAL:</span>
                </div>

                {isFirebaseConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Firebase Firestore Terhubung</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-300">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>{isCheckingConnection ? 'Memeriksa Koneksi...' : 'Menghubungkan Firestore...'}</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Gunakan Username & Password resmi pegawai atau akun Administrator terdaftar yang telah tersimpan di basis data cloud Firestore.
              </p>

              <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400">Sistem Otentikasi Terpusat</span>
                <span className="font-bold text-slate-800">Kanwil DJPb Riau</span>
              </div>
            </div>

            {/* Quick Demo Switcher Pills */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pilih Cepat Akun Demo (1-Klik)</span>
                </p>
                <span className="text-[10px] text-slate-400">Klik kartu untuk mengisi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Admin 1 */}
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount('admin', 'admin123')}
                  className={`p-2.5 text-left rounded-xl border transition-all text-xs flex items-center gap-2.5 ${
                    username === 'admin'
                      ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate text-[11px]">Ahmad Fauzi, S.E.</p>
                    <p className="text-[10px] text-blue-700 font-semibold truncate">
                      ADMIN • Full Akses
                    </p>
                  </div>
                </button>

                {/* Admin 2 */}
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount('rina.admin', 'admin123')}
                  className={`p-2.5 text-left rounded-xl border transition-all text-xs flex items-center gap-2.5 ${
                    username === 'rina.admin'
                      ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate text-[11px]">Rina Anggraini, S.Kom.</p>
                    <p className="text-[10px] text-indigo-700 font-semibold truncate">
                      ADMIN • Logistik
                    </p>
                  </div>
                </button>

                {/* PPNPN 1 */}
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount('ppnpn', 'ppnpn123')}
                  className={`p-2.5 text-left rounded-xl border transition-all text-xs flex items-center gap-2.5 ${
                    username === 'ppnpn'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <PackageMinus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate text-[11px]">Bambang Irawan</p>
                    <p className="text-[10px] text-emerald-700 font-semibold truncate">
                      PPNPN • Catat Keluar
                    </p>
                  </div>
                </button>

                {/* PPNPN 2 */}
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount('siti.ppnpn', 'ppnpn123')}
                  className={`p-2.5 text-left rounded-xl border transition-all text-xs flex items-center gap-2.5 ${
                    username === 'siti.ppnpn'
                      ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate text-[11px]">Siti Nurhaliza</p>
                    <p className="text-[10px] text-amber-700 font-semibold truncate">
                      PPNPN • Layanan ATK
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 text-center">
            <p className="text-[11px] text-slate-400">
              Sistem Persediaan Barang Habis Pakai • Subbag Tata Usaha & Rumah Tangga
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
