const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoice.controller");

/**
 * Invoice Routes
 * Base path: /api/invoices
 */

// POST - Create new invoice
router.post("/", invoiceController.createInvoice);

// POST - Preview invoice with formatting
router.post("/preview", invoiceController.previewInvoice);

// POST - Calculate totals only
router.post("/calculate", invoiceController.calculateTotals);

module.exports = router;
