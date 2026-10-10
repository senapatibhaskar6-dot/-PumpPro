import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_GtU7JVdZgzc1@ep-icy-bonus-b44dhqg4-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const connectionString = process.env.DATABASE_URL || DEFAULT_NEON_URL;

console.log('================================================================');
console.log('🚀 PumpTally - Neon PostgreSQL Database Migration & Setup');
console.log('================================================================\n');

// Mask sensitive credentials for terminal output
function maskUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    const maskedPass = url.password ? '••••••••' : '';
    return `${url.protocol}//${url.username}:${maskedPass}@${url.host}${url.pathname}${url.search}`;
  } catch {
    return 'Neon Connection String (Configured)';
  }
}

console.log(`📡 Connecting to Neon database: ${maskUrl(connectionString)}`);

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 10000,
});

async function runMigration() {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    // 1. Verify basic connection and version
    const verRes = await client.query('SELECT version(), current_database(), current_user;');
    console.log(`✅ Connection verified!`);
    console.log(`   Database : ${verRes.rows[0].current_database}`);
    console.log(`   User     : ${verRes.rows[0].current_user}`);
    console.log(`   Version  : ${verRes.rows[0].version.split(' on ')[0]}\n`);

    // 2. Read schema.sql
    const schemaPath = path.join(rootDir, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }

    console.log('📦 Executing schema.sql migration statements...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Run the schema migration script
    await client.query(schemaSql);
    console.log('✅ All tables, indexes, and constraints created successfully!\n');

    // 3. Query all tables in public schema
    const tablesRes = await client.query(`
      SELECT 
        table_name,
        (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('----------------------------------------------------------------');
    console.log('📋 Neon Database Tables Summary:');
    console.log('----------------------------------------------------------------');
    for (const row of tablesRes.rows) {
      try {
        const countRes = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}";`);
        const count = countRes.rows[0].count;
        console.log(`  ✓ Table: ${row.table_name.padEnd(35)} [${row.column_count} cols] (${count} rows)`);
      } catch {
        console.log(`  ✓ Table: ${row.table_name.padEnd(35)} [${row.column_count} cols]`);
      }
    }
    console.log('----------------------------------------------------------------\n');

    // 4. Record successful migration audit
    await client.query(`
      INSERT INTO pumppro_audit_log (action, details)
      VALUES ('CLI_MIGRATION', jsonb_build_object(
        'timestamp', NOW(),
        'source', 'npm run db:push',
        'durationMs', $1::int,
        'tablesCreated', $2::int
      ));
    `, [Math.round(Date.now() - startTime), tablesRes.rows.length]);

    console.log(`🎉 Migration completed successfully in ${(Date.now() - startTime) / 1000}s!`);
    console.log('👉 You can now start the web application with: npm run dev');
    console.log('👉 Any data saved in the app will now persist permanently in Neon!\n');
  } catch (err: any) {
    console.error('\n❌ Migration failed:');
    console.error(err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
