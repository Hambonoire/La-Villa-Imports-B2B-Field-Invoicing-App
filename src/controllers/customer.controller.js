const woocommerceService = require("../services/woocommerce.service");

/**
 * Customer Controller
 * Handles HTTP requests related to customers
 */

/**
 * Get all customers
 * GET /api/customers
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const { per_page, page, search } = req.query;

    const params = {
      per_page: per_page || 100,
      page: page || 1,
    };

    if (search) {
      params.search = search;
    }

    const customers = await woocommerceService.getCustomers(params);

    res.json({
      success: true,
      count: customers.length,
      data: customers,
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
 * Get single customer by ID
 * GET /api/customers/:id
 */
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Valid customer ID is required",
      });
    }

    const customer = await woocommerceService.getCustomerById(parseInt(id));

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
