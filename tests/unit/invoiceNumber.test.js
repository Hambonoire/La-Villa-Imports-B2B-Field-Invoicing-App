const manager = require("../../src/utils/invoiceNumberManager");
const fs = require("fs");
const path = require("path");

const COUNTER_FILE = path.join(
  __dirname,
  "../../src/data/invoice-counter.json",
);

beforeEach(() => {
  // Reset counter before each test
  if (fs.existsSync(COUNTER_FILE)) {
    fs.writeFileSync(
      COUNTER_FILE,
      JSON.stringify({ lastInvoiceNumber: 0, lastInvoiceDate: null }, null, 2),
    );
  }
});

describe("InvoiceNumberManager", () => {
  test("getNextInvoiceNumber returns correct format INV-YYYYMMDD-NNN", () => {
    const result = manager.getNextInvoiceNumber();
    expect(result.invoiceNumber).toMatch(/^INV-\d{8}-\d{3}$/);
  });

  test("first invoice number has sequence 001", () => {
    const result = manager.getNextInvoiceNumber();
    expect(result.sequenceNumber).toBe(1);
    expect(result.invoiceNumber).toMatch(/-001$/);
  });

  test("incrementCounter advances sequence monotonically", () => {
    const first = manager.incrementCounter();
    const second = manager.incrementCounter();
    const third = manager.incrementCounter();
    const nums = [first, second, third].map((n) => parseInt(n.split("-")[2]));
    expect(nums).toEqual([1, 2, 3]);
  });

  test("no duplicate numbers on rapid sequential calls", () => {
    const results = Array.from({ length: 10 }, () =>
      manager.incrementCounter(),
    );
    const unique = new Set(results);
    expect(unique.size).toBe(10);
  });

  test("validateInvoiceNumber accepts valid format", () => {
    expect(manager.validateInvoiceNumber("INV-20260316-001")).toBe(true);
    expect(manager.validateInvoiceNumber("INV-20260316-123456")).toBe(true);
  });

  test("validateInvoiceNumber rejects malformed strings", () => {
    expect(manager.validateInvoiceNumber("INV-2026-001")).toBe(false);
    expect(manager.validateInvoiceNumber("inv-20260316-001")).toBe(false);
    expect(manager.validateInvoiceNumber("")).toBe(false);
    expect(manager.validateInvoiceNumber("20260316-001")).toBe(false);
  });
});
