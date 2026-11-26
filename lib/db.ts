import { neon } from '@neondatabase/serverless';

declare global {
  var __neonSql: any;
  var __neonReachable: boolean | undefined;
  var __neonInitAttempted: boolean | undefined;
}

/**
 * Returns the neon sql tagged-template function, or null if unavailable.
 * Strictly uses process.env.DATABASE_URL. Never falls back to hardcoded secrets.
 */
export function getNeonSql(): any {
  // If we have confirmed Neon is unreachable, skip immediately
  if (global.__neonReachable === false) return null;

  if (!global.__neonSql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString || connectionString.includes('placeholder') || connectionString.includes('YOUR_DATABASE_PASSWORD')) {
      if (!global.__neonInitAttempted) {
        console.warn('[db] DATABASE_URL is not set or contains placeholder; using fallback datastore.');
        global.__neonInitAttempted = true;
      }
      return null;
    }

    try {
      global.__neonSql = neon(connectionString);
    } catch (err: any) {
      console.warn('[db] Failed to initialize neon sql client (offline mode activated):', err?.message || 'Connection error');
      global.__neonReachable = false;
      return null;
    }
  }
  return global.__neonSql;
}

let isTableInitialized = false;

export async function ensureNeonTables() {
  if (isTableInitialized) return;
  if (global.__neonReachable === false) return;

  const sql = getNeonSql();
  if (!sql) return;

  try {
    const initPromise = (async () => {
      // 1. Create base table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(120) PRIMARY KEY,
          order_number VARCHAR(120) NOT NULL UNIQUE,
          customer_id VARCHAR(100),
          table_id VARCHAR(50) DEFAULT 'delivery',
          table_number VARCHAR(50) DEFAULT 'delivery',
          customer_name VARCHAR(200),
          customer_phone VARCHAR(60),
          delivery_address TEXT,
          coordinates JSONB,
          delivery_distance_km NUMERIC,
          total_amount NUMERIC NOT NULL DEFAULT 0,
          payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
          order_status VARCHAR(50) NOT NULL DEFAULT 'received',
          delivery_status VARCHAR(50) DEFAULT 'pending',
          payment_type VARCHAR(50) DEFAULT 'qris',
          midtrans_transaction_id VARCHAR(150),
          snap_token TEXT,
          snap_redirect_url TEXT,
          whatsapp_confirmation_sent_at TIMESTAMPTZ,
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      // 2. Safely add newer columns if not present
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMPTZ;`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_id VARCHAR(100);`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100);`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_phone VARCHAR(60);`;

      // 3. Create indices for performance and security
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);`;

      // 4. Create products table for cloud production persistence
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(120) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          "group" VARCHAR(100) NOT NULL,
          pack VARCHAR(100) NOT NULL,
          price NUMERIC NOT NULL,
          description TEXT,
          image TEXT,
          source TEXT,
          note TEXT,
          is_available BOOLEAN DEFAULT true,
          stock_qty INTEGER DEFAULT 50,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      // 5. Create store_settings table for cloud production persistence (WA, QRIS, Couriers)
      await sql`
        CREATE TABLE IF NOT EXISTS store_settings (
          id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Neon table init timeout (6000ms)')), 6000)
    );

    await Promise.race([initPromise, timeoutPromise]);
    isTableInitialized = true;
    global.__neonReachable = true;
    console.log('[db] ✅ Neon PostgreSQL transactional datastore ready.');
  } catch (err: any) {
    global.__neonReachable = false;
    console.warn('[db] ⚠️ Neon initialization note:', err?.message || 'Database unavailable');
  }
}
