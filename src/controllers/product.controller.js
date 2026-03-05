const woocommerceService = require("../services/woocommerce.service");

/**
 * Product Controller
 * Handles HTTP requests related to products
 */

/**
 * Get all products
 * GET /api/products
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { per_page, page, category, search } = req.query;

    const params = {
      per_page: per_page || 100,
      page: page || 1,
    };

    if (category) {
      params.category = category;
    }

    if (search) {
      params.search = search;
    }

    const products = await woocommerceService.getProducts(params);

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get single product by ID
 * GET /api/products/:id
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Valid product ID is required",
      });
    }

    const product = await woocommerceService.getProductById(parseInt(id));

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Search products by SKU
 * GET /api/products/sku/:sku
 */
exports.searchBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    if (!sku) {
      return res.status(400).json({
        success: false,
        error: "SKU is required",
      });
    }

    const products = await woocommerceService.searchProductBySku(sku);

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
