const woocommerceService = require("./woocommerce.service");

/**
 * Invoice Service
 * Handles invoice generation and calculations
 */

class InvoiceService {
  /**
   * Generate a new invoice
   * @param {Object} invoiceData - Invoice creation data
   * @param {Number} invoiceData.customerId - WooCommerce customer ID
   * @param {Array} invoiceData.items - Array of {productId, quantity, price (optional)}
   * @param {String} invoiceData.notes - Optional invoice notes
   * @param {Number} invoiceData.taxRate - Optional tax rate (default 0)
   * @returns {Promise<Object>} Generated invoice object
   */
  async generateInvoice(invoiceData) {
    try {
      const { customerId, items, notes = "", taxRate = 0 } = invoiceData;

      // Validate input
      if (!customerId || !items || items.length === 0) {
        throw new Error("Customer ID and at least one item are required");
      }

      // Fetch customer details
      const customer = await woocommerceService.getCustomerById(customerId);

      // Fetch product details for all items
      const invoiceItems = await this.buildInvoiceItems(items);

      // Calculate totals
      const calculations = this.calculateTotals(invoiceItems, taxRate);

      // Build complete invoice object
      const invoice = {
        invoiceNumber: this.generateInvoiceNumber(),
        date: new Date().toISOString(),
        status: "draft",
        customer: {
          id: customer.id,
          name: customer.fullName,
          company: customer.company,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        },
        items: invoiceItems,
        subtotal: calculations.subtotal,
        taxRate: taxRate,
        taxAmount: calculations.taxAmount,
        total: calculations.total,
        notes: notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return invoice;
    } catch (error) {
      console.error("Error generating invoice:", error);
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  /**
   * Build invoice items with product details
   * @param {Array} items - Array of {productId, quantity, price (optional)}
   * @returns {Promise<Array>} Array of formatted invoice items
   */
  async buildInvoiceItems(items) {
    const invoiceItems = [];

    for (const item of items) {
      const { productId, quantity, price } = item;

      if (!productId || !quantity || quantity <= 0) {
        throw new Error("Each item must have a valid productId and quantity");
      }

      // Fetch product details
      const product = await woocommerceService.getProductById(productId);

      // Use custom price if provided, otherwise use product price
      const unitPrice = price !== undefined ? parseFloat(price) : product.price;
      const lineTotal = unitPrice * quantity;

      invoiceItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: quantity,
        unitPrice: unitPrice,
        lineTotal: lineTotal,
        description: product.shortDescription || "",
      });
    }

    return invoiceItems;
  }

  /**
   * Calculate invoice totals
   * @param {Array} items - Array of invoice items
   * @param {Number} taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
   * @returns {Object} Calculation results
   */
  calculateTotals(items, taxRate = 0) {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  }

  /**
   * Generate unique invoice number
   * Format: INV-YYYYMMDD-XXXXX
   * @returns {String} Invoice number
   */
  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, "0");

    return `INV-${year}${month}${day}-${random}`;
  }

  /**
   * Validate invoice data
   * @param {Object} invoice - Invoice object to validate
   * @returns {Object} Validation result {valid: Boolean, errors: Array}
   */
  validateInvoice(invoice) {
    const errors = [];

    if (!invoice.customer || !invoice.customer.id) {
      errors.push("Customer information is required");
    }

    if (!invoice.items || invoice.items.length === 0) {
      errors.push("At least one item is required");
    }

    if (invoice.total <= 0) {
      errors.push("Invoice total must be greater than zero");
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Format invoice for display/PDF
   * @param {Object} invoice - Invoice object
   * @returns {Object} Formatted invoice
   */
  formatInvoiceForDisplay(invoice) {
    return {
      ...invoice,
      date: new Date(invoice.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      subtotal: `$${invoice.subtotal.toFixed(2)}`,
      taxAmount: `$${invoice.taxAmount.toFixed(2)}`,
      total: `$${invoice.total.toFixed(2)}`,
      items: invoice.items.map((item) => ({
        ...item,
        unitPrice: `$${item.unitPrice.toFixed(2)}`,
        lineTotal: `$${item.lineTotal.toFixed(2)}`,
      })),
    };
  }
}

module.exports = new InvoiceService();
