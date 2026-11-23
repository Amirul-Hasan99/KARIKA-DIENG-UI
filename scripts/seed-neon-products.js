const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  await sql.query(`
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
  `);
  console.log('Table products verified/created in Neon');

  // Clear any old products in Neon so only the 9 new products exist!
  await sql.query('DELETE FROM products');
  console.log('Cleared old products from Neon');

  const products = JSON.parse(fs.readFileSync('data/products.json', 'utf-8'));
  for (const p of products) {
    await sql.query(
      'INSERT INTO products (id, name, "group", pack, price, description, image, source, note, is_available, stock_qty) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [p.id, p.name, p.group, p.pack, p.price, p.description, p.image, p.source || '', p.note || '', p.is_available !== false, p.stock_qty || 50]
    );
  }

  const count = await sql.query('SELECT count(*) FROM products');
  console.log('SUCCESS: Total products currently in Neon DB:', count[0].count);
}

main().catch(err => {
  console.error('Error seeding products to Neon:', err);
  process.exit(1);
});
