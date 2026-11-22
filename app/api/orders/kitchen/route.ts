import { NextRequest, NextResponse } from "next/server";
import { getAllKitchenOrders } from "@/lib/order-store";
import { verifyAdminSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminSessionFromRequest(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Akses ditolak: Autentikasi sesi staf dapur/admin diperlukan." },
        { status: 401 }
      );
    }

    const orders = await getAllKitchenOrders();
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
