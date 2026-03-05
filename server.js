require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static("public"));

// Simple health check
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

// Mount routes
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);

// 404 handler for undefined API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found",
  });
});

// //Updated path to wcClient
// const wc = require("./src/services/wcClient"); //Check if these need to be reomoved or included

// app.get("/api/test-products", async (req, res) => {
//   try {
//     const response = await wc.get("products", { per_page: 5 });
//     const products = response.data.map((p) => ({
//       id: p.id,
//       name: p.name,
//       sku: p.sku,
//       price: p.price,
//     }));
//     res.json(products);
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).json({ error: "WooCommerce error" });
//   }
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 La Villa API running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Customers API: http://localhost:${PORT}/api/customers`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
});
