/**
 * Invoice Routes
 */

const router = require("router")();
const pool = require("../config/database");

// GET all invoices - /api/invoices
router.get("/api/invoices", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM invoices ORDER BY created_at DESC LIMIT 50",
    );

    // router's res supports res.json via connect-style helpers in your stack;
    // but to be extra safe, send explicitly:
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result.rows));
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Failed to fetch invoices" }));
  }
});

module.exports = router;
