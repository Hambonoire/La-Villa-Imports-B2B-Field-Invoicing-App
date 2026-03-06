const wc = require("./wcClient");

/**
 * WooCommerce Service
 * Handles all interactions with WooCommerce REST API
 */

class WooCommerceService {
  /**
   * Fetch all B2B customers
   * @param {Object} params - Query parameters (per_page, page, role, etc.)
   * @returns {Promise<Array>} Array of customer objects
   */
  async getCustomers(params = {}) {
    try {
      const defaultParams = {
        per_page: 100,
        role: "all", // Filter by all customer roles
        ...params,
      };

      // Remove search param if it's causing issues
      if (defaultParams.search) {
        delete defaultParams.search;
      }

      const response = await wc.get("customers", defaultParams);

      return response.data
        .filter((customer) => {
          // Only include customers with actual names
          return customer.first_name && customer.last_name;
        })
        .map((customer) => ({
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          fullName: `${customer.first_name} ${customer.last_name}`,
          company: customer.billing?.company || "",
          phone: customer.billing?.phone || "",
          address: {
            street: customer.billing?.address_1 || "",
            street2: customer.billing?.address_2 || "",
            city: customer.billing?.city || "",
            state: customer.billing?.state || "",
            postcode: customer.billing?.postcode || "",
            country: customer.billing?.country || "",
          },
          metadata: customer.meta_data || [],
        }));
    } catch (error) {
      console.error(
        "Error fetching customers:",
        error.response?.data || error.message,
      );
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  }

  /**
   * Fetch a single customer by ID
   * @param {Number} customerId - WooCommerce customer ID
   * @returns {Promise<Object>} Customer object
   */
  async getCustomerById(customerId) {
    try {
      const response = await wc.get(`customers/${customerId}`);
      const customer = response.data;

      return {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        fullName: `${customer.first_name} ${customer.last_name}`,
        company: customer.billing?.company || "",
        phone: customer.billing?.phone || "",
        address: {
          street: customer.billing?.address_1 || "",
          street2: customer.billing?.address_2 || "",
          city: customer.billing?.city || "",
          state: customer.billing?.state || "",
          postcode: customer.billing?.postcode || "",
          country: customer.billing?.country || "",
        },
        metadata: customer.meta_data || [],
      };
    } catch (error) {
      console.error(
        `Error fetching customer ${customerId}:`,
        error.response?.data || error.message,
      );
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
  }

  /**
   * Fetch all products (B2B catalog)
   * @param {Object} params - Query parameters (per_page, page, category, etc.)
   * @returns {Promise<Array>} Array of product objects
   */
  async getProducts(params = {}) {
    try {
      const defaultParams = {
        per_page: 100,
        status: "publish",
        ...params,
      };

      const response = await wc.get("products", defaultParams);

      return response.data.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: parseFloat(product.price) || 0,
        regularPrice: parseFloat(product.regular_price) || 0,
        salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
        description: product.description || "",
        shortDescription: product.short_description || "",
        stockStatus: product.stock_status,
        stockQuantity: product.stock_quantity,
        categories: product.categories?.map((cat) => cat.name) || [],
        images: product.images?.map((img) => img.src) || [],
        taxStatus: product.tax_status,
        taxClass: product.tax_class,
        metadata: product.meta_data || [],
      }));
    } catch (error) {
      console.error(
        "Error fetching products:",
        error.response?.data || error.message,
      );
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Fetch a single product by ID
   * @param {Number} productId - WooCommerce product ID
   * @returns {Promise<Object>} Product object
   */
  async getProductById(productId) {
    try {
      const response = await wc.get(`products/${productId}`);
      const product = response.data;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: parseFloat(product.price) || 0,
        regularPrice: parseFloat(product.regular_price) || 0,
        salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
        description: product.description || "",
        shortDescription: product.short_description || "",
        stockStatus: product.stock_status,
        stockQuantity: product.stock_quantity,
        categories: product.categories?.map((cat) => cat.name) || [],
        images: product.images?.map((img) => img.src) || [],
        taxStatus: product.tax_status,
        taxClass: product.tax_class,
        metadata: product.meta_data || [],
      };
    } catch (error) {
      console.error(
        `Error fetching product ${productId}:`,
        error.response?.data || error.message,
      );
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  /**
   * Search products by SKU
   * @param {String} sku - Product SKU to search for
   * @returns {Promise<Array>} Array of matching products
   */
  async searchProductBySku(sku) {
    try {
      const response = await wc.get("products", { sku });

      return response.data.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: parseFloat(product.price) || 0,
        regularPrice: parseFloat(product.regular_price) || 0,
        stockStatus: product.stock_status,
        stockQuantity: product.stock_quantity,
      }));
    } catch (error) {
      console.error(
        `Error searching product by SKU ${sku}:`,
        error.response?.data || error.message,
      );
      throw new Error(`Failed to search product: ${error.message}`);
    }
  }
}

module.exports = new WooCommerceService();
