import type { Language } from "@/components/language-context";
import type { Product } from "@/lib/site-data";

type LocalizedProductFields = Pick<
  Product,
  "name" | "category" | "badge" | "unit" | "description" | "highlights" | "tags"
>;

const englishProducts: Record<string, LocalizedProductFields> = {
  p1: {
    name: "Green Mango Pickle",
    category: "Pickle",
    badge: "Best Seller",
    unit: "1 bag",
    description: "Made with small pieces of green mango, fennel, mustard oil, and a touch of sugar.",
    highlights: ["A perfect sweet-and-sour balance", "Fresh green mango flavor", "Natural ingredients"],
    tags: ["Sweet and sour", "Traditional", "Fresh"],
  },
  p2: {
    name: "Mixed Balachao",
    category: "Balachao",
    badge: "New",
    unit: "1 kg",
    description: "Premium mixed balachao prepared with mango, lemon, chili, peppers, and herbs.",
    highlights: ["Premium ingredients", "A balanced blend of herbs and spices", "Extra garlic and chili"],
    tags: ["Premium", "Best seller", "Mixed flavor"],
  },
  p3: {
    name: "Shrimp Balachao",
    category: "Balachao",
    badge: "Flash Sale",
    unit: "1 kg",
    description: "Extra-spicy shrimp balachao for a delicious meal at home.",
    highlights: ["A well-balanced spice blend", "Hot and spicy", "Customer favorite"],
    tags: ["Shrimp", "Spicy", "Premium"],
  },
  p4: {
    name: "Family Combo Pack",
    category: "Combo Pack",
    badge: "Combo Offer",
    unit: "1 set",
    description: "A complete family pack combining pickles, balachao, and snacks.",
    highlights: ["A complete tasting pack", "Carefully balanced mix", "Homestyle flavor"],
    tags: ["Combo", "Family", "Offer"],
  },
  p5: {
    name: "Green Chili Pickle",
    category: "Pickle",
    badge: "Hot Pick",
    unit: "1 jar",
    description: "A tangy mustard pickle made with green chilies and flavorful oil.",
    highlights: ["Extra spicy", "Perfect with Bangladeshi meals", "Flavor that lasts"],
    tags: ["Chili", "Tangy", "Pickle"],
  },
  p6: {
    name: "Special Pickle Box",
    category: "Other",
    badge: "Gift Pack",
    unit: "1 box",
    description: "A gift-ready box of five assorted pickles for special guests.",
    highlights: ["Gift-ready", "Southwestern flavor", "A thoughtful gift"],
    tags: ["Gift", "Box", "Special"],
  },
  p7: {
    name: "Lentil Balachao",
    category: "Balachao",
    badge: "Customer Favorite",
    unit: "1 kg",
    description: "Delicious lentil balachao, perfect with rice.",
    highlights: ["Bold flavor with fewer calories", "Perfect with rice", "Carefully prepared"],
    tags: ["Lentil", "With rice", "Flavor"],
  },
  p8: {
    name: "Nakshi Paan Combo",
    category: "Combo Pack",
    badge: "Limited",
    unit: "1 set",
    description: "A snack combo featuring nakshi paan and small bites.",
    highlights: ["Rich flavor and ingredients", "A classic choice", "A delightful snack gift"],
    tags: ["Combo", "Nakshi", "Gift"],
  },
};

const englishProductNames: Record<string, string> = {
  "মিক্সড বালাচাও": "Mixed Balachao",
  "মিষ্টি আচার": "Sweet Pickle",
  "ইলিশ ও চিংড়ী বালাচাও": "Hilsa and Shrimp Balachao",
  "গরুর মাংসের আচার": "Beef Pickle",
};

export function localizeProduct(product: Product, language: Language): Product {
  if (language === "bn") {
    return { ...product, ...product.translations?.bn };
  }

  const localizedProduct = englishProducts[product.id];
  const storedEnglish = product.translations?.en;
  const englishName = product.englishName?.trim();
  const hasBanglaName = englishName ? /[\u0980-\u09ff]/.test(englishName) : false;

  return {
    ...product,
    ...localizedProduct,
    ...storedEnglish,
    name:
      storedEnglish?.name ??
      localizedProduct?.name ??
      englishProductNames[product.name] ??
      (englishName && !hasBanglaName
        ? englishName
        : product.name),
  };
}
