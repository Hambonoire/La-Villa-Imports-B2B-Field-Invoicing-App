/**
 * Main Application
 * Handles UI interactions and coordinates between API and invoice builder
 */

// DOM Elements
const elements = {
  // Customer lookup
  customerLookup: document.getElementById("customerLookup"),
  searchCustomerBtn: document.getElementById("searchCustomerBtn"),
  customerResults: document.getElementById("customerResults"),

  // Customer form fields
  customerId: document.getElementById("customerId"),
  customerName: document.getElementById("customerName"),
  customerCompany: document.getElementById("customerCompany"),
  customerEmail: document.getElementById("customerEmail"),
  customerPhone: document.getElementById("customerPhone"),
  customerAddress: document.getElementById("customerAddress"),
  customerCity: document.getElementById("customerCity"),
  customerState: document.getElementById("customerState"),
  customerZip: document.getElementById("customerZip"),

  // Product search
  productSearch: document.getElementById("productSearch"),
  searchProductBtn: document.getElementById("searchProductBtn"),
  productResults: document.getElementById("productResults"),

  // Invoice items
  itemsList: document.getElementById("itemsList"),

  // Invoice details
  taxRate: document.getElementById("taxRate"),
  taxRateDisplay: document.getElementById("taxRateDisplay"),
  notes: document.getElementById("notes"),
  paymentTerms: document.getElementById("paymentTerms"),
  checkNumberField: document.getElementById("checkNumberField"),
  checkNumber: document.getElementById("checkNumber"),

  // Payment terms display
  paymentTermsDisplay: document.getElementById("paymentTermsDisplay"),
  paymentTermsText: document.getElementById("paymentTermsText"),
  checkNumberDisplay: document.getElementById("checkNumberDisplay"),

  // Invoice summary
  subtotal: document.getElementById("subtotal"),
  taxAmount: document.getElementById("taxAmount"),
  total: document.getElementById("total"),

  // Actions
  clearFormBtn: document.getElementById("clearFormBtn"),
  previewBtn: document.getElementById("previewBtn"),
  generateBtn: document.getElementById("generateBtn"),

  // Modal
  previewModal: document.getElementById("previewModal"),
  previewContent: document.getElementById("previewContent"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  closePreviewBtn: document.getElementById("closePreviewBtn"),
  confirmGenerateBtn: document.getElementById("confirmGenerateBtn"),

  // Loading overlay
  loadingOverlay: document.getElementById("loadingOverlay"),
};

/**
 * Initialize application
 */
function init() {
  // Set up event listeners
  setupEventListeners();

  // Subscribe to invoice builder state changes
  invoiceBuilder.onStateChange = handleStateChange;

  // Initial UI update
  updateUI();

  console.log("La Villa Invoice App initialized");
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Customer search
  elements.searchCustomerBtn.addEventListener("click", handleCustomerSearch);
  elements.customerLookup.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleCustomerSearch();
  });

  // Product search
  elements.searchProductBtn.addEventListener("click", handleProductSearch);
  elements.productSearch.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleProductSearch();
  });

  // Tax rate change
  elements.taxRate.addEventListener("input", (e) => {
    invoiceBuilder.setTaxRate(e.target.value);
  });

  // Notes change
  elements.notes.addEventListener("input", (e) => {
    invoiceBuilder.setNotes(e.target.value);
  });

  // Payment terms change
  elements.paymentTerms.addEventListener("change", handlePaymentTermsChange);
  elements.checkNumber.addEventListener("input", handleCheckNumberChange);

  // Actions
  elements.clearFormBtn.addEventListener("click", handleClearForm);
  elements.previewBtn.addEventListener("click", handlePreview);
  elements.generateBtn.addEventListener("click", handleGenerate);

  // Modal
  elements.closeModalBtn.addEventListener("click", closeModal);
  elements.closePreviewBtn.addEventListener("click", closeModal);
  elements.confirmGenerateBtn.addEventListener("click", handleConfirmGenerate);
}

/**
 * Handle customer search
 */
