import { Prisma } from "@prisma/client";
import { authorizeAdminApi } from "@/lib/admin-api";
import { serializeAdminProduct, validateAdminProductPatch } from "@/lib/admin-products";
import { prisma } from "@/lib/prisma";
import { invalidateStoreProducts } from "@/lib/store-catalog";
import { ProductTranslationError, translateProductFields } from "@/lib/product-translations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authorizationError = await authorizeAdminApi(request);
  if (authorizationError) return authorizationError;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid product data." }, { status: 400 });
  }

  const validation = validateAdminProductPatch(body);
  if (!validation.success) return Response.json({ error: validation.error }, { status: 400 });

  try {
    const currentProduct = await prisma.acharProduct.findUnique({
      where: { id },
    });
    if (!currentProduct) return Response.json({ error: "Product not found." }, { status: 404 });

    const data = validation.data;
    const nextPrice = data.price ?? currentProduct.price;
    const nextSalePrice = "salePrice" in data ? data.salePrice ?? null : currentProduct.salePrice;
    if (nextSalePrice !== null && nextSalePrice > nextPrice) {
      return Response.json({ error: "Offer price must be between zero and the regular price." }, { status: 400 });
    }

    const updateData: Prisma.AcharProductUpdateInput = { updatedAt: new Date() };
    const translationFields = ["name", "category", "shortDesc", "description", "ingredients", "unit", "badge", "tags"] as const;
    if (translationFields.some((field) => field in data)) {
      const current = serializeAdminProduct(currentProduct);
      const { translations, sourceLanguage } = await translateProductFields({
        name: data.name ?? current.name,
        slug: data.slug ?? current.slug,
        category: data.category ?? current.category,
        shortDesc: data.shortDesc ?? current.shortDesc,
        description: data.description ?? current.description,
        ingredients: data.ingredients ?? current.ingredients,
        price: data.price ?? current.price,
        salePrice: "salePrice" in data ? data.salePrice ?? null : current.salePrice,
        stock: data.stock ?? current.stock,
        unit: data.unit ?? current.unit,
        badge: data.badge ?? current.badge,
        featured: data.featured ?? current.featured,
        image: data.image ?? current.image,
        gallery: data.gallery ?? current.gallery,
        tags: data.tags ?? current.tags,
      });
      updateData.translations = translations;
      updateData.englishName = translations.en.name;
      if (!("name" in data)) updateData.name = translations[sourceLanguage].name;
    }
    if ("name" in data) {
      updateData.name = data.name;
    }
    if ("slug" in data) updateData.slug = data.slug;
    if ("category" in data) updateData.category = data.category;
    if ("shortDesc" in data) updateData.shortDesc = data.shortDesc;
    if ("description" in data) updateData.description = data.description;
    if ("ingredients" in data) updateData.ingredients = data.ingredients;
    if ("price" in data) updateData.price = data.price;
    if ("salePrice" in data) {
      updateData.salePrice = data.salePrice;
      updateData.compareAtPrice = data.salePrice === null ? null : nextPrice;
    }
    if (typeof data.stock === "number") {
      updateData.stock = data.stock;
      updateData.inStock = data.stock > 0;
    }
    if ("unit" in data) updateData.unit = data.unit;
    if ("badge" in data) updateData.badge = data.badge || null;
    if ("featured" in data) updateData.featured = data.featured;
    if ("image" in data) updateData.image = data.image;
    if ("gallery" in data) updateData.images = data.gallery;
    if ("tags" in data) updateData.tags = data.tags;

    const product = await prisma.acharProduct.update({
      where: { id },
      data: updateData,
    });

    invalidateStoreProducts();
    return Response.json({ product: serializeAdminProduct(product) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "A product already uses this URL slug." }, { status: 409 });
    }
    if (error instanceof ProductTranslationError) {
      console.error("Unable to translate admin product", error.message);
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("Unable to update admin product", error);
    return Response.json({ error: "Unable to update this product." }, { status: 503 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  const authorizationError = await authorizeAdminApi(request);
  if (authorizationError) return authorizationError;

  const { id } = await context.params;
  try {
    await prisma.acharProduct.delete({ where: { id } });
    invalidateStoreProducts();
    return Response.json({ deleted: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return Response.json({ error: "This product belongs to existing orders and cannot be deleted." }, { status: 409 });
    }
    console.error("Unable to delete admin product", error);
    return Response.json({ error: "Unable to delete this product." }, { status: 503 });
  }
}
