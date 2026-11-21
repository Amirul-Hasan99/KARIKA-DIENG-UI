import fs from "fs";
import path from "path";
import { Courier } from "@/types";
import { DEFAULT_COURIERS } from "./couriers";

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

export function getStoreSettings(): StoreSettings {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        couriers: Array.isArray(parsed.couriers) && parsed.couriers.length > 0 ? parsed.couriers : DEFAULT_COURIERS,
        admin_whatsapp_display: formatPhoneDisplay(parsed.admin_whatsapp || DEFAULT_SETTINGS.admin_whatsapp),
      };
    }
  } catch (err) {
    console.warn("[settings] Failed to read settings.json, using default:", err);
  }

  // Save default settings file if not exists
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
  } catch {}

  return DEFAULT_SETTINGS;
}

export function updateStoreSettings(updates: Partial<StoreSettings>): StoreSettings {
  const current = getStoreSettings();
  const rawWa = updates.admin_whatsapp ? String(updates.admin_whatsapp).trim() : current.admin_whatsapp;
  
  const updated: StoreSettings = {
    ...current,
    ...updates,
    admin_whatsapp: rawWa,
    admin_whatsapp_display: formatPhoneDisplay(rawWa),
    couriers: updates.couriers ? updates.couriers : current.couriers,
    updated_at: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.error("[settings] Failed to save settings.json:", err);
    throw err;
  }

  return updated;
}

export function getStoreCouriers(): Courier[] {
  return getStoreSettings().couriers;
}

export function saveStoreCourier(courierData: {
  id?: string;
  name: string;
  phone: string;
  zone?: string;
  vehicle?: string;
  is_active?: boolean;
}): { couriers: Courier[]; saved: Courier } {
  const settings = getStoreSettings();
  let couriers = [...settings.couriers];

  if (courierData.id) {
    // Edit existing courier
    const idx = couriers.findIndex((c) => c.id === courierData.id);
    if (idx !== -1) {
      couriers[idx] = {
        ...couriers[idx],
        ...courierData,
        phone: String(courierData.phone).trim(),
      };
      updateStoreSettings({ couriers });
      return { couriers, saved: couriers[idx] };
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
  updateStoreSettings({ couriers });
  return { couriers, saved: newCourier };
}

export function deleteStoreCourier(courierId: string): Courier[] {
  const settings = getStoreSettings();
  const filtered = settings.couriers.filter((c) => c.id !== courierId);
  updateStoreSettings({ couriers: filtered });
  return filtered;
}
