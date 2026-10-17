export type Category = {
  id: string;
  name: string;
  description?: string;
  image: string;
  accent: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  englishName?: string;
  translations?: ProductTranslations;
  shortDesc?: string;
  ingredients?: string;
  category: string;
  price: number;
  salePrice?: number;
  image: string;
  gallery: string[];
  badge: string;
  stock: number;
  rating: number;
  reviews: number;
  featured: boolean;
  unit: string;
  description: string;
  highlights: string[];
  tags: string[];
};

export type ProductTranslationFields = Pick<
  Product,
  "name" | "category" | "badge" | "unit" | "description" | "highlights" | "tags"
> & {
  shortDesc: string;
  ingredients: string;
};

export type ProductTranslations = Record<"en" | "bn", ProductTranslationFields>;

export type Review = {
  name: string;
  title: string;
  review: string;
  rating: number;
  image: string;
};

export const storeInfo = {
  name: "H B C Achar Shop",
  shortName: "HBCA",
  slogan: "স্বাদের ঐতিহ্য",
  phone: "01757121627",
  hotline: "01757121627",
  website: "www.hbcha.co",
  email: "hello@hbcha.co",
  address: "পাকুন্দিয়া বাজার, কিশোরগঞ্জ, বাংলাদেশ",
  businessType: "আচার, চিংড়ি বালাচাও, মিক্সড বালাচাও, কম্বো-প্যাক ও অন্যান্য খাদ্যপণ্য",
};

export const categories: Category[] = [
  {
    id: "achar",
    name: "আচার",
    description: "ঐতিহ্যবাহী ও ভোজ্য আচার",
    image: "/img/achar.jpg",
    accent: "from-orange-500 to-red-500",
  },
  {
    id: "balachao",
    name: "বালাচাও",
    image: "/img/balachao.jpg",
    accent: "from-amber-500 to-yellow-500",
  },
  {
    id: "combo",
    name: "কম্বো প্যাক",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    accent: "from-emerald-500 to-lime-500",
  },
  {
    id: "snacks",
    name: "অন্যান্য খাদ্যপণ্য",
    description: "গরম-ঠান্ডা, গিফট ও স্পেশাল",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    accent: "from-pink-500 to-violet-500",
  },
];

