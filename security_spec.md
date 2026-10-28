# Security Specification — InventarisKu (barangpersediaan)

## 1. Data Invariants
1. **Master Gate & Schema Integrity**: Every document written to `/items/{itemId}`, `/transactions/{transactionId}`, `/opnames/{opnameId}`, `/fuelLogs/{fuelLogId}`, `/categories/{categoryId}`, and `/appUsers/{userId}` must strictly match its schema blueprint, required keys, allowed keys (`hasOnly`), string length bounds (`.size()`), and valid document ID pattern (`^[a-zA-Z0-9_\-]+$`).
2. **Role & Admin Authority**: Bootstrapped admin (`nauvalsdm82@gmail.com` with `email_verified == true`) and verified admins in `/admins/{uid}` have full administrative privileges.
3. **Immutability**: `id` and `createdAt` fields cannot be altered during updates (`incoming().id == existing().id && incoming().createdAt == existing().createdAt`).
4. **No Shadow Fields**: Any payload containing undeclared keys is rejected via `keys().hasOnly(...)`.

## 2. The "Dirty Dozen" Payloads
1. **Shadow Field Injection on Item Create**: `{ id: "item-1", sku: "SKU-1", name: "Kertas", category: "ATK", unit: "Rim", stock: 10, minStock: 2, unitPrice: 50000, createdAt: "2026-10-27", updatedAt: "2026-10-27", isSuperAdmin: true }` -> Rejected by `hasOnly()`.
2. **Oversized ID Poisoning**: Document ID of 500 characters -> Rejected by `isValidId()`.
3. **Negative Stock Value**: `{ stock: -50 }` on `/items/{itemId}` -> Rejected by `data.stock >= 0`.
4. **Invalid Transaction Type**: `{ type: "HACK" }` on `/transactions/{transactionId}` -> Rejected by `data.type in ['MASUK', 'KELUAR', 'PENYESUAIAN']`.
5. **Negative Fuel Rupiah / Liters**: `{ totalRupiah: -1000, totalLiters: 0 }` on `/fuelLogs/{fuelLogId}` -> Rejected by `data.totalRupiah > 0 && data.totalLiters > 0`.
6. **Immutable `createdAt` Tampering on Update**: Modifying `createdAt` on an existing item -> Rejected by `incoming().createdAt == existing().createdAt`.
7. **Immutable `id` Tampering on Update**: Modifying `id` on an existing fuel log -> Rejected by `incoming().id == existing().id`.
8. **String Overflow (Denial of Wallet)**: Sending a 10,000-character string in `notes` -> Rejected by `notes.size() <= 500`.
9. **Invalid Opname Status**: `{ status: "DELETED" }` on `/opnames/{opnameId}` -> Rejected by `data.status in ['DRAFT', 'SELESAI']`.
10. **Invalid User Role Escalation**: `{ role: "SUPERROOT" }` on `/appUsers/{userId}` -> Rejected by `data.role in ['ADMIN', 'PPNPN']`.
11. **Unverified Email Spoofing**: Token with `email == 'nauvalsdm82@gmail.com'` but `email_verified == false` -> Rejected by `request.auth.token.email_verified == true`.
12. **Arbitrary Unknown Collection Write**: Writing to `/unprotected/{docId}` -> Rejected by global default-deny catch-all `match /{document=**} { allow read, write: if false; }`.
