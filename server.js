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
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Updated path to wcClient
const wc = require("./src/services/wcClient");

app.get("/api/test-products", async (req, res) => {
  try {
    const response = await wc.get("products", { per_page: 5 });
    const products = response.data.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
    }));
    res.json(products);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "WooCommerce error" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`La Villa API running on http://localhost:${PORT}`);
});
