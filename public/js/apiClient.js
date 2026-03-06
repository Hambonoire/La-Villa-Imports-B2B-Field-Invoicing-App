const apiClient = {
  async get(endpoint) {
    const response = await fetch(endpoint);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      console.error('API Error:', error);
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      console.error('API Error:', error);
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Get next invoice number
   */
  async getNextInvoiceNumber() {
    return this.get("/api/invoices/next-number");
  },

  /**
   * Get customer by ID
   */
  async getCustomer(customerId) {
    return this.get(`/api/customers/${customerId}`);
  },

  /**
   * Get all products
   */
  async getAllProducts() {
    return this.get("/api/products");
  },

  /**
   * Get product by ID
   */
  async getProduct(productId) {
    return this.get(`/api/products/${productId}`);
  },

  /**
   * Calculate invoice totals
   */
  async calculateInvoice(data) {
    return this.post("/api/invoices/calculate", data);
  },

  /**
   * Preview invoice PDF
   */
  async previewInvoice(data) {
    return this.post("/api/invoices/preview", data);
  },

  /**
   * Generate and save invoice
   */
  async generateInvoice(data) {
    return this.post("/api/invoices", data);
  },
};
