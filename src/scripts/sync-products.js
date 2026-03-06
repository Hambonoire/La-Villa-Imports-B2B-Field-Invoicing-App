/**
 * Sync products from WooCommerce to local database
 */

require('dotenv/config');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const pool = require('../config/database');

// Initialize WooCommerce API
const WooCommerce = new WooCommerceRestApi({
  url: process.env.WC_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: 'wc/v3'
});

async function syncProducts() {
  console.log('🔄 Starting product sync from WooCommerce...');
  
  try {
    let page = 1;
    let allProducts = [];
    let hasMore = true;

    // Fetch all products (paginated)
    while (hasMore) {
      console.log(`   Fetching page ${page}...`);
      const response = await WooCommerce.get('products', {
        per_page: 100,
        page: page,
        status: 'publish' // Only get published products
      });

      allProducts = allProducts.concat(response.data);
      
      // Check if there are more pages
      hasMore = response.headers['x-wp-totalpages'] > page;
      page++;
    }

    console.log(`✅ Fetched ${allProducts.length} products from WooCommerce`);

    // Clear existing products
    await pool.query('DELETE FROM products');
    console.log('🗑️  Cleared existing products');

    // Insert products into database
    let insertedCount = 0;
    for (const product of allProducts) {
      try {
        await pool.query(
          `INSERT INTO products (name, description, price, category, sku, woocommerce_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            product.name,
            product.description || product.short_description || '',
            parseFloat(product.price) || 0,
            product.categories.length > 0 ? product.categories[0].name : 'Uncategorized',
            product.sku || '',
            product.id
          ]
        );
        insertedCount++;
      } catch (error) {
        console.error(`❌ Error inserting product ${product.name}:`, error.message);
      }
    }

    console.log(`✅ Successfully synced ${insertedCount} products to database`);

    // Show sample of synced products
    const sampleProducts = await pool.query('SELECT id, name, price, sku FROM products LIMIT 5');
    console.log('\n📦 Sample products:');
    sampleProducts.rows.forEach(p => {
      console.log(`   - ${p.name} ($${p.price}) [${p.sku}]`);
    });

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }

  process.exit(0);
}

// Run sync
syncProducts();
