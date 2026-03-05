const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");

/**
 * Customer Routes
 * Base path: /api/customers
 */

// GET all customers
router.get("/", customerController.getAllCustomers);

// GET single customer by ID
router.get("/:id", customerController.getCustomerById);

module.exports = router;
