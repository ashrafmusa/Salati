import React, { createContext, useState, useEffect, ReactNode, useContext, useMemo } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from "firebase/firestore";
import { StoreSettings } from '../types';

interface SettingsContextType {
  settings: StoreSettings | null;
  loading: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'store');
    
    const unsubscribe = onSnapshot(settingsRef, docSnap => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as StoreSettings);
      } else {
        setSettings({ deliveryFee: 500 }); // Default value
        console.warn("Store settings not found in Firestore, using default values.");
      }
      setLoading(false);
    }, err => {
      console.error("Error fetching store settings:", err);
      setSettings({ deliveryFee: 500 }); // Fallback on error
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({ settings, loading }), [settings, loading]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
