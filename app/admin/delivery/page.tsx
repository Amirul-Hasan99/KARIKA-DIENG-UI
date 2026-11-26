"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flaticon } from "@/components/ui/Flaticon";
import { Order } from "@/types";

const money = (v: number) => `Rp${v.toLocaleString("id-ID")}`;

function isOrderDelivered(order: Order): boolean {
  return order.delivery_status === "delivered" || order.order_status === "completed";
}

function isCodPayment(order: Order): boolean {
  return order.payment_type === "cod" || order.payment_type === "cash";
}

export default function AdminDeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/orders", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Tidak dapat memuat pesanan.");
      setOrders(d.orders || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi gangguan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const t = setInterval(() => void refresh(), 8000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(t);
    };
  }, [refresh]);

  async function setTwoStateDelivery(order: Order, nextStatus: "picked_up" | "delivered") {
    setBusyId(order.id);
    setError("");
    try {
      const r = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_status: nextStatus,
          order_status: nextStatus === "delivered" ? "completed" : "ready",
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || "Status tidak dapat disimpan.");
      }
      setOrders((prev) => prev.map((o) => (o.id === order.id ? d.order : o)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui status pengiriman.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmCash(order: Order) {
    setBusyId(order.id);
    setError("");
    try {
      const r = await fetch("/api/orders/confirm-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || "Pembayaran belum dapat dikonfirmasi.");
      }
      setOrders((prev) => prev.map((o) => (o.id === order.id ? d.order : o)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengkonfirmasi pembayaran tunai.");
    } finally {
      setBusyId(null);
    }
  }

  const activeOrders = orders.filter((o) => o.payment_status !== "failed");

  return (
    <main className="min-h-screen bg-[#F7F5F0] px-4 py-6 text-[#1C1917] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E1D6] pb-5">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#57534E] hover:text-[#1C1917] transition"
            >
              <Flaticon name="arrow-left" className="text-xs" />
              <span>Kembali ke Dashboard</span>
            </Link>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1C1917]">
              Pesanan &amp; Pengiriman Dieng
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#57534E]">
              Kontrol pengiriman 2 tahap: <strong className="text-[#1C1917]">Dalam Pengiriman</strong> &rarr;{" "}
              <strong className="text-[#15803D]">Terkirim</strong>.
            </p>
          </div>
          <button
            onClick={() => void refresh()}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#E6E1D6] bg-white px-4 py-2 text-sm font-semibold text-[#1C1917] hover:bg-[#FAF8F5] active:scale-[0.99] transition cursor-pointer shadow-2xs"
          >
            <Flaticon name="refresh" className="text-xs" />
            <span>Muat Ulang</span>
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-[#B91C1C] font-medium">
            {error}
          </p>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="rounded-xl border border-[#E6E1D6] bg-white p-6 text-sm text-[#57534E]">
              Memuat daftar pengiriman…
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="rounded-xl border border-[#E6E1D6] bg-white p-8 text-center text-sm text-[#57534E]">
              Belum ada pesanan aktif yang perlu dikirim.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeOrders.map((order) => {
                const delivered = isOrderDelivered(order);
                const isCod = isCodPayment(order);
                const isBusy = busyId === order.id;
                const totalQty = order.items.reduce((n, i) => n + i.qty, 0);

                return (
                  <article
                    key={order.id}
                    className="rounded-xl border border-[#E6E1D6] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.05)] flex flex-col justify-between overflow-hidden"
                  >
                    {/* Header: Order ID + Payment Badge + Current Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#E6E1D6] bg-[#FAF8F5] px-4 py-2.5">
                      <span className="font-mono text-xs font-bold text-[#1C1917] tabular-nums truncate">
                        #{order.order_number}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            isCod
                              ? "bg-stone-200 text-[#1C1917]"
                              : "bg-[#FEF3C7] text-[#B45309]"
                          }`}
                        >
                          {isCod ? "COD" : "QRIS"}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                            delivered
                              ? "bg-[#DCFCE7] text-[#15803D]"
                              : "bg-amber-100 text-[#B45309]"
                          }`}
                        >
                          {delivered ? "Terkirim" : "Dalam Pengiriman"}
                        </span>
                      </div>
                    </div>

                    {/* Body: Compact Structured Metadata */}
                    <div className="p-4 space-y-3 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-sm font-bold text-[#1C1917] truncate">
                            {order.customer_name || "Pembeli"}
                          </h2>
                          <p className="font-mono text-xs text-[#57534E] tabular-nums mt-0.5">
                            {order.customer_phone || "-"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-sm font-extrabold text-[#1C1917] tabular-nums">
                            {money(order.total_amount)}
                          </p>
                          <p className="text-[11px] font-medium text-[#57534E]">
                            {totalQty} paket •{" "}
                            <span
                              className={
                                order.payment_status === "settlement"
                                  ? "text-[#15803D] font-bold"
                                  : "text-[#B45309] font-semibold"
                              }
                            >
                              {order.payment_status === "settlement" ? "Lunas" : "Belum Lunas"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-[#E6E1D6] pt-2.5 text-xs text-[#57534E] space-y-1">
                        <p className="line-clamp-2 text-[#1C1917] font-medium leading-snug">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534E] mr-1.5">
                            Patokan:
                          </span>
                          {order.delivery_address || "Alamat belum tercatat"}
                        </p>
                        {order.delivery_distance_km !== undefined && (
                          <p className="font-mono text-[11px] text-[#57534E] tabular-nums">
                            Jarak: ~{order.delivery_distance_km} km dari Titik 0 Dieng
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer: Maps Link + Streamlined 2-State Action */}
                    <div className="border-t border-[#E6E1D6] bg-[#FAF8F5] px-4 py-3 space-y-2">
                      {isCod && order.payment_status !== "settlement" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void confirmCash(order)}
                          className="w-full min-h-[38px] rounded-lg border border-[#E6E1D6] bg-white hover:bg-stone-50 px-3 py-1.5 text-xs font-semibold text-[#1C1917] active:scale-[0.99] transition disabled:opacity-50"
                        >
                          Konfirmasi Tunai COD Diterima
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        {order.coordinates && (
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://www.google.com/maps/search/?api=1&query=${order.coordinates.lat},${order.coordinates.lng}`}
                            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-[#E6E1D6] bg-white px-3 py-2 text-xs font-semibold text-[#1C1917] hover:bg-stone-50 active:scale-[0.99] transition shrink-0"
                            title="Buka Rute Google Maps"
                          >
                            <Flaticon name="marker" variant="sr" className="text-xs text-[#D97706]" />
                            <span>Maps</span>
                          </a>
                        )}

                        {!delivered ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void setTwoStateDelivery(order, "delivered")}
                            className="flex-1 min-h-[42px] rounded-lg bg-[#D97706] hover:bg-[#B45309] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white active:scale-[0.99] transition disabled:opacity-50"
                          >
                            {isBusy ? "Menyimpan..." : "Tandai Terkirim"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void setTwoStateDelivery(order, "picked_up")}
                            className="flex-1 min-h-[42px] rounded-lg border border-[#E6E1D6] bg-white hover:bg-stone-50 px-3 py-2 text-xs font-semibold text-[#57534E] active:scale-[0.99] transition disabled:opacity-50"
                          >
                            {isBusy ? "Menyimpan..." : "Kembali ke Dalam Pengiriman"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