export const products: Product[] = [
  {
    id: "p1",
    slug: "mango-achar-classic",
    name: "কাঁচা আমের আচার",
    category: "আচার",
    price: 220,
    salePrice: 180,
    image:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    ],
    badge: "বেস্ট সেলার",
    stock: 42,
    rating: 4.9,
    reviews: 328,
    featured: true,
    unit: "১টি ব্যাগ",
    description: "ছোট ছোট টুকরো কাঁচা আম, মৌরী, সরিষা তেল ও সামান্য চিনি মিশিয়ে তৈরি।",
    highlights: ["খুব টক-চিনির ভারসাম্য", "কাঁচা আমের সতেজ স্বাদ", "প্রাকৃতিক উপাদান"],
    tags: ["মিষ্টি টক", "ঐতিহ্যবাহী", "ফ্রেশ"],
  },
  {
    id: "p2",
    slug: "mixed-pickle-premium",
    name: "মিক্সড বালাচাও",
    category: "বালাচাও",
    price: 300,
    salePrice: 260,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    ],
    badge: "নতুন",
    stock: 31,
    rating: 4.8,
    reviews: 214,
    featured: true,
    unit: "১ কেজি",
    description: "আম, লেবু, লঙ্কা, মরিচ ও ভেষজ মিশিয়ে তৈরি প্রিমিয়াম মিক্সড বালাচাও।",
    highlights: ["উচ্চমানের উপাদান", "গুল্ম-মশলা ভারসাম্য", "অতিরিক্ত রসুন ও মরিচ"],
    tags: ["প্রিমিয়াম", "বিক্রির সেরা", "মিশ্র স্বাদ"],
  },
  {
    id: "p3",
    slug: "shrimp-balachao-spicy",
    name: "চিংড়ি বালাচাও",
    category: "বালাচাও",
    price: 420,
    salePrice: 360,
    image:
      "https://images.unsplash.com/photo-1559847844-d7f7d5f2d6c3?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1559847844-d7f7d5f2d6c3?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    ],
    badge: "ফ্ল্যাশ সেল",
    stock: 24,
    rating: 5,
    reviews: 191,
    featured: true,
    unit: "১ কেজি",
    description: "এক্সট্রা স্পাইসি চিংড়ি বালাচাও, ঘরে বসে পারফেক্ট ডিশের স্বাদ।",
    highlights: ["গুরুত্বপূর্ণ মসলার ভারসাম্য", "গরম ও ঝাঁঝালো", "হট সেলার"],
    tags: ["চিংড়ি", "স্পাইসি", "প্রিমিয়াম"],
  },
  {
    id: "p4",
    slug: "combo-pack-family",
    name: "ফ্যামিলি কম্বো প্যাক",
    category: "কম্বো প্যাক",
    price: 950,
    salePrice: 820,
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1559847844-d7f7d5f2d6c3?auto=format&fit=crop&w=900&q=80",
    ],
    badge: "কম্বো অফার",
    stock: 18,
    rating: 4.7,
    reviews: 164,
    featured: true,
    unit: "১ সেট",
    description: "আচার, বালাচাও ও ছোট খাবারের সমন্বয়ে সম্পূর্ণ ফ্যামিলি খাবার প্যাক।",
    highlights: ["অভিজ্ঞতা পূর্ণ প্যাক", "সমানভাবে মিশ্রিত", "বাড়ির খাবারের মতো"],
    tags: ["কম্বো", "ফ্যামিলি", "অফার"],
  },
  {
    id: "p5",
    slug: "green-chili-achar",
    name: "সবুজ মরিচের আচার",
    category: "আচার",
    price: 260,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1559847844-d7f7d5f2d6c3?auto=format&fit=crop&w=900&q=80",
    ],
    badge: "হট পিক",
    stock: 50,
    rating: 4.8,
    reviews: 244,
    featured: false,
    unit: "১টি জার",
    description: "সবুজ মরিচ ও স্বাদযুক্ত তেল দিয়ে তৈরি সরিষার ঝাঁঝালো আচার।",
    highlights: ["অত্যন্ত ঝাঁঝালো", "বাংলাদেশি ভোজের সঙ্গী", "স্বাদ retain"],
    tags: ["মরিচ", "ঝাঁঝালো", "আচার"],
  },
  {
    id: "p6",
    slug: "special-pickles-box",
    name: "স্পেশাল আচার বক্স",
    category: "অন্য",
    price: 680,
    salePrice: 620,
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    ],
    badge: "গিফট প্যাক",
    stock: 27,
    rating: 4.9,
    reviews: 109,
    featured: false,
    unit: "১ বক্স",
    description: "বিশেষ অতিথি ও গিফটের জন্য একসঙ্গে ৫ ধরনের আচার মিশ্রিত বক্স।",
    highlights: ["গিফট-রেডি", "দক্ষিণ-পশ্চিমী স্বাদ", "সম্ভাব্য উপহার"],
    tags: ["উপহার", "বক্স", "স্পেশাল"],
  },
  {
    id: "p7",
    slug: "dal-mixed-fry",
    name: "ডাল বালাচাও",
    category: "বালাচাও",
    price: 290,
    image:
      "https://images.unsplash.com/photo-1559847844-d7f7d5f2d6c3?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1559847844-d7f7d5f2d6c3?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    ],
    badge: "প্রেমের জোগাড়",
    stock: 40,
    rating: 4.7,
    reviews: 183,
    featured: false,
    unit: "১ কেজি",
    description: "ভাতের সাথে খাওয়ার জন্য অতুলনীয় ডাল বালাচাও।",
    highlights: ["কম ক্যালরিতে মজবুত স্বাদ", "ভাতের সেরা সঙ্গী", "পূতভাবে রান্না"],
    tags: ["ডাল", "ভাতের সঙ্গী", "স্বাদ"],
  },
  {
    id: "p8",
    slug: "nakshi-paan-combo",
    name: "নকশি পান কম্বো",
    category: "কম্বো প্যাক",
    price: 430,
    salePrice: 390,
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    ],
    badge: "লিমিটেড",
    stock: 16,
    rating: 4.6,
    reviews: 72,
    featured: false,
    unit: "১ সেট",
    description: "নকশি পান ও ছোট স্ন্যাকস মিশ্রিত স্ন্যাক কম্বো।",
    highlights: ["স্বাদ ও উপাদান", "ক্লাসিক বিকল্প", "গিফট স্ন্যাক"],
    tags: ["কম্বো", "নকশি", "গিফট"],
  },
];

