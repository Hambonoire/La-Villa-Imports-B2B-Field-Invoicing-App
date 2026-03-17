// tests/integration/sync.service.test.js

const { Pool } = require("pg");
const invoiceNumberManager = require("../../src/utils/invoiceNumberManager");
const SyncService = require("../../src/services/sync.service");
const remoteInvoiceApi = require("../../src/services/remoteInvoiceApi");

jest.mock("../../src/services/remoteInvoiceApi");

let pool;

beforeAll(async () => {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  // Clear invoices (and items if needed) to isolate tests
  await pool.query("DELETE FROM invoice_items");
  await pool.query("DELETE FROM invoices");
  jest.clearAllMocks();
});

describe("SyncService integration", () => {
  test("processes all pending invoices exactly once", async () => {
    const queue = [
      {
        id: "temp-1",
        payload: { customer_id: 1, subtotal: 10, tax_rate: 0, total: 10 },
      },
      {
        id: "temp-2",
        payload: { customer_id: 2, subtotal: 20, tax_rate: 0, total: 20 },
      },
    ];

    remoteInvoiceApi.createRemoteInvoice
      .mockResolvedValueOnce({ id: 1001 })
      .mockResolvedValueOnce({ id: 1002 });

    const result = await SyncService.syncPendingInvoices(queue, pool);

    expect(result.successIds).toEqual(["temp-1", "temp-2"]);
    expect(result.failedIds).toEqual([]);

    const rows = await pool.query("SELECT invoice_number FROM invoices");
    expect(rows.rowCount).toBe(2);
  });

  test("is idempotent for same offline entries using invoice_number uniqueness", async () => {
    const queue = [
      {
        id: "temp-3",
        payload: { customer_id: 1, subtotal: 30, tax_rate: 0, total: 30 },
      },
    ];

    remoteInvoiceApi.createRemoteInvoice.mockResolvedValue({ id: 2001 });

    const first = await SyncService.syncPendingInvoices(queue, pool);
    const second = await SyncService.syncPendingInvoices(queue, pool);

    expect(first.successIds).toEqual(["temp-3"]);
    expect(second.successIds).toEqual([]);
    expect(second.skippedIds).toEqual(["temp-3"]);

    const rows = await pool.query("SELECT invoice_number FROM invoices");
    expect(rows.rowCount).toBe(1);
  });

  test("concurrent syncs do not create duplicate invoice numbers", async () => {
    const queue = [
      {
        id: "temp-4",
        payload: { customer_id: 1, subtotal: 40, tax_rate: 0, total: 40 },
      },
    ];

    remoteInvoiceApi.createRemoteInvoice.mockResolvedValue({ id: 3001 });

    const [res1, res2] = await Promise.all([
      SyncService.syncPendingInvoices(queue, pool),
      SyncService.syncPendingInvoices(queue, pool),
    ]);

    const successCount =
      (res1.successIds.includes("temp-4") ? 1 : 0) +
      (res2.successIds.includes("temp-4") ? 1 : 0);

    expect(successCount).toBe(1);

    const rows = await pool.query("SELECT invoice_number FROM invoices");
    expect(rows.rowCount).toBe(1);
  });

  test("failed sync leaves invoices uncreated (no silent data loss)", async () => {
    const queue = [
      {
        id: "temp-5",
        payload: { customer_id: 3, subtotal: 50, tax_rate: 0, total: 50 },
      },
    ];

    remoteInvoiceApi.createRemoteInvoice.mockRejectedValue(
      new Error("Network error"),
    );

    const result = await SyncService.syncPendingInvoices(queue, pool);

    expect(result.successIds).toEqual([]);
    expect(result.failedIds).toEqual(["temp-5"]);

    const rows = await pool.query("SELECT * FROM invoices");
    expect(rows.rowCount).toBe(0);
  });

  test("partial failures only persist successful invoices", async () => {
    const queue = [
      {
        id: "temp-6",
        payload: { customer_id: 1, subtotal: 60, tax_rate: 0, total: 60 },
      },
      {
        id: "temp-7",
        payload: { customer_id: 2, subtotal: 70, tax_rate: 0, total: 70 },
      },
    ];

    remoteInvoiceApi.createRemoteInvoice
      .mockResolvedValueOnce({ id: 4001 }) // temp-6 succeeds
      .mockRejectedValueOnce(new Error("Remote validation error")); // temp-7 fails

    const result = await SyncService.syncPendingInvoices(queue, pool);

    expect(result.successIds).toEqual(["temp-6"]);
    expect(result.failedIds).toEqual(["temp-7"]);

    const rows = await pool.query("SELECT invoice_number FROM invoices");
    expect(rows.rowCount).toBe(1);
  });

  test("already synced invoices are skipped on subsequent runs", async () => {
    const queue = [
      {
        id: "temp-8",
        payload: { customer_id: 4, subtotal: 80, tax_rate: 0, total: 80 },
      },
    ];

    remoteInvoiceApi.createRemoteInvoice.mockResolvedValueOnce({ id: 5001 });

    await SyncService.syncPendingInvoices(queue, pool);

    remoteInvoiceApi.createRemoteInvoice.mockClear();

    const result = await SyncService.syncPendingInvoices(queue, pool);

    expect(remoteInvoiceApi.createRemoteInvoice).not.toHaveBeenCalled();
    expect(result.successIds).toEqual([]);
    expect(result.skippedIds).toEqual(["temp-8"]);
  });

  test("assigns unique, valid invoice numbers from invoiceNumberManager", async () => {
    jest.spyOn(invoiceNumberManager, "incrementCounter");

    const queue = [
      {
        id: "temp-9",
        payload: { customer_id: 5, subtotal: 90, tax_rate: 0, total: 90 },
      },
      {
        id: "temp-10",
        payload: { customer_id: 6, subtotal: 100, tax_rate: 0, total: 100 },
      },
    ];

    remoteInvoiceApi.createRemoteInvoice
      .mockResolvedValueOnce({ id: 6001 })
      .mockResolvedValueOnce({ id: 6002 });

    await SyncService.syncPendingInvoices(queue, pool);

    expect(invoiceNumberManager.incrementCounter).toHaveBeenCalledTimes(2);

    const rows = await pool.query("SELECT invoice_number FROM invoices");
    expect(rows.rowCount).toBe(2);
    for (const row of rows.rows) {
      expect(row.invoice_number).toMatch(/^INV-\d{8}-\d{3}$/);
    }
  });
});
