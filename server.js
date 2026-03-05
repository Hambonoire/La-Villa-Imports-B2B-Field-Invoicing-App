require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static("public"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "La Villa B2B Invoicing API",
  });
});

// Import routes
const customerRoutes = require("./src/routes/customer.routes");
const productRoutes = require("./src/routes/product.routes");
const invoiceRoutes = require("./src/routes/invoice.routes");

// Mount routes
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);

// Generic 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 La Villa API running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Customers API: http://localhost:${PORT}/api/customers`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`🧾 Invoices API: http://localhost:${PORT}/api/invoices`);
});
