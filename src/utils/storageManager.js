const STORAGE_KEY = "offlineInvoiceQueue";

class StorageManager {
  loadQueue() {
    if (typeof window === "undefined" || !window.localStorage) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      return [];
    }
  }

  saveQueue(queue) {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }

  addToQueue(invoice) {
    const queue = this.loadQueue();
    const item = {
      id: invoice.id,
      payload: invoice.payload || invoice,
      status: "pending",
      createdAt: Date.now(),
    };
    queue.push(item);
    this.saveQueue(queue);
    return item;
  }

  getQueue() {
    return this.loadQueue();
  }

  markSynced(id) {
    const queue = this.loadQueue();
    const updated = queue.map((item) =>
      item.id === id
        ? { ...item, status: "synced", syncedAt: Date.now() }
        : item,
    );
    this.saveQueue(updated);
    return updated;
  }

  clearSynced() {
    const queue = this.loadQueue();
    const remaining = queue.filter((item) => item.status !== "synced");
    this.saveQueue(remaining);
    return remaining;
  }
}

module.exports = new StorageManager();
module.exports.STORAGE_KEY = STORAGE_KEY;
