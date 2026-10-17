import { getStoreProducts } from "@/lib/store-catalog";

export async function GET() {
  try {
    return Response.json(
      { products: await getStoreProducts() },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Unable to load storefront product catalog", error);
    return Response.json({ error: "Unable to load the product catalog." }, { status: 503 });
  }
}
