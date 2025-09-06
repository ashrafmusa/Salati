import React, {
  useState,
  useContext,
  createContext,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { StoreProduct, CartItem, ExtraItem, Offer, Item } from "../types";
import {
  calculateBundlePrice,
  applyDiscounts,
  calculateItemAndExtrasTotal,
} from "../utils/helpers";
import { useSettings } from "./SettingsContext";

interface CartState {
  items: CartItem[];
}

type CartErrorType = "fetch" | "add" | "update" | "remove" | "merge";

interface CartError {
  type: CartErrorType;
  message: string;
}

export interface CartContextType {
  state: CartState;
  loading: boolean;
  error: CartError | null;
  deliveryFee: number;
  deliveryMethod: "delivery" | "pickup";
  setDeliveryMethod: (method: "delivery" | "pickup") => void;
  addToCart: (product: StoreProduct, selectedExtras?: ExtraItem[]) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getDiscountDetails: () => { amount: number; offerIds: string[] };
  getFinalTotal: () => number;
  getCartCount: () => number;
}

export const CartContext = createContext<CartContextType | undefined>(
  undefined
);

const GUEST_CART_KEY = "salatiGuestCart";

const getGuestCart = (): CartItem[] => {
  try {
    const localData = localStorage.getItem(GUEST_CART_KEY);
    return localData ? JSON.parse(localData) : [];
  } catch (error) {
    console.error("Error parsing guest cart:", error);
    return [];
  }
};

const saveGuestCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving guest cart:", error);
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [items, setItems] = useState<CartItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CartError | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    "delivery"
  );

  useEffect(() => {
    const itemsQuery = query(collection(db, "items"));
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const fetchedItems = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Item)
      );
      setAllItems(fetchedItems);
    });

    const offersQuery = query(
      collection(db, "offers"),
      where("expiryDate", ">", new Date().toISOString())
    );
    const unsubscribeOffers = onSnapshot(offersQuery, (snapshot) => {
      const activeOffers = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Offer)
      );
      setOffers(activeOffers);
    });

    return () => {
      unsubscribeItems();
      unsubscribeOffers();
    };
  }, []);

  useEffect(() => {
    let unsubscribeCart = () => {};

    const mergeCartsAndListen = async () => {
      if (!user) return;
      const cartRef = doc(db, "users", user.uid, "cart", "current");
      const guestItems = getGuestCart();

      if (guestItems.length > 0) {
        try {
          await runTransaction(db, async (transaction) => {
            const cartDoc = await transaction.get(cartRef);
            const firestoreItems: CartItem[] =
              cartDoc.exists() && cartDoc.data()?.items
                ? cartDoc.data()!.items
                : [];

            guestItems.forEach((guestItem) => {
              const existingIndex = firestoreItems.findIndex(
                (item) => item.cartId === guestItem.cartId
              );
              if (existingIndex > -1) {
                firestoreItems[existingIndex].quantity += guestItem.quantity;
              } else {
                firestoreItems.push(guestItem);
              }
            });

            transaction.set(cartRef, { items: firestoreItems });
          });
          localStorage.removeItem(GUEST_CART_KEY);
        } catch (e) {
          console.error("Error merging carts:", e);
          setError({ type: "merge", message: "Could not merge local cart." });
        }
      }

      unsubscribeCart = onSnapshot(
        cartRef,
        (docSnap) => {
          setItems(
            docSnap.exists() && docSnap.data()?.items
              ? docSnap.data()!.items
              : []
          );
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching cart:", err);
          setError({ type: "fetch", message: "Failed to fetch cart data." });
          setLoading(false);
        }
      );
    };

    if (user) {
      setLoading(true);
      mergeCartsAndListen();
    } else {
      setItems(getGuestCart());
      setLoading(false);
    }

    return () => unsubscribeCart();
  }, [user]);

  const generateCartId = (product: StoreProduct, extras: ExtraItem[]) => {
    const extraKey =
      product.type === "bundle"
        ? JSON.stringify(extras.map((e) => e.id).sort())
        : "";
    return `${product.id}-${btoa(extraKey).replace(/=/g, "")}`;
  };

  const addToCart = useCallback(
    (product: StoreProduct, selectedExtras: ExtraItem[] = []) => {
      const cartId = generateCartId(product, selectedExtras);

      const action = (prevItems: CartItem[]) => {
        const newItems = [...prevItems];
        const index = newItems.findIndex((item) => item.cartId === cartId);

        if (index > -1) {
          newItems[index].quantity += 1;
        } else {
          const unitPrice =
            product.type === "item"
              ? product.price
              : calculateBundlePrice(product, allItems);

          newItems.push({
            cartId,
            productId: product.id,
            productType: product.type,
            name: product.name,
            arabicName: product.arabicName,
            imageUrl: product.imageUrl,
            quantity: 1,
            unitPrice: unitPrice,
            selectedExtras: product.type === "bundle" ? selectedExtras : [],
            category: product.category,
            stock: product.stock,
          });
        }
        return newItems;
      };

      if (user) {
        const cartRef = doc(db, "users", user.uid, "cart", "current");
        runTransaction(db, async (transaction) => {
          const cartDoc = await transaction.get(cartRef);
          const currentItems =
            cartDoc.exists() && cartDoc.data()?.items
              ? cartDoc.data()!.items
              : [];
          transaction.set(cartRef, { items: action(currentItems) });
        }).catch((e) => {
          console.error("Error adding item to cart:", e);
          setError({ type: "add", message: "Failed to add item to cart." });
        });
      } else {
        setItems((prev) => {
          const newItems = action(prev);
          saveGuestCart(newItems);
          return newItems;
        });
      }
    },
    [user, allItems]
  );

  const removeFromCart = useCallback(
    (cartId: string) => {
      const action = (prevItems: CartItem[]) =>
        prevItems.filter((item) => item.cartId !== cartId);

      if (user) {
        const cartRef = doc(db, "users", user.uid, "cart", "current");
        runTransaction(db, async (transaction) => {
          const cartDoc = await transaction.get(cartRef);
          const currentItems =
            cartDoc.exists() && cartDoc.data()?.items
              ? cartDoc.data()!.items
              : [];
          transaction.set(cartRef, { items: action(currentItems) });
        }).catch((e) => {
          console.error("Error removing item:", e);
          setError({
            type: "remove",
            message: "Failed to remove item from cart.",
          });
        });
      } else {
        setItems((prev) => {
          const newItems = action(prev);
          saveGuestCart(newItems);
          return newItems;
        });
      }
    },
    [user]
  );

  const updateQuantity = useCallback(
    (cartId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(cartId);
        return;
      }

      const action = (prevItems: CartItem[]) => {
        return prevItems.map((item) =>
          item.cartId === cartId ? { ...item, quantity } : item
        );
      };

      if (user) {
        const cartRef = doc(db, "users", user.uid, "cart", "current");
        runTransaction(db, async (transaction) => {
          const cartDoc = await transaction.get(cartRef);
          const currentItems =
            cartDoc.exists() && cartDoc.data()?.items
              ? cartDoc.data()!.items
              : [];
          transaction.set(cartRef, { items: action(currentItems) });
        }).catch((e) => {
          console.error("Error updating quantity:", e);
          setError({
            type: "update",
            message: "Failed to update item quantity.",
          });
        });
      } else {
        setItems((prev) => {
          const newItems = action(prev);
          saveGuestCart(newItems);
          return newItems;
        });
      }
    },
    [user, removeFromCart]
  );

  const clearCart = useCallback(async () => {
    if (user) {
      const cartRef = doc(db, "users", user.uid, "cart", "current");
      await setDoc(cartRef, { items: [] }).catch((e) =>
        console.error("Error clearing cart:", e)
      );
    } else {
      setItems([]);
      saveGuestCart([]);
    }
  }, [user]);

  const deliveryFee = useMemo(() => {
    if (deliveryMethod === "pickup") {
      return 0;
    }
    // If a user is logged in and has a custom delivery fee, use it.
    if (user && typeof user.customDeliveryFee === "number") {
      return user.customDeliveryFee;
    }
    // Otherwise, fall back to the default store-wide fee.
    return settings?.deliveryFee || 0;
  }, [user, settings, deliveryMethod]);

  const getCartSubtotal = useMemo(() => {
    return () =>
      items.reduce(
        (total, item) =>
          total + calculateItemAndExtrasTotal(item) * item.quantity,
        0
      );
  }, [items]);

  const getDiscountDetails = useMemo(() => {
    return () => {
      const { totalDiscount, appliedOfferIds } = applyDiscounts(
        items,
        offers,
        (item) => calculateItemAndExtrasTotal(item) * item.quantity
      );
      return { amount: totalDiscount, offerIds: appliedOfferIds };
    };
  }, [items, offers]);

  const getFinalTotal = useMemo(() => {
    return () => {
      const subtotal = getCartSubtotal();
      const { amount: discountAmount } = getDiscountDetails();
      return subtotal - discountAmount + deliveryFee;
    };
  }, [getCartSubtotal, getDiscountDetails, deliveryFee]);

  const getCartCount = useMemo(() => {
    return () => items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      state: { items },
      loading,
      error,
      deliveryFee,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartSubtotal,
      getDiscountDetails,
      getFinalTotal,
      getCartCount,
      deliveryMethod,
      setDeliveryMethod,
    }),
    [
      items,
      loading,
      error,
      deliveryFee,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartSubtotal,
      getDiscountDetails,
      getFinalTotal,
      getCartCount,
      deliveryMethod,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
