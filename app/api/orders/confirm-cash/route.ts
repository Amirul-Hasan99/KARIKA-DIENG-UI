import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderPayment } from "@/lib/order-store";
import { notifyPaymentOnWhatsApp } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, paymentType } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const existing = await getOrderById(orderId);
    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Preserve original payment_type (qris vs cod/cash) unless explicitly overridden
    const resolvedType = paymentType || existing.payment_type || "cod";
    const txPrefix = resolvedType === "qris" ? "qris_manual" : "cash";
    const updated = await updateOrderPayment(
      orderId,
      "settlement",
      resolvedType,
      `${txPrefix}_${Date.now()}`
    );
    if (updated) await notifyPaymentOnWhatsApp(updated);

    if (!updated) {
      return NextResponse.json(
        { error: "Order not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        resolvedType === "qris"
          ? "Pembayaran QRIS berhasil dikonfirmasi lunas!"
          : "Pembayaran tunai (COD) berhasil dikonfirmasi lunas!",
      order: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
