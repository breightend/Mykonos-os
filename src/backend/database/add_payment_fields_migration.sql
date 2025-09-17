-- Migration to add payment-related fields to account_movements table

-- Add bank_id column for linking payments to specific banks
ALTER TABLE account_movements 
ADD COLUMN IF NOT EXISTS bank_id INTEGER;

-- Add transaction_number for storing payment transaction references
ALTER TABLE account_movements 
ADD COLUMN IF NOT EXISTS transaction_number TEXT;

-- Add echeq_time for e-cheque payment timing (deferred payments)
ALTER TABLE account_movements 
ADD COLUMN IF NOT EXISTS echeq_time TEXT;

-- Add invoice_number for linking to invoice numbers
ALTER TABLE account_movements 
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Add foreign key constraint for bank_id (assuming banks table exists)
-- ALTER TABLE account_movements 
-- ADD CONSTRAINT fk_account_movements_bank 
-- FOREIGN KEY (bank_id) REFERENCES banks(id);

-- Note: Uncomment the above constraint if you have a banks table and want referential integrity