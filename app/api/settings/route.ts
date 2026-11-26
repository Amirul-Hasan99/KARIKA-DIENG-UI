import { NextResponse } from "next/server";
import {
  getStoreSettings,
  updateStoreSettings,
  formatWhatsAppNumber,
  saveStoreCourier,
  deleteStoreCourier,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json(
      {
        success: true,
        settings,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat pengaturan" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Autentikasi sesi admin
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("dioleh2_admin_session=")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya admin terautentikasi yang dapat mengubah pengaturan" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      admin_whatsapp,
      qris_image_url,
      qris_merchant_name,
      store_name,
      store_address,
      store_hours,
      couriers,
      action,
      courier,
      courierId,
    } = body;

    // Aksi khusus kurir: save (tambah / edit)
    if (action === "save_courier" && courier) {
      if (!courier.name || !courier.phone) {
        return NextResponse.json(
          { success: false, error: "Nama dan nomor WhatsApp kurir wajib diisi" },
          { status: 400 }
        );
      }
      const cleanPhone = String(courier.phone).replace(/[^0-9]/g, "");
      if (cleanPhone.length < 9) {
        return NextResponse.json(
          { success: false, error: "Nomor WhatsApp kurir tidak valid" },
          { status: 400 }
        );
      }
      const res = await saveStoreCourier(courier);
      return NextResponse.json({
        success: true,
        message: "Data kurir berhasil disimpan",
        courier: res.saved,
        couriers: res.couriers,
        settings: res.settings,
      });
    }

    // Aksi khusus kurir: delete
    if (action === "delete_courier" && courierId) {
      const res = await deleteStoreCourier(courierId);
      return NextResponse.json({
        success: true,
        message: "Kurir berhasil dihapus",
        couriers: res.couriers,
        settings: res.settings,
      });
    }

    // Validasi nomor WhatsApp jika diberikan
    if (admin_whatsapp !== undefined) {
      const cleanWa = String(admin_whatsapp).replace(/[^0-9]/g, "");
      if (cleanWa.length < 9 || cleanWa.length > 15) {
        return NextResponse.json(
          { success: false, error: "Nomor WhatsApp tidak valid. Masukkan 10-14 digit nomor telepon Indonesia." },
          { status: 400 }
        );
      }
    }

    const updated = await updateStoreSettings({
      ...(admin_whatsapp !== undefined ? { admin_whatsapp: String(admin_whatsapp).trim() } : {}),
      ...(qris_image_url !== undefined ? { qris_image_url: String(qris_image_url).trim() } : {}),
      ...(qris_merchant_name !== undefined ? { qris_merchant_name: String(qris_merchant_name).trim() } : {}),
      ...(store_name !== undefined ? { store_name: String(store_name).trim() } : {}),
      ...(store_address !== undefined ? { store_address: String(store_address).trim() } : {}),
      ...(store_hours !== undefined ? { store_hours: String(store_hours).trim() } : {}),
      ...(Array.isArray(couriers) ? { couriers } : {}),
    });

    return NextResponse.json({
      success: true,
      message: "Pengaturan admin & pembayaran berhasil disimpan",
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menyimpan pengaturan" },
      { status: 500 }
    );
  }
}
