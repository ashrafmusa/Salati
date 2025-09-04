import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import { 
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    User as FirebaseUser,
    ConfirmationResult
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { User } from "../types";

// The Super Admin has full permissions and is defined by their email.
const SUPER_ADMIN_EMAILS = ["ashraf0968491090@gmail.com", "salahashrf58@gmail.com"];

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  registerWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (
    phoneNumber: string,
    recaptchaContainerId: string
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userRef = doc(db, "users", fbUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          let userData = userSnap.data() as User;
          const isSuperAdminByEmail = fbUser.email ? SUPER_ADMIN_EMAILS.includes(fbUser.email) : false;
          
          if (isSuperAdminByEmail && userData.role !== 'super-admin') {
            userData.role = 'super-admin';
            updateDoc(userRef, { role: 'super-admin' }).catch(err => {
              console.error("Failed to self-heal super-admin role:", err);
            });
          }
          setUser({ ...userData, uid: fbUser.uid });

        } else {
          const isSuperAdmin = fbUser.email ? SUPER_ADMIN_EMAILS.includes(fbUser.email) : false;
          
          const newUser: User = {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || "عميل جديد",
            phone: fbUser.phoneNumber,
            role: isSuperAdmin ? "super-admin" : "customer",
          };
          await setDoc(userRef, newUser);
          setUser(newUser);
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
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = result.user;
        if (!fbUser) throw new Error("User creation failed.");

        await updateProfile(fbUser, { displayName: name });
        
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    []
  );

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }, []);

  const signInWithPhone = useCallback(
    async (phoneNumber: string, recaptchaContainerId: string) => {
      try {
        if ((window as any).grecaptcha) {
          (window as any).grecaptcha.reset();
        }
        const appVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
            'size': 'invisible'
        });
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
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
      const userRef = doc(db, "users", firebaseUser.uid);
      
      const updateData: { name: string; address: string; phone?: string; } = {
        name: details.name,
        address: details.address,
      };

      if (details.phone) {
        updateData.phone = details.phone;
      }

      await updateDoc(userRef, updateData);
      setUser((prevUser) => (prevUser ? { ...prevUser, ...updateData } : null));
    },
    [firebaseUser]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      registerWithEmail,
      loginWithEmail,
      signInWithPhone,
      verifyOTP,
      updateUserDetails,
      logout,
    }),
    [
      user,
      firebaseUser,
      loading,
      registerWithEmail,
      loginWithEmail,
      signInWithPhone,
      verifyOTP,
      updateUserDetails,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
