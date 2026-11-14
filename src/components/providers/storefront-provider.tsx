"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { addUniqueId, parseStoredCart, parseStoredIdList, removeId, type StoredCartItem } from "@/lib/local-commerce";

const ENQUIRY_STORAGE_KEY = "mr-lapshop-enquiry-list-v1";
const WISHLIST_STORAGE_KEY = "mr-lapshop-wishlist-v1";
const CART_STORAGE_KEY = "mr-lapshop-cart-v1";

type StorefrontContextValue = {
  enquiryIds: string[];
  wishlistIds: string[];
  cartItems: StoredCartItem[];
  hydrated: boolean;
  addToEnquiry: (id: string) => void;
  removeFromEnquiry: (id: string) => void;
  clearEnquiry: () => void;
  toggleWishlist: (id: string) => void;
  removeFromWishlist: (id: string) => void;
  addToCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isInEnquiry: (id: string) => boolean;
  isWishlisted: (id: string) => boolean;
};

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [enquiryIds, setEnquiryIds] = useState<string[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<StoredCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- Intentional post-mount localStorage hydration; browser storage is unavailable during SSR and the empty initial state keeps server/client markup deterministic. */
  useEffect(() => {
    try {
      setEnquiryIds(parseStoredIdList(window.localStorage.getItem(ENQUIRY_STORAGE_KEY)));
      setWishlistIds(parseStoredIdList(window.localStorage.getItem(WISHLIST_STORAGE_KEY)));
      setCartItems(parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY)));
    } catch {
      // Browsers with blocked storage still get an in-memory experience for this visit.
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(ENQUIRY_STORAGE_KEY, JSON.stringify(enquiryIds));
    } catch {
      // Storage can be unavailable or full; the current in-memory state remains usable.
    }
  }, [enquiryIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // Storage can be unavailable or full; the current in-memory state remains usable.
    }
  }, [wishlistIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)); } catch { /* Keep the in-memory cart usable if storage is unavailable. */ }
  }, [cartItems, hydrated]);

  const addToEnquiry = useCallback((id: string) => setEnquiryIds((current) => addUniqueId(current, id)), []);
  const removeFromEnquiry = useCallback((id: string) => setEnquiryIds((current) => removeId(current, id)), []);
  const clearEnquiry = useCallback(() => setEnquiryIds([]), []);
  const toggleWishlist = useCallback((id: string) => {
    setWishlistIds((current) => current.includes(id) ? removeId(current, id) : addUniqueId(current, id));
  }, []);
  const removeFromWishlist = useCallback((id: string) => setWishlistIds((current) => removeId(current, id)), []);
  const addToCart = useCallback((id: string) => setCartItems((current) => {
    const existing = current.find((item) => item.productId === id);
    if (existing) return current.map((item) => item.productId === id ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item);
    return [...current, { productId: id, quantity: 1 }];
  }), []);
  const updateCartQuantity = useCallback((id: string, quantity: number) => setCartItems((current) => quantity < 1 ? current.filter((item) => item.productId !== id) : current.map((item) => item.productId === id ? { ...item, quantity: Math.min(10, Math.floor(quantity)) } : item)), []);
  const removeFromCart = useCallback((id: string) => setCartItems((current) => current.filter((item) => item.productId !== id)), []);
  const clearCart = useCallback(() => setCartItems([]), []);
  const isInEnquiry = useCallback((id: string) => enquiryIds.includes(id), [enquiryIds]);
  const isWishlisted = useCallback((id: string) => wishlistIds.includes(id), [wishlistIds]);

  const value = useMemo<StorefrontContextValue>(() => ({
    enquiryIds,
    wishlistIds,
    cartItems,
    hydrated,
    addToEnquiry,
    removeFromEnquiry,
    clearEnquiry,
    toggleWishlist,
    removeFromWishlist,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    isInEnquiry,
    isWishlisted,
  }), [
    enquiryIds,
    wishlistIds,
    cartItems,
    hydrated,
    addToEnquiry,
    removeFromEnquiry,
    clearEnquiry,
    toggleWishlist,
    removeFromWishlist,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    isInEnquiry,
    isWishlisted,
  ]);

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront() {
  const context = useContext(StorefrontContext);
  if (!context) throw new Error("useStorefront must be used inside StorefrontProvider");
  return context;
}
