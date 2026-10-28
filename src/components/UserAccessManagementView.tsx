import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  Lock,
  KeyRound,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Info,
  Check,
  X,
  Fuel,
  ArrowUpDown,
  Download,
  Database,
  ShieldAlert,
  Package,
  Tags,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { UserProfile, UserRole } from '../types/inventory';

export const UserAccessManagementView: React.FC = () => {
  const {
    currentUser,
    users,
    isAdmin,
    switchUserById,
    addUser,
    updateUser,
    deleteUser,
    resetUsersToDefault,
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
    isFirebaseConnected,
    setActiveTab,
    transactions,
  } = useInventory();

  // Active sub-tab
  const [subTab, setSubTab] = useState<'directory' | 'matrix' | 'audit' | 'reset-data'>('directory');
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Filters for user directory
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState<{
    name: string;
    role: UserRole;
    roleTitle: string;
    username: string;
    department: string;
    nip: string;
    status: 'ACTIVE' | 'INACTIVE';
    avatarColor: string;
    password?: string;
  }>({
    password: '',
    name: '',
    role: 'PPNPN',
    roleTitle: '',
    username: '',
    department: 'Subbagian TURT Kanwil DJPb Riau',
    nip: '',
    status: 'ACTIVE',
    avatarColor: 'bg-emerald-600',
  });

  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedAuditOfficer, setSelectedAuditOfficer] = useState<string>('ALL');

  // Available avatar colors
  const avatarColors = [
    { label: 'Biru Utama', value: 'bg-blue-600' },
    { label: 'Indigo / Ungu', value: 'bg-indigo-600' },
    { label: 'Emerald / Hijau', value: 'bg-emerald-600' },
    { label: 'Amber / Oranye', value: 'bg-amber-600' },
    { label: 'Rose / Merah', value: 'bg-rose-600' },
    { label: 'Slate / Abu', value: 'bg-slate-700' },
  ];

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      role: 'PPNPN',
      roleTitle: 'PPNPN - Petugas Distribusi & Pengeluaran Barang',
      username: '',
      department: 'Layanan Operasional & Gudang Persediaan',
      nip: '',
      status: 'ACTIVE',
      avatarColor: 'bg-emerald-600',
      password: 'ppnpn123',
    });
    setFormFeedback(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      role: user.role,
      roleTitle: user.roleTitle,
      username: user.username,
      department: user.department,
      nip: user.nip || '',
      status: user.status || 'ACTIVE',
      avatarColor: user.avatarColor || (user.role === 'ADMIN' ? 'bg-blue-600' : 'bg-emerald-600'),
      password: user.password || '',
    });
    setFormFeedback(null);
    setIsModalOpen(true);
  };

  // Submit create or edit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.username.trim()) {
      setFormFeedback({ type: 'error', message: 'Nama lengkap dan username wajib diisi.' });
      return;
    }

    if (editingUserId) {
      const res = updateUser(editingUserId, {
        name: formData.name.trim(),
        role: formData.role,
        roleTitle: formData.roleTitle.trim() || (formData.role === 'ADMIN' ? 'Administrator Persediaan' : 'PPNPN - Petugas Barang Keluar'),
        username: formData.username.trim(),
        department: formData.department.trim(),
        nip: formData.nip.trim(),
        status: formData.status,
        avatarColor: formData.avatarColor,
        ...(formData.password?.trim() ? { password: formData.password.trim() } : {}),
      });

      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormFeedback({ type: 'error', message: res.message });
      }
    } else {
      const res = addUser({
        name: formData.name.trim(),
        role: formData.role,
        roleTitle: formData.roleTitle.trim() || (formData.role === 'ADMIN' ? 'Administrator Persediaan' : 'PPNPN - Petugas Barang Keluar'),
        username: formData.username.trim(),
        department: formData.department.trim(),
        nip: formData.nip.trim(),
        status: formData.status,
        avatarColor: formData.avatarColor,
        ...(formData.password?.trim() ? { password: formData.password.trim() } : {}),
      });

      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormFeedback({ type: 'error', message: res.message });
      }
    }
  };

  // Delete user handler
  const handleDeleteUser = (user: UserProfile) => {
    if (user.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan.');
      return;
    }

    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus akun "${user.name}" (${user.role})? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      const res = deleteUser(user.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.nip && u.nip.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || (u.status || 'ACTIVE') === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const ppnpnCount = users.filter((u) => u.role === 'PPNPN').length;
  const activeCount = users.filter((u) => (u.status || 'ACTIVE') === 'ACTIVE').length;

  // Filtered audit transactions
  const officerNames = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach((t) => {
      if (t.recipientOrSignee) list.add(t.recipientOrSignee);
    });
    return Array.from(list);
  }, [transactions]);

  const auditTransactions = useMemo(() => {
    if (selectedAuditOfficer === 'ALL') return transactions;
    return transactions.filter((t) => t.recipientOrSignee === selectedAuditOfficer);
  }, [transactions, selectedAuditOfficer]);

  // If accessed by non-admin
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Halaman Terproteksi Administrator</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Menu Pengelolaan Akses Admin hanya dapat diakses oleh pengguna dengan peran <strong>ADMIN</strong>. 
          Anda saat ini login sebagai <strong>{currentUser.name} (PPNPN)</strong> dengan kewenangan khusus pencatatan barang keluar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setActiveTab('stock-out')}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Buka Pencatatan Barang Keluar &rarr;
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  Pengelolaan Akses Admin & Pengguna
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Akses Khusus Admin
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kelola akun pengguna persediaan, matriks kewenangan peran (Admin & PPNPN), serta audit aktivitas pencatatan barang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Reset data pengguna ke setelan awal default? Akun kustom akan dikembalikan ke data awal.')) {
                  resetUsersToDefault();
                }
              }}
              title="Reset Pengguna ke Default"
              className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Total Pengguna</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{users.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Akun terdaftar sistem</p>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80">
            <div className="flex items-center justify-between text-blue-700 text-xs font-semibold mb-1">
              <span>Administrator</span>
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-blue-900">{adminCount}</p>
            <p className="text-[11px] text-blue-600/80 mt-0.5">Akses penuh sistem & opname</p>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-1">
              <span>Petugas PPNPN</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-950">{ppnpnCount}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Kewenangan catat barang keluar</p>
          </div>

          <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-200/80">
            <div className="flex items-center justify-between text-teal-700 text-xs font-semibold mb-1">
              <span>Akun Aktif</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-teal-900">{activeCount}</p>
            <p className="text-[11px] text-teal-600 mt-0.5">Siap digunakan operasional</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('directory')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === 'directory'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Pengguna ({users.length})</span>
        </button>

        <button
          onClick={() => setSubTab('matrix')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === 'matrix'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Matriks Hak Akses Peran</span>
        </button>

        <button
          onClick={() => setSubTab('audit')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === 'audit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Audit Aktivitas Petugas</span>
        </button>

        <button
          onClick={() => setSubTab('reset-data')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === 'reset-data'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset & Pemulihan Data</span>
        </button>
      </div>

      {/* SUBTAB 1: DAFTAR PENGGUNA */}
      {subTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, username, NIP, atau unit kerja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 text-xs sm:text-sm text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">Semua Peran</option>
                <option value="ADMIN">Administrator</option>
                <option value="PPNPN">Petugas PPNPN</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Pengguna & Akun</th>
                  <th className="py-3 px-4">Peran & Kewenangan</th>
                  <th className="py-3 px-4">Unit Kerja & NIP</th>
                  <th className="py-3 px-4">Status & Login Terakhir</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada pengguna yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isUserAdmin = user.role === 'ADMIN';
                    const isCurrent = user.id === currentUser.id;

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCurrent ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl ${
                                user.avatarColor || (isUserAdmin ? 'bg-blue-600' : 'bg-emerald-600')
                              } text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                                {isCurrent && (
                                  <span className="text-[10px] font-black px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                                    Aktif Saat Ini
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">@{user.username}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                              isUserAdmin
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {isUserAdmin ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            <span>{user.role}</span>
                          </span>
                          <p className="text-[11px] text-slate-500 font-medium mt-1">
                            {user.roleTitle}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {isUserAdmin ? 'Akses Penuh Master & Opname' : 'Khusus Pencatatan Barang Keluar'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="text-slate-800 font-medium">{user.department}</p>
                          {user.nip ? (
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID/NIP: {user.nip}</p>
                          ) : (
                            <p className="text-[11px] text-slate-400 mt-0.5">-</p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                user.status === 'INACTIVE' ? 'bg-slate-300' : 'bg-emerald-500'
                              }`}
                            />
                            <span
                              className={`font-semibold ${
                                user.status === 'INACTIVE' ? 'text-slate-400' : 'text-emerald-700'
                              }`}
                            >
                              {user.status === 'INACTIVE' ? 'Nonaktif' : 'Aktif'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Login: {user.lastLogin || 'Hari ini'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Pengguna"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!isCurrent && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Tidak ada data pengguna yang sesuai.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isUserAdmin = user.role === 'ADMIN';
                const isCurrent = user.id === currentUser.id;

                return (
                  <div
                    key={user.id}
                    className={`bg-white rounded-2xl p-4 border shadow-xs ${
                      isCurrent ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${
                            user.avatarColor || (isUserAdmin ? 'bg-blue-600' : 'bg-emerald-600')
                          } text-white font-bold flex items-center justify-center text-sm shadow-xs`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                            {isCurrent && (
                              <span className="text-[10px] font-black px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">@{user.username}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          isUserAdmin
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
                      <p className="text-slate-700 font-medium">{user.roleTitle}</p>
                      <p className="text-slate-500">{user.department}</p>
                      {user.nip && <p className="text-slate-400 font-mono text-[11px]">NIP/ID: {user.nip}</p>}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            user.status === 'INACTIVE' ? 'bg-slate-300' : 'bg-emerald-500'
                          }`}
                        />
                        <span>{user.status === 'INACTIVE' ? 'Nonaktif' : 'Aktif'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: MATRIKS HAK AKSES */}
      {subTab === 'matrix' && (
        <div className="space-y-6">
          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Tabel Perbandingan Hak Akses Peran
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian izin operasi sistem yang membedakan peran Administrator dan Petugas PPNPN.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Fitur / Tindakan Operasional</th>
                    <th className="py-3 px-4 text-center w-36 bg-blue-50/30">
                      <div className="font-bold text-blue-900">ADMINISTRATOR</div>
                      <div className="text-[10px] text-blue-600 lowercase font-normal">(pengelola bmn)</div>
                    </th>
                    <th className="py-3 px-4 text-center w-36 bg-emerald-50/30">
                      <div className="font-bold text-emerald-900">PETUGAS PPNPN</div>
                      <div className="text-[10px] text-emerald-700 lowercase font-normal">(operasional gudang)</div>
                    </th>
                    <th className="py-3 px-4">Keterangan & Landasan Prosedur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Row 1: Barang Keluar */}
                  <tr className="bg-emerald-50/20">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">Pencatatan Barang Keluar (Distribusi)</div>
                      <div className="text-[11px] text-slate-500">Mencatat pengeluaran barang untuk permintaan divisi/subbag</div>
                    </td>
                    <td className="py-3.5 px-4 text-center bg-blue-50/20">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Diizinkan
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center bg-emerald-50/40">
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-black bg-emerald-200 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> KEWENANGAN UTAMA
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                      PPNPN melayani langsung permintaan ATK/barang unit kerja di loket gudang dan mencatat serah terima bukti barang keluar secara real-time.
                    </td>
                  </tr>

                  {/* Row 2: Barang Masuk */}
                  <tr>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">Pencatatan Barang Masuk (Penerimaan)</div>
                      <div className="text-[11px] text-slate-500">Menerima barang dari rekanan/supplier berdasarkan SPK/PO</div>
                    </td>
                    <td className="py-3.5 px-4 text-center bg-blue-50/20">
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Diizinkan
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                        <X className="w-3.5 h-3.5" /> Dibatasi
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                      Barang masuk terkait verifikasi kontrak pengadaan, faktur harga satuan, dan penerimaan BAST yang menjadi tanggung jawab Pejabat Pengadaan / Admin BMN.
                    </td>
                  </tr>

                  {/* Row 3: Master Barang */}
                  <tr>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">Kelola Master Data Barang Persediaan</div>
                      <div className="text-[11px] text-slate-500">Tambah barang baru, ubah nama, harga satuan, SKU, batas minimum</div>
                    </td>
                    <td className="py-3.5 px-4 text-center bg-blue-50/20">
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Diizinkan
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                        <X className="w-3.5 h-3.5" /> Dibatasi
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                      Mencegah duplikasi kode SKU atau perubahan harga buku yang tidak sah. PPNPN hanya berhak melihat katalog untuk cek ketersediaan stok.
                    </td>
                  </tr>

                  {/* Row 4: Stock Opname */}
                  <tr>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">Stock Opname Fisik & Penyesuaian Saldo</div>
                      <div className="text-[11px] text-slate-500">Pemeriksaan fisik periodik dan eksekusi adjustment saldo buku</div>
                    </td>
                    <td className="py-3.5 px-4 text-center bg-blue-50/20">
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Diizinkan
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                        <X className="w-3.5 h-3.5" /> Dibatasi
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                      Penyesuaian selisih fisik membutuhkan Berita Acara resmi pengelola persediaan yang ditandatangani Kasubbag/Pimpinan.
                    </td>
                  </tr>

                  {/* Row 5: Scan Barcode */}
                  <tr>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">Pemindaian Barcode & Cek Stok Fisik</div>
                      <div className="text-[11px] text-slate-500">Scan SKU kamera HP / input kode untuk pencarian cepat</div>
                    </td>
                    <td className="py-3.5 px-4 text-center bg-blue-50/20">
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Diizinkan
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center bg-emerald-50/40">
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Diizinkan
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                      Mendukung petugas PPNPN saat mengambil barang fisik agar barang yang dikeluarkan sesuai dengan SKU.
                    </td>
                  </tr>

                  {/* Row 6: Cetak Bukti */}
                  <tr>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">Cetak Bukti Transaksi Barang Keluar</div>
                      <div className="text-[11px] text-slate-500">Cetak Surat Bukti Barang Keluar (SBBK) untuk tanda tangan penerima</div>
                    </td>
                    <td className="py-3.5 px-4 text-center bg-blue-50/20">
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Diizinkan
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center bg-emerald-50/40">
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Diizinkan
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                      PPNPN dapat langsung mencetak tanda terima pengeluaran barang untuk diarsip dan ditandatangani pemohon.
                    </td>
                  </tr>

                  {/* Row 7: Kelola Akses Admin */}
                  <tr>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">Pengelolaan Akses Akun & Reset Sistem</div>
                      <div className="text-[11px] text-slate-500">Tambah/edit akun user, atur hak akses, backup & restore database</div>
                    </td>
                    <td className="py-3.5 px-4 text-center bg-blue-50/20">
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Diizinkan
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                        <X className="w-3.5 h-3.5" /> Dibatasi
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                      Fungsi administratif tingkat tinggi untuk menjamin tata kelola keamanan sistem persediaan.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SOP Policy Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 p-5 rounded-2xl border border-blue-200/80">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Info className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1.5 text-slate-700">
                <h4 className="font-bold text-slate-900 text-sm">
                  Prinsip Pemisahan Tugas (Segregation of Duties) Persediaan
                </h4>
                <p className="leading-relaxed">
                  Pemberian kewenangan khusus bagi <strong>PPNPN untuk mencatat Barang Keluar</strong> bertujuan mempermudah dan mempercepat pelayanan distribusi ATK kepada pegawai dan unit kerja tanpa hambatan birokrasi, sekaligus menjaga validitas data buku inventaris karena hak pencatatan Barang Masuk dan perubahan Master Barang tetap berada di bawah kendali tunggal <strong>Administrator</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: AUDIT AKTIVITAS PETUGAS */}
      {subTab === 'audit' && (
        <div className="space-y-4">
          {/* Officer Selector & Summary */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Audit Jejak Mutasi per Petugas</h3>
              <p className="text-xs text-slate-500">
                Riwayat transaksi masuk & keluar yang dicatat oleh petugas pengguna sistem.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter Petugas:</span>
              <select
                value={selectedAuditOfficer}
                onChange={(e) => setSelectedAuditOfficer(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">Semua Petugas ({transactions.length} mutasi)</option>
                {officerNames.map((name) => (
                  <option key={name} value={name}>
                    {name} ({transactions.filter((t) => t.recipientOrSignee === name).length} mutasi)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">No. Bukti & Tanggal</th>
                    <th className="py-3 px-4">Jenis Mutasi</th>
                    <th className="py-3 px-4">Barang & Jumlah</th>
                    <th className="py-3 px-4">Petugas Pencatat</th>
                    <th className="py-3 px-4">Tujuan / Pemasok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada transaksi yang dicatat.
                      </td>
                    </tr>
                  ) : (
                    auditTransactions.slice(0, 20).map((trx) => {
                      const isKeluar = trx.type === 'KELUAR';
                      const isMasuk = trx.type === 'MASUK';

                      return (
                        <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-800 block">{trx.referenceNo}</span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(trx.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                isKeluar
                                  ? 'bg-amber-100 text-amber-800'
                                  : isMasuk
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {isKeluar ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : isMasuk ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : (
                                <ClipboardList className="w-3 h-3" />
                              )}
                              <span>{trx.type}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">{trx.itemName}</span>
                            <span className="text-[11px] text-slate-500">
                              Jumlah: <strong className="text-slate-900">{trx.quantity} {trx.unit}</strong>
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{trx.recipientOrSignee}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {trx.recipientOrSignee.toLowerCase().includes('ppnpn')
                                ? 'Petugas Operasional PPNPN'
                                : 'Petugas Administrator / Tim'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-700 block">{trx.sourceOrDestination}</span>
                            {trx.notes && (
                              <span className="text-[11px] text-slate-400 italic">"{trx.notes}"</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PUSAT RESET DATA (ADMINISTRATOR) */}
      {subTab === 'reset-data' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Card */}
          <div className="bg-linear-to-r from-rose-900 via-rose-800 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-200 border border-rose-400/40 uppercase tracking-wider">
                  Khusus Hak Akses Administrator
                </span>
                {isFirebaseConnected && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Cloud Firestore Terhubung
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Pusat Reset & Pemulihan Database</h2>
              <p className="text-xs sm:text-sm text-rose-100/80 mt-1 max-w-2xl leading-relaxed">
                Kelola dan bersihkan data transaksi, stok opname, pengisian BBM, atau kembalikan seluruh sistem ke pengaturan awal pabrik. Setiap tindakan langsung disinkronkan ke basis data cloud.
              </p>
            </div>
            <button
              onClick={exportJSON}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 border border-white/20 transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-rose-300" />
              <span>Unduh Cadangan (.JSON)</span>
            </button>
          </div>

          {/* Feedback banner */}
          {resetFeedback && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-semibold animate-in fade-in ${
                resetFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {resetFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{resetFeedback.message}</span>
            </div>
          )}

          {/* Grid of Reset Actions Aligned with Main Menu */}
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Panduan Administrator:</strong> Setiap tombol reset di bawah ini dipetakan langsung dengan pilihan pada <strong>Menu Utama</strong> sistem. Data langsung tersinkronkan ke cloud Firebase Firestore.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Menu Katalog Barang */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800">
                      1. Katalog Barang
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">Master Data Katalog Barang</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kelola data master persediaan barang kantor (ATK, pantry, komputer, cetakan).
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    disabled={isResetting}
                    onClick={async () => {
                      if (window.confirm('⚠️ Reset katalog barang ke 10 barang standar Kanwil DJPb Riau beserta stok awalnya?')) {
                        setIsResetting(true);
                        const res = await resetItemsToDefault();
                        setIsResetting(false);
                        setResetFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                        setTimeout(() => setResetFeedback(null), 5000);
                      }
                    }}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset ke 10 Barang Bawaan</span>
                  </button>
                  <button
                    disabled={isResetting}
                    onClick={async () => {
                      if (window.confirm('⚠️ Kosongkan seluruh katalog barang persediaan? Anda harus menginput ulang dari awal.')) {
                        setIsResetting(true);
                        const res = await clearAllItems();
                        setIsResetting(false);
                        setResetFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                        setTimeout(() => setResetFeedback(null), 5000);
                      }
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 active:scale-[0.99] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Seluruh Katalog</span>
                  </button>
                </div>
              </div>

              {/* 2. Menu Barang Masuk */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                      2. Barang Masuk
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">Riwayat Transaksi Barang Masuk</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hapus catatan pengadaan/penerimaan barang masuk dari pemasok. Master barang tetap utuh.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    disabled={isResetting}
                    onClick={async () => {
                      if (window.confirm('⚠️ Kosongkan seluruh log mutasi Barang Masuk?')) {
                        setIsResetting(true);
                        const res = await resetStockInTransactions();
                        setIsResetting(false);
                        setResetFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                        setTimeout(() => setResetFeedback(null), 5000);
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Kosongkan Transaksi Barang Masuk</span>
                  </button>
                </div>
              </div>

              {/* 3. Menu Barang Keluar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800">
                      3. Barang Keluar
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">Riwayat Transaksi Barang Keluar</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hapus catatan distribusi dan pengeluaran barang ke unit kerja / pegawai kantor.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    disabled={isResetting}
                    onClick={async () => {
                      if (window.confirm('⚠️ Kosongkan seluruh log mutasi Barang Keluar?')) {
                        setIsResetting(true);
                        const res = await resetStockOutTransactions();
                        setIsResetting(false);
                        setResetFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                        setTimeout(() => setResetFeedback(null), 5000);
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Kosongkan Transaksi Barang Keluar</span>
                  </button>
                </div>
              </div>

              {/* 4. Menu Pengisian BBM */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-orange-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                      <Fuel className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-100 text-orange-800">
                      4. Pengisian BBM
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">Riwayat Catatan BBM Kendaraan</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hapus rekaman pengisian BBM dan odometer dari 9 kendaraan dinas operasional kantor.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    disabled={isResetting}
                    onClick={async () => {
                      if (window.confirm('⚠️ Kosongkan seluruh log riwayat pengisian BBM kendaraan dinas?')) {
                        setIsResetting(true);
                        const res = await resetFuelLogs();
                        setIsResetting(false);
                        setResetFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                        setTimeout(() => setResetFeedback(null), 5000);
                      }
                    }}
                    className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Log Pengisian BBM</span>
                  </button>
                  <button
                    disabled={isResetting}
                    onClick={async () => {
                      if (window.confirm('⚠️ Kembalikan catatan log BBM ke data contoh bawaan?')) {
                        setIsResetting(true);
                        const res = await resetFuelLogsToDefault();
                        setIsResetting(false);
                        setResetFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                        setTimeout(() => setResetFeedback(null), 5000);
                      }
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-orange-50 text-orange-800 border border-orange-300 active:scale-[0.99] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset ke Log BBM Contoh</span>
                  </button>
                </div>
              </div>

              {/* 5. Menu Stock Opname */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800">
                      5. Stock Opname
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">Sesi & Draf Rekonsiliasi Opname</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hapus seluruh sesi perhitungan fisik barang persediaan dan riwayat audit selisih stok.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    disabled={isResetting}
                    onClick={async () => {
                      if (window.confirm('⚠️ Kosongkan seluruh riwayat dan draf sesi stock opname?')) {
                        setIsResetting(true);
                        const res = await resetOpnames();
                        setIsResetting(false);
                        setResetFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                        setTimeout(() => setResetFeedback(null), 5000);
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Kosongkan Riwayat Stock Opname</span>
                  </button>
                </div>
              </div>

              {/* 6. Master Kategori Persediaan */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Tags className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-800">
                      6. Master Kategori
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">Kategori Barang Persediaan</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kembalikan daftar kategori barang persediaan ke standar bawaan instansi (ATK, Kertas, Komputer, Pantry, Cetakan).
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    disabled={isResetting}
                    onClick={async () => {
                      if (window.confirm('⚠️ Kembalikan daftar kategori barang ke standar awal sistem?')) {
                        setIsResetting(true);
                        const res = await resetCategoriesToDefault();
                        setIsResetting(false);
                        setResetFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                        setTimeout(() => setResetFeedback(null), 5000);
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Kategori ke Standar Bawaan</span>
                  </button>
                </div>
              </div>

              {/* Card 7: Reset Seluruh Database Menu Utama */}
              <div className="bg-white p-5 rounded-2xl border-2 border-rose-300 shadow-xs hover:border-rose-400 transition-all flex flex-col justify-between md:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">Reset Total Seluruh Menu Utama (Pabrik)</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                          Reset Penuh
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl mt-0.5">
                        Mengembalikan <strong>seluruh data modul operasional</strong> (Katalog Barang, Barang Masuk & Keluar, Pengisian BBM, Stock Opname, serta Kategori) secara serentak ke data default awal Kanwil DJPb Riau.
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={isResetting}
                    onClick={async () => {
                      if (
                        window.confirm(
                          '⚠️ PERINGATAN SISTEM ADMINISTRATOR:\nTindakan ini akan mengembalikan SELURUH database (barang, transaksi masuk/keluar, BBM, opname, kategori) ke kondisi awal default pabrik.\n\nApakah Anda benar-benar yakin ingin melanjutkan?'
                        )
                      ) {
                        setIsResetting(true);
                        const res = await resetToDefaultData();
                        setIsResetting(false);
                        setResetFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                        setTimeout(() => setResetFeedback(null), 5000);
                      }
                    }}
                    className="shrink-0 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Seluruh Modul</span>
                  </button>
                </div>
              </div>

            {/* Card 5: Reset Akun Pengguna Bawaan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-0.5">Reset Akun Pengguna ke Standar Sistem</h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      Mengembalikan daftar akun petugas Administrator (Ahmad Fauzi & Rina) dan PPNPN (Bambang & Siti) ke password dan hak akses awal.
                    </p>
                  </div>
                </div>

                <button
                  disabled={isResetting}
                  onClick={() => {
                    if (
                      window.confirm(
                        '⚠️ RESET AKUN PETUGAS:\nDaftar akun pengguna akan dikembalikan ke setelan awal sistem (admin, rina.admin, ppnpn, siti.ppnpn).\n\nLanjutkan?'
                      )
                    ) {
                      resetUsersToDefault();
                      setResetFeedback({
                        type: 'success',
                        message: 'Daftar akun pengguna berhasil dikembalikan ke standar awal.',
                      });
                      setTimeout(() => setResetFeedback(null), 5000);
                    }
                  }}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Akun Pengguna</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* MODAL: TAMBAH / EDIT PENGGUNA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl z-10 border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                    formData.role === 'ADMIN' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}
                >
                  {formData.role === 'ADMIN' ? <Shield className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingUserId ? 'Edit Akun & Akses Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur peran, kewenangan operasional, dan identitas petugas persediaan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  formFeedback.type === 'error'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peran Pengguna (Role Akses) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() =>
                      setFormData({
                        ...formData,
                        role: 'PPNPN',
                        roleTitle: formData.roleTitle.includes('Administrator')
                          ? 'PPNPN - Petugas Distribusi & Pengeluaran Barang'
                          : formData.roleTitle,
                        avatarColor: 'bg-emerald-600',
                      })
                    }
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.role === 'PPNPN'
                        ? 'border-emerald-600 bg-emerald-50/70'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs text-emerald-900">PPNPN (Operasional)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Kewenangan khusus mencatat Barang Keluar dan scan SKU.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      setFormData({
                        ...formData,
                        role: 'ADMIN',
                        roleTitle: formData.roleTitle.includes('PPNPN')
                          ? 'Administrator Pengelola Persediaan'
                          : formData.roleTitle,
                        avatarColor: 'bg-blue-600',
                      })
                    }
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.role === 'ADMIN'
                        ? 'border-blue-600 bg-blue-50/70'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xs text-blue-900">ADMINISTRATOR</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Akses penuh: master barang, barang masuk, opname fisik & kelola pengguna.
                    </p>
                  </div>
                </div>
              </div>

              {/* Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bambang Irawan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Akun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: bambang.ppnpn"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 text-xs font-mono text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi / Password {editingUserId ? '(Kosongkan jika tidak ingin mengubah)' : <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={editingUserId ? 'Biarkan kosong untuk mempertahankan sandi saat ini' : 'Minimal 6 karakter, default: admin123 / ppnpn123'}
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs font-mono text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Jabatan & NIP/ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Tanggung Jawab
                  </label>
                  <input
                    type="text"
                    placeholder={
                      formData.role === 'ADMIN'
                        ? 'Pengelola BMN & Persediaan'
                        : 'Petugas Distribusi Gudang'
                    }
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.role === 'ADMIN' ? 'NIP Pegawai' : 'Nomor Identitas PPNPN / NIK'}
                  </label>
                  <input
                    type="text"
                    placeholder={formData.role === 'ADMIN' ? '19850614 201001 1 002' : 'PPNPN-2024-009'}
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 text-xs font-mono text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unit Kerja / Subbagian
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Seksi Operasional & Gudang Persediaan"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Status & Avatar Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">Aktif (Dapat Login & Operasional)</option>
                    <option value="INACTIVE">Nonaktif (Dinonaktifkan Sementara)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warna Badge Avatar</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    {avatarColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, avatarColor: color.value })}
                        className={`w-7 h-7 rounded-lg ${color.value} cursor-pointer transition-transform ${
                          formData.avatarColor === color.value
                            ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