async function handleCustomerSearch() {
  const searchTerm = elements.customerLookup.value.trim();

  if (!searchTerm) {
    alert("Please enter a search term");
    return;
  }

  showLoading(true);

  try {
    const response = await apiClient.searchCustomers(searchTerm);
    displayCustomerResults(response.data);
  } catch (error) {
    alert("Error searching customers: " + error.message);
  } finally {
    showLoading(false);
  }
}

/**
 * Display customer search results
 */
function displayCustomerResults(customers) {
  if (!customers || customers.length === 0) {
    elements.customerResults.innerHTML =
      '<p class="customer-results__empty">No customers found</p>';
    return;
  }

  elements.customerResults.innerHTML = customers
    .map(
      (customer) => `
    <div class="customer-results__item" onclick="selectCustomer(${customer.id})">
      <div class="customer-results__name">${customer.fullName}</div>
      ${customer.company ? `<div class="customer-results__company">${customer.company}</div>` : ""}
      <div class="customer-results__contact">
        <span class="customer-results__email">${customer.email}</span>
        ${customer.phone ? `<span class="customer-results__phone">${customer.phone}</span>` : ""}
      </div>
    </div>
  `,
    )
    .join("");
}

/**
 * Select a customer and populate form
 */
async function selectCustomer(customerId) {
  showLoading(true);

  try {
    const response = await apiClient.getCustomer(customerId);
    const customer = response.data;

    // Populate form fields
    elements.customerId.value = customer.id;
    elements.customerName.value = customer.fullName;
    elements.customerCompany.value = customer.company || "";
    elements.customerEmail.value = customer.email;
    elements.customerPhone.value = customer.phone;
    elements.customerAddress.value = customer.address.street;
    elements.customerCity.value = customer.address.city;
    elements.customerState.value = customer.address.state;
    elements.customerZip.value = customer.address.postcode;

    // Set customer in invoice builder
    invoiceBuilder.setCustomer({
      id: customer.id,
      name: customer.fullName,
      company: customer.company,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });

    // Clear search results
    elements.customerResults.innerHTML = "";
    elements.customerLookup.value = "";
  } catch (error) {
    alert("Error loading customer: " + error.message);
  } finally {
    showLoading(false);
  }
}

/**
 * Handle product search
 */
async function handleProductSearch() {
  const searchTerm = elements.productSearch.value.trim();

  showLoading(true);

  try {
    let response;
    if (searchTerm) {
      response = await apiClient.searchProducts(searchTerm);
    } else {
      response = await apiClient.getAllProducts();
    }

    displayProductResults(response.data);
  } catch (error) {
    alert("Error searching products: " + error.message);
  } finally {
    showLoading(false);
  }
}

/**
 * Display product search results
 */
function displayProductResults(products) {
  if (!products || products.length === 0) {
    elements.productResults.innerHTML =
      '<p class="customer-results__empty">No products found</p>';
    return;
  }

  elements.productResults.innerHTML = products
    .map(
      (product) => `
    <div class="product-list__item">
      <div class="product-list__info">
        <div class="product-list__name">${product.name}</div>
        ${product.sku ? `<div class="product-list__sku">SKU: ${product.sku}</div>` : ""}
        <div class="product-list__price">$${product.price.toFixed(2)}</div>
      </div>
      <button class="product-list__button" onclick="addProduct(${product.id})">
        Add to Invoice
      </button>
    </div>
  `,
    )
    .join("");
}

/**
 * Add product to invoice
 */
async function addProduct(productId) {
  showLoading(true);

  try {
    const response = await apiClient.getProduct(productId);
    const product = response.data;

    invoiceBuilder.addItem(product);
  } catch (error) {
    alert("Error adding product: " + error.message);
  } finally {
    showLoading(false);
  }
}

/**
 * Handle payment terms change
 */
function handlePaymentTermsChange() {
  const selectedTerms = elements.paymentTerms.value;

  // Show/hide check number field
  if (selectedTerms === "check") {
    elements.checkNumberField.classList.remove(
      "invoice-details__field--hidden",
    );
    elements.checkNumber.required = true;
  } else {
    elements.checkNumberField.classList.add("invoice-details__field--hidden");
    elements.checkNumber.required = false;
    elements.checkNumber.value = "";
  }

  // Update invoice builder
  if (selectedTerms) {
    invoiceBuilder.setPaymentTerms(selectedTerms, elements.checkNumber.value);
  }
}

