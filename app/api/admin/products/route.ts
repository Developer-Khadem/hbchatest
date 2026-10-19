import { Prisma } from "@prisma/client";
import { authorizeAdminApi } from "@/lib/admin-api";
import { makeAdminProductSlug, serializeAdminProduct, validateAdminProduct } from "@/lib/admin-products";
import { prisma } from "@/lib/prisma";
import { invalidateStoreProducts } from "@/lib/store-catalog";
import { ProductTranslationError, translateProductFields } from "@/lib/product-translations";

export async function GET(request: Request) {
  const authorizationError = await authorizeAdminApi(request);
  if (authorizationError) return authorizationError;

  try {
    const [items, categoryItems] = await Promise.all([
      prisma.acharProduct.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.acharProduct.findMany({
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
    ]);

    return Response.json({
      products: items.map(serializeAdminProduct),
      categories: categoryItems.map(({ category }) => ({ id: category, name: category })),
    });
  } catch (error) {
    console.error("Unable to load admin product catalog", error);
    return Response.json({ error: "Unable to load products. Check the database connection and schema." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const authorizationError = await authorizeAdminApi(request);
  if (authorizationError) return authorizationError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid product data." }, { status: 400 });
  }

  const validation = validateAdminProduct(body);
  if (!validation.success) return Response.json({ error: validation.error }, { status: 400 });

  try {
    const id = crypto.randomUUID();
    const validatedData = validation.data;
    const data = {
      ...validatedData,
      slug: validatedData.slug || `${makeAdminProductSlug(validatedData.name) || "product"}-${id.slice(0, 8)}`,
    };
    const { translations } = await translateProductFields(data);
    const product = await prisma.acharProduct.create({
      data: {
        id,
        name: data.name,
        englishName: translations.en.name,
        translations,
        description: data.description,
        price: data.price,
        compareAtPrice: data.salePrice === null ? null : data.price,
        category: data.category,
        image: data.image,
        badge: data.badge || null,
        heat: "মাঝারি",
        inStock: data.stock > 0,
        updatedAt: new Date(),
        images: data.gallery,
        isActive: true,
        stock: data.stock,
        slug: data.slug,
        shortDesc: data.shortDesc,
        salePrice: data.salePrice,
        ingredients: data.ingredients,
        unit: data.unit,
        featured: data.featured,
        tags: data.tags,
      },
    });

    invalidateStoreProducts();
    return Response.json({ product: serializeAdminProduct(product) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "A product already uses this URL slug." }, { status: 409 });
    }
    if (error instanceof ProductTranslationError) {
      console.error("Unable to translate admin product", error.message);
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("Unable to create admin product", error);
    return Response.json({ error: "Unable to save this product." }, { status: 503 });
  }
}
