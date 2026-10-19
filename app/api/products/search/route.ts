import { searchStoreProducts } from "@/lib/product-search";

const MAX_QUERY_LENGTH = 100;
const MAX_SUGGESTIONS = 6;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().slice(0, MAX_QUERY_LENGTH) ?? "";

  if (!query) {
    return Response.json({ products: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const products = await searchStoreProducts(query, MAX_SUGGESTIONS);
    return Response.json(
      { products },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    console.error("Unable to load live product search suggestions", error);
    return Response.json(
      { error: "Unable to search products right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
