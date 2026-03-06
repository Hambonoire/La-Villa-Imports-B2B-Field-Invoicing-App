-- Add column to track if invoice number was custom
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_custom_number BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on custom numbers
CREATE INDEX IF NOT EXISTS idx_invoices_is_custom ON invoices(is_custom_number);
