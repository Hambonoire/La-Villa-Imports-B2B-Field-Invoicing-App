const pool = require("../config/database");

/**
 * Get all products
 */
exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price, category, sku
       FROM products 
       ORDER BY name ASC`
    );

    // Transform data to ensure price is a number
    const products = result.rows.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      category: product.category,
      sku: product.sku
    }));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: true,
      data: products,
    }));
  } catch (error) {
    console.error("Controller error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: false,
      error: "Failed to fetch products",
    }));
  }
};

/**
 * Get product by ID
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, description, price, category, sku
       FROM products 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        success: false,
        error: "Product not found",
      }));
      return;
    }

    const product = result.rows[0];

    // Transform data to ensure price is a number
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      category: product.category,
      sku: product.sku
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: true,
      data: transformedProduct,
    }));
  } catch (error) {
    console.error("Controller error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: false,
      error: "Failed to fetch product",
    }));
  }
};
