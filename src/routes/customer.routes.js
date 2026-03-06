/**
 * Customer Routes
 */

const router = require("router")();
const customerController = require("../controllers/customer.controller");

// GET all customers - /api/customers
router.get("/api/customers", (req, res) => {
  customerController.getAllCustomers(req, res);
});

// GET single customer by ID - /api/customers/:id
router.get("/api/customers/:id", (req, res) => {
  customerController.getCustomerById(req, res);
});

module.exports = router;
