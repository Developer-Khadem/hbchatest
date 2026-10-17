"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useLanguage } from "@/components/language-context";

type Product = {
  id: string;
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

type Category = { id: string; name: string };

type ProductForm = Omit<Product, "id">;

type ApiError = { error?: unknown };

function getChangedFields<T extends object>(original: T, current: T): Partial<T> {
  const changed: Partial<T> = {};
  for (const key of Object.keys(current) as Array<keyof T>) {
    if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
      Object.assign(changed, { [key]: current[key] });
    }
  }
  return changed;
}

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  category: "",
  shortDesc: "",
  description: "",
  ingredients: "",
  price: 0,
  salePrice: null,
  stock: 0,
  unit: "১টি জার",
  badge: "",
  featured: false,
  image: "",
  gallery: [],
  tags: [],
};

function readError(body: ApiError, fallback: string) {
  return typeof body.error === "string" ? body.error : fallback;
}

function makeSlug(value: string) {
  return value.normalize("NFKC").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

const MAX_PRODUCT_IMAGE_BYTES = 100 * 1024;
const TARGET_PRODUCT_IMAGE_BYTES = 96 * 1024;

function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Your browser could not compress this image."));
      } else if (blob.type !== "image/webp") {
        reject(new Error("Your browser does not support WebP image compression."));
      } else {
        resolve(blob);
      }
    }, "image/webp", quality);
  });
}

async function compressProductImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image for compression.");

    const initialScale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * initialScale));
    let height = Math.max(1, Math.round(bitmap.height * initialScale));

    while (true) {
      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of [0.82, 0.68, 0.54, 0.4, 0.28, 0.18, 0.1]) {
        const blob = await encodeWebp(canvas, quality);
        if (blob.size < MAX_PRODUCT_IMAGE_BYTES && blob.size <= TARGET_PRODUCT_IMAGE_BYTES) {
          const fileName = file.name.replace(/\.[^.]+$/, "") || "product-image";
          return new File([blob], `${fileName}.webp`, { type: "image/webp" });
        }
      }

      if (Math.max(width, height) <= 64) {
        throw new Error("Could not compress this image below 100 KB. Choose a smaller or simpler image.");
      }

      const scale = Math.max(64 / Math.max(width, height), 0.8);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }
  } finally {
    bitmap.close();
  }
}

async function fetchAdminProducts(): Promise<{ products: Product[]; categories: Category[] }> {
  const response = await fetch("/api/admin/products", { cache: "no-store" });
  const result: unknown = await parseJson(response);
  if (!response.ok) throw new Error(readError(result as ApiError, "Unable to load products."));
  if (typeof result !== "object" || result === null || !("products" in result) || !Array.isArray(result.products)) {
    throw new Error("The server returned invalid product data.");
  }

  return {
    products: result.products as Product[],
    categories: "categories" in result && Array.isArray(result.categories) ? result.categories as Category[] : [],
  };
}