/**
 * Handle check number change
 */
function handleCheckNumberChange() {
  if (elements.paymentTerms.value === "check") {
    invoiceBuilder.setPaymentTerms("check", elements.checkNumber.value);
  }
}

/**
 * Handle state change from invoice builder
 */
function handleStateChange() {
  updateUI();
}

/**
 * Update UI based on current state
 */
function updateUI() {
  // Update invoice items list
  updateItemsList();

  // Update totals
  updateTotals();

  // Update payment terms display
  updatePaymentTermsDisplay();

  // Update tax rate display
  elements.taxRateDisplay.textContent = invoiceBuilder.state.taxRate.toFixed(1);

  // Enable/disable buttons based on validity
  const isValid = invoiceBuilder.isValid();
  elements.previewBtn.disabled = !isValid;
  elements.generateBtn.disabled = !isValid;
}

/**
 * Update invoice items list
 */
function updateItemsList() {
  const items = invoiceBuilder.state.items;

  if (items.length === 0) {
    elements.itemsList.innerHTML =
      '<p class="invoice-items__empty">No items added yet. Search and add products above.</p>';
    return;
  }

  elements.itemsList.innerHTML = items
    .map(
      (item) => `
    <div class="invoice-items__item">
      <div class="invoice-items__product-name">${item.productName}</div>
      <div class="invoice-items__quantity-control">
        <button class="invoice-items__quantity-btn" onclick="changeQuantity(${item.productId}, -1)">-</button>
        <span class="invoice-items__quantity-display">${item.quantity}</span>
        <button class="invoice-items__quantity-btn" onclick="changeQuantity(${item.productId}, 1)">+</button>
      </div>
      <div class="invoice-items__price">$${item.price.toFixed(2)}</div>
      <div class="invoice-items__total">$${(item.price * item.quantity).toFixed(2)}</div>
      <button class="invoice-items__remove" onclick="removeItem(${item.productId})">Remove</button>
    </div>
  `,
    )
    .join("");
}

/**
 * Change item quantity
 */
function changeQuantity(productId, delta) {
  const item = invoiceBuilder.state.items.find(
    (i) => i.productId === productId,
  );
  if (item) {
    invoiceBuilder.updateQuantity(productId, item.quantity + delta);
  }
}

/**
 * Remove item from invoice
 */
function removeItem(productId) {
  if (confirm("Remove this item from the invoice?")) {
    invoiceBuilder.removeItem(productId);
  }
}

/**
 * Update totals display
 */
function updateTotals() {
  const totals = invoiceBuilder.calculateTotals();

  elements.subtotal.textContent = `$${totals.subtotal}`;
  elements.taxAmount.textContent = `$${totals.taxAmount}`;
  elements.total.textContent = `$${totals.total}`;
}

/**
 * Update payment terms display
 */
function updatePaymentTermsDisplay() {
  const terms = invoiceBuilder.state.paymentTerms;

  if (!terms) {
    elements.paymentTermsDisplay.style.display = "none";
    return;
  }

  elements.paymentTermsDisplay.style.display = "block";

  const termsLabels = {
    cod: "COD (Cash on Delivery)",
    check: "Check",
    net30: "Net 30",
  };

  elements.paymentTermsText.textContent = termsLabels[terms] || terms;

  if (terms === "check" && invoiceBuilder.state.checkNumber) {
    elements.checkNumberDisplay.textContent = `Check #: ${invoiceBuilder.state.checkNumber}`;
    elements.checkNumberDisplay.style.display = "block";
  } else {
    elements.checkNumberDisplay.style.display = "none";
  }
}

/**
 * Handle clear form
 */
function handleClearForm() {
  if (confirm("Clear all form data and start over?")) {
    invoiceBuilder.clear();

    // Clear form fields
    elements.customerLookup.value = "";
    elements.customerName.value = "";
    elements.customerCompany.value = "";
    elements.customerEmail.value = "";
    elements.customerPhone.value = "";
    elements.customerAddress.value = "";
    elements.customerCity.value = "";
    elements.customerState.value = "";
    elements.customerZip.value = "";
    elements.productSearch.value = "";
    elements.notes.value = "";
    elements.taxRate.value = "8.0";
    elements.paymentTerms.value = "";
    elements.checkNumber.value = "";

    // Clear results
    elements.customerResults.innerHTML = "";
    elements.productResults.innerHTML = "";

    updateUI();
  }
}

