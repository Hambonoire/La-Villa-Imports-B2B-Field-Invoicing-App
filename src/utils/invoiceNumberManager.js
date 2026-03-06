const fs = require('fs');
const path = require('path');

const COUNTER_FILE = path.join(__dirname, '../data/invoice-counter.json');

class InvoiceNumberManager {
  constructor() {
    this.ensureCounterFile();
  }

  /**
   * Ensure counter file exists
   */
  ensureCounterFile() {
    const dir = path.dirname(COUNTER_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(COUNTER_FILE)) {
      this.saveCounter({ lastInvoiceNumber: 0, lastInvoiceDate: null });
    }
  }

  /**
   * Read counter from file
   */
  readCounter() {
    try {
      const data = fs.readFileSync(COUNTER_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading counter file:', error);
      return { lastInvoiceNumber: 0, lastInvoiceDate: null };
    }
  }

  /**
   * Save counter to file
   */
  saveCounter(data) {
    try {
      fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving counter file:', error);
    }
  }

  /**
   * Get next sequential invoice number
   */
  getNextInvoiceNumber() {
    const counter = this.readCounter();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;

    // Check if date changed - if so, reset counter
    const lastDate = counter.lastInvoiceDate;
    let nextNumber;

    if (lastDate === dateString) {
      nextNumber = counter.lastInvoiceNumber + 1;
    } else {
      nextNumber = 1;
    }

    const invoiceNumber = `INV-${dateString}-${String(nextNumber).padStart(3, '0')}`;

    return {
      invoiceNumber,
      sequenceNumber: nextNumber,
      date: dateString
    };
  }

  /**
   * Increment and save the counter
   */
  incrementCounter() {
    const next = this.getNextInvoiceNumber();
    this.saveCounter({
      lastInvoiceNumber: next.sequenceNumber,
      lastInvoiceDate: next.date
    });
    return next.invoiceNumber;
  }

  /**
   * Validate custom invoice number format
   */
  validateInvoiceNumber(invoiceNumber) {
    // Format: INV-YYYYMMDD-XXXXXX
    const pattern = /^INV-\d{8}-\d{1,6}$/;
    return pattern.test(invoiceNumber);
  }
}

module.exports = new InvoiceNumberManager();
