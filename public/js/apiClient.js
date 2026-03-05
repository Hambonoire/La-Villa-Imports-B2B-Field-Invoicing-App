/**
 * API Client
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = "http://localhost:4000/api";

const apiClient = {
  /**
   * Generic GET request
   */
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API GET Error:", error);
      throw error;
    }
  },

  /**
   * Generic POST request
   */
  async post(endpoint, body) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API POST Error:", error);
      throw error;
    }
  },

  /**
   * Search customers
   */
  async searchCustomers(searchTerm) {
    return this.get(`/customers?search=${encodeURIComponent(searchTerm)}`);
  },

  /**
   * Get customer by ID
   */
  async getCustomer(customerId) {
    return this.get(`/customers/${customerId}`);
  },

  /**
   * Search products
   */
  async searchProducts(searchTerm) {
    return this.get(`/products?search=${encodeURIComponent(searchTerm)}`);
  },

  /**
   * Get all products
   */
  async getAllProducts() {
    return this.get("/products");
  },

  /**
   * Get product by ID
   */
  async getProduct(productId) {
    return this.get(`/products/${productId}`);
  },

  /**
   * Calculate invoice totals
   */
  async calculateInvoice(items, taxRate) {
    return this.post("/invoices/calculate", { items, taxRate });
  },

  /**
   * Preview invoice
   */
  async previewInvoice(invoiceData) {
    return this.post("/invoices/preview", invoiceData);
  },

  /**
   * Generate final invoice
   */
  async generateInvoice(invoiceData) {
    return this.post("/invoices", invoiceData);
  },
};
