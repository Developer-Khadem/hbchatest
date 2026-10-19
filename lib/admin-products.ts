import type { Prisma } from "@prisma/client";
import {
  products as storeProducts,
  type Product,
  type ProductTranslationFields,
  type ProductTranslations,
} from "@/lib/site-data";

export type AdminProductInput = {
  name: string;
  slug: string;
  category: string;
  shortDesc: string;
  description: string;
  ingredients: string;
  price: number;
  salePrice: number | null;
  stock: number;
  unit: string;
  badge: string;
  featured: boolean;
  image: string;
  gallery: string[];
  tags: string[];
};

export type AdminProductRecord = AdminProductInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

type ProductValidationResult =
  | { success: true; data: AdminProductInput }
  | { success: false; error: string };

type ProductPatchValidationResult =
  | { success: true; data: Partial<AdminProductInput> }
  | { success: false; error: string };

export function makeAdminProductSlug(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function serializeAdminProduct(product: Prisma.AcharProductGetPayload<object>): AdminProductRecord {
  const baseSlug = makeAdminProductSlug(product.englishName || product.name) || "product";
  return {
    id: product.id,
    name: product.name,
    slug: product.slug || `${baseSlug}-${product.id.slice(0, 6)}`,
    category: product.category,
    shortDesc: product.shortDesc || product.description.slice(0, 240),
    description: product.description,
    ingredients: product.ingredients || "",
    price: product.price,
    salePrice: product.salePrice ?? null,
    stock: product.stock,
    unit: product.unit || "১টি জার",
    badge: product.badge || "",
    featured: product.featured,
    image: product.image,
    gallery: product.images,
    tags: product.tags,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function readProductTranslationFields(value: Prisma.JsonValue): ProductTranslationFields | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const fields = value as Prisma.JsonObject;
  const stringFields = ["name", "category", "badge", "unit", "description", "shortDesc", "ingredients"] as const;
  if (stringFields.some((field) => typeof fields[field] !== "string")) return undefined;
  if (
    !Array.isArray(fields.highlights) ||
    !fields.highlights.every((item) => typeof item === "string") ||
    !Array.isArray(fields.tags) ||
    !fields.tags.every((item) => typeof item === "string")
  ) {
    return undefined;
  }

  return {
    name: fields.name as string,
    category: fields.category as string,
    badge: fields.badge as string,
    unit: fields.unit as string,
    description: fields.description as string,
    shortDesc: fields.shortDesc as string,
    ingredients: fields.ingredients as string,
    highlights: fields.highlights as string[],
    tags: fields.tags as string[],
  };
}

function readProductTranslations(value: Prisma.JsonValue): ProductTranslations | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const translations = value as Prisma.JsonObject;
  const enValue = translations.en;
  const bnValue = translations.bn;
  if (!enValue || !bnValue) return undefined;
  const en = readProductTranslationFields(enValue);
  const bn = readProductTranslationFields(bnValue);
  return en && bn ? { en, bn } : undefined;
}

export function serializeStoreProduct(product: Prisma.AcharProductGetPayload<object>): Product {
  const serialized = serializeAdminProduct(product);
  const gallery = product.images.filter((image) => image !== product.image);

  return {
    ...serialized,
    englishName: product.englishName,
    translations: readProductTranslations(product.translations),
    shortDesc: serialized.shortDesc,
    ingredients: serialized.ingredients,
    gallery,
    salePrice: serialized.salePrice ?? undefined,
    rating: 0,
    reviews: 0,
    highlights: serialized.ingredients
      .split(",")
      .map((ingredient) => ingredient.trim())
      .filter(Boolean),
  };
}

function validImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function readList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const entries = value.map((item) => (typeof item === "string" ? item.trim() : ""));
  if (entries.some((item) => !item || item.length > maxLength)) return null;
  return [...new Set(entries)];
}

