import { syncPendingLoans } from "./syncLoans";

let registered = false;

export function registerOfflineSync() {
  if (registered || typeof window === "undefined") return;
  registered = true;

  const sync = () => {
    syncPendingLoans().catch((err) => {
      console.warn("No se pudo sincronizar la cola offline", err);
    });
  };

  window.addEventListener("online", sync);
  window.addEventListener("focus", sync);

  if (navigator.onLine) {
    sync();
  }
}
