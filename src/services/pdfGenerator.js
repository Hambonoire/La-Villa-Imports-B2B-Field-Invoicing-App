const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PDFGenerator {
  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(invoice) {
    return new Promise((resolve, reject) => {
      try {
        // Ensure invoices directory exists
        const invoicesDir = path.join(process.cwd(), "invoices");
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const filename = `${invoice.invoiceNumber}.pdf`;
        const filepath = path.join(invoicesDir, filename);

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header - Company Info
        doc.fontSize(20).text("La Villa Imports", 50, 50);
        doc.fontSize(10).text("Premium Coffee & Fine Foods", 50, 75);
        doc.text("Conway, AR", 50, 90);
        doc.moveDown();

        // Invoice Title and Number
        doc.fontSize(24).text("INVOICE", 400, 50);
        doc.fontSize(12).text(`#${invoice.invoiceNumber}`, 400, 80);
        doc
          .fontSize(10)
          .text(
            `Date: ${new Date(invoice.date).toLocaleDateString()}`,
            400,
            100,
          );

        // Customer Information
        doc.fontSize(12).text("Bill To:", 50, 150);
        doc.fontSize(10);
        doc.text(invoice.customer.name, 50, 170);
        if (invoice.customer.company) {
          doc.text(invoice.customer.company, 50, 185);
        }
        if (invoice.customer.address) {
          const addr = invoice.customer.address;
          doc.text(addr.street, 50, 200);
          doc.text(`${addr.city}, ${addr.state} ${addr.postcode}`, 50, 215);
        }
        doc.text(invoice.customer.email, 50, 230);
        doc.text(invoice.customer.phone, 50, 245);

        // Items Table
        const tableTop = 300;
        doc.fontSize(12).text("Items", 50, tableTop);

        // Table Headers
        const itemY = tableTop + 20;
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("Product", 50, itemY);
        doc.text("Qty", 300, itemY);
        doc.text("Price", 360, itemY);
        doc.text("Total", 450, itemY);

        // Horizontal line under headers
        doc
          .moveTo(50, itemY + 15)
          .lineTo(550, itemY + 15)
          .stroke();

        // Items
        doc.font("Helvetica");
        let yPosition = itemY + 25;

        invoice.items.forEach((item) => {
          doc.text(item.productName, 50, yPosition, { width: 240 });
          doc.text(item.quantity.toString(), 300, yPosition);
          doc.text(`$${item.price.toFixed(2)}`, 360, yPosition);
          doc.text(`$${item.total.toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        });

        // Totals section
        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;

        const totalsX = 400;
        doc.font("Helvetica");
        doc.text("Subtotal:", totalsX, yPosition);
        doc.text(`$${invoice.subtotal.toFixed(2)}`, 480, yPosition);
        yPosition += 20;

        if (invoice.taxRate > 0) {
          doc.text(
            `Tax (${(invoice.taxRate * 100).toFixed(1)}%):`,
            totalsX,
            yPosition,
          );
          doc.text(`$${invoice.taxAmount.toFixed(2)}`, 480, yPosition);
          yPosition += 20;
        }

        doc.font("Helvetica-Bold").fontSize(12);
        doc.text("Total:", totalsX, yPosition);
        doc.text(`$${invoice.total.toFixed(2)}`, 480, yPosition);

        // Payment Terms
        yPosition += 40;
        if (invoice.paymentTerms) {
          doc.font("Helvetica").fontSize(10);
          doc.text("Payment Terms:", 50, yPosition);
          doc.text(invoice.paymentTerms.toUpperCase(), 150, yPosition);

          if (invoice.paymentTerms === "check" && invoice.checkNumber) {
            yPosition += 15;
            doc.text("Check Number:", 50, yPosition);
            doc.text(invoice.checkNumber, 150, yPosition);
          }
        }

        // Notes
        if (invoice.notes) {
          yPosition += 30;
          doc.fontSize(10).font("Helvetica-Bold");
          doc.text("Notes:", 50, yPosition);
          yPosition += 15;
          doc.font("Helvetica");
          doc.text(invoice.notes, 50, yPosition, { width: 500 });
        }

        // Footer
        doc.moveDown(2);
        const pageWidth = doc.page.width - 100; // Total width minus margins
        doc
          .fontSize(8)
          .text("Thank you for your business!", 50, doc.y, {
            align: "center",
            width: pageWidth,
          });

        // Finalize PDF
        doc.end();

        stream.on("finish", () => {
          resolve({ filepath, filename });
        });

        stream.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PDFGenerator();
