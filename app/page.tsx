"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Flaticon } from "@/components/ui/Flaticon";
import { BrandLogoIcon } from "@/components/ui/BrandLogo";
import { INITIAL_KARIKA_PRODUCTS, KarikaProduct } from "@/lib/karika-products-data";

const heroImage = "/images/logo-d-oleh2.png";

const featuredProducts = [
  {
    id: "carica-biasa",
    name: "Carica Manisan Asli",
    pack: "Isi 6 Cup × 115 g",
    price: 22000,
    tag: "Paling Laris",
    image:
      "https://ayopromo.com/show-picture?path=gambar%2Fproduk%2FcCVpzIO5LdcBNAiT9hNdNhWOmOhJh9dsMmMcDi3V.jpg",
    desc: "Potongan pepaya gunung khas Dieng dengan kuah sirup manis alami yang segar dinikmati dingin.",
  },
  {
    id: "carica-premium",
    name: "Carica Premium Spesial",
    pack: "Isi 6 Cup Besar",
    price: 40000,
    tag: "Kemasan Berbagi",
    image:
      "https://down-id.img.susercontent.com/file/id-11134207-7ra0k-mc7nllxauxj618",
    desc: "Pilihan cup ukuran besar berkuah sirup melimpah, favorit keluarga saat berkunjung ke Dieng.",
  },
  {
    id: "mie-ongklok",
    name: "Mie Ongklok Instan",
    pack: "Isi 6 Bungkus",
    price: 78000,
    tag: "Kuliner Legendaris",
    image: "/images/mie-ongklok.jpg",
    desc: "Kuah kental gurih berempah khas Wonosobo lengkap dengan ebi, tahu, dan kucai kering.",
  },
  {
    id: "keripik-jamur",
    name: "Keripik Jamur Tiram",
    pack: "Isi 6 Bungkus",
    price: 150000,
    tag: "Camilan Renyah",
    image:
      "https://raja-wisata.com/wp-content/uploads/2024/09/Keripik-Jamur-Dieng.jpg",
    desc: "Jamur tiram budidaya pegunungan berbalut tepung bumbu renyah, gurih tahan lama.",
  },
];

const deliveryStatusText: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Menunggu Konfirmasi Toko",
    color: "bg-amber-100 text-amber-900 border-amber-300",
  },
  assigned: {
    label: "Kurir Ditugaskan",
    color: "bg-blue-100 text-blue-900 border-blue-300",
  },
  picked_up: {
    label: "Kurir Dalam Perjalanan (Otw Dieng)",
    color: "bg-purple-100 text-purple-900 border-purple-300",
  },
  delivered: {
    label: "Pesanan Telah Tiba",
    color: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  failed_attempt: {
    label: "Pengantaran Tertunda",
    color: "bg-rose-100 text-rose-900 border-rose-300",
  },
};

