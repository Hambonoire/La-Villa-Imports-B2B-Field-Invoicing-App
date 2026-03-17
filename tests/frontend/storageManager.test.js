const StorageManagerModule = require("../../src/utils/storageManager");
const StorageManager = StorageManagerModule;
const STORAGE_KEY = StorageManagerModule.STORAGE_KEY || "offlineInvoiceQueue";

// Simple localStorage mock for jsdom
beforeAll(() => {
  if (!global.window) {
    global.window = {};
  }
  if (!window.localStorage) {
    let store = {};
    const localStorageMock = {
      getItem: (key) => (key in store ? store[key] : null),
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: false,
    });
  }
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("Frontend StorageManager (browser)", () => {
  test("starts with empty queue when nothing stored", () => {
    expect(StorageManager.getQueue()).toEqual([]);
  });

  test("persists offline queue in localStorage without data loss", () => {
    const invoice = { id: "temp-1", payload: { total: 42 } };
    StorageManager.addToQueue(invoice);

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("temp-1");
    expect(parsed[0].status).toBe("pending");

    const queue = StorageManager.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].payload.total).toBe(42);
  });

  test("markSynced updates status without losing payload", () => {
    const invoice = { id: "temp-2", payload: { total: 99 } };
    StorageManager.addToQueue(invoice);

    StorageManager.markSynced("temp-2");
    const queue = StorageManager.getQueue();

    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe("temp-2");
    expect(queue[0].status).toBe("synced");
    expect(queue[0].payload.total).toBe(99);
  });

  test("clearSynced removes only synced items", () => {
    StorageManager.addToQueue({ id: "temp-3", payload: { total: 10 } });
    StorageManager.addToQueue({ id: "temp-4", payload: { total: 20 } });

    StorageManager.markSynced("temp-3");
    const remaining = StorageManager.clearSynced();

    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe("temp-4");

    const queue = StorageManager.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe("temp-4");
    expect(queue[0].status).toBe("pending");
  });
});
