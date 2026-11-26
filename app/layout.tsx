import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "D'Oleh-Oleh Dieng — Oleh-Oleh Wonosobo & Manisan Carica Asli",
  description: "Pesan oleh-oleh khas Dieng dan Wonosobo: Carica, Mie Ongklok, Keripik Tempe Kemul, dan Opak Singkong. Pengantaran hingga radius 8 km dari Titik 0 Dieng.",
  icons: {
    icon: [
      { url: "/icon-d-oleh2.png", type: "image/png", sizes: "256x256" },
      { url: "/images/logo-d-oleh2.webp", type: "image/webp" },
    ],
    apple: [{ url: "/icon-d-oleh2.png", sizes: "256x256", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#D97706",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css" />
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-bold-rounded/css/uicons-bold-rounded.css" />
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-rounded/css/uicons-solid-rounded.css" />
      </head>
      <body className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-[#F7F5F0] text-[#1C1917] antialiased selection:bg-[#D97706] selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
