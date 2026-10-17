"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/site-data";

export type CartItem = {
  productId: string;
  quantity: number;
};

const CART_STORAGE_KEY = "hbca-cart";
const CART_CHANGE_EVENT = "hbca-cart-change";
const EMPTY_CART: CartItem[] = [];
let cachedCartJson: string | null | undefined;
let cachedCartItems = EMPTY_CART;
let pendingProductsRequest: Promise<Product[]> | null = null;

function isCartItem(value: unknown): value is CartItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "productId" in value &&
    typeof value.productId === "string" &&
    "quantity" in value &&
    typeof value.quantity === "number"
  );
}

function readCartItems(): CartItem[] {
  const saved = window.localStorage.getItem(CART_STORAGE_KEY);
  if (saved === cachedCartJson) return cachedCartItems;

  try {
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    cachedCartItems = Array.isArray(parsed) && parsed.every(isCartItem) ? parsed : EMPTY_CART;
  } catch {
    cachedCartItems = EMPTY_CART;
  }

  cachedCartJson = saved;
  return cachedCartItems;
}

function subscribeToCart(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CART_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CART_CHANGE_EVENT, onChange);
  };
}

function getServerCartItems() {
  return EMPTY_CART;
}

function isCatalogProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "slug" in value &&
    typeof value.slug === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    (!("englishName" in value) || typeof value.englishName === "string") &&
    "category" in value &&
    typeof value.category === "string" &&
    "price" in value &&
    typeof value.price === "number" &&
    (!("salePrice" in value) || typeof value.salePrice === "number") &&
    "image" in value &&
    typeof value.image === "string" &&
    "gallery" in value &&
    Array.isArray(value.gallery) &&
    "badge" in value &&
    typeof value.badge === "string" &&
    "stock" in value &&
    typeof value.stock === "number" &&
    "rating" in value &&
    typeof value.rating === "number" &&
    "reviews" in value &&
    typeof value.reviews === "number" &&
    "featured" in value &&
    typeof value.featured === "boolean" &&
    "unit" in value &&
    typeof value.unit === "string" &&
    "description" in value &&
    typeof value.description === "string" &&
    "highlights" in value &&
    Array.isArray(value.highlights) &&
    "tags" in value &&
    Array.isArray(value.tags)
  );
}

function fetchStoreProducts(): Promise<Product[]> {
  if (!pendingProductsRequest) {
    pendingProductsRequest = (async () => {
      const response = await fetch("/api/products");
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error("The product catalog returned an invalid response.");
      }
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Unable to load the product catalog.";
        throw new Error(message);
      }
      if (
        typeof result !== "object" ||
        result === null ||
        !("products" in result) ||
        !Array.isArray(result.products) ||
        !result.products.every(isCatalogProduct)
      ) {
        throw new Error("The server returned invalid product data.");
      }
      return result.products;
    })().finally(() => {
      pendingProductsRequest = null;
    });
  }

  return pendingProductsRequest;
}

function updateCartItems(update: (items: CartItem[]) => CartItem[]) {
  const nextItems = update(readCartItems());
  const nextJson = JSON.stringify(nextItems);
  window.localStorage.setItem(CART_STORAGE_KEY, nextJson);
  cachedCartItems = nextItems;
  cachedCartJson = nextJson;
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

type CartContextValue = {
  items: CartItem[];
  products: Product[];
  isProductsLoading: boolean;
  productsError: string | null;
  refreshProducts: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalPrice: number;
  deliveryFee: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribeToCart, readCartItems, getServerCartItems);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const refreshProducts = async () => {
    setIsProductsLoading(true);
    try {
      setProducts(await fetchStoreProducts());
      setProductsError(null);
    } catch (error) {
      setProductsError(error instanceof Error ? error.message : "Unable to load the product catalog.");
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    fetchStoreProducts()
      .then((loadedProducts) => {
        if (cancelled) return;
        setProducts(loadedProducts);
        setProductsError(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProductsError(error instanceof Error ? error.message : "Unable to load the product catalog.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addItem = (product: Product, quantity = 1) => {
    updateCartItems((current) => {
      const existingIndex = current.findIndex((item) => item.productId === product.id);

      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...current, { productId: product.id, quantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    updateCartItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (productId: string) => {
    updateCartItems((current) => current.filter((item) => item.productId !== productId));
  };

  const clearCart = () => updateCartItems(() => EMPTY_CART);

  const cartItems = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          return product ? { ...product, quantity: item.quantity } : null;
        })
        .filter((item): item is Product & { quantity: number } => item !== null),
    [items, products],
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (item.salePrice ?? item.price) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 60 : 0;
  const totalPrice = subtotal + deliveryFee;

  const value = {
    items,
    products,
    isProductsLoading,
    productsError,
    refreshProducts,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    subtotal,
    totalPrice,
    deliveryFee,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
