import api from "../api";
import {
  getPendingLoanTransactions,
  offlineDb,
  type OfflineLoanStatus,
  type PendingLoanTransaction,
} from "./db";

export interface QueueLoanInput {
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
  clientId: string;
}

export async function queueLoanTransaction(input: QueueLoanInput) {
  const now = new Date().toISOString();

  await offlineDb.pendingLoanTransactions.add({
    ...input,
    statusSync: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  });

  window.dispatchEvent(new CustomEvent("offline-sync-queue-changed"));
}

export async function syncPendingLoans() {
  if (!navigator.onLine) {
    return { processed: 0, skipped: true };
  }

  const tenantId = localStorage.getItem("tenantId");
  if (!tenantId) {
    return { processed: 0, skipped: true };
  }

  const pending = (await getPendingLoanTransactions()).filter((item) => item.tenantId === tenantId);
  if (pending.length === 0) {
    return { processed: 0, skipped: false };
  }

  const now = new Date().toISOString();
  const pendingIds = pending.map((item) => item.id).filter((id): id is number => typeof id === "number");

  await offlineDb.pendingLoanTransactions.bulkUpdate(
    pendingIds.map((id) => ({
      key: id,
      changes: { statusSync: "syncing", updatedAt: now },
    }))
  );

  try {
    const transactions = pending.map(toSyncPayload);
    const res = await api.post("/sync/loans", { tenantId, transactions });

    await offlineDb.pendingLoanTransactions.bulkUpdate(
      pendingIds.map((id) => ({
        key: id,
        changes: {
          statusSync: "synced",
          lastError: undefined,
          updatedAt: new Date().toISOString(),
        },
      }))
    );

    window.dispatchEvent(new CustomEvent("offline-sync-queue-changed"));
    return { processed: res.data?.processed ?? transactions.length, skipped: false };
  } catch (err: any) {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "No se pudo sincronizar";

    await offlineDb.pendingLoanTransactions.bulkUpdate(
      pending.map((item) => ({
        key: item.id!,
        changes: {
          statusSync: "failed",
          attempts: item.attempts + 1,
          lastError: message,
          updatedAt: new Date().toISOString(),
        },
      }))
    );

    window.dispatchEvent(new CustomEvent("offline-sync-queue-changed"));
    return { processed: 0, skipped: false, error: message };
  }
}

export async function getPendingLoansCount() {
  const tenantId = localStorage.getItem("tenantId");
  const pending = await getPendingLoanTransactions();
  return pending.filter((item) => !tenantId || item.tenantId === tenantId).length;
}

export async function listPendingLoansForUi() {
  const tenantId = localStorage.getItem("tenantId");
  const pending = await getPendingLoanTransactions();
  return pending.filter((item) => !tenantId || item.tenantId === tenantId);
}

function toSyncPayload(item: PendingLoanTransaction) {
  return {
    userId: item.userId,
    bookId: item.bookId,
    loanId: item.loanId,
    loanDate: item.loanDate,
    dueDate: item.dueDate,
    returnDate: item.returnDate,
    status: item.status,
  };
}