export function AdminProductManager() {
  const { t } = useLanguage();
  const { refreshProducts } = useCart();
  const fileInput = useRef<HTMLInputElement>(null);
  const originalForm = useRef<ProductForm | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      const { products, categories: loadedCategories } = await fetchAdminProducts();
      setError("");
      setItems(products);
      setCategories(loadedCategories);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAdminProducts().then(({ products, categories: loadedCategories }) => {
      if (cancelled) return;
      setItems(products);
      setCategories(loadedCategories);
      setError("");
    }).catch((loadError: unknown) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = items.filter((product) =>
    `${product.name} ${product.category} ${product.slug}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  const startCreate = () => {
    setEditingId(null);
    originalForm.current = null;
    setForm({ ...emptyForm, category: categories[0]?.name ?? "" });
    setNotice("");
    setError("");
    setIsFormOpen(true);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    const productForm: ProductForm = {
      name: product.name,
      slug: product.slug,
      category: product.category,
      shortDesc: product.shortDesc,
      description: product.description,
      ingredients: product.ingredients,
      price: product.price,
      salePrice: product.salePrice,
      stock: product.stock,
      unit: product.unit,
      badge: product.badge,
      featured: product.featured,
      image: product.image,
      gallery: product.gallery,
      tags: product.tags,
    };
    originalForm.current = productForm;
    setForm(productForm);
    setNotice("");
    setError("");
    setIsFormOpen(true);
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setError("");
    setNotice("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError(t("Choose a JPG, PNG or WebP image up to 10 MB."));
      return;
    }

    setIsUploading(true);
    try {
      const compressedFile = await compressProductImage(file);
      const signatureResponse = await fetch("/api/admin/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: compressedFile.type, size: compressedFile.size }),
      });
      const signatureResult: unknown = await parseJson(signatureResponse);
      if (!signatureResponse.ok) throw new Error(readError(signatureResult as ApiError, "Unable to authorize image upload."));
      if (
        typeof signatureResult !== "object" ||
        signatureResult === null ||
        !("cloudName" in signatureResult) ||
        typeof signatureResult.cloudName !== "string" ||
        !("apiKey" in signatureResult) ||
        typeof signatureResult.apiKey !== "string" ||
        !("timestamp" in signatureResult) ||
        typeof signatureResult.timestamp !== "number" ||
        !("folder" in signatureResult) ||
        typeof signatureResult.folder !== "string" ||
        !("signature" in signatureResult) ||
        typeof signatureResult.signature !== "string"
      ) {
        throw new Error("The server returned invalid Cloudinary upload credentials.");
      }

      const uploadData = new FormData();
      uploadData.set("file", compressedFile);
      uploadData.set("api_key", signatureResult.apiKey);
      uploadData.set("timestamp", String(signatureResult.timestamp));
      uploadData.set("folder", signatureResult.folder);
      uploadData.set("signature", signatureResult.signature);
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signatureResult.cloudName)}/image/upload`,
        { method: "POST", body: uploadData },
      );
      const uploadResult: unknown = await parseJson(uploadResponse);
      if (!uploadResponse.ok) {
        throw new Error(
          typeof uploadResult === "object" &&
          uploadResult !== null &&
          "error" in uploadResult &&
          typeof uploadResult.error === "object" &&
          uploadResult.error !== null &&
          "message" in uploadResult.error &&
          typeof uploadResult.error.message === "string"
            ? uploadResult.error.message
            : "Cloudinary image upload failed.",
        );
      }
      if (typeof uploadResult !== "object" || uploadResult === null || !("secure_url" in uploadResult) || typeof uploadResult.secure_url !== "string") {
        throw new Error("Cloudinary did not return a secure image URL.");
      }

      const secureUrl = uploadResult.secure_url;
      setForm((current) => ({ ...current, image: secureUrl, gallery: [secureUrl] }));
      setNotice(t("Image uploaded to Cloudinary."));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Cloudinary image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!editingId && !form.image) {
      setError(t("Upload the product image to Cloudinary before saving."));
      return;
    }

    setIsSaving(true);
    const payload = editingId && originalForm.current
      ? getChangedFields(originalForm.current, form)
      : {
        ...form,
        slug: makeSlug(form.slug || form.name),
        price: Number(form.price),
        salePrice: form.salePrice === null || Number.isNaN(Number(form.salePrice)) ? null : Number(form.salePrice),
        stock: Number(form.stock),
        tags: form.tags,
      };

    if (editingId && Object.keys(payload).length === 0) {
      setIsSaving(false);
      setError(t("Make at least one change before saving."));
      return;
    }

    try {
      const response = await fetch(editingId ? `/api/admin/products/${encodeURIComponent(editingId)}` : "/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await parseJson(response);
      if (!response.ok) throw new Error(readError(result as ApiError, "Unable to save this product."));
      setIsFormOpen(false);
      setNotice(t(editingId ? "Product updated." : "Product added."));
      await Promise.all([loadProducts(), refreshProducts()]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save this product.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(t("Delete this product? This cannot be undone."))) return;
    setDeletingId(product.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: "DELETE" });
      const result: unknown = await parseJson(response);
      if (!response.ok) throw new Error(readError(result as ApiError, "Unable to delete this product."));
      setItems((current) => current.filter((item) => item.id !== product.id));
      await refreshProducts();
      setNotice(t("Product deleted."));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete this product.");
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500";

  return (
    <section id="product-management" className="mt-5 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">{t("Product management")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("Add, edit and remove products from the saved catalog.")}</p>
        </div>
        <button type="button" onClick={startCreate} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
          <Plus size={17} /> {t("Add product")}
        </button>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{t(error)}</p> : null}
      {notice ? <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{notice}</p> : null}

      <label className="relative mt-4 block max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Search products")} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
      </label>

      {isLoading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" /> {t("Loading products...")}</p>
      ) : error && items.length === 0 ? null : filteredItems.length === 0 ? (
        <p className="mt-6 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">{t("No products found.")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("Product")}</th>
                <th className="px-4 py-3">{t("Category")}</th>
                <th className="px-4 py-3">{t("Price")}</th>
                <th className="px-4 py-3">{t("Stock")}</th>
                <th className="px-4 py-3 text-right">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <Image src={product.image} alt="" width={40} height={40} unoptimized className="size-10 rounded-lg object-cover" />
                      <span><span className="block font-bold">{t(product.name)}</span><span className="block text-xs text-slate-500">{product.slug}</span></span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t(product.category)}</td>
                  <td className="px-4 py-3 font-semibold">৳{product.salePrice ?? product.price}</td>
                  <td className="px-4 py-3">{product.stock} {t(product.unit)}</td>
                  <td className="px-4 py-3">
                    <span className="flex justify-end gap-1">
                      <button type="button" aria-label={`${t("Edit")} ${product.name}`} onClick={() => startEdit(product)} className="rounded-lg p-2 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"><Pencil size={16} /></button>
                      <button type="button" aria-label={`${t("Delete")} ${product.name}`} disabled={deletingId === product.id} onClick={() => void deleteProduct(product)} className="rounded-lg p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50">{deletingId === product.id ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 sm:items-center sm:p-6">
          <section role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h3 id="product-form-title" className="text-lg font-black">{t(editingId ? "Edit product" : "Add product")}</h3>
                <p className="mt-1 text-xs text-slate-500">{t(editingId ? "Only changed fields will be saved." : "Required product details and one Cloudinary image.")}</p>
              </div>
              <button type="button" aria-label={t("Close")} onClick={() => setIsFormOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
            </div>

            <form noValidate={Boolean(editingId)} onSubmit={saveProduct} className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">{t("Product name")}{editingId ? "" : " *"}
                  <input required={!editingId} minLength={editingId ? undefined : 2} maxLength={120} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} onBlur={() => setForm((current) => ({ ...current, slug: current.slug || makeSlug(current.name) }))} className={inputClass} />
                </label>
                <label className="text-sm font-semibold">{t("URL slug")}{editingId ? "" : " *"}
                  <input required={!editingId} maxLength={160} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: makeSlug(event.target.value) }))} className={inputClass} />
                </label>
                <label className="text-sm font-semibold">{t("Category")}{editingId ? "" : " *"}
                  <input required={!editingId} list="admin-product-categories" maxLength={80} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={inputClass} />
                  <datalist id="admin-product-categories">{categories.map((category) => <option key={category.id} value={category.name} />)}</datalist>
                </label>
                <label className="text-sm font-semibold">{t("Size / jar variant")}{editingId ? "" : " *"}
                  <input required={!editingId} maxLength={80} value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder={t("e.g. 500 g glass jar")} className={inputClass} />
                </label>
                <label className="text-sm font-semibold">{t("Regular price")} (৳){editingId ? "" : " *"}
                  <input required={!editingId} type="number" min="0" max="10000000" step="1" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} className={inputClass} />
                </label>
                <label className="text-sm font-semibold">{t("Offer price")} (৳)
                  <input type="number" min="0" max={form.price} step="0.01" value={form.salePrice ?? ""} onChange={(event) => setForm((current) => ({ ...current, salePrice: event.target.value === "" ? null : Number(event.target.value) }))} className={inputClass} />
                </label>
                <label className="text-sm font-semibold">{t("Stock")}{editingId ? "" : " *"}
                  <input required={!editingId} type="number" min="0" max="10000000" step="1" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: Number(event.target.value) }))} className={inputClass} />
                </label>
                <label className="text-sm font-semibold">{t("Badge")}
                  <input maxLength={40} value={form.badge} onChange={(event) => setForm((current) => ({ ...current, badge: event.target.value }))} className={inputClass} />
                </label>
              </div>

              <label className="block text-sm font-semibold">{t("Short description")}{editingId ? "" : " *"}
                <input required={!editingId} minLength={editingId ? undefined : 2} maxLength={240} value={form.shortDesc} onChange={(event) => setForm((current) => ({ ...current, shortDesc: event.target.value }))} className={inputClass} />
              </label>
              <label className="block text-sm font-semibold">{t("Description")}{editingId ? "" : " *"}
                <textarea required={!editingId} minLength={editingId ? undefined : 2} maxLength={3000} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={inputClass} />
              </label>
              <label className="block text-sm font-semibold">{t("Ingredients")}
                <textarea maxLength={1000} rows={2} value={form.ingredients} onChange={(event) => setForm((current) => ({ ...current, ingredients: event.target.value }))} className={inputClass} />
              </label>
              <label className="block text-sm font-semibold">{t("Tags")} <span className="font-normal text-slate-500">({t("comma separated")})</span>
                <input value={form.tags.join(", ")} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} className={inputClass} />
              </label>

              <div>
                <p className="text-sm font-semibold">{t("Product photo")}{editingId ? "" : " *"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  {form.image ? <Image src={form.image} alt={t("Product preview")} width={88} height={88} unoptimized className="size-[88px] rounded-xl object-cover" /> : <span className="grid size-[88px] place-items-center rounded-xl bg-white text-slate-400"><ImagePlus size={28} /></span>}
                  <div className="flex-1">
                    <p className="text-xs leading-5 text-slate-600">{t("Upload one JPG, PNG or WebP image to Cloudinary (max 10 MB).")}</p>
                    <button type="button" disabled={isUploading} onClick={() => fileInput.current?.click()} className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 disabled:opacity-50">
                      {isUploading ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />}
                      {t(isUploading ? "Uploading..." : form.image ? "Replace image" : "Choose image")}
                    </button>
                    <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void uploadImage(event)} />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} className="size-4 accent-emerald-700" />
                {t("Feature this product")}
              </label>

              {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{t(error)}</p> : null}
              {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{notice}</p> : null}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">{t("Cancel")}</button>
                <button type="submit" disabled={isSaving || isUploading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                  {isSaving ? <LoaderCircle size={16} className="animate-spin" /> : null}
                  {t(isSaving ? "Saving..." : editingId ? "Save changes" : "Add product")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
