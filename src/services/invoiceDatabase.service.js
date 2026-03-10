const pool = require("../config/database");

/**
 * Invoice Database Service
 * Handles all invoice database operations
 */
class InvoiceDatabaseService {
  /**
   * Save invoice to database
   */
  async saveInvoice(invoice, isCustomNumber = false) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          invoice_number, customer_id, invoice_date, 
          subtotal, tax_rate, tax_amount, total, 
          notes, payment_terms, check_number, is_custom_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          invoice.invoiceNumber,
          invoice.customer.id,
          invoice.date,
          invoice.subtotal,
          invoice.taxRate,
          invoice.taxAmount,
          invoice.total,
          invoice.notes,
          invoice.paymentTerms || null,
          invoice.checkNumber || null,
          isCustomNumber,
        ],
      );

      const invoiceId = invoiceResult.rows[0].id;

      // Insert invoice items
      for (const item of invoice.items) {
        await client.query(
          `INSERT INTO invoice_items (
            invoice_id, product_id, product_name, 
            quantity, unit_price, line_total
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            invoiceId,
            item.productId,
            item.productName,
            item.quantity,
            item.price,
            item.total,
          ],
        );
      }

      await client.query("COMMIT");
      return invoiceId;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get last custom invoice number
   */
  async getLastCustomInvoiceNumber() {
    try {
      const result = await pool.query(
        `SELECT invoice_number 
       FROM invoices 
       ORDER BY created_at DESC 
       LIMIT 1`,
      );

      return result.rows.length > 0 ? result.rows[0].invoice_number : null;
    } catch (error) {
      console.error("Error getting last custom invoice number:", error);
      throw error;
    }
  }

  /**
   * Check if invoice number already exists
   */
  async invoiceNumberExists(invoiceNumber) {
    try {
      const result = await pool.query(
        "SELECT id FROM invoices WHERE invoice_number = $1",
        [invoiceNumber],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking invoice number:", error);
      throw error;
    }
  }
  /**
   * Get last invoice number (custom or auto) for sequential validation
   */
  async getLastInvoiceNumber() {
    try {
      const result = await pool.query(
        `SELECT invoice_number, is_custom_number 
         FROM invoices 
         ORDER BY created_at DESC 
         LIMIT 1`,
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Error getting last invoice number:", error);
      throw error;
    }
  }
}
module.exports = new InvoiceDatabaseService();
