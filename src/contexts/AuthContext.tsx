import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { auth, db } from "../firebase/config";
import { User } from "../types";

const SUPER_ADMIN_EMAILS = [
  "ashraf0968491090@gmail.com",
  "salahashrf58@gmail.com",
];

// FIX: Replaced v9 types with v8 compat types.
type FirebaseUser = firebase.User;
type ConfirmationResult = firebase.auth.ConfirmationResult;
type RecaptchaVerifier = firebase.auth.RecaptchaVerifier;

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  registerWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  signInWithPhone: (
    phoneNumber: string,
    appVerifier: RecaptchaVerifier
  ) => Promise<void>;
  verifyOTP: (otp: string) => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  updateUserDetails: (details: {
    name: string;
    address: string;
    phone?: string;
  }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // FIX: Refactored onAuthStateChanged to use v8 compat syntax.
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // FIX: Refactored Firestore calls to use v8 compat syntax.
        const userRef = db.collection("users").doc(fbUser.uid);
        const userSnap = await userRef.get();

        if (userSnap.exists) {
          let userData = userSnap.data() as User;
          const isSuperAdminByEmail = fbUser.email
            ? SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(
                fbUser.email.toLowerCase()
              )
            : false;

          if (isSuperAdminByEmail && userData.role !== "super-admin") {
            userData.role = "super-admin";
            // FIX: Refactored Firestore updateDoc call to use v8 compat syntax.
            userRef.update({ role: "super-admin" }).catch((err) => {
              console.error("Failed to self-heal super-admin role:", err);
            });
          }
          setUser({ ...userData, uid: fbUser.uid });
        } else {
          const isSuperAdmin = fbUser.email
            ? SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(
                fbUser.email.toLowerCase()
              )
            : false;

          const newUser: User = {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || "عميل جديد",
            phone: fbUser.phoneNumber,
            role: isSuperAdmin ? "super-admin" : "customer",
          };
          // FIX: Refactored Firestore setDoc call to use v8 compat syntax.
          await userRef.set(newUser);
          setUser(newUser);
          setShowWelcomeModal(true); // Show welcome modal for new users
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const registerWithEmail = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        // FIX: Refactored createUserWithEmailAndPassword to use v8 compat syntax.
        const result = await auth.createUserWithEmailAndPassword(
          email,
          password
        );
        const fbUser = result.user;
        if (!fbUser) throw new Error("User creation failed.");

        // FIX: Refactored updateProfile to use v8 compat syntax.
        await fbUser.updateProfile({ displayName: name });
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    []
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        // FIX: Refactored signInWithEmailAndPassword to use v8 compat syntax.
        await auth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    []
  );

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    try {
      await auth.sendPasswordResetEmail(email);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }, []);

  const signInWithPhone = useCallback(
    async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
      try {
        const confirmation = await auth.signInWithPhoneNumber(
          phoneNumber,
          appVerifier
        );
        setConfirmationResult(confirmation);
      } catch (error) {
        console.error("Error during phone sign-in:", error);
        throw error;
      }
    },
    []
  );

  const verifyOTP = useCallback(
    async (otp: string) => {
      if (!confirmationResult) {
        throw new Error("Confirmation result is not available.");
      }
      try {
        const result = await confirmationResult.confirm(otp);
        return result.user;
      } catch (error) {
        console.error("Invalid OTP", error);
        throw error;
      }
    },
    [confirmationResult]
  );

  const updateUserDetails = useCallback(
    async (details: { name: string; address: string; phone?: string }) => {
      if (!firebaseUser) throw new Error("User not authenticated.");
      // FIX: Refactored Firestore doc call to use v8 compat syntax.
      const userRef = db.collection("users").doc(firebaseUser.uid);

      const updateData: Partial<User> = {
        name: details.name,
        address: details.address,
      };

      if (details.phone) {
        updateData.phone = details.phone;
      }

      // FIX: Refactored Firestore updateDoc call to use v8 compat syntax.
      await userRef.update(updateData);
      setUser((prevUser) => (prevUser ? { ...prevUser, ...updateData } : null));
    },
    [firebaseUser]
  );

  const logout = useCallback(async () => {
    // FIX: Refactored signOut to use v8 compat syntax.
    await auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      showWelcomeModal,
      setShowWelcomeModal,
      registerWithEmail,
      loginWithEmail,
      sendPasswordResetEmail,
      signInWithPhone,
      verifyOTP,
      updateUserDetails,
      logout,
    }),
    [
      user,
      firebaseUser,
      loading,
      showWelcomeModal,
      registerWithEmail,
      loginWithEmail,
      sendPasswordResetEmail,
      signInWithPhone,
      verifyOTP,
      updateUserDetails,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
