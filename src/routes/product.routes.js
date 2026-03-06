/**
 * Product Routes
 */

const router = require("router")();
const productController = require("../controllers/product.controller");

// GET all products - /api/products
router.get("/api/products", (req, res) => {
  productController.getAllProducts(req, res);
});

// GET single product by ID - /api/products/:id
router.get("/api/products/:id", (req, res) => {
  productController.getProductById(req, res);
});

module.exports = router;
