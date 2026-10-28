import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  db,
  auth,
  googleProvider,
  OperationType,
  handleFirestoreError,
  sanitizeForFirestore,
  testConnection,
} from '../lib/firebase';
import {
  InventoryItem,
  StockTransaction,
  OpnameSession,
  ActiveTab,
  UserProfile,
  UserRole,
  FuelLogRecord,
} from '../types/inventory';
import {
  INITIAL_ITEMS,
  INITIAL_TRANSACTIONS,
  INITIAL_OPNAMES,
  INITIAL_CATEGORIES,
  INITIAL_FUEL_LOGS,
  DEFAULT_USERS,
} from '../data/initialData';
import { generateRefNo, downloadCSV } from '../utils/formatters';

interface PrintDocumentPayload {
  type: 'BUKTI_MASUK' | 'BUKTI_KELUAR' | 'KARTU_STOK' | 'OPNAME_SHEET' | 'REKAP_MUTASI';
  data: any;
}

interface InventoryContextType {
  // User Authentication & Roles
  isAuthenticated: boolean;
  isFirebaseConnected: boolean;
  checkFirebaseConnection: () => Promise<boolean>;
  login: (username: string, password?: string) => { success: boolean; message: string };
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  currentUser: UserProfile;
  switchUser: (role: UserRole) => void;
  switchUserById: (userId: string) => void;
  users: UserProfile[];
  addUser: (user: Omit<UserProfile, 'id'>) => { success: boolean; message: string; user?: UserProfile };
  updateUser: (id: string, updates: Partial<UserProfile>) => { success: boolean; message: string };
  deleteUser: (id: string) => { success: boolean; message: string };
  resetUsersToDefault: () => void;
  isAdmin: boolean;
  isPPNPN: boolean;
  canRecordStockIn: boolean;
  canRecordStockOut: boolean;
  canManageItems: boolean;
  canManageOpname: boolean;
  canManageMasterData: boolean;

  items: InventoryItem[];
  transactions: StockTransaction[];
  opnames: OpnameSession[];
  categories: string[];
  fuelLogs: FuelLogRecord[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  filterStockStatus: 'all' | 'low' | 'out' | 'safe';
  setFilterStockStatus: (status: 'all' | 'low' | 'out' | 'safe') => void;

  // Modals & popups
  selectedItemForDetail: InventoryItem | null;
  setSelectedItemForDetail: (item: InventoryItem | null) => void;
  transactionModalState: { isOpen: boolean; type: 'MASUK' | 'KELUAR'; item?: InventoryItem };
  openTransactionModal: (type: 'MASUK' | 'KELUAR', item?: InventoryItem) => void;
  closeTransactionModal: () => void;
  itemFormState: { isOpen: boolean; itemToEdit?: InventoryItem };
  openItemForm: (itemToEdit?: InventoryItem) => void;
  closeItemForm: () => void;
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  isMasterSettingsOpen: boolean;
  setIsMasterSettingsOpen: (open: boolean) => void;
  printDoc: PrintDocumentPayload | null;
  setPrintDoc: (doc: PrintDocumentPayload | null) => void;

  // Operations
  addItem: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => boolean;
  recordTransaction: (params: {
    type: 'MASUK' | 'KELUAR';
    itemId: string;
    quantity: number;
    sourceOrDestination: string;
    recipientOrSignee: string;
    notes?: string;
    unitPrice?: number;
    date?: string;
  }) => { success: boolean; message: string; transaction?: StockTransaction };
  quickAdjustStock: (
    itemId: string,
    actualStock: number,
    reason: string,
    officer: string
  ) => void;
  saveOpname: (
    sessionData: Omit<OpnameSession, 'id' | 'createdAt' | 'referenceNo'>,
    applyAdjustments: boolean
  ) => void;
  addCategory: (cat: string) => void;
  resetToDefaultData: () => Promise<{ success: boolean; message: string }>;
  resetItemsToDefault: () => Promise<{ success: boolean; message: string }>;
  clearAllItems: () => Promise<{ success: boolean; message: string }>;
  resetStockInTransactions: () => Promise<{ success: boolean; message: string }>;
  resetStockOutTransactions: () => Promise<{ success: boolean; message: string }>;
  resetTransactions: () => Promise<{ success: boolean; message: string }>;
  resetFuelLogs: () => Promise<{ success: boolean; message: string }>;
  resetFuelLogsToDefault: () => Promise<{ success: boolean; message: string }>;
  resetOpnames: () => Promise<{ success: boolean; message: string }>;
  resetCategoriesToDefault: () => Promise<{ success: boolean; message: string }>;
  exportJSON: () => void;
  importJSON: (jsonStr: string) => { success: boolean; message: string };
  exportItemsToCSV: () => void;
  exportTransactionsToCSV: () => void;
  addFuelLog: (data: Omit<FuelLogRecord, 'id' | 'referenceNo' | 'createdAt'>) => FuelLogRecord;
  updateFuelLog: (id: string, updates: Partial<FuelLogRecord>) => void;
  deleteFuelLog: (id: string) => void;
  exportFuelLogsToCSV: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ITEMS: 'inventaris_items_v1',
  TRANSACTIONS: 'inventaris_transactions_v1',
  OPNAMES: 'inventaris_opnames_v1',
  CATEGORIES: 'inventaris_categories_v1',
  FUEL_LOGS: 'inventaris_fuel_logs_v1',
  USER: 'inventaris_user_v1',
  USERS: 'inventaris_users_list_v1',
  AUTH: 'inventaris_auth_session_v1',
  SEEDED: 'inventaris_firestore_seeded_v1',
};

function toCategoryId(name: string): string {
  return (
    'cat-' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)
  );
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const seededRef = useRef<Record<string, boolean>>({});

