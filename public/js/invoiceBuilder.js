/**
 * Invoice Builder
 * Manages invoice data and cart functionality
 */

const invoiceBuilder = {
  // Current invoice state
  state: {
    customer: null,
    items: [],
    taxRate: 8.0,
    notes: "",
    paymentTerms: null,
    checkNumber: null,
  },

  /**
   * Set customer data
   */
  setCustomer(customer) {
    this.state.customer = customer;
    this.notifyStateChange();
  },

  /**
   * Clear customer data
   */
  clearCustomer() {
    this.state.customer = null;
    this.notifyStateChange();
  },

  /**
   * Add product to cart
   */
  addItem(product) {
    // Check if product already exists in cart
    const existingItem = this.state.items.find(
      (item) => item.productId === product.id,
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.state.items.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        price: product.price,
      });
    }

    this.notifyStateChange();
  },

  /**
   * Update item quantity
   */
  updateQuantity(productId, quantity) {
    const item = this.state.items.find((item) => item.productId === productId);

    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.notifyStateChange();
      }
    }
  },

  /**
   * Remove item from cart
   */
  removeItem(productId) {
    this.state.items = this.state.items.filter(
      (item) => item.productId !== productId,
    );
    this.notifyStateChange();
  },

  /**
   * Update item price (for custom B2B pricing)
   */
  updatePrice(productId, price) {
    const item = this.state.items.find((item) => item.productId === productId);

    if (item) {
      item.price = parseFloat(price);
      this.notifyStateChange();
    }
  },

  /**
   * Set tax rate
   */
  setTaxRate(rate) {
    this.state.taxRate = parseFloat(rate);
    this.notifyStateChange();
  },

  /**
   * Set invoice notes
   */
  setNotes(notes) {
    this.state.notes = notes;
  },

  /**
   * Set payment terms
   */
  setPaymentTerms(terms, checkNumber = null) {
    this.state.paymentTerms = terms;
    this.state.checkNumber = checkNumber;
    this.notifyStateChange();
  },

  /**
   * Calculate invoice totals
   */
  calculateTotals() {
    const subtotal = this.state.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const taxAmount = subtotal * (this.state.taxRate / 100);
    const total = subtotal + taxAmount;

    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
    };
  },

  /**
   * Check if invoice is valid for generation
   */
  isValid() {
    return (
      this.state.customer !== null &&
      this.state.items.length > 0 &&
      this.state.paymentTerms !== null &&
      (this.state.paymentTerms !== "check" || this.state.checkNumber)
    );
  },

  /**
   * Get invoice data for API submission
   */
  getInvoiceData() {
    const totals = this.calculateTotals();

    return {
      invoiceNumber: this.state.invoiceNumber || null,
      customer: this.state.customer,
      items: this.state.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      taxRate: this.state.taxRate / 100,
      notes: this.state.notes,
      paymentTerms: this.state.paymentTerms,
      checkNumber: this.state.checkNumber,
      subtotal: parseFloat(totals.subtotal),
      taxAmount: parseFloat(totals.taxAmount),
      total: parseFloat(totals.total),
    };
  },

  /**
   * Clear all invoice data
   */
  clear() {
    this.state = {
      customer: null,
      items: [],
      taxRate: 8.0,
      notes: "",
      paymentTerms: null,
      checkNumber: null,
    };
    this.notifyStateChange();
  },

  /**
   * Notify state change (to be overridden by UI)
   */
  notifyStateChange() {
    // This will be overridden in app.js
    if (typeof this.onStateChange === "function") {
      this.onStateChange();
    }
  },
};