export default function HomePage() {
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [products, setProducts] = useState<KarikaProduct[]>(INITIAL_KARIKA_PRODUCTS);
  const [adminPhone, setAdminPhone] = useState("083122046357");
  const [adminDisplayPhone, setAdminDisplayPhone] = useState("0831-2204-6357");

  // Pagination for 9 products (3x3 grid) on Landing Page
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const itemsPerPage = 9;
  const totalProductPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const startProductIndex = (currentProductPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startProductIndex, startProductIndex + itemsPerPage);

  const handleProductPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalProductPages) {
      setCurrentProductPage(newPage);
      const el = document.getElementById("pilihan-favorit");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Load live products and store settings
  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.products) && d.products.length > 0) {
          setProducts(d.products);
        }
      })
      .catch(() => {});

    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.admin_whatsapp) {
          setAdminPhone(d.settings.admin_whatsapp);
          setAdminDisplayPhone(d.settings.admin_whatsapp_display || d.settings.admin_whatsapp);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const checkActiveOrder = async () => {
      try {
        const raw = localStorage.getItem("karika_active_order");
        if (!raw) {
          setActiveOrder(null);
          return;
        }
        const parsed = JSON.parse(raw);
        if (!parsed.orderId) return;

        // Fetch fresh status from API
        const res = await fetch(`/api/orders/${encodeURIComponent(parsed.orderId)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            const updated = {
              orderId: data.order.id,
              orderNumber: data.order.order_number,
              customerName: data.order.customer_name,
              customerPhone: data.order.customer_phone,
              totalAmount: data.order.total_amount,
              paymentType: data.order.payment_type,
              paymentStatus: data.order.payment_status,
              deliveryStatus: data.order.delivery_status || "pending",
              updatedAt: new Date().toISOString(),
            };
            setActiveOrder(updated);
            localStorage.setItem("karika_active_order", JSON.stringify(updated));
            return;
          }
        }
        setActiveOrder(parsed);
      } catch {}
    };

    void checkActiveOrder();
    const interval = setInterval(checkActiveOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  const dismissActiveOrder = () => {
    localStorage.removeItem("karika_active_order");
    setActiveOrder(null);
  };
  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#24251f] selection:bg-[#E25C00] selection:text-white">
      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#e7e4d8] bg-[#f8f7f2]/90 backdrop-blur-md">
        <nav className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="flex items-center gap-2.5 sm:gap-3 group"
              title="D OLEH - OLEH"
            >
              <span className="flex h-10 w-14 sm:h-12 sm:w-16 items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-xs border border-[#1b3d2b]/20 bg-[#163826]">
                <img
                  src="/images/logo-d-oleh2.webp"
                  alt="D OLEH-OLEH"
                  className="h-full w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                />
              </span>
              <div className="flex flex-col">
                <span className="text-base xs:text-lg sm:text-2xl font-black tracking-tight text-[#24251f] whitespace-nowrap">
                  D OLEH - OLEH
                </span>
                <span className="text-[10px] font-semibold text-[#7d7a6e] -mt-1 hidden md:inline">
                  Sentra Oleh-Oleh Khas Dataran Tinggi
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs xl:text-sm font-semibold text-[#5c5a52]">
            <a href="#pilihan-favorit" className="hover:text-black transition px-1 py-0.5">
              Produk Favorit
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Titik+0+Dieng"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-black transition px-1 py-0.5"
            >
              <Flaticon name="marker" variant="sr" className="text-xs text-[#a28b00]" />
              Area Antar 8 km
            </a>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href={activeOrder ? `/orders/${activeOrder.orderId}` : "/orders"}>
              <Button
                variant="outline"
                size="default"
                className={`relative rounded-full border font-bold text-xs h-8 sm:h-9 px-2.5 sm:px-3.5 gap-1 sm:gap-1.5 shadow-2xs transition shrink-0 ${
                  activeOrder
                    ? "border-amber-300 bg-amber-100/90 text-amber-900 shadow-xs"
                    : "border-[#d8d5c7] bg-white text-[#24251f] hover:bg-[#faf9f5]"
                }`}
              >
                <Flaticon name="truck-side" className="text-xs text-[#90802a]" />
                <span className="hidden xs:inline">Pantau</span> Pesanan
                {activeOrder && (
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping ml-0.5" />
                )}
              </Button>
            </Link>
            <Link href="/catalog">
              <Button
                variant="secondary"
                size="default"
                className="rounded-full shadow-xs hover:shadow-md transition gap-1.5 font-bold h-8 sm:h-9 px-3 sm:px-4 bg-[#E25C00] hover:bg-[#c84f00] text-white text-xs shrink-0"
              >
                <Flaticon name="shopping-bag" variant="sr" className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">Beli Oleh-Oleh</span>
                <span className="sm:hidden">Beli</span>
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ACTIVE ORDER LIVE TRACKING BANNER (Device notification) */}
      {activeOrder && (
        <aside aria-label="Status pesanan aktif" className="mx-auto max-w-7xl px-4 pt-4 sm:px-10">
          <div className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-r from-[#fffcf2] via-white to-[#fbf9ed] p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E25C00] px-2.5 py-0.5 text-[11px] font-black text-white">
                    <Flaticon name="bell-ring" variant="sr" className="text-xs" />
                    PESANAN AKTIF
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {activeOrder.orderNumber}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                      deliveryStatusText[activeOrder.deliveryStatus || "pending"]?.color ||
                      "bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    {deliveryStatusText[activeOrder.deliveryStatus || "pending"]?.label ||
                      activeOrder.deliveryStatus}
                  </span>
                  {activeOrder.paymentStatus !== "settlement" && (
                    <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      Belum Lunas
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6a685e]">
                  Pesanan a.n. <strong>{activeOrder.customerName || "Pembeli"}</strong> sedang dipantau langsung dari toko Dieng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/orders/${activeOrder.orderId}`}>
                  <Button
                    size="sm"
                    className="rounded-xl bg-[#292a23] hover:bg-black text-white font-bold text-xs gap-1.5"
                  >
                    <Flaticon name="qr" variant="sr" className="text-xs" />
                    <span>Lihat Detail / Bayar QRIS</span>
                  </Button>
                </Link>
                <button
                  onClick={dismissActiveOrder}
                  title="Sembunyikan dari landing page"
                  className="rounded-xl border border-[#dedad0] bg-white p-2 text-xs text-[#7d7a70] hover:bg-[#f5f2e8]"
                >
                  <Flaticon name="cross" className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Headlines & Call to actions */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[#1e1f1a] leading-[1.08]">
                 <span className="text-[#E25C00]">
                  D' oleh-Oleh
                </span>{" "}
                <br />
                Dingin udaranya,{" "}
                <span className="text-[#E25C00]">
                  hangat &amp; manis
                </span>{" "}
                oleh-olehnya.
              </h1>

              {/* Narasi Panduan Pemesanan & Bantuan Admin */}
              <p className="text-sm sm:text-base text-[#66645b] font-medium leading-relaxed max-w-xl">
                Jika Anda kebingungan cara memesan oleh-oleh melalui sistem website ini, tim kami siap membantu Anda dengan senang hati. Cukup hubungi admin kami dengan mengklik tombol <strong>CHAT ADMIN</strong> di bawah ini untuk pemesanan langsung via WhatsApp.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link href="/catalog">
                  <Button
                    size="lg"
                    className="h-12 sm:h-14 rounded-2xl bg-[#282922] text-white hover:bg-black font-extrabold px-7 sm:px-8 text-sm sm:text-base shadow-lg shadow-black/10 transition gap-2"
                  >
                    <span>Pilih Oleh-Oleh Sekarang</span>
                    <Flaticon name="arrow-right" variant="rr" className="text-sm" />
                  </Button>
                </Link>

                <a
                  href={`https://wa.me/${adminPhone.replace(/[^0-9]/g, "").startsWith("62") ? adminPhone.replace(/[^0-9]/g, "") : `62${adminPhone.replace(/[^0-9]/g, "").replace(/^0/, "")}`}?text=${encodeURIComponent("Halo Admin D OLEH-OLEH, saya ingin bertanya mengenai produk oleh-oleh Dieng.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 sm:h-14 items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black px-6 sm:px-8 text-sm sm:text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.842-.981z" />
                  </svg>
                  <span>CHAT ADMIN</span>
                </a>

                <a href="#pilihan-favorit">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 sm:h-14 rounded-2xl border-[#dcd8ca] bg-white font-bold text-[#4f4d45] hover:bg-[#f4f2e9] gap-2 px-5 text-sm"
                  >
                    <span>Lihat Produk</span>
                    <Flaticon name="arrow-small-down" variant="rr" className="text-sm" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: Hero Visual Card with Brand Logo */}
            <div className="lg:col-span-5">
              <div className="relative isolate mx-auto w-full max-w-md lg:max-w-none">
                {/* Decorative background glow */}
                <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-[#163826]/20 via-[#E25C00]/15 to-transparent blur-2xl -z-10" />

                <div className="relative aspect-[4/5] sm:aspect-[4/4.5] overflow-hidden rounded-[2.25rem] border-2 border-[#e7e4d8] bg-white shadow-2xl flex flex-col items-center justify-center p-4 sm:p-6">
                  {/* Top Badge on card */}
                  <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/90 px-3.5 py-1.5 text-xs font-bold text-[#E25C00] shadow-2xs backdrop-blur-md">
                      <Flaticon name="compass" variant="rr" className="text-xs text-[#E25C00]" />
                      Titik 0 Km Dieng
                    </span>
                  </div>

                  {/* Logo - prominently centered with rounded corners */}
                  <div className="flex-1 flex items-center justify-center w-full px-2 sm:px-4 py-14 sm:py-16">
                    <div className="w-full max-w-[320px] sm:max-w-[360px] aspect-[3/2] rounded-2xl overflow-hidden shadow-xl border border-[#1b3d2b]/25 bg-[#163826] transition duration-700 hover:scale-[1.03]">
                      <img
                        src="/images/logo-d-oleh2.webp"
                        alt="Logo Resmi D OLEH-OLEH Wonosobo Dieng"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Bottom Captions on card */}
                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 sm:p-4 text-center border border-[#e8e5dc] shadow-xs z-10">
                    <p className="text-xs sm:text-sm font-black uppercase tracking-[0.15em] text-[#E25C00]">
                      D' Oleh-Oleh
                    </p>
                    <p className="text-xs text-[#5c5a52] font-semibold leading-relaxed pt-0.5">
                      Pesan sekarang dan nikmati waktu liburan Anda di Dieng.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED SIGNATURE PRODUCTS */}
      <section id="pilihan-favorit" className="py-12 sm:py-24 bg-[#f8f7f2]">
        <div className="mx-auto max-w-7xl px-3 sm:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Badge variant="default" className="bg-[#E25C00] text-white font-extrabold">
                Koleksi Terpopuler
              </Badge>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-[#1e1f1a]">
                Pilihan Oleh-Oleh Favorit Wisatawan
              </h2>
              <p className="mt-2 text-[#69665c]">
                Produk olahan khas Dieng dan Wonosobo yang paling sering dipesan untuk buah tangan.
              </p>
            </div>
            <Link href="/catalog">
              <Button variant="outline" className="rounded-full border-[#dcd7c8] bg-white font-bold hover:bg-[#ece8dc] gap-2">
                <span>Lihat Semua Produk di Katalog</span>
                <Flaticon name="arrow-right" variant="rr" className="text-sm" />
              </Button>
            </Link>
          </div>

          {/* Product Cards Grid: Selalu 9 Kotak (3 Kolom x 3 Baris) di Mobile, Tablet & Desktop */}
          <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
            {paginatedProducts.map((p) => (
              <Card
                key={p.id}
                className="overflow-hidden rounded-2xl sm:rounded-3xl border-[#e8e5dc] bg-white shadow-xs hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#eeece4]">
                    <img
                      src={p.image || "/images/hero-dieng.jpg"}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/hero-dieng.jpg";
                      }}
                    />
                    <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-wrap items-center gap-1 sm:gap-1.5">
                      <Badge className="bg-black/85 text-white backdrop-blur-xs font-bold text-[8px] sm:text-[11px] px-1.5 sm:px-2.5 py-0.5 rounded-full">
                        {p.group}
                      </Badge>
                      <span className="hidden xs:inline-block rounded-full bg-white/95 px-1.5 sm:px-2.5 py-0.5 text-[8px] sm:text-[10px] font-bold text-slate-800 shadow-xs">
                        {p.pack}
                      </span>
                    </div>
                  </div>

                  <CardHeader className="p-2 sm:p-5 pb-1 sm:pb-2">
                    <CardTitle className="text-xs sm:text-base lg:text-lg font-extrabold text-[#24251f] group-hover:text-[#E25C00] transition leading-tight sm:leading-snug line-clamp-2 min-h-[2rem] sm:min-h-12">
                      {p.name}
                    </CardTitle>
                    <p className="hidden sm:block text-xs text-[#737167] mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </CardHeader>
                </div>

                <CardFooter className="p-2 sm:p-5 pt-1.5 sm:pt-3 border-t border-[#f1eee4] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mt-auto">
                  <div className="w-full sm:w-auto">
                    <span className="text-[8px] sm:text-[10px] font-bold text-[#E25C00] uppercase tracking-wider block">
                      Harga
                    </span>
                    <span className="text-xs sm:text-base lg:text-lg font-black text-[#24251f]">
                      Rp{p.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <Link href="/catalog" className="w-full sm:w-auto">
                    <Button
                      size="sm"
                      className="w-full sm:w-auto rounded-lg sm:rounded-xl font-extrabold bg-[#E25C00] text-white hover:bg-[#c84f00] h-7 sm:h-9 px-2 sm:px-4 text-[10px] sm:text-xs shadow-xs"
                    >
                      <span>Pesan</span>
                      <Flaticon name="shopping-bag" variant="sr" className="text-[10px] sm:text-xs ml-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination Navigation Controls di Bawah 9 Produk */}
          {totalProductPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#e8e5dc] bg-white p-3 sm:p-4 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleProductPageChange(currentProductPage - 1)}
                  disabled={currentProductPage === 1}
                  className="flex items-center gap-1.5 rounded-xl border border-[#dcd7c8] bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-[#24251f] hover:bg-[#faf9f5] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                  title="Halaman Sebelumnya"
                >
                  <Flaticon name="angle-small-left" className="text-sm" />
                  <span>Sebelumnya</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleProductPageChange(currentProductPage + 1)}
                  disabled={currentProductPage === totalProductPages}
                  className="flex items-center gap-1.5 rounded-xl border border-[#dcd7c8] bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-[#24251f] hover:bg-[#faf9f5] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                  title="Halaman Berikutnya"
                >
                  <span>Berikutnya</span>
                  <Flaticon name="angle-small-right" className="text-sm" />
                </button>
              </div>

              {/* Nomor Halaman */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full py-0.5">
                {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handleProductPageChange(pageNum)}
                    className={`h-8 sm:h-9 min-w-8 sm:min-w-9 px-2 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      currentProductPage === pageNum
                        ? "bg-[#E25C00] text-white shadow-xs"
                        : "bg-[#faf9f5] text-[#24251f] border border-[#e4e1d7] hover:bg-[#f0eee6]"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <div className="text-xs text-[#737167]">
                Halaman <strong className="text-[#24251f]">{currentProductPage}</strong> dari{" "}
                <strong className="text-[#24251f]">{totalProductPages}</strong>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#E25C00] hover:bg-[#c84f00] text-white px-6 py-3 text-xs sm:text-sm font-extrabold shadow-md transition"
            >
              <Flaticon name="shop" className="text-sm" />
              <span>Buka Katalog Lengkap</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e5e1d3] bg-[#f2efe4] text-[#292a23]">
        <div className="mx-auto max-w-7xl px-5 pt-12 pb-10 sm:px-10">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Column 1: INFORMASI */}
            <div className="space-y-3.5">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#E25C00] block">
                  INFORMASI
                </span>
                <Link href="/" className="inline-flex items-center gap-2.5 sm:gap-3 group">
                  <span className="flex h-11 w-16 sm:h-12 sm:w-18 items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-xs border border-[#1b3d2b]/20 bg-[#163826]">
                    <img
                      src="/images/logo-d-oleh2.webp"
                      alt="D OLEH-OLEH"
                      className="h-full w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span className="text-xl font-black tracking-tight text-[#24251f]">
                    D OLEH - OLEH
                  </span>
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-[#66645a] leading-relaxed max-w-sm">
                Pusat pemesanan oleh-oleh khas dataran tinggi Dieng &amp; Kabupaten Wonosobo. Layanan antar cepat ke penginapan, homestay, dan hotel dalam radius 8 km dari Titik Nol Dieng.
              </p>
              <div className="space-y-1.5 pt-1 text-xs text-[#545249]">
                <div className="flex items-center gap-2 font-medium">
                  <Flaticon name="marker" variant="sr" className="text-xs text-[#E25C00]" />
                  <span>Titik 0 Km Dieng, Kejajar, Wonosobo, Jawa Tengah</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Flaticon name="clock" variant="sr" className="text-xs text-[#E25C00]" />
                  <span>Buka Setiap Hari: 07.00 - 21.00 WIB</span>
                </div>
              </div>
            </div>

            {/* Column 2: BANTUAN */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#E25C00]">
                BANTUAN
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#66645a]">
                <li>
                  <Link href="/orders" className="hover:text-black transition font-bold text-[#E25C00] flex items-center gap-1.5">
                    <Flaticon name="truck-side" className="text-xs" />
                    <span>Pantau Status Pesanan</span>
                  </Link>
                </li>
                <li>
                  <a href="#alur-pemesanan" className="hover:text-black transition">
                    Alur &amp; Cara Pesan
                  </a>
                </li>
                <li>
                  <Link href="/catalog" className="hover:text-black transition">
                    Minimal Belanja (5 Paket)
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Titik+0+Dieng"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-black transition"
                  >
                    Cek Titik 0 Km di Google Maps
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${adminPhone.replace(/[^0-9]/g, "").startsWith("62") ? adminPhone.replace(/[^0-9]/g, "") : `62${adminPhone.replace(/[^0-9]/g, "").replace(/^0/, "")}`}?text=${encodeURIComponent("Halo Admin D OLEH-OLEH, saya butuh bantuan mengenai pemesanan.")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#15803d] font-bold hover:underline"
                  >
                    <Flaticon name="phone-call" variant="sr" className="text-xs" />
                    <span>WhatsApp CS ({adminDisplayPhone})</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: METODE PEMBAYARAN */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#E25C00]">
                METODE PEMBAYARAN
              </h3>
              <p className="text-xs sm:text-sm text-[#66645a] leading-relaxed">
                Mendukung QRIS instan seluruh perbankan dan e-Wallet serta Tunai di tempat (COD).
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-xl bg-white border border-[#ded9cb] px-3.5 py-1.5 text-xs font-black text-slate-800 shadow-2xs">
                  QRIS
                </span>
                <span className="rounded-xl bg-white border border-[#ded9cb] px-3.5 py-1.5 text-xs font-black text-slate-800 shadow-2xs">
                  COD (Tunai)
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright and Security Bar */}
          <div className="mt-10 pt-6 border-t border-[#e2decfa0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7e7b70]">
            <p>
              &copy; {new Date().getFullYear()} D OLEH - OLEH · Sentra Oleh-Oleh Wonosobo. Seluruh hak cipta dilindungi.
            </p>
            <div className="flex items-center gap-4">
              <span>Dataran Tinggi Dieng, Jawa Tengah</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
