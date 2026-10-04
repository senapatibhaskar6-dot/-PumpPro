import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const { Pool } = pg;

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Neon PostgreSQL Connection Pool
// Fallback directly to the user's Neon connection string if not provided in environment
const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_GtU7JVdZgzc1@ep-icy-bonus-b44dhqg4-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const connectionString = process.env.DATABASE_URL || DEFAULT_NEON_URL;

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon cloud pooler SSL
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Extract connection metadata safely for status reporting (hiding password)
function getSanitizedDbInfo(connStr: string) {
  try {
    const url = new URL(connStr);
    return {
      provider: 'Neon Serverless PostgreSQL',
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.replace(/^\//, ''),
      user: url.username,
      region: 'AWS us-east-2 (Ohio)',
      sslMode: url.searchParams.get('sslmode') || 'require',
      pooler: url.hostname.includes('pooler') ? 'Connection Pooler Active' : 'Direct Node',
    };
  } catch {
    return {
      provider: 'Neon Serverless PostgreSQL',
      host: 'ep-icy-bonus-b44dhqg4-pooler.c-6.us-east-2.aws.neon.tech',
      port: '5432',
      database: 'neondb',
      user: 'neondb_owner',
      region: 'AWS us-east-2 (Ohio)',
      sslMode: 'require',
      pooler: 'Connection Pooler Active',
    };
  }
}

// Initialize Neon Database schema
async function initDbSchema() {
  try {
    const client = await pool.connect();
    try {
      console.log('⚡ Initializing Neon PostgreSQL schema for PumpPro...');

      // Main persistent key-value store for application collections
      await client.query(`
        CREATE TABLE IF NOT EXISTS pumppro_store (
          key VARCHAR(64) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Audit and synchronization log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS pumppro_audit_log (
          id SERIAL PRIMARY KEY,
          action VARCHAR(64) NOT NULL,
          details JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Index on store key and updated_at
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_pumppro_store_updated ON pumppro_store(updated_at DESC);
      `);

      // Relational tables for Fuel Stock Management & Tanker Decantations
      await client.query(`
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
          status VARCHAR(20) NOT NULL,
          shortage_liters NUMERIC(12, 2) DEFAULT 0,
          gain_liters NUMERIC(12, 2) DEFAULT 0,
          financial_impact NUMERIC(12, 2) DEFAULT 0,
          recorded_by VARCHAR(64),
          remarks TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_tanker_date ON pumppro_tanker_receipts(date DESC);
        CREATE INDEX IF NOT EXISTS idx_stock_recon_date ON pumppro_fuel_stock_reconciliation(date DESC);
      `);

      // Log successful connection
      await client.query(`
        INSERT INTO pumppro_audit_log (action, details)
        VALUES ('SERVER_STARTUP', jsonb_build_object('timestamp', NOW(), 'status', 'CONNECTED', 'provider', 'Neon PostgreSQL'));
      `);

      console.log('✅ Neon PostgreSQL tables initialized successfully!');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('⚠️ Warning: Error during Neon DB initialization:', err.message);
  }
}

// -----------------------------------------------------------------------------
// REST API ROUTES
// -----------------------------------------------------------------------------

// API Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'PumpPro Fuel & Lubricants Management',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// API Database Status Check (Ping Neon PostgreSQL)
app.get('/api/db/status', async (_req, res) => {
  const startTime = Date.now();
  const dbInfo = getSanitizedDbInfo(connectionString);

  try {
    const result = await pool.query(`
      SELECT 
        NOW() as current_time, 
        version() as pg_version,
        current_database() as database_name,
        current_user as db_user;
    `);

    const latencyMs = Date.now() - startTime;

    // Get count of keys in store
    const storeCount = await pool.query('SELECT COUNT(*) as count FROM pumppro_store;');
    const auditCount = await pool.query('SELECT COUNT(*) as count FROM pumppro_audit_log;');

    res.json({
      connected: true,
      status: 'active',
      latencyMs,
      ...dbInfo,
      serverTime: result.rows[0]?.current_time,
      pgVersion: result.rows[0]?.pg_version,
      stats: {
        totalStoreKeys: parseInt(storeCount.rows[0]?.count || '0', 10),
        totalAuditLogs: parseInt(auditCount.rows[0]?.count || '0', 10),
      },
    });
  } catch (err: any) {
    res.status(503).json({
      connected: false,
      status: 'error',
      message: err.message,
      latencyMs: Date.now() - startTime,
      ...dbInfo,
    });
  }
});

// GET all collections stored in Neon
app.get('/api/db/all', async (_req, res) => {
  try {
    const result = await pool.query('SELECT key, data, updated_at FROM pumppro_store;');
    const storeMap: Record<string, any> = {};
    result.rows.forEach(row => {
      storeMap[row.key] = row.data;
    });

    res.json({
      success: true,
      count: result.rowCount,
      data: storeMap,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single key
app.get('/api/db/get/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const result = await pool.query('SELECT data, updated_at FROM pumppro_store WHERE key = $1;', [key]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: `Key ${key} not found` });
      return;
    }
    res.json({
      success: true,
      key,
      data: result.rows[0].data,
      updatedAt: result.rows[0].updated_at,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST save single key
app.post('/api/db/set/:key', async (req, res) => {
  const { key } = req.params;
  const { data } = req.body;

  if (data === undefined) {
    res.status(400).json({ success: false, error: 'Data payload is required' });
    return;
  }

  try {
    await pool.query(
      `
      INSERT INTO pumppro_store (key, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) 
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
      `,
      [key, JSON.stringify(data)]
    );

    res.json({
      success: true,
      key,
      message: `Persisted ${key} to Neon PostgreSQL`,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST bulk save multiple keys (used for full station backup / sync)
app.post('/api/db/bulk-save', async (req, res) => {
  const { store } = req.body;
  if (!store || typeof store !== 'object') {
    res.status(400).json({ success: false, error: 'store object is required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const keys = Object.keys(store);
    for (const key of keys) {
      await client.query(
        `
        INSERT INTO pumppro_store (key, data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) 
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
        `,
        [key, JSON.stringify(store[key])]
      );
    }
    await client.query(
      `
      INSERT INTO pumppro_audit_log (action, details)
      VALUES ('BULK_SYNC', jsonb_build_object('keysCount', $1, 'timestamp', NOW()));
      `,
      [keys.length]
    );
    await client.query('COMMIT');

    res.json({
      success: true,
      keysCount: keys.length,
      message: `Successfully synchronized ${keys.length} tables with Neon PostgreSQL`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// POST reset to factory defaults in Neon
app.post('/api/db/reset', async (_req, res) => {
  try {
    await pool.query('TRUNCATE TABLE pumppro_store;');
    await pool.query(
      `
      INSERT INTO pumppro_audit_log (action, details)
      VALUES ('RESET_DATABASE', jsonb_build_object('timestamp', NOW()));
      `
    );
    res.json({
      success: true,
      message: 'Neon PostgreSQL store reset successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// FRONTEND SERVING (Vite dev middleware or Static production)
// -----------------------------------------------------------------------------

async function startServer() {
  // Initialize Neon schema first
  await initDbSchema();

  if (!isProd) {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PumpPro server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Neon PostgreSQL Connected: ${getSanitizedDbInfo(connectionString).host}`);
  });
}

startServer();
