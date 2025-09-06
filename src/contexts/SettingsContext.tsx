import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useMemo,
} from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { StoreSettings } from "../types";

interface SettingsContextType {
  settings: StoreSettings | null;
  loading: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

const DEFAULT_LOGO_URL =
  "https://res.cloudinary.com/dolmzcken/image/upload/v1756915579/ml9gwjd3vkqz84ban7lm.png";
const DEFAULT_SETTINGS: StoreSettings = {
  deliveryFee: 500,
  logoUrl: DEFAULT_LOGO_URL,
  storeAddress: "Please configure your store address in the admin panel.",
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, "settings", "store");

    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<StoreSettings>;
          // Ensure all properties have a value to prevent crashes.
          setSettings({
            deliveryFee: data.deliveryFee ?? DEFAULT_SETTINGS.deliveryFee,
            logoUrl: data.logoUrl || DEFAULT_SETTINGS.logoUrl,
            storeAddress: data.storeAddress || DEFAULT_SETTINGS.storeAddress,
          });
        } else {
          setSettings(DEFAULT_SETTINGS);
          console.warn(
            "Store settings not found in Firestore, using default values."
          );
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching store settings:", err);
        setSettings(DEFAULT_SETTINGS); // Fallback on error
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({ settings, loading }), [settings, loading]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
