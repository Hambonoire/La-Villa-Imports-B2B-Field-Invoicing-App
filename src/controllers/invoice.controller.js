const path = require("path");
const fs = require("fs");
const invoiceNumberManager = require("../utils/invoiceNumberManager");
const pdfGenerator = require("../services/pdfGenerator");

/**
 * Invoice Controller
 * Handles invoice generation and management
 */

class InvoiceController {
  /**
   * Get next invoice number
   */
  async getNextInvoiceNumber(req, res) {
    try {
      const next = invoiceNumberManager.getNextInvoiceNumber();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            invoiceNumber: next.invoiceNumber,
            sequenceNumber: next.sequenceNumber,
          },
        }),
      );
    } catch (error) {
      console.error("Get next invoice number error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: `Failed to get next invoice number: ${error.message}`,
        }),
      );
    }
  }

  /**
   * Preview invoice before generation
   */
  async previewInvoice(req, res) {
    try {
      console.log("Preview invoice called");
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const {
        customer,
        items,
        taxRate,
        notes,
        paymentTerms,
        checkNumber,
        customInvoiceNumber,
      } = req.body;

      // Validate required fields
      if (!customer || !items || items.length === 0) {
        console.log("Validation failed:", { customer, items });
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: "Customer information and at least one item are required",
          }),
        );
        return;
      }

      console.log("Validation passed, generating preview...");

      // Generate or use custom invoice number
      let invoiceNumber;
      if (customInvoiceNumber) {
        if (!invoiceNumberManager.validateInvoiceNumber(customInvoiceNumber)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Invalid invoice number format. Use: INV-YYYYMMDD-XXXXXX",
            }),
          );
          return;
        }
        invoiceNumber = customInvoiceNumber;
      } else {
        const next = invoiceNumberManager.getNextInvoiceNumber();
        invoiceNumber = next.invoiceNumber;
      }

      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Calculate totals
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const tax = subtotal * (taxRate || 0);
      const total = subtotal + tax;

      console.log("Totals calculated:", { subtotal, tax, total });

      // Format preview data
      const preview = {
        invoiceNumber,
        date: currentDate,
        customer: {
          name: customer.name,
          company: customer.company || "",
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        },
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName || "Product",
          quantity: item.quantity,
          unitPrice: `$${item.price.toFixed(2)}`,
          lineTotal: `$${(item.price * item.quantity).toFixed(2)}`,
        })),
        subtotal: `$${subtotal.toFixed(2)}`,
        taxRate: taxRate || 0,
        taxAmount: `$${tax.toFixed(2)}`,
        total: `$${total.toFixed(2)}`,
        notes: notes || "",
        paymentTerms: paymentTerms || "",
        checkNumber: checkNumber || "",
      };

      console.log("Preview generated successfully");

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          data: preview,
        }),
      );
    } catch (error) {
      console.error("Preview invoice error:", error);
      console.error("Error stack:", error.stack);

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: `Failed to generate preview: ${error.message}`,
        }),
      );
    }
  }

  /**
   * Generate and save invoice
   */
  async generateInvoice(req, res) {
    try {
      const {
        customer,
        items,
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes,
        paymentTerms,
        checkNumber,
        customInvoiceNumber,
      } = req.body;

      // Validate required fields
      if (!customer || !items || items.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: "Customer information and at least one item are required",
          }),
        );
        return;
      }

      // Generate or use custom invoice number and increment counter
      let invoiceNumber;
      if (customInvoiceNumber) {
        if (!invoiceNumberManager.validateInvoiceNumber(customInvoiceNumber)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Invalid invoice number format. Use: INV-YYYYMMDD-XXXXXX",
            }),
          );
          return;
        }
        invoiceNumber = customInvoiceNumber;
      } else {
        invoiceNumber = invoiceNumberManager.incrementCounter();
      }

      const currentDate = new Date().toISOString();

      const invoice = {
        invoiceNumber,
        date: currentDate,
        customer: {
          id: customer.id,
          name: customer.name,
          company: customer.company || "",
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        },
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName || "Product",
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal:
          subtotal ||
          items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        taxRate: taxRate || 0,
        taxAmount: taxAmount || 0,
        total: total || 0,
        notes: notes || "",
        paymentTerms: paymentTerms || "",
        checkNumber: checkNumber || "",
        status: "generated",
        createdAt: new Date(),
      };

      // Generate PDF
      console.log("📝 Generating invoice PDF:", invoiceNumber);
      const { filepath, filename } =
        await pdfGenerator.generateInvoicePDF(invoice);
      console.log("✅ PDF generated:", filepath);
      console.log("Customer:", customer.name);
      console.log("Total:", `$${invoice.total.toFixed(2)}`);
      console.log("Payment Terms:", paymentTerms);

      // TODO: Save invoice data to database

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            ...invoice,
            pdfPath: filepath,
            pdfFilename: filename,
          },
        }),
      );
    } catch (error) {
      console.error("Generate invoice error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: `Failed to generate invoice: ${error.message}`,
        }),
      );
    }
  }

  /**
   * Get invoice PDF for viewing/printing
   */
  async getInvoicePDF(req, res) {
    try {
      const { invoiceNumber } = req.params;

      if (!invoiceNumber) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: "Invoice number is required",
          }),
        );
        return;
      }

      const filepath = path.join(
        process.cwd(),
        "invoices",
        `${invoiceNumber}.pdf`,
      );

      // Check if file exists
      if (!fs.existsSync(filepath)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: "Invoice not found",
          }),
        );
        return;
      }

      // Serve the PDF file
      const stat = fs.statSync(filepath);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Length": stat.size,
        "Content-Disposition": `inline; filename="${invoiceNumber}.pdf"`,
      });

      const readStream = fs.createReadStream(filepath);
      readStream.pipe(res);
    } catch (error) {
      console.error("Get invoice PDF error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: `Failed to retrieve invoice: ${error.message}`,
        }),
      );
    }
  }

  /**
   * Calculate invoice totals
   */
  async calculateInvoice(req, res) {
    try {
      const { items, taxRate } = req.body;

      if (!items || items.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: "At least one item is required",
          }),
        );
        return;
      }

      const subtotal = items.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);

      const tax = subtotal * (taxRate || 0);
      const total = subtotal + tax;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          data: {
            subtotal: subtotal.toFixed(2),
            taxAmount: tax.toFixed(2),
            total: total.toFixed(2),
          },
        }),
      );
    } catch (error) {
      console.error("Calculate invoice error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: `Failed to calculate totals: ${error.message}`,
        }),
      );
    }
  }
}

module.exports = new InvoiceController();
