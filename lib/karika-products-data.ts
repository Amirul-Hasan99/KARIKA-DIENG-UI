export interface KarikaProduct {
  id: string;
  name: string;
  group: "Carica" | "Makanan" | "Camilan" | "Minuman";
  pack: string;
  price: number;
  description: string;
  image: string;
  source?: string;
  note?: string;
  is_available: boolean;
  stock_qty?: number;
}

export const KARIKA_CATEGORIES = [
  { id: "Semua", name: "Semua Produk", icon: "box-alt" },
  { id: "Carica", name: "Carica Dieng", icon: "box-alt" },
  { id: "Makanan", name: "Makanan Khas", icon: "restaurant" },
  { id: "Camilan", name: "Camilan Renyah", icon: "cookie" },
  { id: "Minuman", name: "Minuman Herbal", icon: "mug-hot-alt" },
];

export const INITIAL_KARIKA_PRODUCTS: KarikaProduct[] = [
  {
    "id": "amerta-karika-sirup-6-cup",
    "name": "Amerta Karika Sirup 6 Cup",
    "group": "Carica",
    "pack": "1 Dus · 6 Cup",
    "price": 38000,
    "description": "Amerta Carica In Syrup merupakan manisan buah carica premium khas pegunungan Dieng, Wonosobo. Diproses higienis dari buah carica pilihan dengan kuah sirup manis segar yang nikmat disajikan dingin. Dikemas dalam dus hitam eksklusif isi 6 cup.",
    "image": "/images/products/amerta-karika-sirup-6-cup.png",
    "source": "Riset Pasar Online & Produsen Wonosobo (Shopee/Tokopedia Rp35.000 - Rp45.000)",
    "note": "Kemasan gift box hitam eksklusif isi 6 cup",
    "is_available": true,
    "stock_qty": 50
  },
  {
    "id": "karika-gemilang-isi-12-cup",
    "name": "Karika Gemilang Isi 12 Cup",
    "group": "Carica",
    "pack": "1 Dus · 12 Cup @115g",
    "price": 60000,
    "description": "Carica Gemilang Kualitas Premium menghadirkan cita rasa autentik dataran tinggi Dieng. Dibuat dari potongan buah carica segar bertekstur kenyal lembut yang terendam dalam sirup manis menyegarkan. Kemasan kotak besar isi 12 cup sangat pas sebagai sajian keluarga.",
    "image": "/images/products/karika-gemilang-12-cup.png",
    "source": "Riset Pasar Online & Produsen Wonosobo (Shopee/Tokopedia Rp55.000 - Rp75.000)",
    "note": "Kemasan dus kuning besar isi 12 cup @115g",
    "is_available": true,
    "stock_qty": 50
  },
  {
    "id": "karika-gemilang-isi-6",
    "name": "Karika Gemilang Isi 6 Cup",
    "group": "Carica",
    "pack": "1 Dus · 6 Cup @115g",
    "price": 28000,
    "description": "Carica Gemilang Mini Pack isi 6 cup @115g adalah pilihan tepat oleh-oleh ringkas khas Wonosobo. Perpaduan manis alami sirup dan kesegaran buah pepaya gunung Dieng memberikan sensasi kesegaran saat berwisata.",
    "image": "/images/products/karika-gemilang-6-cup.png",
    "source": "Riset Pasar Online & Produsen Wonosobo (Shopee/Tokopedia Rp24.000 - Rp38.000)",
    "note": "Kemasan mini pack dus kuning isi 6 cup @115g",
    "is_available": true,
    "stock_qty": 50
  },
  {
    "id": "carica-bukit-dieng-isi-6",
    "name": "Carica Bukit Dieng Isi 6 Cup",
    "group": "Carica",
    "pack": "1 Pack · 6 Cup",
    "price": 20000,
    "description": "Carica Bukit Dieng kemasan jinjing plastik ekonomis isi 6 cup merupakan camilan manisan favorit wisatawan Dieng. Sangat nikmat dinikmati saat santai di villa atau homestay, terutama disajikan dalam keadaan dingin.",
    "image": "/images/products/karika-bukit-dieng-6-cup.png",
    "source": "Riset Pasar Online & Pusat Oleh-Oleh Dieng (Shopee/Tokopedia Rp16.000 - Rp25.000)",
    "note": "Kemasan plastik mika jinjing isi 6 cup ekonomis",
    "is_available": true,
    "stock_qty": 50
  },
  {
    "id": "carica-dieng-kemasan-jinjing-6-cup",
    "name": "Carica Dieng Kemasan Jinjing 6 Cup",
    "group": "Carica",
    "pack": "1 Pack · 6 Cup",
    "price": 20000,
    "description": "Olahan manisan carica buah pepaya gunung khas Wonosobo kemasan plastik jinjing isi 6 cup praktis, segar, manis alami, dan siap dinikmati kapan saja.",
    "image": "/images/products/karika-bukit-dieng-6-cup-alt.png",
    "source": "Riset Pasar Sentra Oleh-Oleh Dieng (Shopee/Tokopedia Rp16.000 - Rp25.000)",
    "note": "Kemasan plastik jinjing 6 cup varian praktis",
    "is_available": true,
    "stock_qty": 50
  },
  {
    "id": "amerta-karika-sirup-isi-12",
    "name": "Amerta Karika Sirup Isi 12 Cup",
    "group": "Carica",
    "pack": "1 Dus · 12 Cup",
    "price": 75000,
    "description": "Amerta Carica In Syrup Tropical Treasure from Dieng kemasan besar isi 12 cup hadir dengan desain dus hitam yang mewah dan elegan. Terbuat dari buah carica pilihan lereng Dieng yang diproses higienis bersertifikasi Halal & P-IRT.",
    "image": "/images/products/amerta-karika-sirup-12-cup.png",
    "source": "Riset Pasar Online & Produsen Wonosobo (Shopee/Tokopedia Rp65.000 - Rp85.000)",
    "note": "Kemasan gift box hitam besar isi 12 cup",
    "is_available": true,
    "stock_qty": 50
  },
  {
    "id": "kripik-tempe-kemul-selma",
    "name": "Kripik Tempe Kemul Selma",
    "group": "Camilan",
    "pack": "1 Bungkus",
    "price": 22000,
    "description": "Kripik Tempe Kemul Selma membawa kelezatan tempe kemul legendaris khas Wonosobo dalam wujud keripik renyah tahan lama. Dibuat dari tempe berkualitas, tepung beras berbalut bumbu rempah pilihan, dan taburan daun kucai yang harum.",
    "image": "/images/products/keripik-tempe-kemul-selma.png",
    "source": "Riset Pasar Sentra Kuliner Wonosobo (Shopee/Tokopedia Rp18.000 - Rp28.000)",
    "note": "Kripik tempe kemul renyah gurih kemasan pouch",
    "is_available": true,
    "stock_qty": 50
  },
  {
    "id": "keripik-carica-s4-food",
    "name": "Keripik Carica S4 Food",
    "group": "Camilan",
    "pack": "1 Bungkus",
    "price": 25000,
    "description": "Keripik Carica S4 Food merupakan inovasi buah carica khas Dieng yang diproses melalui penggorengan hampa udara (vacuum frying). Teksturnya super renyah dengan rasa manis alami buah carica asli Wonosobo yang terjaga keasliannya.",
    "image": "/images/products/keripik-carica-s4.png",
    "source": "Riset Pasar Toko Oleh-Oleh Dieng (Shopee/Tokopedia Rp18.000 - Rp28.000)",
    "note": "Keripik buah carica renyah vacuum frying",
    "is_available": true,
    "stock_qty": 50
  },
  {
    "id": "opak-singkong-sabar-makmur",
    "name": "Opak Singkong Sabar Makmur",
    "group": "Camilan",
    "pack": "1 Bungkus",
    "price": 18000,
    "description": "Opak Singkong Sabar Makmur adalah camilan tradisional legendaris Wonosobo yang terbuat dari singkong pilihan bermutu tinggi. Dipadukan dengan bumbu bawang putih dan kucai segar sehingga menghasilkan keripik tipis yang gurih dan renyah.",
    "image": "/images/products/opak-singkong-sabar-makmur.png",
    "source": "Riset Pasar Tradisional Wonosobo (Shopee/Tokopedia Rp14.000 - Rp22.000)",
    "note": "Opak singkong daun kucai khas Wonosobo",
    "is_available": true,
    "stock_qty": 50
  }
];
