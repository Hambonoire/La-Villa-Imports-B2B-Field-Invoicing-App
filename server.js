/**
 * La Villa B2B Invoice API Server
 * Main entry point
 */

require("dotenv/config");
const http = require("http");
const router = require("router")();
const finalhandler = require("finalhandler");
const bodyParser = require("body-parser");
const cors = require("cors");
const serveStatic = require("serve-static");
const url = require("url");

// Configuration
const PORT = process.env.PORT || 4000;

// CORS middleware
const corsMiddleware = cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Body parser middleware
const jsonParser = bodyParser.json();

// Query string parser middleware
const queryParser = (req, res, next) => {
  const parsedUrl = url.parse(req.url, true);
  req.query = parsedUrl.query || {};
  req.pathname = parsedUrl.pathname;
  next();
};

// Apply middleware
router.use((req, res, next) => {
  corsMiddleware(req, res, () => {
    jsonParser(req, res, () => {
      queryParser(req, res, next);
    });
  });
});

// Health check endpoint
router.get("/api/health", (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      success: true,
      message: "La Villa API is running",
      timestamp: new Date().toISOString(),
    }),
  );
});

// Import and register routes
const customerRoutes = require("./src/routes/customer.routes");
const productRoutes = require("./src/routes/product.routes");
const invoiceController = require("./src/controllers/invoice.controller");

router.use(customerRoutes);
router.use(productRoutes);

// Register invoice routes
router.get("/api/invoices/next-number", (req, res) => {
  invoiceController.getNextInvoiceNumber(req, res);
});
router.post("/api/invoices/calculate", (req, res) => {
  invoiceController.calculateInvoice(req, res);
});

router.post("/api/invoices/preview", (req, res) => {
  invoiceController.previewInvoice(req, res);
});

router.post("/api/invoices", (req, res) => {
  invoiceController.generateInvoice(req, res);
});

// Serve static files from public directory
const serve = serveStatic("public", { index: ["index.html"] });

// Create HTTP server
const server = http.createServer((req, res) => {
  // Try to serve static files first
  serve(req, res, () => {
    // If not a static file, use router
    router(req, res, finalhandler(req, res));
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 La Villa API running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Customers API: http://localhost:${PORT}/api/customers`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`🧾 Invoices API: http://localhost:${PORT}/api/invoices`);
});

// Error handling
server.on("error", (error) => {
  console.error("Server error:", error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});
