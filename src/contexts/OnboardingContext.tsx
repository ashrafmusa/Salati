import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useContext,
  useMemo,
} from "react";

interface OnboardingContextType {
  isGuideActive: boolean;
  startGuide: () => void;
  finishGuide: () => void;
  hasSeenGuide: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

const ONBOARDING_KEY = "salatiHasSeenOnboarding";

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [hasSeenGuide] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [isGuideActive, setIsGuideActive] = useState(false);

  const startGuide = useCallback(() => {
    setIsGuideActive(true);
  }, []);

  const finishGuide = useCallback(() => {
    setIsGuideActive(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch (error) {
      console.error("Failed to save onboarding status to localStorage:", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      isGuideActive,
      startGuide,
      finishGuide,
      hasSeenGuide,
    }),
    [isGuideActive, startGuide, finishGuide, hasSeenGuide]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
