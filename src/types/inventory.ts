export type ItemCategory =
  | 'ATK & Kertas'
  | 'Elektronik & Kabel'
  | 'Peralatan Kebersihan'
  | 'Pantry & Konsumsi'
  | 'Alat Tulis & Kantor'
  | 'Perlengkapan P3K'
  | 'Perkakas & Maintenance'
  | 'Cetak & Promosi'
  | 'Lain-lain';

export type ItemUnit =
  | 'Pcs'
  | 'Rim'
  | 'Box'
  | 'Pak'
  | 'Botol'
  | 'Roll'
  | 'Set'
  | 'Unit'
  | 'Lusin'
  | 'Pouch'
  | 'Kg';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  supplier?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'MASUK' | 'KELUAR' | 'PENYESUAIAN';

export interface StockTransaction {
  id: string;
  referenceNo: string;
  date: string;
  type: TransactionType;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  sourceOrDestination: string; // Supplier for IN, Divisi/Pegawai for OUT, Alasan for PENYESUAIAN
  recipientOrSignee: string;   // Penanggung jawab / PIC
  notes?: string;
  stockBefore: number;
  stockAfter: number;
  createdAt: string;
}

export interface OpnameEntry {
  itemId: string;
  itemName: string;
  itemSku: string;
  unit: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  notes: string;
  checked: boolean;
}

export interface OpnameSession {
  id: string;
  referenceNo: string;
  title: string;
  date: string;
  officerName: string;
  notes?: string;
  status: 'DRAFT' | 'SELESAI';
  entries: OpnameEntry[];
  totalDiscrepancy: number;
  createdAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'items'
  | 'stock-in'
  | 'stock-out'
  | 'fuel-log'
  | 'opname'
  | 'reports'
  | 'scanner'
  | 'user-access';

export const VEHICLE_LIST = [
  'Inova Zennik BM 19',
  'Fortuner BM 1987 T',
  'Rush BM 1737 T',
  'Xpander BM 17 11 T',
  'Wuling BM 1888 T',
  'Inova BM 1679 TP',
  'Innova Reborn B 1932 PQS',
  'Nmax 4267 TP',
  'Vario BM 4612 TP',
] as const;

export interface FuelLogRecord {
  id: string;
  referenceNo: string;
  officerName: string;
  date: string;
  vehicleName: string;
  totalRupiah: number;
  totalLiters: number;
  odometerKm: number;
  notes?: string;
  createdAt: string;
}

export type UserRole = 'ADMIN' | 'PPNPN';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  username: string;
  department: string;
  avatarColor: string;
  nip?: string;
  email?: string;
  phone?: string;
  password?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  lastLogin?: string;
}

