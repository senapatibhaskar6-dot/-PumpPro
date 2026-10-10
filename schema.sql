-- =============================================================================
-- PumpTally - Complete Neon PostgreSQL Database Schema & Migration Script
-- Compatible with Neon Serverless PostgreSQL & standard PostgreSQL 14+
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. APPLICATION CORE KEY-VALUE STORE
-- Stores complete JSON state collections synchronized with PumpTally web application
CREATE TABLE IF NOT EXISTS pumppro_store (
  key VARCHAR(64) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pumptally_store (
  key VARCHAR(64) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pumppro_store_updated ON pumppro_store(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pumptally_store_updated ON pumptally_store(updated_at DESC);

-- 3. AUDIT & LOGGING TABLE
CREATE TABLE IF NOT EXISTS pumptally_audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(64) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Also support existing audit table name
CREATE TABLE IF NOT EXISTS pumppro_audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(64) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PETROL PUMP STATIONS TABLE
CREATE TABLE IF NOT EXISTS pumptally_stations (
  id VARCHAR(64) PRIMARY KEY,
  station_name VARCHAR(255) NOT NULL,
  oil_company VARCHAR(64) NOT NULL,
  ro_code VARCHAR(64) NOT NULL,
  owner_name VARCHAR(128) NOT NULL,
  owner_phone VARCHAR(32) NOT NULL,
  owner_email VARCHAR(128),
  gstin VARCHAR(32),
  address TEXT,
  highway_name VARCHAR(128),
  district VARCHAR(64),
  state VARCHAR(64),
  pincode VARCHAR(16),
  tanks_count INT DEFAULT 3,
  nozzles_count INT DEFAULT 6,
  plan_status VARCHAR(32) DEFAULT 'Active',
  is_active BOOLEAN DEFAULT TRUE,
  registered_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FUEL RATES & COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS pumptally_fuel_rates (
  type VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  short_code VARCHAR(16) NOT NULL,
  rate_per_liter NUMERIC(10, 2) NOT NULL,
  dealer_cost_per_liter NUMERIC(10, 2) NOT NULL,
  dealer_margin_per_liter NUMERIC(10, 2) NOT NULL,
  color VARCHAR(16) DEFAULT '#f97316',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. UNDERGROUND FUEL STORAGE TANKS TABLE (Liters Based System)
CREATE TABLE IF NOT EXISTS pumptally_tanks (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  fuel_type VARCHAR(32) NOT NULL,
  capacity_liters NUMERIC(12, 2) NOT NULL,
  current_volume_liters NUMERIC(12, 2) NOT NULL,
  dip_reading_cm NUMERIC(8, 2) DEFAULT 0,
  last_refill_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DISPENSING NOZZLES TABLE
CREATE TABLE IF NOT EXISTS pumptally_nozzles (
  id VARCHAR(64) PRIMARY KEY,
  dispenser_unit VARCHAR(64) NOT NULL,
  nozzle_number INT NOT NULL,
  name VARCHAR(128) NOT NULL,
  fuel_type VARCHAR(32) NOT NULL,
  tank_id VARCHAR(64) REFERENCES pumptally_tanks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. NOZZLE METER READINGS & SALES TABLE
CREATE TABLE IF NOT EXISTS pumptally_meter_readings (
  id VARCHAR(64) PRIMARY KEY,
  date DATE NOT NULL,
  shift VARCHAR(64) NOT NULL,
  nozzle_id VARCHAR(64) NOT NULL,
  opening_reading NUMERIC(14, 2) NOT NULL,
  closing_reading NUMERIC(14, 2) NOT NULL,
  testing_qty NUMERIC(10, 2) DEFAULT 0,
  net_sale_qty NUMERIC(12, 2) NOT NULL,
  rate NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(14, 2) NOT NULL,
  recorded_by VARCHAR(64),
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readings_date_shift ON pumptally_meter_readings(date, shift);
CREATE INDEX IF NOT EXISTS idx_readings_nozzle ON pumptally_meter_readings(nozzle_id);

-- 9. TANKER DELIVERY & DECANTATION RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS pumptally_tanker_receipts (
  id VARCHAR(64) PRIMARY KEY,
  date DATE NOT NULL,
  time VARCHAR(16),
  tanker_no VARCHAR(32),
  invoice_no VARCHAR(64),
  supplier VARCHAR(64),
  fuel_type VARCHAR(32),
  tank_id VARCHAR(64),
  invoice_qty NUMERIC(12, 2) NOT NULL,
  actual_qty NUMERIC(12, 2) NOT NULL,
  shortage_gain NUMERIC(12, 2) DEFAULT 0,
  density NUMERIC(8, 2),
  temperature NUMERIC(6, 2),
  dip_before NUMERIC(8, 2),
  dip_after NUMERIC(8, 2),
  driver_name VARCHAR(64),
  decanted_by VARCHAR(64),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Also support existing table name
CREATE TABLE IF NOT EXISTS pumppro_tanker_receipts (
  id VARCHAR(64) PRIMARY KEY,
  date DATE NOT NULL,
  time VARCHAR(16),
  tanker_no VARCHAR(32),
  invoice_no VARCHAR(64),
  supplier VARCHAR(64),
  fuel_type VARCHAR(32),
  tank_id VARCHAR(64),
  invoice_qty NUMERIC(12, 2) NOT NULL,
  actual_qty NUMERIC(12, 2) NOT NULL,
  shortage_gain NUMERIC(12, 2) DEFAULT 0,
  density NUMERIC(8, 2),
  temperature NUMERIC(6, 2),
  dip_before NUMERIC(8, 2),
  dip_after NUMERIC(8, 2),
  driver_name VARCHAR(64),
  decanted_by VARCHAR(64),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pumptally_tanker_date ON pumptally_tanker_receipts(date DESC);

-- 10. DAILY FUEL STOCK RECONCILIATION TABLE (Physical Stock vs Book Stock)
CREATE TABLE IF NOT EXISTS pumptally_fuel_stock_reconciliation (
  id VARCHAR(64) PRIMARY KEY,
  date DATE NOT NULL,
  tank_id VARCHAR(64) NOT NULL,
  tank_name VARCHAR(128),
  fuel_type VARCHAR(32) NOT NULL,
  opening_stock NUMERIC(12, 2) NOT NULL,
  stock_received NUMERIC(12, 2) DEFAULT 0,
  total_available NUMERIC(12, 2) NOT NULL,
  metered_sales NUMERIC(12, 2) NOT NULL,
  net_sales NUMERIC(12, 2) NOT NULL,
  expected_closing NUMERIC(12, 2) NOT NULL,
  actual_closing NUMERIC(12, 2) NOT NULL,
  actual_dip_cm NUMERIC(8, 2),
  variance NUMERIC(12, 2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  shortage_liters NUMERIC(12, 2) DEFAULT 0,
  gain_liters NUMERIC(12, 2) DEFAULT 0,
  financial_impact NUMERIC(12, 2) DEFAULT 0,
  recorded_by VARCHAR(64),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Also support existing table name
CREATE TABLE IF NOT EXISTS pumppro_fuel_stock_reconciliation (
  id VARCHAR(64) PRIMARY KEY,
  date DATE NOT NULL,
  tank_id VARCHAR(64) NOT NULL,
  tank_name VARCHAR(128),
  fuel_type VARCHAR(32) NOT NULL,
  opening_stock NUMERIC(12, 2) NOT NULL,
  stock_received NUMERIC(12, 2) DEFAULT 0,
  total_available NUMERIC(12, 2) NOT NULL,
  metered_sales NUMERIC(12, 2) NOT NULL,
  net_sales NUMERIC(12, 2) NOT NULL,
  expected_closing NUMERIC(12, 2) NOT NULL,
  actual_closing NUMERIC(12, 2) NOT NULL,
  actual_dip_cm NUMERIC(8, 2),
  variance NUMERIC(12, 2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  shortage_liters NUMERIC(12, 2) DEFAULT 0,
  gain_liters NUMERIC(12, 2) DEFAULT 0,
  financial_impact NUMERIC(12, 2) DEFAULT 0,
  recorded_by VARCHAR(64),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pumptally_recon_date ON pumptally_fuel_stock_reconciliation(date DESC);

-- 11. LUBRICANT INVENTORY TABLE
CREATE TABLE IF NOT EXISTS pumptally_lubricants (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  brand VARCHAR(64) NOT NULL,
  category VARCHAR(64) NOT NULL,
  pack_size VARCHAR(32) NOT NULL,
  sku VARCHAR(64),
  mrp NUMERIC(10, 2) NOT NULL,
  purchase_cost NUMERIC(10, 2) NOT NULL,
  selling_price NUMERIC(10, 2) NOT NULL,
  current_stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  unit VARCHAR(32) DEFAULT 'Can',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. LUBRICANT SALES REGISTER TABLE
CREATE TABLE IF NOT EXISTS pumptally_lube_sales (
  id VARCHAR(64) PRIMARY KEY,
  date DATE NOT NULL,
  shift VARCHAR(64),
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(128) NOT NULL,
  pack_size VARCHAR(32),
  quantity_sold INT NOT NULL,
  rate_per_unit NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  payment_mode VARCHAR(32) DEFAULT 'Cash',
  invoice_number VARCHAR(64),
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lube_sales_date ON pumptally_lube_sales(date DESC);

-- 13. CREDIT CUSTOMERS (FLEET & CREDIT KHATA) TABLE
CREATE TABLE IF NOT EXISTS pumptally_customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  company VARCHAR(128),
  phone VARCHAR(32) NOT NULL,
  email VARCHAR(128),
  address TEXT,
  vehicle_numbers JSONB DEFAULT '[]'::jsonb,
  credit_limit NUMERIC(12, 2) DEFAULT 50000,
  outstanding_balance NUMERIC(12, 2) DEFAULT 0,
  opening_balance NUMERIC(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CREDIT FUEL SLIPS TABLE
CREATE TABLE IF NOT EXISTS pumptally_credit_slips (
  id VARCHAR(64) PRIMARY KEY,
  date DATE NOT NULL,
  shift VARCHAR(64),
  customer_id VARCHAR(64) NOT NULL,
  vehicle_number VARCHAR(32) NOT NULL,
  driver_name VARCHAR(64),
  fuel_type VARCHAR(32) NOT NULL,
  quantity_liters NUMERIC(10, 2) NOT NULL,
  rate NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  slip_number VARCHAR(64),
  notes TEXT,
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_slips_cust ON pumptally_credit_slips(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_slips_date ON pumptally_credit_slips(date DESC);

-- 15. CREDIT PAYMENTS / SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS pumptally_credit_payments (
  id VARCHAR(64) PRIMARY KEY,
  date DATE NOT NULL,
  customer_id VARCHAR(64) NOT NULL,
  amount_paid NUMERIC(12, 2) NOT NULL,
  payment_mode VARCHAR(32) DEFAULT 'Bank Transfer',
  reference_number VARCHAR(64),
  received_by VARCHAR(64),
  notes TEXT,
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_pay_cust ON pumptally_credit_payments(customer_id);

-- 16. DAILY FUEL DENSITY & QUALITY REGISTER TABLE
CREATE TABLE IF NOT EXISTS pumptally_daily_density (
  id VARCHAR(64) PRIMARY KEY,
  date DATE NOT NULL,
  shift VARCHAR(64) NOT NULL,
  petrol_observed NUMERIC(8, 2) NOT NULL,
  petrol_standard NUMERIC(8, 2) DEFAULT 742.0,
  petrol_variance NUMERIC(6, 2) NOT NULL,
  petrol_status VARCHAR(32) NOT NULL,
  diesel_observed NUMERIC(8, 2) NOT NULL,
  diesel_standard NUMERIC(8, 2) DEFAULT 832.0,
  diesel_variance NUMERIC(6, 2) NOT NULL,
  diesel_status VARCHAR(32) NOT NULL,
  recorded_by VARCHAR(64),
  hydrometer_id VARCHAR(64),
  thermometer_temp NUMERIC(6, 2),
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_density_date ON pumptally_daily_density(date DESC);

-- 17. INITIAL SEED: LOG SETUP COMPLETE
INSERT INTO pumptally_audit_log (action, details)
VALUES ('DB_MIGRATION_COMPLETE', jsonb_build_object('status', 'SUCCESS', 'timestamp', NOW()));

-- =============================================================================
-- Migration complete! All PumpTally tables are now ready in Neon PostgreSQL.
-- =============================================================================
