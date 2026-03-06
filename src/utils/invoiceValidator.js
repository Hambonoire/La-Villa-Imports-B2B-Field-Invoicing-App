/**
 * Invoice Validation Utilities
 */

const pool = require('../config/database');

/**
 * Extract numeric sequence from invoice number
 */
function parseInvoiceNumber(invoiceNumber) {
  const match = invoiceNumber.match(/^INV-(\d{8})-(\d+)$/);
  if (!match) return null;
  
  return {
    date: match[1],
    sequence: parseInt(match[2], 10)
  };
}

/**
 * Validate if custom invoice number is sequential (checks database)
 */
async function validateSequential(customNumber) {
  try {
    // Get the last invoice for today
    const custom = parseInvoiceNumber(customNumber);
    if (!custom) {
      return { isValid: false, error: 'Invalid invoice number format' };
    }

    const result = await pool.query(
      `SELECT invoice_number FROM invoices 
       WHERE invoice_number LIKE $1 
       ORDER BY invoice_number DESC LIMIT 1`,
      [`INV-${custom.date}-%`]
    );

    if (result.rows.length === 0) {
      // First invoice of the day
      return { isValid: true };
    }

    const lastNumber = result.rows[0].invoice_number;
    const last = parseInvoiceNumber(lastNumber);

    const expectedSequence = last.sequence + 1;
    const expectedNext = `INV-${custom.date}-${String(expectedSequence).padStart(3, '0')}`;

    if (custom.sequence < last.sequence) {
      return {
        isValid: false,
        error: `Invoice number ${customNumber} is lower than the last invoice ${lastNumber}.`
      };
    }

    if (custom.sequence !== expectedSequence) {
      return {
        isValid: false,
        error: `Cannot skip sequence numbers. Expected ${expectedNext} but got ${customNumber}.`
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Validation error:', error);
    return { isValid: true }; // Allow on error
  }
}

module.exports = {
  parseInvoiceNumber,
  validateSequential
};
