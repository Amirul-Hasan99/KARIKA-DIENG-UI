import fs from "fs";
import path from "path";
import { Courier } from "@/types";
import { DEFAULT_COURIERS } from "./couriers";
import { getNeonSql, ensureNeonTables } from "./db";

export { DEFAULT_COURIERS };

export interface StoreSettings {
  admin_whatsapp: string;
  admin_whatsapp_display: string;
  qris_image_url: string;
  qris_merchant_name: string;
  store_name: string;
  store_address: string;
  store_hours: string;
  couriers: Courier[];
  updated_at: string;
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), "data", "settings.json");

export const DEFAULT_SETTINGS: StoreSettings = {
  admin_whatsapp: "083122046357",
  admin_whatsapp_display: "0831-2204-6357",
  qris_image_url: "",
  qris_merchant_name: "D OLEH - OLEH DIENG",
  store_name: "D OLEH - OLEH",
  store_address: "Titik 0 Km Dieng, Kejajar, Wonosobo, Jawa Tengah",
  store_hours: "Buka Setiap Hari: 07.00 - 21.00 WIB",
  couriers: DEFAULT_COURIERS,
  updated_at: new Date().toISOString(),
};

/**
 * Standardize phone number to WhatsApp international format (e.g. 628123456789)
 */
export function formatWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("62")) {
    return cleaned;
  }
  if (cleaned.startsWith("0")) {
    return `62${cleaned.slice(1)}`;
  }
  return cleaned;
}

/**
 * Format phone number for human friendly display (e.g. 0831-2204-6357)
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  let standard = cleaned;
  if (standard.startsWith("62")) {
    standard = `0${standard.slice(2)}`;
  }
  if (standard.length >= 10) {
    return `${standard.slice(0, 4)}-${standard.slice(4, 8)}-${standard.slice(8)}`;
  }
  return standard;
}

function normalizeSettings(parsed: any): StoreSettings {
  const rawWa = parsed?.admin_whatsapp || DEFAULT_SETTINGS.admin_whatsapp;
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    couriers: Array.isArray(parsed?.couriers) ? parsed.couriers : DEFAULT_COURIERS,
    admin_whatsapp: rawWa,
    admin_whatsapp_display: formatPhoneDisplay(rawWa),
  };
}

function readLocalSettings(): StoreSettings | null {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      return normalizeSettings(JSON.parse(raw));
    }
  } catch (err) {
    console.warn("[settings] Failed to read settings.json:", err);
  }
  return null;
}

function writeLocalSettingsSafe(settings: StoreSettings): void {
  // Never throw on read-only serverless filesystems (e.g. Vercel /var/task)
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), "utf-8");
  } catch {
    // Non-fatal in production serverless environment
  }
}

export async function getStoreSettings(): Promise<StoreSettings> {
  // 1. Try Neon PostgreSQL first (authoritative in cloud production)
  try {
    await ensureNeonTables();
    const sql = getNeonSql();
    if (sql && global.__neonReachable !== false) {
      const rows: any = await sql`
        SELECT data FROM store_settings WHERE id = 'default' LIMIT 1;
      `;
      if (Array.isArray(rows) && rows.length > 0 && rows[0]?.data) {
        const parsed = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
        const normalized = normalizeSettings(parsed);
        writeLocalSettingsSafe(normalized);
        return normalized;
      }
    }
  } catch (err) {
    console.warn("[settings] Neon read fallback:", err);
  }

  // 2. Fallback to local file
  const local = readLocalSettings();
  if (local) return local;

  // 3. Default
  writeLocalSettingsSafe(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateStoreSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getStoreSettings();
  const rawWa = updates.admin_whatsapp ? String(updates.admin_whatsapp).trim() : current.admin_whatsapp;

  const updated: StoreSettings = {
    ...current,
    ...updates,
    admin_whatsapp: rawWa,
    admin_whatsapp_display: formatPhoneDisplay(rawWa),
    couriers: updates.couriers !== undefined ? updates.couriers : current.couriers,
    updated_at: new Date().toISOString(),
  };

  // 1. Persist to Neon PostgreSQL
  try {
    await ensureNeonTables();
    const sql = getNeonSql();
    if (sql && global.__neonReachable !== false) {
      await sql`
        INSERT INTO store_settings (id, data, updated_at)
        VALUES ('default', ${JSON.stringify(updated)}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW();
      `;
    }
  } catch (err) {
    console.error("[settings] Failed to save to Neon:", err);
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      throw new Error("Gagal menyimpan pengaturan ke database cloud.");
    }
  }

  // 2. Non-throwing local cache update
  writeLocalSettingsSafe(updated);

  return updated;
}

export async function getStoreCouriers(): Promise<Courier[]> {
  const settings = await getStoreSettings();
  return settings.couriers;
}

export async function saveStoreCourier(courierData: {
  id?: string;
  name: string;
  phone: string;
  zone?: string;
  vehicle?: string;
  is_active?: boolean;
}): Promise<{ couriers: Courier[]; saved: Courier; settings: StoreSettings }> {
  const settings = await getStoreSettings();
  const couriers = [...settings.couriers];

  if (courierData.id) {
    // Edit existing courier
    const idx = couriers.findIndex((c) => c.id === courierData.id);
    if (idx !== -1) {
      couriers[idx] = {
        ...couriers[idx],
        ...courierData,
        name: courierData.name.trim(),
        phone: String(courierData.phone).trim(),
      };
      const updatedSettings = await updateStoreSettings({ couriers });
      return { couriers: updatedSettings.couriers, saved: couriers[idx], settings: updatedSettings };
    }
  }

  // Add new courier
  const newCourier: Courier = {
    id: courierData.id || `k_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: courierData.name.trim(),
    phone: String(courierData.phone).trim(),
    zone: courierData.zone || "Area 0-8 Km Dieng",
    vehicle: courierData.vehicle || "Sepeda Motor",
    is_active: courierData.is_active !== undefined ? courierData.is_active : true,
  };

  couriers.push(newCourier);
  const updatedSettings = await updateStoreSettings({ couriers });
  return { couriers: updatedSettings.couriers, saved: newCourier, settings: updatedSettings };
}

export async function deleteStoreCourier(courierId: string): Promise<{ couriers: Courier[]; settings: StoreSettings }> {
  const settings = await getStoreSettings();
  const filtered = settings.couriers.filter((c) => c.id !== courierId);
  const updatedSettings = await updateStoreSettings({ couriers: filtered });
  return { couriers: updatedSettings.couriers, settings: updatedSettings };
}
