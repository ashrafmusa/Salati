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
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { useAuth } from "../hooks/useAuth";
import { StoreProduct, CartItem, ExtraItem, Offer, Item } from "../types";
import { calculateBundleSdgPrice, applyDiscounts, calculateItemAndExtrasTotal, calculateSdgPrice } from "../utils/helpers";
import { useSettings } from "./SettingsContext";
import { dispatchCartUpdate } from '../components/NavigationBar';

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
  deliveryMethod: 'delivery' | 'pickup';
  areAllItemsLoaded: boolean;
  setDeliveryMethod: (method: 'delivery' | 'pickup') => void;
  addToCart: (product: StoreProduct, quantity: number, selectedExtras?: ExtraItem[]) => void;
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

const GUEST_CART_KEY = 'salatiGuestCart';

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
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [areAllItemsLoaded, setAreAllItemsLoaded] = useState(false);

  useEffect(() => {
    const itemsQuery = db.collection('items');
    const unsubscribeItems = itemsQuery.onSnapshot((snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>) => {
        const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Item));
        setAllItems(fetchedItems);
        setAreAllItemsLoaded(true);
    });

    const offersQuery = db.collection('offers').where('expiryDate', '>', new Date().toISOString());
    const unsubscribeOffers = offersQuery.onSnapshot((snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>) => {
        const activeOffers = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Offer));
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
        const cartRef = db.collection("users").doc(user.uid).collection("cart").doc("current");
        const guestItems = getGuestCart();
        
        if (guestItems.length > 0) {
            try {
                await db.runTransaction(async (transaction) => {
                    const cartDoc = await transaction.get(cartRef);
                    const firestoreItems: CartItem[] = cartDoc.exists && (cartDoc.data() as { items: CartItem[] })?.items ? (cartDoc.data() as { items: CartItem[] })!.items : [];
                    
                    guestItems.forEach(guestItem => {
                        const existingIndex = firestoreItems.findIndex(item => item.cartId === guestItem.cartId);
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
                setError({ type: 'merge', message: 'Could not merge local cart.'});
            }
        }
        
        unsubscribeCart = cartRef.onSnapshot(
          (docSnap) => {
            setItems(docSnap.exists && (docSnap.data() as { items: CartItem[] })?.items ? (docSnap.data() as { items: CartItem[] })!.items : []);
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
    const extraKey = product.type === 'bundle' ? JSON.stringify(extras.map((e) => e.id).sort()) : '';
    return `${product.id}-${btoa(extraKey).replace(/=/g, '')}`;
  };

  const addToCart = useCallback(
    (product: StoreProduct, quantity: number, selectedExtras: ExtraItem[] = []) => {
      if (!settings || (product.type === 'bundle' && !areAllItemsLoaded)) {
          console.error("Settings or items not loaded yet, cannot add to cart.");
          return;
      }
      const cartId = generateCartId(product, selectedExtras);

      const action = (prevItems: CartItem[]) => {
        const newItems = [...prevItems];
        const index = newItems.findIndex((item) => item.cartId === cartId);
        
        if (index > -1) {
            const newQuantity = newItems[index].quantity + quantity;
            if (newQuantity <= newItems[index].stock) {
                newItems[index].quantity = newQuantity;
            } else {
                newItems[index].quantity = newItems[index].stock;
            }
        } else {
            if (product.stock > 0) {
                 const unitPrice = product.type === 'item' 
                    ? calculateSdgPrice(product, settings)
                    : calculateBundleSdgPrice(product, allItems, settings);
                
                newItems.push({
                    cartId,
                    productId: product.id,
                    productType: product.type,
                    name: product.name,
                    arabicName: product.arabicName,
                    imageUrl: product.imageUrl,
                    quantity: Math.min(quantity, product.stock),
                    unitPrice: unitPrice,
                    selectedExtras: product.type === 'bundle' ? selectedExtras : [],
                    category: product.category,
                    stock: product.stock
                });
            }
        }
        return newItems;
      };

      if (user) {
        const cartRef = db.collection("users").doc(user.uid).collection("cart").doc("current");
        db.runTransaction(async (transaction) => {
            const cartDoc = await transaction.get(cartRef);
            const currentItems = cartDoc.exists && (cartDoc.data() as { items: CartItem[] })?.items ? (cartDoc.data() as { items: CartItem[] })!.items : [];
            transaction.set(cartRef, { items: action(currentItems) });
        }).then(() => {
            dispatchCartUpdate(); // Dispatch event on successful add
        }).catch(e => {
            console.error("Error adding item to cart:", e);
            setError({ type: "add", message: "Failed to add item to cart." });
        });
      } else {
        setItems(prev => {
            const newItems = action(prev);
            saveGuestCart(newItems);
            dispatchCartUpdate(); // Dispatch event on successful add
            return newItems;
        });
      }
    },
    [user, allItems, areAllItemsLoaded, settings]
  );
  
  const removeFromCart = useCallback(
    (cartId: string) => {
        const action = (prevItems: CartItem[]) => prevItems.filter((item) => item.cartId !== cartId);

        if (user) {
            const cartRef = db.collection("users").doc(user.uid).collection("cart").doc("current");
            db.runTransaction(async (transaction) => {
                const cartDoc = await transaction.get(cartRef);
                const currentItems = cartDoc.exists && (cartDoc.data() as { items: CartItem[] })?.items ? (cartDoc.data() as { items: CartItem[] })!.items : [];
                transaction.set(cartRef, { items: action(currentItems) });
            }).catch(e => {
                console.error("Error removing item:", e);
                setError({ type: "remove", message: "Failed to remove item from cart." });
            });
        } else {
            setItems(prev => {
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
             return prevItems.map((item) => {
                if (item.cartId === cartId) {
                    const newQuantity = Math.min(quantity, item.stock); // Cap quantity at available stock
                    return { ...item, quantity: newQuantity };
                }
                return item;
            });
        };

        if (user) {
            const cartRef = db.collection("users").doc(user.uid).collection("cart").doc("current");
            db.runTransaction(async (transaction) => {
                const cartDoc = await transaction.get(cartRef);
                const currentItems = cartDoc.exists && (cartDoc.data() as { items: CartItem[] })?.items ? (cartDoc.data() as { items: CartItem[] })!.items : [];
                transaction.set(cartRef, { items: action(currentItems) });
            }).catch(e => {
                console.error("Error updating quantity:", e);
                setError({ type: "update", message: "Failed to update item quantity." });
            });
        } else {
            setItems(prev => {
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
        const cartRef = db.collection("users").doc(user.uid).collection("cart").doc("current");
        await cartRef.set({ items: [] }).catch(e => console.error("Error clearing cart:", e));
     } else {
        setItems([]);
        saveGuestCart([]);
     }
  }, [user]);

  const deliveryFee = useMemo(() => {
    if (deliveryMethod === 'pickup') {
        return 0;
    }
    // If a user is logged in and has a custom delivery fee, use it.
    if (user && typeof user.customDeliveryFee === 'number') {
        return user.customDeliveryFee;
    }
    // Otherwise, fall back to the default store-wide fee.
    return settings?.deliveryFee || 0;
  }, [user, settings, deliveryMethod]);

  const getCartSubtotal = useMemo(() => {
    return () => items.reduce((total, item) => total + calculateItemAndExtrasTotal(item) * item.quantity, 0);
  }, [items]);

  const getDiscountDetails = useMemo(() => {
    return () => {
        const { totalDiscount, appliedOfferIds } = applyDiscounts(items, offers, (item) => calculateItemAndExtrasTotal(item) * item.quantity);
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
      state: { items }, loading, error, deliveryFee, addToCart, updateQuantity,
      removeFromCart, clearCart, getCartSubtotal, getDiscountDetails, getFinalTotal, getCartCount,
      deliveryMethod, setDeliveryMethod, areAllItemsLoaded,
    }),
    [ items, loading, error, deliveryFee, addToCart, updateQuantity, removeFromCart, clearCart, getCartSubtotal, getDiscountDetails, getFinalTotal, getCartCount, deliveryMethod, areAllItemsLoaded ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
