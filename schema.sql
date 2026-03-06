-- La Villa Invoicing Database Schema

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  woocommerce_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  sku VARCHAR(100),
  woocommerce_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  invoice_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  payment_terms VARCHAR(100),
  check_number VARCHAR(50),
  woocommerce_order_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_woocommerce_id ON customers(woocommerce_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_woocommerce_id ON products(woocommerce_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Insert sample customers
INSERT INTO customers (name, company, email, phone, address, city, state, zip) VALUES
('Jeremy Clark', 'Clark Enterprises', 'jeremy@clarkenterprises.com', '501-555-0101', '123 Business Ave', 'Conway', 'AR', '72032'),
('Sarah Martinez', 'Martinez Coffee Shop', 'sarah@martinezcoffee.com', '501-555-0102', '456 Main St', 'Little Rock', 'AR', '72201'),
('Michael Chen', 'Chen Restaurant Group', 'michael@chengroup.com', '501-555-0103', '789 Commerce Blvd', 'North Little Rock', 'AR', '72114');

-- Insert sample products (you'll sync real products from WooCommerce)
INSERT INTO products (name, description, price, category, sku) VALUES
('México Natural Medium Roast', 'Smooth, balanced Mexican coffee with chocolate notes', 17.99, 'Coffee', 'MEX-MED-001'),
('Colombia Supremo Dark Roast', 'Bold Colombian coffee with rich caramel undertones', 18.99, 'Coffee', 'COL-DARK-001'),
('Guatemala Antigua Light Roast', 'Bright, citrusy Guatemalan coffee with floral notes', 19.99, 'Coffee', 'GTM-LIGHT-001');

