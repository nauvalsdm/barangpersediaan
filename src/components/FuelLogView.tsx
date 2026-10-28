import React, { useState } from 'react';
import {
  Fuel,
  Plus,
  Calendar,
  User,
  Car,
  Gauge,
  Droplets,
  Banknote,
  Search,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  RotateCcw,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { VEHICLE_LIST, FuelLogRecord } from '../types/inventory';
import { formatRupiah, formatNumber, formatDateIndo } from '../utils/formatters';

export const FuelLogView: React.FC = () => {
  const {
    fuelLogs,
    addFuelLog,
    updateFuelLog,
    deleteFuelLog,
    exportFuelLogsToCSV,
    currentUser,
    users,
  } = useInventory();

  const todayStr = new Date().toISOString().slice(0, 10);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [officerName, setOfficerName] = useState<string>(currentUser.name);
  const [date, setDate] = useState<string>(todayStr);
  const [vehicleName, setVehicleName] = useState<string>(VEHICLE_LIST[0]);
  const [totalRupiah, setTotalRupiah] = useState<string>('');
  const [totalLiters, setTotalLiters] = useState<string>('');
  const [odometerKm, setOdometerKm] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVehicle, setFilterVehicle] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setOfficerName(currentUser.name);
    setDate(todayStr);
    setVehicleName(VEHICLE_LIST[0]);
    setTotalRupiah('');
    setTotalLiters('');
    setOdometerKm('');
    setNotes('');
    setFormError('');
  };

  const handleEdit = (record: FuelLogRecord) => {
    setEditingId(record.id);
    setOfficerName(record.officerName);
    setDate(record.date.slice(0, 10));
    setVehicleName(record.vehicleName);
    setTotalRupiah(String(record.totalRupiah));
    setTotalLiters(String(record.totalLiters));
    setOdometerKm(String(record.odometerKm));
    setNotes(record.notes || '');
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!officerName.trim()) {
      setFormError('Nama Petugas wajib diisi.');
      return;
    }
    if (!date) {
      setFormError('Tanggal Pengisian wajib dipilih.');
      return;
    }
    if (!vehicleName) {
      setFormError('Nama Kendaraan wajib dipilih.');
      return;
    }

    const rupiahNum = Number(totalRupiah);
    const litersNum = Number(totalLiters);
    const odometerNum = Number(odometerKm);

    if (!totalRupiah || isNaN(rupiahNum) || rupiahNum <= 0) {
      setFormError('Total Rupiah harus diisi dengan angka lebih dari 0.');
      return;
    }
    if (!totalLiters || isNaN(litersNum) || litersNum <= 0) {
      setFormError('Total Liter harus diisi dengan angka lebih dari 0.');
      return;
    }
    if (!odometerKm || isNaN(odometerNum) || odometerNum < 0) {
      setFormError('Odometer (KM) harus diisi dengan angka yang valid.');
      return;
    }

    if (editingId) {
      updateFuelLog(editingId, {
        officerName: officerName.trim(),
        date,
        vehicleName,
        totalRupiah: rupiahNum,
        totalLiters: litersNum,
        odometerKm: odometerNum,
        notes: notes.trim() || undefined,
      });
      setSuccessMsg('Data pengisian BBM berhasil diperbarui.');
    } else {
      addFuelLog({
        officerName: officerName.trim(),
        date,
        vehicleName,
        totalRupiah: rupiahNum,
        totalLiters: litersNum,
        odometerKm: odometerNum,
        notes: notes.trim() || undefined,
      });
      setSuccessMsg('Data pengisian BBM berhasil disimpan.');
    }

    resetForm();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Filtered logs
  const filteredLogs = fuelLogs.filter((log) => {
    const matchesSearch =
      !searchQuery.trim() ||
      log.officerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVehicle = filterVehicle === 'ALL' || log.vehicleName === filterVehicle;
    const matchesDate = !filterDate || log.date.slice(0, 10) === filterDate;

    return matchesSearch && matchesVehicle && matchesDate;
  });

  // Summary metrics
  const totalSpendRupiah = filteredLogs.reduce((sum, item) => sum + item.totalRupiah, 0);
  const totalVolumeLiters = filteredLogs.reduce((sum, item) => sum + item.totalLiters, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Pengisian BBM Kendaraan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Pencatatan pemakaian bahan bakar minyak (BBM), odometer, dan biaya operasional kendaraan dinas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportFuelLogsToCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pengisian
            </p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">
              {formatNumber(filteredLogs.length)} <span className="text-xs font-normal text-slate-500">Kali</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Rupiah BBM
            </p>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
              {formatRupiah(totalSpendRupiah)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Konsumsi Liter
            </p>
            <p className="text-xl font-extrabold text-blue-700 mt-0.5">
              {totalVolumeLiters.toLocaleString('id-ID', { maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-normal text-slate-500">Liter</span>
            </p>
          </div>
        </div>
      </div>

      {/* Form Input Pengisian BBM */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center">
              {editingId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {editingId ? 'Edit Data Pengisian BBM' : 'Form Input Pengisian BBM'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Lengkapi rincian petugas, tanggal, kendaraan, nominal rupiah, liter, dan odometer.
              </p>
            </div>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batal Edit</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError('')} className="text-rose-500 hover:text-rose-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Nama Petugas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Petugas <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  list="petugas-list"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Masukkan nama petugas..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
                <datalist id="petugas-list">
                  {users.map((u) => (
                    <option key={u.id} value={u.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* 2. Pilihan Tanggal Pengisian */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Pengisian <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            {/* 3. Pilihan Nama Kendaraan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilihan Nama Kendaraan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Car className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 focus:bg-white text-sm font-semibold text-slate-900 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                >
                  {VEHICLE_LIST.map((vehicle) => (
                    <option key={vehicle} value={vehicle}>
                      {vehicle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Total Rupiah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Rupiah (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Banknote className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={totalRupiah}
                  onChange={(e) => setTotalRupiah(e.target.value)}
                  placeholder="Contoh: 350000"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>
              {totalRupiah && Number(totalRupiah) > 0 && (
                <p className="text-[11px] font-semibold text-emerald-600 mt-1">
                  Senilai: {formatRupiah(Number(totalRupiah))}
                </p>
              )}
            </div>

            {/* 5. Total Liter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Liter <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Droplets className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalLiters}
                  onChange={(e) => setTotalLiters(e.target.value)}
                  placeholder="Contoh: 25.5"
                  className="w-full pl-9 pr-14 py-2.5 bg-slate-50 focus:bg-white text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Liter
                </span>
              </div>
            </div>

            {/* 6. Odometer (KM) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Odometer (KM) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Gauge className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  placeholder="Contoh: 24500"
                  className="w-full pl-9 pr-12 py-2.5 bg-slate-50 focus:bg-white text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  KM
                </span>
              </div>
            </div>
          </div>

          {/* Keterangan Tambahan & Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan / Keperluan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Perjalanan dinas luar kota / Operasional kantor..."
                className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Simpan Perubahan' : 'Simpan Pengisian BBM'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter & Riwayat Tabel Pengisian BBM */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat Pengisian BBM</h3>
            <p className="text-xs text-slate-500">
              Daftar catatan pengisian BBM seluruh kendaraan operasional
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari petugas / kendaraan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Vehicle Filter */}
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">Semua Kendaraan ({VEHICLE_LIST.length})</option>
              {VEHICLE_LIST.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-700 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 focus:outline-none"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-100"
                  title="Reset Tanggal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Tanggal Pengisian</th>
                <th className="py-3 px-4">Nama Petugas</th>
                <th className="py-3 px-4">Nama Kendaraan</th>
                <th className="py-3 px-4 text-right">Odometer (KM)</th>
                <th className="py-3 px-4 text-right">Total Liter</th>
                <th className="py-3 px-4 text-right">Total Rupiah</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Fuel className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Belum ada data pengisian BBM</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Silakan isi formulir di atas untuk mencatat pengisian BBM kendaraan.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{formatDateIndo(log.date)}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{log.referenceNo}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{log.officerName}</div>
                      {log.notes && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{log.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200/60">
                        <Car className="w-3.5 h-3.5 text-orange-600" />
                        {log.vehicleName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {formatNumber(log.odometerKm)} KM
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-blue-700 whitespace-nowrap">
                      {log.totalLiters.toLocaleString('id-ID', { maximumFractionDigits: 2 })} L
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                      {formatRupiah(log.totalRupiah)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {confirmDeleteId === log.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              deleteFuelLog(log.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 cursor-pointer"
                          >
                            Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-300 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(log)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(log.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
