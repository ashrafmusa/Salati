import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

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
        const wishlistRef = doc(db, "users", user.uid, "wishlist", "current");
        const guestIds = getGuestWishlist();

        if (guestIds.length > 0) {
            try {
                const docSnap = await getDoc(wishlistRef);
                const firestoreIds = docSnap.exists() && docSnap.data()?.itemIds ? docSnap.data()!.itemIds : [];
                const mergedIds = Array.from(new Set([...firestoreIds, ...guestIds]));
                await setDoc(wishlistRef, { itemIds: mergedIds }, { merge: true });
                localStorage.removeItem(GUEST_WISHLIST_KEY);
            } catch (error) {
                console.error("Error merging wishlists:", error);
            }
        }

        unsubscribe = onSnapshot(wishlistRef, (docSnap) => {
            setItemIds(docSnap.exists() && docSnap.data()?.itemIds ? docSnap.data()!.itemIds : []);
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
      const wishlistRef = doc(db, "users", user.uid, "wishlist", "current");
      await setDoc(wishlistRef, { itemIds: arrayUnion(productId) }, { merge: true });
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
        const wishlistRef = doc(db, "users", user.uid, "wishlist", "current");
        await updateDoc(wishlistRef, { itemIds: arrayRemove(productId) });
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