const invoiceService = require("../services/invoice.service");

/**
 * Invoice Controller
 * Handles HTTP requests related to invoices
 */

/**
 * Create/generate a new invoice
 * POST /api/invoices
 * Body: { customerId, items: [{productId, quantity, price}], notes, taxRate }
 */
exports.createInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    // Generate the invoice
    const invoice = await invoiceService.generateInvoice(invoiceData);

    // Validate the generated invoice
    const validation = invoiceService.validateInvoice(invoice);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get formatted invoice for display
 * POST /api/invoices/preview
 * Body: { customerId, items: [{productId, quantity, price}], notes, taxRate }
 */
exports.previewInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    // Generate the invoice
    const invoice = await invoiceService.generateInvoice(invoiceData);

    // Format for display
    const formatted = invoiceService.formatInvoiceForDisplay(invoice);

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Calculate invoice totals without full generation
 * POST /api/invoices/calculate
 * Body: { items: [{productId, quantity, price}], taxRate }
 */
exports.calculateTotals = async (req, res) => {
  try {
    const { items, taxRate = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Items array is required",
      });
    }

    // Build invoice items (fetch product details)
    const invoiceItems = await invoiceService.buildInvoiceItems(items);

    // Calculate totals
    const calculations = invoiceService.calculateTotals(invoiceItems, taxRate);

    res.json({
      success: true,
      data: {
        items: invoiceItems,
        ...calculations,
      },
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
