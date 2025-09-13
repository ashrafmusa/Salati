
import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export interface WishlistContextType {
  itemIds: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  loading: boolean;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_WISHLIST_KEY = 'salatiGuestWishlist';

const getGuestWishlist = (): string[] => {
    try {
        const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveGuestWishlist = (ids: string[]) => {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids));
};

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const mergeAndListen = async () => {
        if (!user) return;
        // FIX: Refactored Firestore doc call to use v8 compat syntax.
        const wishlistRef = db.collection("users").doc(user.uid).collection("wishlist").doc("current");
        const guestIds = getGuestWishlist();

        if (guestIds.length > 0) {
            try {
                // FIX: Refactored Firestore getDoc call to use v8 compat syntax.
                const docSnap = await wishlistRef.get();
                // FIX: Cast document data to correctly access the 'itemIds' property.
                const firestoreIds = docSnap.exists && (docSnap.data() as { itemIds: string[] })?.itemIds ? (docSnap.data() as { itemIds: string[] })!.itemIds : [];
                const mergedIds = Array.from(new Set([...firestoreIds, ...guestIds]));
                // FIX: Refactored Firestore setDoc call to use v8 compat syntax.
                await wishlistRef.set({ itemIds: mergedIds }, { merge: true });
                localStorage.removeItem(GUEST_WISHLIST_KEY);
            } catch (error) {
                console.error("Error merging wishlists:", error);
            }
        }

        // FIX: Refactored onSnapshot call to use v8 compat syntax.
        unsubscribe = wishlistRef.onSnapshot((docSnap) => {
            // FIX: Cast document data to correctly access the 'itemIds' property.
            setItemIds(docSnap.exists && (docSnap.data() as {itemIds: string[]})?.itemIds ? (docSnap.data() as {itemIds: string[]})!.itemIds : []);
            setLoading(false);
        }, () => setLoading(false));
    };

    if (user) {
        setLoading(true);
        mergeAndListen();
    } else {
        setItemIds(getGuestWishlist());
        setLoading(false);
    }

    return () => unsubscribe();
  }, [user]);

  const addToWishlist = useCallback(async (productId: string) => {
    if (user) {
      // FIX: Refactored Firestore calls to use v8 compat syntax.
      const wishlistRef = db.collection("users").doc(user.uid).collection("wishlist").doc("current");
      await wishlistRef.set({ itemIds: firebase.firestore.FieldValue.arrayUnion(productId) }, { merge: true });
    } else {
      setItemIds(prevIds => {
        const newIds = Array.from(new Set([...prevIds, productId]));
        saveGuestWishlist(newIds);
        return newIds;
      });
    }
  }, [user]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (user) {
        // FIX: Refactored Firestore calls to use v8 compat syntax.
        const wishlistRef = db.collection("users").doc(user.uid).collection("wishlist").doc("current");
        await wishlistRef.update({ itemIds: firebase.firestore.FieldValue.arrayRemove(productId) });
    } else {
        setItemIds(prevIds => {
            const newIds = prevIds.filter(id => id !== productId);
            saveGuestWishlist(newIds);
            return newIds;
        });
    }
  }, [user]);

  const isInWishlist = useCallback((productId: string) => {
    return itemIds.includes(productId);
  }, [itemIds]);

  const value = useMemo(() => ({
      itemIds,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      loading
  }), [itemIds, addToWishlist, removeFromWishlist, isInWishlist, loading]);


  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
