import fs from "fs";
import path from "path";
import { KarikaProduct, INITIAL_KARIKA_PRODUCTS, KARIKA_CATEGORIES } from "./karika-products-data";
import { getMenuStockMap, setMenuItemAvailability } from "./order-store";
import { getNeonSql } from "./db";

export * from "./karika-products-data";

const PRODUCTS_FILE_PATH = path.join(process.cwd(), "data", "products.json");

function readLocalProducts(): KarikaProduct[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE_PATH)) {
      const raw = fs.readFileSync(PRODUCTS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [...INITIAL_KARIKA_PRODUCTS];
}

function saveLocalProducts(products: KarikaProduct[]) {
  try {
    const dir = path.dirname(PRODUCTS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(products, null, 2), "utf-8");
  } catch (e) {
    // Vercel serverless filesystem is read-only at runtime
  }
}

export async function getAllKarikaProducts(): Promise<KarikaProduct[]> {
  const sql = getNeonSql();
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, name, "group", pack, price, description, image, source, note, is_available, stock_qty
        FROM products
        ORDER BY created_at ASC
      `;
      if (Array.isArray(rows) && rows.length > 0) {
        const stockMap = getMenuStockMap();
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          group: r.group,
          pack: r.pack,
          price: Number(r.price),
          description: r.description || "",
          image: r.image || "/images/hero-dieng.jpg",
          source: r.source || undefined,
          note: r.note || undefined,
          is_available: stockMap[r.id] !== undefined ? stockMap[r.id] : (r.is_available !== false),
          stock_qty: r.stock_qty !== undefined ? Number(r.stock_qty) : 50,
        }));
      }
    } catch (err) {
      console.warn("[products] Neon read error, falling back to local file:", err);
    }
  }

  // Local fallback
  const products = readLocalProducts();
  const stockMap = getMenuStockMap();
  return products.map((prod) => ({
    ...prod,
    is_available: stockMap[prod.id] !== undefined ? stockMap[prod.id] : (prod.is_available !== false),
  }));
}

export function getAllKarikaProductsSync(): KarikaProduct[] {
  const products = readLocalProducts();
  const stockMap = getMenuStockMap();
  return products.map((prod) => ({
    ...prod,
    is_available: stockMap[prod.id] !== undefined ? stockMap[prod.id] : (prod.is_available !== false),
  }));
}

export async function createKarikaProduct(productData: {
  name: string;
  group: "Carica" | "Makanan" | "Camilan" | "Minuman";
  pack: string;
  price: number;
  description: string;
  image?: string;
  stock_qty?: number;
  is_available?: boolean;
}): Promise<KarikaProduct> {
  const idSlug = productData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const id = `${idSlug}-${Date.now().toString(36)}`;

  const newProduct: KarikaProduct = {
    id,
    name: productData.name,
    group: productData.group,
    pack: productData.pack || "1 paket",
    price: Number(productData.price) || 0,
    description: productData.description || "",
    image: productData.image || "/images/hero-dieng.jpg",
    stock_qty: productData.stock_qty !== undefined ? Number(productData.stock_qty) : 50,
    is_available: productData.is_available !== undefined ? Boolean(productData.is_available) : true,
  };

  // 1. Save to Neon PostgreSQL if available
  const sql = getNeonSql();
  if (sql) {
    try {
      await sql`
        INSERT INTO products (id, name, "group", pack, price, description, image, source, note, is_available, stock_qty)
        VALUES (
          ${newProduct.id},
          ${newProduct.name},
          ${newProduct.group},
          ${newProduct.pack},
          ${newProduct.price},
          ${newProduct.description},
          ${newProduct.image},
          ${newProduct.source || ""},
          ${newProduct.note || ""},
          ${newProduct.is_available},
          ${newProduct.stock_qty}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          "group" = EXCLUDED."group",
          pack = EXCLUDED.pack,
          price = EXCLUDED.price,
          description = EXCLUDED.description,
          image = EXCLUDED.image,
          is_available = EXCLUDED.is_available,
          stock_qty = EXCLUDED.stock_qty,
          updated_at = NOW();
      `;
    } catch (e) {
      console.error("[products] Failed to insert to Neon:", e);
    }
  }

  // 2. Save to local products.json
  const local = readLocalProducts();
  local.push(newProduct);
  saveLocalProducts(local);

  setMenuItemAvailability(newProduct.id, newProduct.is_available);
  return newProduct;
}

export async function updateKarikaProduct(
  id: string,
  updates: Partial<KarikaProduct>
): Promise<KarikaProduct | null> {
  const local = readLocalProducts();
  const index = local.findIndex((p) => p.id === id);
  const current = index !== -1 ? local[index] : null;

  const merged: KarikaProduct = {
    id,
    name: updates.name !== undefined ? String(updates.name) : (current?.name || id),
    group: updates.group || current?.group || "Carica",
    pack: updates.pack !== undefined ? String(updates.pack) : (current?.pack || "1 paket"),
    description: updates.description !== undefined ? String(updates.description) : (current?.description || ""),
    image: updates.image !== undefined ? String(updates.image) : (current?.image || "/images/hero-dieng.jpg"),
    price: updates.price !== undefined ? Number(updates.price) : (current?.price || 0),
    stock_qty: updates.stock_qty !== undefined ? Number(updates.stock_qty) : (current?.stock_qty || 50),
    is_available: updates.is_available !== undefined ? Boolean(updates.is_available) : (current?.is_available !== false),
  };

  // 1. Update Neon PostgreSQL
  const sql = getNeonSql();
  if (sql) {
    try {
      await sql`
        UPDATE products SET
          name = COALESCE(${updates.name !== undefined ? String(updates.name) : null}, name),
          "group" = COALESCE(${updates.group || null}, "group"),
          pack = COALESCE(${updates.pack !== undefined ? String(updates.pack) : null}, pack),
          price = COALESCE(${updates.price !== undefined ? Number(updates.price) : null}, price),
          description = COALESCE(${updates.description !== undefined ? String(updates.description) : null}, description),
          image = COALESCE(${updates.image !== undefined ? String(updates.image) : null}, image),
          is_available = COALESCE(${updates.is_available !== undefined ? Boolean(updates.is_available) : null}, is_available),
          stock_qty = COALESCE(${updates.stock_qty !== undefined ? Number(updates.stock_qty) : null}, stock_qty),
          updated_at = NOW()
        WHERE id = ${id};
      `;
    } catch (e) {
      console.error("[products] Failed to update in Neon:", e);
    }
  }

  // 2. Update local file
  if (index !== -1) {
    local[index] = merged;
    saveLocalProducts(local);
  }

  if (updates.is_available !== undefined) {
    setMenuItemAvailability(id, updates.is_available);
  }

  return merged;
}

export async function deleteKarikaProduct(id: string): Promise<boolean> {
  // 1. Delete from Neon PostgreSQL
  const sql = getNeonSql();
  if (sql) {
    try {
      await sql`DELETE FROM products WHERE id = ${id};`;
    } catch (e) {
      console.error("[products] Failed to delete from Neon:", e);
    }
  }

  // 2. Delete from local file
  const local = readLocalProducts();
  const filtered = local.filter((p) => p.id !== id);
  saveLocalProducts(filtered);

  return true;
}