export function validateAdminProduct(value: unknown): ProductValidationResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { success: false, error: "Invalid product data." };
  }

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const category = typeof record.category === "string" ? record.category.trim() : "";
  const slugInput = typeof record.slug === "string" ? record.slug : "";
  const slug = makeAdminProductSlug(slugInput);
  const shortDesc = typeof record.shortDesc === "string" ? record.shortDesc.trim() : "";
  const description = typeof record.description === "string" ? record.description.trim() : "";
  const ingredients = typeof record.ingredients === "string" ? record.ingredients.trim() : "";
  const unit = typeof record.unit === "string" ? record.unit.trim() : "";
  const badge = typeof record.badge === "string" ? record.badge.trim() : "";
  const image = typeof record.image === "string" ? record.image.trim() : "";
  const price = record.price === undefined || record.price === null || record.price === ""
    ? 0
    : typeof record.price === "number" ? record.price : Number.NaN;
  const stock = record.stock === undefined || record.stock === null || record.stock === ""
    ? 0
    : typeof record.stock === "number" ? record.stock : Number.NaN;
  const salePrice = record.salePrice === undefined || record.salePrice === null || record.salePrice === ""
    ? null
    : Number(record.salePrice);
  const gallery = record.gallery === undefined ? [] : readList(record.gallery, 10, 500);
  const tags = record.tags === undefined ? [] : readList(record.tags, 20, 40);
  const featured = record.featured === undefined ? false : record.featured;

  if (name.length > 120) return { success: false, error: "Product name must be 120 characters or fewer." };
  if (slug.length > 160) return { success: false, error: "Enter a valid product slug." };
  if (category.length > 80) return { success: false, error: "Category must be 80 characters or fewer." };
  if (shortDesc.length > 240) return { success: false, error: "Short description must be 240 characters or fewer." };
  if (description.length > 3000) return { success: false, error: "Description must be 3000 characters or fewer." };
  if (ingredients.length > 1000) return { success: false, error: "Ingredients must be 1000 characters or fewer." };
  if (!Number.isInteger(price) || price < 0 || price > 10000000) return { success: false, error: "Enter a valid regular price." };
  if (salePrice !== null && (!Number.isInteger(salePrice) || salePrice < 0 || salePrice > price)) {
    return { success: false, error: "Offer price must be between zero and the regular price." };
  }
  if (!Number.isInteger(stock) || stock < 0 || stock > 10000000) return { success: false, error: "Stock must be a non-negative whole number." };
  if (unit.length > 80) return { success: false, error: "Size or unit must be 80 characters or fewer." };
  if (badge.length > 40) return { success: false, error: "Badge must be 40 characters or fewer." };
  if ((image && !validImageUrl(image)) || image.length > 500) return { success: false, error: "Enter a valid product image URL." };
  if (!gallery || gallery.some((url) => !validImageUrl(url))) return { success: false, error: "Gallery must contain up to 10 valid image URLs." };
  if (!tags || typeof featured !== "boolean") return { success: false, error: "Check tags and featured product setting." };

  return {
    success: true,
    data: {
      name: name || "নতুন পণ্য",
      slug,
      category: category || "আচার",
      shortDesc,
      description,
      ingredients,
      price,
      salePrice,
      stock,
      unit: unit || "১টি জার",
      badge,
      featured,
      image: image || "/img/achar.jpg",
      gallery,
      tags,
    },
  };
}

