import { NextRequest, NextResponse } from "next/server";
import { getAllOrdersAdmin } from "@/lib/order-store";
import { verifyAdminSessionFromRequest } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { maskName, maskPhone } from "@/lib/utils";

function normalizeIndoPhone(val?: string): string {
  if (!val) return "";
  const digits = val.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const table = (searchParams.get("table") || "").trim();

    if (!q && !table) {
      return NextResponse.json(
        { error: "Parameter q (No. Pesanan / No. WhatsApp) atau table harus diisi." },
        { status: 400 }
      );
    }

    const isAdmin = await verifyAdminSessionFromRequest(req);

    // Apply Rate Limiting for unauthenticated public lookups (max 10 queries per minute per IP)
    if (!isAdmin) {
      const clientIp =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "public-client";

      const limitResult = await checkRateLimit(`search:${clientIp}`, 10, 60 * 1000);
      if (!limitResult.allowed) {
        return NextResponse.json(
          {
            error: "Terlalu banyak permintaan pencarian status pesanan. Silakan tunggu 1 menit sebelum mencoba lagi.",
          },
          { status: 429 }
        );
      }

      // Enforce strict query validation for public users to prevent scraping/enumeration
      const digitsOnly = q.replace(/\D/g, "");
      const isExactOrderCode = /^((GC|ORD)-[a-zA-Z0-9_-]{4,}|[a-zA-Z0-9_-]{10,})$/i.test(q);
      const isCompletePhone = digitsOnly.length >= 10;
      const isTableQuery = Boolean(table && table.length <= 20);

      if (!isExactOrderCode && !isCompletePhone && !isTableQuery) {
        return NextResponse.json(
          {
            error:
              "Untuk melindungi privasi pelanggan, masukkan Nomor Pesanan lengkap (contoh: GC-...) atau Nomor WhatsApp lengkap (minimal 10 digit) yang digunakan saat pemesanan.",
          },
          { status: 400 }
        );
      }
    }

    const allOrders = await getAllOrdersAdmin();
    const lowerQuery = q.toLowerCase();
    const cleanQueryDigits = q.replace(/\D/g, "");
    const normQueryPhone = normalizeIndoPhone(q);

    const matched = allOrders.filter((order) => {
      // Table filter
      if (table && order.table_number && order.table_number.toLowerCase() === table.toLowerCase()) {
        return true;
      }

      if (!q) return false;

      // Exact order ID or order number match (allowed for both public & admin)
      if (order.id && order.id.toLowerCase() === lowerQuery) return true;
      if (order.order_number && order.order_number.toLowerCase() === lowerQuery) return true;

      // Phone lookup
      if (order.customer_phone) {
        const cleanOrderDigits = order.customer_phone.replace(/\D/g, "");
        const normOrderPhone = normalizeIndoPhone(order.customer_phone);

        if (cleanQueryDigits.length >= 10) {
          // Public requires exact phone match
          if (cleanOrderDigits === cleanQueryDigits || normOrderPhone === normQueryPhone) {
            return true;
          }
          // Admin may do substring phone search
          if (isAdmin && (cleanOrderDigits.includes(cleanQueryDigits) || normOrderPhone.includes(normQueryPhone))) {
            return true;
          }
        }
      }

      // Admin-only partial name / ID search
      if (isAdmin) {
        if (order.customer_name && order.customer_name.toLowerCase().includes(lowerQuery)) return true;
        if (order.customer_id && order.customer_id.toLowerCase().includes(lowerQuery)) return true;
        if (order.order_number && order.order_number.toLowerCase().includes(lowerQuery)) return true;
      }

      return false;
    });

    // If caller is admin, return complete details
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        count: matched.length,
        orders: matched.slice(0, 25),
      });
    }

    // For public customers: DATA MINIMIZATION to protect PII
    const sanitizedOrders = matched.slice(0, 10).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      customer_name: maskName(order.customer_name),
      customer_phone: maskPhone(order.customer_phone),
      delivery_address: order.delivery_address ? "Kawasan Dieng (Terkonfirmasi)" : "Dieng",
      // Never expose coordinates or payment proof URL to public lookups
      total_amount: order.total_amount,
      payment_status: order.payment_status,
      order_status: order.order_status,
      delivery_status: order.delivery_status || "pending",
      payment_type: order.payment_type || "qris",
      created_at: order.created_at,
      items: (order.items || []).map((item) => ({
        menu_id: item.menu_id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        subtotal: item.subtotal,
      })),
    }));

    return NextResponse.json({
      success: true,
      count: sanitizedOrders.length,
      orders: sanitizedOrders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Terjadi kendala saat memproses pencarian pesanan." },
      { status: 500 }
    );
  }
}