  // All managed users state
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  // Current user & role state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = DEFAULT_USERS.find((u) => u.id === parsed.id || u.role === parsed.role);
        if (match) return match;
        if (parsed && parsed.id && parsed.name && parsed.role) return parsed;
      }
      return DEFAULT_USERS[0];
    } catch {
      return DEFAULT_USERS[0];
    }
  });

  // Authentication session state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (stored === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });

  // Initialize with LocalStorage or default initial data
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return stored ? JSON.parse(stored) : INITIAL_ITEMS;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return stored ? JSON.parse(stored) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [opnames, setOpnames] = useState<OpnameSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OPNAMES);
      return stored ? JSON.parse(stored) : INITIAL_OPNAMES;
    } catch {
      return INITIAL_OPNAMES;
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return stored ? JSON.parse(stored) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [fuelLogs, setFuelLogs] = useState<FuelLogRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FUEL_LOGS);
      return stored ? JSON.parse(stored) : INITIAL_FUEL_LOGS;
    } catch {
      return INITIAL_FUEL_LOGS;
    }
  });

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out' | 'safe'>('all');

  // Modals
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | null>(null);
  const [transactionModalState, setTransactionModalState] = useState<{
    isOpen: boolean;
    type: 'MASUK' | 'KELUAR';
    item?: InventoryItem;
  }>({ isOpen: false, type: 'MASUK' });
  const [itemFormState, setItemFormState] = useState<{ isOpen: boolean; itemToEdit?: InventoryItem }>({
    isOpen: false,
  });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMasterSettingsOpen, setIsMasterSettingsOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<PrintDocumentPayload | null>(null);

  // Sync to localStorage as fast offline cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPNAMES, JSON.stringify(opnames));
  }, [opnames]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(fuelLogs));
  }, [fuelLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const isUserAdmin = fbUser.email === 'nauvalsdm82@gmail.com';
        const mappedProfile: UserProfile = {
          id: `fb-${fbUser.uid.slice(0, 20)}`,
          name: fbUser.displayName || fbUser.email || 'Pengguna Firebase',
          role: isUserAdmin ? 'ADMIN' : 'ADMIN',
          roleTitle: 'Administrator Pengelola Persediaan',
          username: fbUser.email ? fbUser.email.split('@')[0] : 'admin',
          department: 'Subbag Tata Usaha & Pengelolaan Barang',
          avatarColor: 'bg-blue-600',
          email: fbUser.email || undefined,
          status: 'ACTIVE',
          lastLogin: 'Terhubung via Google Firebase',
        };
        setCurrentUser(mappedProfile);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time Firestore synchronization for all collections
  useEffect(() => {
    testConnection().then((connected) => {
      if (connected) setIsFirebaseConnected(true);
    });

    // 1. Items Listener
    const unsubItems = onSnapshot(
      collection(db, 'items'),
      async (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty && !seededRef.current.items) {
          seededRef.current.items = true;
          try {
            const batch = writeBatch(db);
            INITIAL_ITEMS.forEach((item) => {
              batch.set(doc(db, 'items', item.id), sanitizeForFirestore(item));
            });
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'items');
          }
          return;
        }
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((d) => d.data() as InventoryItem);
          loaded.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setItems(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'items');
      }
    );

    // 2. Transactions Listener
    const unsubTransactions = onSnapshot(
      collection(db, 'transactions'),
      async (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty && !seededRef.current.transactions) {
          seededRef.current.transactions = true;
          try {
            const batch = writeBatch(db);
            INITIAL_TRANSACTIONS.forEach((trx) => {
              batch.set(doc(db, 'transactions', trx.id), sanitizeForFirestore(trx));
            });
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'transactions');
          }
          return;
        }
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((d) => d.data() as StockTransaction);
          loaded.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setTransactions(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'transactions');
      }
    );

    // 3. Opnames Listener
    const unsubOpnames = onSnapshot(
      collection(db, 'opnames'),
      async (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty && !seededRef.current.opnames) {
          seededRef.current.opnames = true;
          try {
            const batch = writeBatch(db);
            INITIAL_OPNAMES.forEach((opn) => {
              batch.set(doc(db, 'opnames', opn.id), sanitizeForFirestore(opn));
            });
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'opnames');
          }
          return;
        }
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((d) => d.data() as OpnameSession);
          loaded.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setOpnames(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'opnames');
      }
    );

    // 4. Fuel Logs Listener
    const unsubFuelLogs = onSnapshot(
      collection(db, 'fuelLogs'),
      async (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty && !seededRef.current.fuelLogs) {
          seededRef.current.fuelLogs = true;
          try {
            const batch = writeBatch(db);
            INITIAL_FUEL_LOGS.forEach((fuel) => {
              batch.set(doc(db, 'fuelLogs', fuel.id), sanitizeForFirestore(fuel));
            });
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'fuelLogs');
          }
          return;
        }
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((d) => d.data() as FuelLogRecord);
          loaded.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setFuelLogs(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'fuelLogs');
      }
    );

    // 5. Categories Listener
    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      async (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty && !seededRef.current.categories) {
          seededRef.current.categories = true;
          try {
            const batch = writeBatch(db);
            INITIAL_CATEGORIES.forEach((catName) => {
              const catId = toCategoryId(catName);
              batch.set(doc(db, 'categories', catId), { id: catId, name: catName });
            });
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'categories');
          }
          return;
        }
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((d) => (d.data() as { id: string; name: string }).name);
          setCategories(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      }
    );

    // 6. Users Listener
    const unsubUsers = onSnapshot(
      collection(db, 'appUsers'),
      async (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty && !seededRef.current.appUsers) {
          seededRef.current.appUsers = true;
          try {
            const batch = writeBatch(db);
            DEFAULT_USERS.forEach((u) => {
              batch.set(doc(db, 'appUsers', u.id), sanitizeForFirestore(u));
            });
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'appUsers');
          }
          return;
        }
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((d) => d.data() as UserProfile);
          setUsers(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'appUsers');
      }
    );

    return () => {
      unsubItems();
      unsubTransactions();
      unsubOpnames();
      unsubFuelLogs();
      unsubCategories();
      unsubUsers();
    };
  }, []);

  const checkFirebaseConnection = useCallback(async (): Promise<boolean> => {
    const ok = await testConnection();
    setIsFirebaseConnected(ok);
    return ok;
  }, []);

  // Role permissions
  const isAdmin = currentUser.role === 'ADMIN';
  const isPPNPN = currentUser.role === 'PPNPN';
  const canRecordStockIn = isAdmin;
  const canRecordStockOut = true;
  const canManageItems = isAdmin;
  const canManageOpname = isAdmin;
  const canManageMasterData = isAdmin;

  const login = (username: string, password?: string): { success: boolean; message: string } => {
    const cleanUser = username.trim().toLowerCase();
    const target = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUser ||
        (u.nip && u.nip.toLowerCase().replace(/[\s.-]/g, '') === cleanUser.replace(/[\s.-]/g, ''))
    );

    if (!target) {
      return { success: false, message: 'Username atau NIP tidak terdaftar dalam sistem.' };
    }

    if (target.status === 'INACTIVE') {
      return {
        success: false,
        message: 'Akun Anda sedang dinonaktifkan oleh Administrator. Hubungi Subbag Tata Usaha.',
      };
    }

    if (target.password && password && target.password !== password) {
      return { success: false, message: 'Kata sandi / Password salah. Silakan periksa kembali.' };
    }

    const now = new Date();
    const timeString = `Hari ini, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;
    const updated = { ...target, lastLogin: timeString };

    setCurrentUser(updated);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
    setDoc(doc(db, 'appUsers', updated.id), sanitizeForFirestore(updated)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `appUsers/${updated.id}`)
    );

    if (target.role === 'PPNPN' && (activeTab === 'opname' || activeTab === 'stock-in' || activeTab === 'user-access')) {
      setActiveTab('stock-out');
    }

    return {
      success: true,
      message: `Selamat datang kembali, ${target.name}!`,
    };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      return {
        success: true,
        message: `Selamat datang, ${fbUser.displayName || fbUser.email}!`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Gagal masuk dengan Google Firebase.',
      };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    signOut(auth).catch(() => {});
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'false');
    } catch (e) {
      console.error(e);
    }
  };

  const switchUser = (role: UserRole) => {
    const targetUser =
      users.find((u) => u.role === role && u.status !== 'INACTIVE') ||
      users.find((u) => u.role === role) ||
      DEFAULT_USERS.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(targetUser));
      } catch (e) {
        console.error(e);
      }
      if (role === 'PPNPN' && (activeTab === 'opname' || activeTab === 'stock-in' || activeTab === 'user-access')) {
        setActiveTab('stock-out');
      }
    }
  };

  const switchUserById = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(targetUser));
      } catch (e) {
        console.error(e);
      }
      if (targetUser.role === 'PPNPN' && (activeTab === 'opname' || activeTab === 'stock-in' || activeTab === 'user-access')) {
        setActiveTab('stock-out');
      }
    }
  };

  const addUser = (userData: Omit<UserProfile, 'id'>) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Administrator yang berwenang menambahkan pengguna baru.' };
    }
    const usernameExists = users.some(
      (u) => u.username.toLowerCase() === userData.username.trim().toLowerCase()
    );
    if (usernameExists) {
      return { success: false, message: `Username "${userData.username}" sudah digunakan akun lain.` };
    }

    const newUser: UserProfile = {
      ...userData,
      id: `user-${Date.now()}`,
      status: userData.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLogin: 'Belum pernah login',
    };
    setUsers((prev) => [...prev, newUser]);
    setDoc(doc(db, 'appUsers', newUser.id), sanitizeForFirestore(newUser)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `appUsers/${newUser.id}`)
    );
    return { success: true, message: `Pengguna "${newUser.name}" berhasil didaftarkan.`, user: newUser };
  };

  const updateUser = (id: string, updates: Partial<UserProfile>) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Administrator yang berwenang mengubah data akun pengguna.' };
    }
    const existingUser = users.find((u) => u.id === id);
    if (existingUser) {
      const updated = { ...existingUser, ...updates };
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      if (currentUser.id === id) {
        setCurrentUser(updated);
      }
      setDoc(doc(db, 'appUsers', id), sanitizeForFirestore(updated)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `appUsers/${id}`)
      );
    }
    return { success: true, message: 'Data profil pengguna berhasil diperbarui.' };
  };

  const deleteUser = (id: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Administrator yang berwenang menghapus pengguna.' };
    }
    if (id === currentUser.id) {
      return { success: false, message: 'Tidak dapat menghapus akun yang sedang Anda gunakan saat ini.' };
    }
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, message: 'Pengguna tidak ditemukan.' };

    if (target.role === 'ADMIN') {
      const adminCount = users.filter((u) => u.role === 'ADMIN').length;
      if (adminCount <= 1) {
        return {
          success: false,
          message: 'Sistem harus memiliki minimal satu akun Administrator aktif.',
        };
      }
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    deleteDoc(doc(db, 'appUsers', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `appUsers/${id}`)
    );
    return { success: true, message: `Pengguna "${target.name}" berhasil dihapus.` };
  };

  const resetUsersToDefault = () => {
    setUsers(DEFAULT_USERS);
    setCurrentUser(DEFAULT_USERS[0]);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    DEFAULT_USERS.forEach((u) => {
      setDoc(doc(db, 'appUsers', u.id), sanitizeForFirestore(u)).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `appUsers/${u.id}`)
      );
    });
  };

  // Modal handlers
  const openTransactionModal = (type: 'MASUK' | 'KELUAR', item?: InventoryItem) => {
    if (isPPNPN && type === 'MASUK') {
      setTransactionModalState({ isOpen: true, type: 'KELUAR', item });
      return;
    }
    setTransactionModalState({ isOpen: true, type, item });
  };

  const closeTransactionModal = () => {
    setTransactionModalState({ isOpen: false, type: 'MASUK' });
  };

  const openItemForm = (itemToEdit?: InventoryItem) => {
    if (!isAdmin) return;
    setItemFormState({ isOpen: true, itemToEdit });
  };

  const closeItemForm = () => {
    setItemFormState({ isOpen: false });
  };

  // CRUD Items
  const addItem = (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isAdmin) return;
    const newItem: InventoryItem = {
      ...data,
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => [newItem, ...prev]);
    setDoc(doc(db, 'items', newItem.id), sanitizeForFirestore(newItem)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `items/${newItem.id}`)
    );

    if (newItem.stock > 0) {
      const initialTrx: StockTransaction = {
        id: `trx-${Date.now()}`,
        referenceNo: generateRefNo('IN'),
        date: new Date().toISOString(),
        type: 'MASUK',
        itemId: newItem.id,
        itemName: newItem.name,
        itemSku: newItem.sku,
        quantity: newItem.stock,
        unit: newItem.unit,
        unitPrice: newItem.unitPrice,
        totalPrice: newItem.stock * newItem.unitPrice,
        sourceOrDestination: newItem.supplier || 'Saldo Awal Sistem',
        recipientOrSignee: 'Sistem / Administrator',
        notes: 'Pencatatan saldo awal barang baru.',
        stockBefore: 0,
        stockAfter: newItem.stock,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [initialTrx, ...prev]);
      setDoc(doc(db, 'transactions', initialTrx.id), sanitizeForFirestore(initialTrx)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `transactions/${initialTrx.id}`)
      );
    }
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    const existingItem = items.find((i) => i.id === id);
    if (!existingItem) return;
    const updatedItem: InventoryItem = {
      ...existingItem,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
    if (selectedItemForDetail?.id === id) {
      setSelectedItemForDetail(updatedItem);
    }
    setDoc(doc(db, 'items', id), sanitizeForFirestore(updatedItem)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `items/${id}`)
    );
  };

  const deleteItem = (id: string): boolean => {
    if (!isAdmin) return false;
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemForDetail?.id === id) {
      setSelectedItemForDetail(null);
    }
    deleteDoc(doc(db, 'items', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `items/${id}`)
    );
    return true;
  };

  // Record Stock In / Stock Out
  const recordTransaction = (params: {
    type: 'MASUK' | 'KELUAR';
    itemId: string;
    quantity: number;
    sourceOrDestination: string;
    recipientOrSignee: string;
    notes?: string;
    unitPrice?: number;
    date?: string;
  }) => {
    if (isPPNPN && params.type === 'MASUK') {
      return {
        success: false,
        message: 'Kewenangan Terbatas: User PPNPN hanya berwenang mencatat transaksi Barang Keluar (pemakaian barang).',
      };
    }

    const targetItem = items.find((i) => i.id === params.itemId);
    if (!targetItem) {
      return { success: false, message: 'Barang tidak ditemukan dalam database.' };
    }

    if (params.quantity <= 0) {
      return { success: false, message: 'Jumlah mutasi harus lebih besar dari 0.' };
    }

    if (params.type === 'KELUAR' && targetItem.stock < params.quantity) {
      return {
        success: false,
        message: `Stok tidak mencukupi! Tersedia hanya ${targetItem.stock} ${targetItem.unit}, diminta ${params.quantity} ${targetItem.unit}.`,
      };
    }

    const price = params.unitPrice !== undefined ? params.unitPrice : targetItem.unitPrice;
    const stockBefore = targetItem.stock;
    const stockAfter =
      params.type === 'MASUK'
        ? stockBefore + params.quantity
        : stockBefore - params.quantity;

    const newTrx: StockTransaction = {
      id: `trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      referenceNo: generateRefNo(params.type === 'MASUK' ? 'IN' : 'OUT'),
      date: params.date || new Date().toISOString(),
      type: params.type,
      itemId: targetItem.id,
      itemName: targetItem.name,
      itemSku: targetItem.sku,
      quantity: params.quantity,
      unit: targetItem.unit,
      unitPrice: price,
      totalPrice: params.quantity * price,
      sourceOrDestination: params.sourceOrDestination || '-',
      recipientOrSignee: params.recipientOrSignee || '-',
      notes: params.notes,
      stockBefore,
      stockAfter,
      createdAt: new Date().toISOString(),
    };

    updateItem(targetItem.id, {
      stock: stockAfter,
      unitPrice: params.type === 'MASUK' && params.unitPrice ? params.unitPrice : targetItem.unitPrice,
    });

    setTransactions((prev) => [newTrx, ...prev]);
    setDoc(doc(db, 'transactions', newTrx.id), sanitizeForFirestore(newTrx)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `transactions/${newTrx.id}`)
    );

    return {
      success: true,
      message: `Berhasil mencatat transaksi ${params.type === 'MASUK' ? 'Masuk' : 'Keluar'} untuk ${targetItem.name}.`,
      transaction: newTrx,
    };
  };

  // Quick Adjustment (Koreksi Stok Cepat)
  const quickAdjustStock = (
    itemId: string,
    actualStock: number,
    reason: string,
    officer: string
  ) => {
    if (!isAdmin) return;
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const stockBefore = targetItem.stock;
    const difference = actualStock - stockBefore;
    if (difference === 0) return;

    const newTrx: StockTransaction = {
      id: `trx-${Date.now()}`,
      referenceNo: generateRefNo('ADJ'),
      date: new Date().toISOString(),
      type: 'PENYESUAIAN',
      itemId: targetItem.id,
      itemName: targetItem.name,
      itemSku: targetItem.sku,
      quantity: Math.abs(difference),
      unit: targetItem.unit,
      unitPrice: targetItem.unitPrice,
      totalPrice: Math.abs(difference) * targetItem.unitPrice,
      sourceOrDestination: `Penyesuaian Fisik: ${difference > 0 ? '+' : ''}${difference} (${reason})`,
      recipientOrSignee: officer,
      notes: reason,
      stockBefore,
      stockAfter: actualStock,
      createdAt: new Date().toISOString(),
    };

    updateItem(targetItem.id, { stock: actualStock });
    setTransactions((prev) => [newTrx, ...prev]);
    setDoc(doc(db, 'transactions', newTrx.id), sanitizeForFirestore(newTrx)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `transactions/${newTrx.id}`)
    );
  };

  // Stock Opname
  const saveOpname = (
    sessionData: Omit<OpnameSession, 'id' | 'createdAt' | 'referenceNo'>,
    applyAdjustments: boolean
  ) => {
    if (!isAdmin) return;
    const newSession: OpnameSession = {
      ...sessionData,
      id: `opn-${Date.now()}`,
      referenceNo: generateRefNo('OPN'),
      createdAt: new Date().toISOString(),
    };

    setOpnames((prev) => [newSession, ...prev]);
    setDoc(doc(db, 'opnames', newSession.id), sanitizeForFirestore(newSession)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `opnames/${newSession.id}`)
    );

    if (applyAdjustments && newSession.status === 'SELESAI') {
      newSession.entries.forEach((entry) => {
        if (entry.difference !== 0) {
          quickAdjustStock(
            entry.itemId,
            entry.physicalStock,
            `Hasil Stock Opname (${newSession.title}): ${entry.notes || 'Penyesuaian hasil cek fisik'}`,
            newSession.officerName
          );
        }
      });
    }
  };

  // Categories
  const addCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
      const catId = toCategoryId(trimmed);
      setDoc(doc(db, 'categories', catId), { id: catId, name: trimmed }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `categories/${catId}`)
      );
    }
  };

  const deleteCategory = (cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
    const catId = toCategoryId(cat);
    deleteDoc(doc(db, 'categories', catId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `categories/${catId}`)
    );
  };

  // Reset to default with real-time Firebase sync
  const resetToDefaultData = async (): Promise<{ success: boolean; message: string }> => {
    try {
      setItems(INITIAL_ITEMS);
      setTransactions(INITIAL_TRANSACTIONS);
      setOpnames(INITIAL_OPNAMES);
      setCategories(INITIAL_CATEGORIES);
      setFuelLogs(INITIAL_FUEL_LOGS);

      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      localStorage.setItem(STORAGE_KEYS.OPNAMES, JSON.stringify(INITIAL_OPNAMES));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(INITIAL_FUEL_LOGS));

      // Batch sync to Firestore
      const batch = writeBatch(db);
      INITIAL_ITEMS.forEach((item) => {
        batch.set(doc(db, 'items', item.id), sanitizeForFirestore(item));
      });
      INITIAL_TRANSACTIONS.forEach((trx) => {
        batch.set(doc(db, 'transactions', trx.id), sanitizeForFirestore(trx));
      });
      INITIAL_OPNAMES.forEach((opn) => {
        batch.set(doc(db, 'opnames', opn.id), sanitizeForFirestore(opn));
      });
      INITIAL_FUEL_LOGS.forEach((fuel) => {
        batch.set(doc(db, 'fuelLogs', fuel.id), sanitizeForFirestore(fuel));
      });
      INITIAL_CATEGORIES.forEach((catName) => {
        const catId = toCategoryId(catName);
        batch.set(doc(db, 'categories', catId), { id: catId, name: catName });
      });
      await batch.commit();

      return { success: true, message: 'Seluruh data berhasil direset dan disinkronkan ke database Firebase!' };
    } catch (err) {
      console.error(err);
      return { success: true, message: 'Data lokal berhasil direset.' };
    }
  };

  // 1. Reset Master Katalog Barang ke Data Standar
  const resetItemsToDefault = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const batch = writeBatch(db);
      items.forEach((item) => {
        batch.delete(doc(db, 'items', item.id));
      });
      INITIAL_ITEMS.forEach((item) => {
        batch.set(doc(db, 'items', item.id), sanitizeForFirestore(item));
      });
      await batch.commit();
      setItems(INITIAL_ITEMS);
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
      return { success: true, message: 'Katalog barang berhasil direset ke daftar standar awal Kanwil DJPb Riau.' };
    } catch (err) {
      console.error(err);
      setItems(INITIAL_ITEMS);
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
      return { success: true, message: 'Katalog barang lokal berhasil direset ke standar awal.' };
    }
  };

  // 2. Kosongkan Seluruh Katalog Barang
  const clearAllItems = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const batch = writeBatch(db);
      items.forEach((item) => {
        batch.delete(doc(db, 'items', item.id));
      });
      await batch.commit();
      setItems([]);
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([]));
      return { success: true, message: 'Seluruh katalog barang berhasil dikosongkan.' };
    } catch (err) {
      console.error(err);
      setItems([]);
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([]));
      return { success: true, message: 'Katalog barang lokal berhasil dikosongkan.' };
    }
  };

  // 3. Reset Riwayat Transaksi Barang Masuk
  const resetStockInTransactions = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const masukTrx = transactions.filter((t) => t.type === 'MASUK');
      const batch = writeBatch(db);
      masukTrx.forEach((t) => {
        batch.delete(doc(db, 'transactions', t.id));
      });
      await batch.commit();
      const remaining = transactions.filter((t) => t.type !== 'MASUK');
      setTransactions(remaining);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(remaining));
      return { success: true, message: 'Seluruh riwayat transaksi Barang Masuk berhasil dikosongkan.' };
    } catch (err) {
      console.error(err);
      const remaining = transactions.filter((t) => t.type !== 'MASUK');
      setTransactions(remaining);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(remaining));
      return { success: true, message: 'Riwayat transaksi Barang Masuk lokal berhasil dikosongkan.' };
    }
  };

  // 4. Reset Riwayat Transaksi Barang Keluar
  const resetStockOutTransactions = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const keluarTrx = transactions.filter((t) => t.type === 'KELUAR');
      const batch = writeBatch(db);
      keluarTrx.forEach((t) => {
        batch.delete(doc(db, 'transactions', t.id));
      });
      await batch.commit();
      const remaining = transactions.filter((t) => t.type !== 'KELUAR');
      setTransactions(remaining);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(remaining));
      return { success: true, message: 'Seluruh riwayat transaksi Barang Keluar berhasil dikosongkan.' };
    } catch (err) {
      console.error(err);
      const remaining = transactions.filter((t) => t.type !== 'KELUAR');
      setTransactions(remaining);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(remaining));
      return { success: true, message: 'Riwayat transaksi Barang Keluar lokal berhasil dikosongkan.' };
    }
  };

  // 5. Reset only stock transaction logs (Mutasi Masuk & Keluar)
  const resetTransactions = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const batch = writeBatch(db);
      transactions.forEach((t) => {
        batch.delete(doc(db, 'transactions', t.id));
      });
      await batch.commit();
      setTransactions([]);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      return { success: true, message: 'Seluruh riwayat transaksi mutasi berhasil dikosongkan.' };
    } catch (err) {
      console.error(err);
      setTransactions([]);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      return { success: true, message: 'Riwayat transaksi lokal berhasil dikosongkan.' };
    }
  };

  // 6. Reset only fuel fill logs
  const resetFuelLogs = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const batch = writeBatch(db);
      fuelLogs.forEach((f) => {
        batch.delete(doc(db, 'fuelLogs', f.id));
      });
      await batch.commit();
      setFuelLogs([]);
      localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify([]));
      return { success: true, message: 'Seluruh log riwayat pengisian BBM berhasil dikosongkan.' };
    } catch (err) {
      console.error(err);
      setFuelLogs([]);
      localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify([]));
      return { success: true, message: 'Log riwayat pengisian BBM lokal berhasil dikosongkan.' };
    }
  };

  // 7. Reset Fuel logs to default mock data
  const resetFuelLogsToDefault = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const batch = writeBatch(db);
      fuelLogs.forEach((f) => {
        batch.delete(doc(db, 'fuelLogs', f.id));
      });
      INITIAL_FUEL_LOGS.forEach((fuel) => {
        batch.set(doc(db, 'fuelLogs', fuel.id), sanitizeForFirestore(fuel));
      });
      await batch.commit();
      setFuelLogs(INITIAL_FUEL_LOGS);
      localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(INITIAL_FUEL_LOGS));
      return { success: true, message: 'Riwayat pengisian BBM berhasil dikembalikan ke data standar bawaan.' };
    } catch (err) {
      console.error(err);
      setFuelLogs(INITIAL_FUEL_LOGS);
      localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(INITIAL_FUEL_LOGS));
      return { success: true, message: 'Riwayat pengisian BBM lokal berhasil dikembalikan ke standar awal.' };
    }
  };

  // 8. Reset only stock opname sessions
  const resetOpnames = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const batch = writeBatch(db);
      opnames.forEach((o) => {
        batch.delete(doc(db, 'opnames', o.id));
      });
      await batch.commit();
      setOpnames([]);
      localStorage.setItem(STORAGE_KEYS.OPNAMES, JSON.stringify([]));
      return { success: true, message: 'Seluruh riwayat stock opname berhasil dikosongkan.' };
    } catch (err) {
      console.error(err);
      setOpnames([]);
      localStorage.setItem(STORAGE_KEYS.OPNAMES, JSON.stringify([]));
      return { success: true, message: 'Riwayat stock opname lokal berhasil dikosongkan.' };
    }
  };

  // 9. Reset Master Kategori Persediaan ke Default
  const resetCategoriesToDefault = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const batch = writeBatch(db);
      categories.forEach((cat) => {
        const catId = toCategoryId(cat);
        batch.delete(doc(db, 'categories', catId));
      });
      INITIAL_CATEGORIES.forEach((catName) => {
        const catId = toCategoryId(catName);
        batch.set(doc(db, 'categories', catId), { id: catId, name: catName });
      });
      await batch.commit();
      setCategories(INITIAL_CATEGORIES);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return { success: true, message: 'Master Kategori barang berhasil direset ke daftar standar bawaan.' };
    } catch (err) {
      console.error(err);
      setCategories(INITIAL_CATEGORIES);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return { success: true, message: 'Master Kategori lokal berhasil direset ke standar bawaan.' };
    }
  };

  // Export JSON backup
  const exportJSON = () => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      items,
      transactions,
      opnames,
      categories,
      fuelLogs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_inventarisku_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const importJSON = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data.items)) {
        return { success: false, message: 'Format data JSON tidak valid (kurang daftar barang).' };
      }
      setItems(data.items);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.opnames)) setOpnames(data.opnames);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (Array.isArray(data.fuelLogs)) setFuelLogs(data.fuelLogs);
      return { success: true, message: 'Berhasil memulihkan data persediaan dari file cadangan.' };
    } catch {
      return { success: false, message: 'Gagal memproses file JSON. Pastikan file valid.' };
    }
  };

  // Export CSV
  const exportItemsToCSV = () => {
    const headers = [
      'Kode SKU',
      'Nama Barang',
      'Kategori',
      'Stok Saat Ini',
      'Satuan',
      'Batas Minimum',
      'Harga Satuan (Rp)',
      'Total Nilai (Rp)',
      'Pemasok / Supplier',
    ];
    const rows = items.map((i) => [
      i.sku,
      i.name,
      i.category,
      i.stock,
      i.unit,
      i.minStock,
      i.unitPrice,
      i.stock * i.unitPrice,
      i.supplier || '-',
    ]);
    downloadCSV(`katalog_barang_persediaan_${new Date().toISOString().slice(0, 10)}`, rows, headers);
  };

  const exportTransactionsToCSV = () => {
    const headers = [
      'No Referensi',
      'Tanggal Transaksi',
      'Jenis Mutasi',
      'Kode SKU',
      'Nama Barang',
      'Jumlah',
      'Satuan',
      'Harga Satuan (Rp)',
      'Total Nilai (Rp)',
      'Asal / Tujuan (Divisi/Pemasok)',
      'Penanggung Jawab',
      'Stok Sebelum',
      'Stok Sesudah',
      'Catatan / Keperluan',
    ];
    const rows = transactions.map((t) => [
      t.referenceNo,
      t.date ? new Date(t.date).toLocaleDateString('id-ID') : '-',
      t.type,
      t.itemSku,
      t.itemName,
      t.quantity,
      t.unit,
      t.unitPrice,
      t.totalPrice,
      t.sourceOrDestination,
      t.recipientOrSignee,
      t.stockBefore,
      t.stockAfter,
      t.notes || '-',
    ]);
    downloadCSV(`riwayat_transaksi_persediaan_${new Date().toISOString().slice(0, 10)}`, rows, headers);
  };

  // Fuel Log CRUD & CSV Export
  const addFuelLog = (data: Omit<FuelLogRecord, 'id' | 'referenceNo' | 'createdAt'>): FuelLogRecord => {
    const newRecord: FuelLogRecord = {
      ...data,
      id: `fuel-${Date.now()}`,
      referenceNo: generateRefNo('BBM'),
      createdAt: new Date().toISOString(),
    };
    setFuelLogs((prev) => [newRecord, ...prev]);
    setDoc(doc(db, 'fuelLogs', newRecord.id), sanitizeForFirestore(newRecord)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `fuelLogs/${newRecord.id}`)
    );
    return newRecord;
  };

  const updateFuelLog = (id: string, updates: Partial<FuelLogRecord>) => {
    const existingLog = fuelLogs.find((l) => l.id === id);
    if (!existingLog) return;
    const updatedLog: FuelLogRecord = { ...existingLog, ...updates };
    setFuelLogs((prev) => prev.map((log) => (log.id === id ? updatedLog : log)));
    setDoc(doc(db, 'fuelLogs', id), sanitizeForFirestore(updatedLog)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `fuelLogs/${id}`)
    );
  };

  const deleteFuelLog = (id: string) => {
    setFuelLogs((prev) => prev.filter((log) => log.id !== id));
    deleteDoc(doc(db, 'fuelLogs', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `fuelLogs/${id}`)
    );
  };

  const exportFuelLogsToCSV = () => {
    const headers = [
      'No Referensi',
      'Tanggal Pengisian',
      'Nama Petugas',
      'Nama Kendaraan',
      'Odometer (KM)',
      'Total Liter',
      'Total Rupiah (Rp)',
      'Catatan',
    ];
    const rows = fuelLogs.map((f) => [
      f.referenceNo,
      f.date,
      f.officerName,
      f.vehicleName,
      f.odometerKm,
      f.totalLiters,
      f.totalRupiah,
      f.notes || '-',
    ]);
    downloadCSV(`riwayat_pengisian_bbm_${new Date().toISOString().slice(0, 10)}`, rows, headers);
  };

  return (
    <InventoryContext.Provider
      value={{
        isAuthenticated,
        isFirebaseConnected,
        checkFirebaseConnection,
        login,
        loginWithGoogle,
        logout,
        currentUser,
        switchUser,
        switchUserById,
        users,
        addUser,
        updateUser,
        deleteUser,
        resetUsersToDefault,
        isAdmin,
        isPPNPN,
        canRecordStockIn,
        canRecordStockOut,
        canManageItems,
        canManageOpname,
        canManageMasterData,
        items,
        transactions,
        opnames,
        categories,
        fuelLogs,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        filterCategory,
        setFilterCategory,
        filterStockStatus,
        setFilterStockStatus,
        selectedItemForDetail,
        setSelectedItemForDetail,
        transactionModalState,
        openTransactionModal,
        closeTransactionModal,
        itemFormState,
        openItemForm,
        closeItemForm,
        isScannerOpen,
        setIsScannerOpen,
        isMasterSettingsOpen,
        setIsMasterSettingsOpen,
        printDoc,
        setPrintDoc,
        addItem,
        updateItem,
        deleteItem,
        recordTransaction,
        quickAdjustStock,
        saveOpname,
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
        exportItemsToCSV,
        exportTransactionsToCSV,
        addFuelLog,
        updateFuelLog,
        deleteFuelLog,
        exportFuelLogsToCSV,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
