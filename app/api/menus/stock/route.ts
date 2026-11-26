import { NextRequest, NextResponse } from "next/server";
import { getMenuStockMap, setMenuItemAvailability } from "@/lib/order-store";
import { getAllKarikaProducts, updateKarikaProduct } from "@/lib/karika-products";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getAllKarikaProducts();
  const stock: Record<string, boolean> = { ...getMenuStockMap() };
  for (const p of products) {
    stock[p.id] = p.is_available !== false;
  }
  return NextResponse.json({ success: true, stock });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { menuId, isAvailable } = body;

    if (!menuId || typeof isAvailable !== "boolean") {
      return NextResponse.json(
        { error: "menuId and isAvailable (boolean) are required." },
        { status: 400 }
      );
    }

    setMenuItemAvailability(menuId, isAvailable);
    await updateKarikaProduct(menuId, { is_available: isAvailable });

    return NextResponse.json({
      success: true,
      menuId,
      isAvailable,
      message: `Menu ${menuId} status diubah menjadi ${isAvailable ? "Tersedia" : "Habis"}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update menu stock" },
      { status: 500 }
    );
  }
}