/**
 * Handle preview invoice
 */
async function handlePreview() {
  showLoading(true);

  try {
    const invoiceData = invoiceBuilder.getInvoiceData();
    const response = await apiClient.previewInvoice(invoiceData);

    displayInvoicePreview(response.data);
  } catch (error) {
    alert("Error generating preview: " + error.message);
  } finally {
    showLoading(false);
  }
}

/**
 * Display invoice preview in modal
 */
function displayInvoicePreview(invoice) {
  const termsLabels = {
    cod: "COD (Cash on Delivery)",
    check: "Check",
    net30: "Net 30",
  };

  const html = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h3 style="color: #8B4513; margin-bottom: 20px;">Invoice #${invoice.invoiceNumber}</h3>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: #666;">Customer Information</h4>
        <p><strong>${invoice.customer.name}</strong></p>
        ${invoice.customer.company ? `<p>${invoice.customer.company}</p>` : ""}
        <p>${invoice.customer.email}</p>
        <p>${invoice.customer.phone}</p>
        <p>${invoice.customer.address.street}<br>
        ${invoice.customer.address.city}, ${invoice.customer.address.state} ${invoice.customer.address.postcode}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: #666;">Invoice Details</h4>
        <p><strong>Date:</strong> ${invoice.date}</p>
        <p><strong>Payment Terms:</strong> ${termsLabels[invoiceData.paymentTerms]}</p>
        ${invoiceData.paymentTerms === "check" ? `<p><strong>Check Number:</strong> ${invoiceData.checkNumber}</p>` : ""}
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f5f5f0; border-bottom: 2px solid #8B4513;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items
            .map(
              (item) => `
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px;">${item.productName}</td>
              <td style="padding: 10px; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right;">${item.unitPrice}</td>
              <td style="padding: 10px; text-align: right;">${item.lineTotal}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      
      <div style="text-align: right; margin-top: 20px;">
        <p><strong>Subtotal:</strong> ${invoice.subtotal}</p>
        <p><strong>Tax (${(invoice.taxRate * 100).toFixed(1)}%):</strong> ${invoice.taxAmount}</p>
        <p style="font-size: 18px; color: #8B4513;"><strong>Total:</strong> ${invoice.total}</p>
      </div>
      
      ${
        invoice.notes
          ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f0; border-left: 4px solid #2C5F2D;">
          <strong>Notes:</strong><br>
          ${invoice.notes}
        </div>
      `
          : ""
      }
    </div>
  `;

  elements.previewContent.innerHTML = html;
  elements.previewModal.classList.remove("modal--hidden");
}

/**
 * Handle generate invoice
 */
async function handleGenerate() {
  if (!confirm("Generate this invoice? This action cannot be undone.")) {
    return;
  }

  showLoading(true);

  try {
    const invoiceData = invoiceBuilder.getInvoiceData();
    const response = await apiClient.generateInvoice(invoiceData);

    alert(
      `Invoice generated successfully!\nInvoice Number: ${response.data.invoiceNumber}`,
    );

    // Clear form after successful generation
    handleClearForm();
  } catch (error) {
    alert("Error generating invoice: " + error.message);
  } finally {
    showLoading(false);
  }
}

/**
 * Handle confirm generate from preview modal
 */
async function handleConfirmGenerate() {
  closeModal();
  await handleGenerate();
}

/**
 * Close modal
 */
function closeModal() {
  elements.previewModal.classList.add("modal--hidden");
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
  if (show) {
    elements.loadingOverlay.classList.remove("loading-overlay--hidden");
  } else {
    elements.loadingOverlay.classList.add("loading-overlay--hidden");
  }
}

// Make functions available globally for inline onclick handlers
window.selectCustomer = selectCustomer;
window.addProduct = addProduct;
window.changeQuantity = changeQuantity;
window.removeItem = removeItem;

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