export const stats = [
  { value: "15K+", label: "সন্তুষ্ট গ্রাহক" },
  { value: "48h", label: "দ্রুত ডেলিভারি" },
  { value: "64", label: "জেলা কভারেজ" },
  { value: "4.9/5", label: "গড় রেটিং" },
];

export const testimonials: Review[] = [
  {
    name: "শামীম",
    title: "প্রিমিয়াম আচার প্রিয়",
    review: "কাঁচা আমের আচার সত্যিই অসাধারণ। ডেলিভারিও খুব দ্রুত।",
    rating: 5,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&h=128&q=80",
  },
  {
    name: "জাহানারা",
    title: "ফ্যামিলি অফার",
    review: "কম্বো প্যাক খুব সুন্দর। খাবারদাবার নিয়ে পরিবারের সবাই খুশি।",
    rating: 5,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80",
  },
  {
    name: "হাসান",
    title: "ফ্রেশ & স্পাইসি",
    review: "চিংড়ি বালাচাওতে স্বাদ ও গন্ধ দুটোই সুন্দর।",
    rating: 4,
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=128&h=128&q=80",
  },
  {
    name: "রুমানা",
    title: "নিয়মিত ক্রেতা",
    review: "আচারটি ঘরোয়া স্বাদের, প্যাকেজিংও সুন্দর ছিল। আবার অর্ডার করব।",
    rating: 5,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&h=128&q=80",
  },
  {
    name: "মেহেদী",
    title: "বালাচাওপ্রেমী",
    review: "ঝাল আর মশলার ভারসাম্য দারুণ—পরিবারের সবাই পছন্দ করেছে।",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80",
  },
  {
    name: "ফারজানা",
    title: "সন্তুষ্ট ক্রেতা",
    review: "অর্ডার সময়মতো পেয়েছি। স্বাদ ও মান দুটোই ভালো লেগেছে।",
    rating: 5,
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=128&h=128&q=80",
  },
];

export const orderTrackingSteps = [
  "অর্ডার করা হয়েছে",
  "অর্ডার গ্রহণ",
  "প্যাকেজিং শুরু",
  "কুরিয়ার বুকিং",
  "যাত্রা শুরু",
  "জেলা শাখায়",
  "থানা/এলাকায়",
  "রিসিভার কনফার্ম",
  "ডেলিভারি শুরু",
  "ডেলিভার করা",
  "রিটার্ন",
  "রিফান্ড/সমাপ্তি",
];

export const districtDeliveryFees = [
  { district: "ঢাকা", fee: 60 },
  { district: "কিশোরগঞ্জ", fee: 40 },
  { district: "শরীয়তপুর", fee: 70 },
  { district: "সিলেট", fee: 120 },
  { district: "চট্টগ্রাম", fee: 110 },
  { district: "বরিশাল", fee: 100 },
  { district: "রাজশাহী", fee: 90 },
];

export const coupons = [
  { code: "HBCA10", discount: 10, minOrder: 500, validUntil: "2026-12-31" },
  { code: "FREESHIP", discount: 0, minOrder: 800, validUntil: "2026-11-15" },
  { code: "GIFT25", discount: 25, minOrder: 1200, validUntil: "2026-10-30" },
];

export const recentOrders = [
  { orderId: "HBC-2401", customer: "শামীম", total: 1240, status: "ডেলিভারি হচ্ছে" },
  { orderId: "HBC-2402", customer: "রাইসা", total: 980, status: "প্রসেসিং" },
  { orderId: "HBC-2403", customer: "ফারহান", total: 1450, status: "কনফার্মড" },
  { orderId: "HBC-2404", customer: "নাহিদ", total: 860, status: "ডেলিভার হয়েছে" },
];

export const adminMetrics = [
  { title: "মোট অর্ডার", value: "1,248", change: "+12%" },
  { title: "মোট বিক্রয়", value: "৳ 3,42,500", change: "+8%" },
  { title: "রিটার্ন", value: "14", change: "-3%" },
  { title: "স্টক-আউট", value: "03", change: "-1%" },
];
