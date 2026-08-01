import Dexie, { type Table } from "dexie";

export type OfflineLoanStatus = "BORROWED" | "RETURNED";
export type PendingSyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface CachedRecord<T = unknown> {
  key: string;
  data: T;
  updatedAt: string;
}

export interface PendingLoanTransaction {
  id?: number;
  clientId: string;
  tenantId: string;
  userId: string;
  bookId: string;
  loanId?: string;
  loanDate?: string;
  dueDate?: string;
  returnDate?: string;
  status: OfflineLoanStatus;
  condition?: string;
  studentName?: string;
  bookTitle?: string;
  statusSync: PendingSyncStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

class BibliotekaOfflineDB extends Dexie {
  cache!: Table<CachedRecord, string>;
  pendingLoanTransactions!: Table<PendingLoanTransaction, number>;

  constructor() {
    super("biblioteka-offline");

    this.version(1).stores({
      cache: "key, updatedAt",
      pendingLoanTransactions:
        "++id, clientId, tenantId, userId, bookId, loanId, status, statusSync, createdAt",
    });
  }
}

export const offlineDb = new BibliotekaOfflineDB();

export async function saveCache<T>(key: string, data: T) {
  await offlineDb.cache.put({
    key,
    data,
    updatedAt: new Date().toISOString(),
  });
}

export async function readCache<T>(key: string): Promise<T | null> {
  const cached = await offlineDb.cache.get(key);
  return cached ? (cached.data as T) : null;
}

export async function getPendingLoanTransactions() {
  return offlineDb.pendingLoanTransactions
    .where("statusSync")
    .anyOf("pending", "failed")
    .sortBy("createdAt");
}

export function createClientId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${random}`;
}
