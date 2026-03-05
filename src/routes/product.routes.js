const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");

/**
 * Product Routes
 * Base path: /api/products
 */

// GET all products
router.get("/", productController.getAllProducts);

// GET product by SKU (must come before /:id to avoid conflicts)
router.get("/sku/:sku", productController.searchBySku);

// GET single product by ID
router.get("/:id", productController.getProductById);

module.exports = router;
