const pool = require("../config/database");

/**
 * Get all customers with pagination
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const { per_page = 50, page = 1 } = req.query || {};
    const limit = parseInt(per_page);
    const offset = (parseInt(page) - 1) * limit;

    const countResult = await pool.query(
      "SELECT COUNT(*) as total FROM customers"
    );
    const total = parseInt(countResult.rows[0].total);

    const result = await pool.query(
      `SELECT id, name, company, email, phone, address, city, state, zip
       FROM customers 
       ORDER BY name ASC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Transform data to match frontend expectations
    const customers = result.rows.map(customer => ({
      id: customer.id,
      name: customer.name,
      company: customer.company,
      email: customer.email,
      phone: customer.phone,
      address: {
        street: customer.address,
        city: customer.city,
        state: customer.state,
        postcode: customer.zip
      }
    }));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: true,
      data: customers,
      pagination: {
        total,
        per_page: limit,
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    console.error("Controller error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: false,
      error: "Failed to fetch customers",
    }));
  }
};

/**
 * Get customer by ID
 */
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, company, email, phone, address, city, state, zip
       FROM customers 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        success: false,
        error: "Customer not found",
      }));
      return;
    }

    const customer = result.rows[0];

    // Transform data to match frontend expectations
    const transformedCustomer = {
      id: customer.id,
      name: customer.name,
      company: customer.company,
      email: customer.email,
      phone: customer.phone,
      address: {
        street: customer.address,
        city: customer.city,
        state: customer.state,
        postcode: customer.zip
      }
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: true,
      data: transformedCustomer,
    }));
  } catch (error) {
    console.error("Controller error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      success: false,
      error: "Failed to fetch customer",
    }));
  }
};
