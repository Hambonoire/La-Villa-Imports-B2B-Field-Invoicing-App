// src/services/sync.service.js

const invoiceNumberManager = require("../utils/invoiceNumberManager");
const remoteInvoiceApi = require("./remoteInvoiceApi");

class SyncService {
  /**
   * Sync a batch of pending offline invoices.
   * @param {Array<{id: string, payload: object}>} queue
   * @param {import('pg').Pool} pool
   * @returns {Promise<{successIds: string[], failedIds: string[], skippedIds: string[]}>}
   */
  static async syncPendingInvoices(queue, pool) {
    const successIds = [];
    const failedIds = [];
    const skippedIds = [];

    for (const item of queue) {
      const tempId = item.id;
      const payload = item.payload || {};

      // Idempotency check: if an invoice already exists for this customer and total
      // with a recent date, treat it as already synced.
      const alreadyExists = await this._findExistingInvoiceForPayload(
        payload,
        pool,
      );
      if (alreadyExists) {
        skippedIds.push(tempId);
        continue;
      }

      // Generate invoice number
      const invoiceNumber = invoiceNumberManager.incrementCounter();

      // Build DB payload
      const {
        customer_id,
        subtotal,
        tax_rate = 0,
        tax_amount = 0,
        total,
        notes = null,
        payment_terms = null,
        check_number = null,
      } = payload;

      const invoiceDate = payload.invoice_date || new Date();

      try {
        // Call remote API
        const remote = await remoteInvoiceApi.createRemoteInvoice({
          ...payload,
          invoice_number: invoiceNumber,
        });

        // Insert into invoices table
        await pool.query(
          `
          INSERT INTO invoices (
            invoice_number,
            customer_id,
            invoice_date,
            subtotal,
            tax_rate,
            tax_amount,
            total,
            notes,
            payment_terms,
            check_number,
            woocommerce_order_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `,
          [
            invoiceNumber,
            customer_id,
            invoiceDate,
            subtotal,
            tax_rate,
            tax_amount,
            total,
            notes,
            payment_terms,
            check_number,
            remote?.id || null,
          ],
        );

        successIds.push(tempId);
      } catch (err) {
        // Unique violation on invoice_number → treat as already synced/duplicate
        if (err.code === "23505") {
          skippedIds.push(tempId);
        } else {
          failedIds.push(tempId);
        }
      }
    }

    return { successIds, failedIds, skippedIds };
  }

  /**
   * Basic idempotency helper:
   * Try to detect an existing invoice that matches this payload enough
   * to consider it already synced.
   */
  static async _findExistingInvoiceForPayload(payload, pool) {
    const { customer_id, total } = payload;
    if (!customer_id || total == null) return null;

    const res = await pool.query(
      `
      SELECT id
      FROM invoices
      WHERE customer_id = $1
        AND total = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [customer_id, total],
    );

    return res.rows[0] || null;
  }
}

module.exports = SyncService;