export function validateAdminProductPatch(value: unknown): ProductPatchValidationResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { success: false, error: "Invalid product data." };
  }

  const record = value as Record<string, unknown>;
  const editableFields = [
    "name",
    "slug",
    "category",
    "shortDesc",
    "description",
    "ingredients",
    "price",
    "salePrice",
    "stock",
    "unit",
    "badge",
    "featured",
    "image",
    "gallery",
    "tags",
  ] as const satisfies readonly (keyof AdminProductInput)[];

  if (
    Object.keys(record).length === 0 ||
    Object.keys(record).some((key) => !editableFields.some((field) => field === key))
  ) {
    return { success: false, error: "Invalid product data." };
  }

  const data: Partial<AdminProductInput> = {};
  if ("name" in record) {
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (name.length < 2 || name.length > 120) return { success: false, error: "Product name must be between 2 and 120 characters." };
    data.name = name;
  }
  if ("slug" in record) {
    const slug = makeAdminProductSlug(typeof record.slug === "string" ? record.slug : "");
    if (!slug || slug.length > 160) return { success: false, error: "Enter a valid product slug." };
    data.slug = slug;
  }
  if ("category" in record) {
    const category = typeof record.category === "string" ? record.category.trim() : "";
    if (category.length < 2 || category.length > 80) return { success: false, error: "Category must be between 2 and 80 characters." };
    data.category = category;
  }
  if ("shortDesc" in record) {
    const shortDesc = typeof record.shortDesc === "string" ? record.shortDesc.trim() : "";
    if (shortDesc.length > 240) return { success: false, error: "Short description must be between 2 and 240 characters." };
    data.shortDesc = shortDesc;
  }
  if ("description" in record) {
    const description = typeof record.description === "string" ? record.description.trim() : "";
    if (description.length > 3000) return { success: false, error: "Description must be between 2 and 3000 characters." };
    data.description = description;
  }
  if ("ingredients" in record) {
    const ingredients = typeof record.ingredients === "string" ? record.ingredients.trim() : "";
    if (ingredients.length > 1000) return { success: false, error: "Ingredients must be 1000 characters or fewer." };
    data.ingredients = ingredients;
  }
  if ("price" in record) {
    const price = typeof record.price === "number" ? record.price : Number.NaN;
    if (!Number.isInteger(price) || price < 0 || price > 10000000) return { success: false, error: "Enter a valid regular price." };
    data.price = price;
  }
  if ("salePrice" in record) {
    const salePrice = record.salePrice === null || record.salePrice === "" ? null : Number(record.salePrice);
    if (salePrice !== null && (!Number.isInteger(salePrice) || salePrice < 0 || salePrice > 10000000)) {
      return { success: false, error: "Offer price must be a non-negative whole number." };
    }
    data.salePrice = salePrice;
  }
  if ("stock" in record) {
    const stock = typeof record.stock === "number" ? record.stock : Number.NaN;
    if (!Number.isInteger(stock) || stock < 0 || stock > 10000000) return { success: false, error: "Stock must be a non-negative whole number." };
    data.stock = stock;
  }
  if ("unit" in record) {
    const unit = typeof record.unit === "string" ? record.unit.trim() : "";
    if (unit.length > 80) return { success: false, error: "Enter a size or unit of up to 80 characters." };
    data.unit = unit;
  }
  if ("badge" in record) {
    const badge = typeof record.badge === "string" ? record.badge.trim() : "";
    if (badge.length > 40) return { success: false, error: "Badge must be 40 characters or fewer." };
    data.badge = badge;
  }
  if ("featured" in record) {
    if (typeof record.featured !== "boolean") return { success: false, error: "Check tags and featured product setting." };
    data.featured = record.featured;
  }
  if ("image" in record) {
    const image = typeof record.image === "string" ? record.image.trim() : "";
    if (!validImageUrl(image) || image.length > 500) return { success: false, error: "Enter a valid product image URL." };
    data.image = image;
  }
  if ("gallery" in record) {
    const gallery = readList(record.gallery, 10, 500);
    if (!gallery || gallery.some((url) => !validImageUrl(url))) return { success: false, error: "Gallery must contain up to 10 valid image URLs." };
    data.gallery = gallery;
  }
  if ("tags" in record) {
    const tags = readList(record.tags, 20, 40);
    if (!tags) return { success: false, error: "Check tags and featured product setting." };
    data.tags = tags;
  }

  return { success: true, data };
}

export async function seedAdminCatalogIfEmpty(
  db: Pick<Prisma.TransactionClient, "acharProduct">,
) {
  if (await db.acharProduct.count()) return;

  await db.acharProduct.createMany({
    data: storeProducts.map((product) => ({
      id: product.id,
      name: product.name,
      englishName: product.name,
      description: product.description,
      price: Math.round(product.price),
      compareAtPrice: product.salePrice === undefined ? null : Math.round(product.price),
      category: product.category,
      image: product.image,
      badge: product.badge || null,
      heat: "মাঝারি",
      inStock: product.stock > 0,
      updatedAt: new Date(),
      brand: null,
      images: product.gallery,
      isActive: true,
      stock: product.stock,
      slug: product.slug,
      shortDesc: product.description.slice(0, 240),
      salePrice: product.salePrice === undefined ? null : Math.round(product.salePrice),
      ingredients: product.highlights.join(", "),
      unit: product.unit,
      featured: product.featured,
      tags: product.tags,
    })),
  });
}
