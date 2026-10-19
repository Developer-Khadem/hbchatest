import type { AdminProductInput } from "@/lib/admin-products";
import type { ProductTranslationFields, ProductTranslations } from "@/lib/site-data";

type TranslationResponse = {
  data?: {
    translations?: Array<{ translatedText?: unknown }>;
  };
  error?: {
    message?: unknown;
  };
};

export class ProductTranslationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductTranslationError";
  }
}

function decodeTranslatedText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function makeTranslationFields(product: AdminProductInput): ProductTranslationFields {
  return {
    name: product.name,
    category: product.category,
    badge: product.badge,
    unit: product.unit,
    description: product.description,
    highlights: product.ingredients.split(",").map((item) => item.trim()).filter(Boolean),
    tags: product.tags,
    shortDesc: product.shortDesc,
    ingredients: product.ingredients,
  };
}

async function translateBatch(
  texts: string[],
  sourceLanguage: "en" | "bn",
  targetLanguage: "en" | "bn",
  apiKey: string,
): Promise<string[]> {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts, source: sourceLanguage, target: targetLanguage, format: "text" }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    },
  );

  let payload: TranslationResponse;
  try {
    payload = await response.json() as TranslationResponse;
  } catch {
    throw new ProductTranslationError("Google Translation returned an invalid response.");
  }

  if (!response.ok) {
    const providerMessage =
      typeof payload.error?.message === "string" ? payload.error.message : "Unknown Google Translation API error.";
    throw new ProductTranslationError(`Automatic translation failed: ${providerMessage}`);
  }

  const translations = payload.data?.translations;
  if (!translations || translations.length !== texts.length) {
    throw new ProductTranslationError("Google Translation returned an incomplete translation.");
  }

  const translatedValues: string[] = [];
  for (const item of translations) {
    if (typeof item.translatedText !== "string") {
      throw new ProductTranslationError("Google Translation returned an incomplete translation.");
    }
    translatedValues.push(decodeTranslatedText(item.translatedText));
  }
  return translatedValues;
}

export async function translateProductFields(
  product: AdminProductInput,
): Promise<{ sourceLanguage: "en" | "bn"; translations: ProductTranslations }> {
  const sourceLanguage = /[\u0980-\u09ff]/u.test(product.name) ? "bn" : "en";
  const sourceFields = makeTranslationFields(product);
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_TRANSLATE_API_KEY is not configured; saving product text without automatic translation.");
    return {
      sourceLanguage,
      translations: { en: sourceFields, bn: sourceFields },
    };
  }

  const targetLanguage = sourceLanguage === "bn" ? "en" : "bn";
  const entries = Object.entries(sourceFields);
  const texts = entries.flatMap(([, value]) => Array.isArray(value) ? value : [value])
    .filter((value) => value.length > 0);
  const batches = Array.from({ length: Math.ceil(texts.length / 100) }, (_, index) =>
    texts.slice(index * 100, (index + 1) * 100),
  );
  let translatedValues: string[];
  try {
    translatedValues = (await Promise.all(
      batches.map((batch) => translateBatch(batch, sourceLanguage, targetLanguage, apiKey)),
    )).flat();
  } catch (error) {
    if (error instanceof ProductTranslationError) throw error;
    throw new ProductTranslationError("Unable to reach Google Translation. Check the connection and try again.");
  }

  let translatedIndex = 0;
  const translatedFields = Object.fromEntries(entries.map(([key, value]) => {
    if (Array.isArray(value)) {
      return [key, value.map((item) => item.length > 0 ? translatedValues[translatedIndex++] : item)];
    }
    return [key, value.length > 0 ? translatedValues[translatedIndex++] : value];
  })) as ProductTranslationFields;

  return {
    sourceLanguage,
    translations: sourceLanguage === "bn"
      ? { bn: sourceFields, en: translatedFields }
      : { en: sourceFields, bn: translatedFields },
  };
}
