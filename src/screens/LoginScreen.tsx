import React, { useState, useRef, useEffect, useMemo } from "react";
// FIX: Corrected react-router-dom import to fix module resolution issue by using a namespace import and destructuring. This can resolve issues where named exports are not correctly recognized by the build tool.
import * as ReactRouterDOM from "react-router-dom";
const { useNavigate, useLocation, Link } = ReactRouterDOM;
import { useAuth } from "../hooks/useAuth";
import {
  WarningIcon,
  UserIcon,
  PhoneIcon,
  LockIcon,
  EmailIcon,
  EyeIcon,
  EyeSlashIcon,
  SpinnerIcon,
} from "../assets/icons";
import Logo from "../components/Logo";
import OTPInput from "../components/OTPInput";
import { useSettings } from "../contexts/SettingsContext";
import fallbackIllustration from "/login-illustration.svg";
import firebase from "firebase/compat/app";
import "firebase/compat/auth"; // Import auth compat for RecaptchaVerifier
import PasswordResetModal from "../components/PasswordResetModal";
import { useToast } from "../contexts/ToastContext";
import { auth } from "../firebase/config";

type AuthStep = "phone" | "otp" | "details";
type AuthMethod = "phone" | "email";

// Style constants for this screen
const inputFieldClasses =
  "w-full appearance-none rounded-lg border bg-white dark:bg-slate-700 p-3 pr-10 text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50";
const btnPrimaryClasses =
  "w-full flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 dark:focus:ring-offset-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-500";

const LoginScreen: React.FC = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  const [step, setStep] = useState<AuthStep>("phone");

  // Phone state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Shared state
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    user,
    loginWithEmail,
    registerWithEmail,
    signInWithPhone,
    verifyOTP,
    sendPasswordResetEmail,
  } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<firebase.auth.RecaptchaVerifier | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/";

  const illustrationSrc = useMemo(() => {
    if (settings?.loginIllustrationSvg) {
      try {
        return `data:image/svg+xml;base64,${btoa(
          settings.loginIllustrationSvg
        )}`;
      } catch (e) {
        console.error("Error encoding custom SVG, using fallback.", e);
        return fallbackIllustration;
      }
    }
    return fallbackIllustration;
  }, [settings]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const isAdminRole = [
        "super-admin",
        "admin",
        "sub-admin",
        "driver",
        "supplier",
      ].includes(user.role);

      if (isAdminRole) {
        window.location.href = "./admin.html";
      } else {
        navigate(from, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, from]);

  // Setup reCAPTCHA verifier
  useEffect(() => {
    if (
      authMethod === "phone" &&
      recaptchaContainerRef.current &&
      !verifierRef.current
    ) {
      // FIX: Corrected RecaptchaVerifier instantiation to align with Firebase v8 compat library, which takes the container element as the first argument and an optional parameters object as the second. The 'auth' object is not passed directly.
      verifierRef.current = new firebase.auth.RecaptchaVerifier(
        recaptchaContainerRef.current,
        {
          size: "invisible",
          callback: () => {
            /* reCAPTCHA solved */
          },
        }
      );
      verifierRef.current.render();
    }
  }, [authMethod]);

  const validate = (fieldName?: string): boolean => {
    const newErrors: Record<string, string> = {};

    if (authMethod === "phone") {
      if (step === "phone" && (!fieldName || fieldName === "phone")) {
        if (!/^\+[1-9]\d{1,14}$/.test(phone))
          newErrors.phone =
            "الرجاء إدخال رقم هاتف صالح بالصيغة الدولية (e.g., +249...).";
      }
      if (step === "otp" && (!fieldName || fieldName === "otp")) {
        if (otp.length !== 6) newErrors.otp = "يجب أن يتكون الرمز من 6 أرقام.";
      }
    } else {
      // email method
      if (mode === "signup" && (!fieldName || fieldName === "name")) {
        if (!name.trim()) newErrors.name = "الاسم مطلوب.";
      }
      if (!fieldName || fieldName === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          newErrors.email = "الرجاء إدخال بريد إلكتروني صالح.";
      }
      if (!fieldName || fieldName === "password") {
        if (password.length < 6)
          newErrors.password = "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate("phone")) return;
    setLoading(true);
    setErrors({});
    try {
      if (!verifierRef.current)
        throw new Error("Recaptcha verifier not initialized.");
      await signInWithPhone(phone, verifierRef.current);
      setStep("otp");
    } catch (error: any) {
      setErrors({
        api: error.message || "فشل إرسال الرمز. الرجاء المحاولة مرة أخرى.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate("otp")) return;
    setLoading(true);
    setErrors({});
    try {
      await verifyOTP(otp);
    } catch (error: any) {
      setErrors({ api: "الرمز غير صحيح. الرجاء المحاولة مرة أخرى." });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
    } catch (error: any) {
      let message = "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.";
      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
            message = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
            break;
          case "auth/email-already-in-use":
            message = "هذا البريد الإلكتروني مسجل بالفعل.";
            break;
          default:
            message = "فشل تسجيل الدخول. الرجاء التحقق من اتصالك بالإنترنت.";
        }
      }
      setErrors({ api: message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (resetEmail: string) => {
    await sendPasswordResetEmail(resetEmail);
    showToast(
      `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${resetEmail}`,
      "success"
    );
  };

  const AuthMethodToggle = () => (
    <div className="flex justify-center mb-6">
      <div className="relative flex w-full max-w-xs p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <div
          className={`absolute top-1 h-10 w-1/2 bg-white dark:bg-slate-700 rounded-md shadow-sm transition-transform duration-300 ease-in-out ${
            authMethod === "phone" ? "translate-x-0" : "translate-x-full"
          }`}
        />
        <button
          onClick={() => setAuthMethod("phone")}
          className="relative z-10 w-1/2 py-2 text-center font-semibold"
        >
          بالهاتف
        </button>
        <button
          onClick={() => setAuthMethod("email")}
          className="relative z-10 w-1/2 py-2 text-center font-semibold"
        >
          بالإيميل
        </button>
      </div>
    </div>
  );

  const FormHeader = () => (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        {mode === "login" ? "مرحباً بعودتك!" : "إنشاء حساب جديد"}
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        {mode === "login"
          ? "سجل الدخول للمتابعة إلى سـلـتـي."
          : "انضم إلينا اليوم وابدأ التسوق."}
      </p>
    </div>
  );

  const hasApiError = errors.api;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row">
      <div className="hidden md:block md:w-1/2 lg:w-2/5 xl:w-1/3 p-8">
        <div className="h-full flex flex-col justify-between">
          <Logo imgClassName="w-20" textClassName="text-3xl" />
          <img
            src={illustrationSrc}
            alt="Shopping illustration"
            className="w-full max-w-sm mx-auto"
          />
          <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
            © {new Date().getFullYear()} Salati. All Rights Reserved.
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 lg:w-3/5 xl:w-2/3 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-form-entry">
          <FormHeader />
          <AuthMethodToggle />

          {hasApiError && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 flex items-center gap-2">
              <WarningIcon className="w-5 h-5" />
              <span>{errors.api}</span>
            </div>
          )}

          {authMethod === "phone" && (
            <form
              onSubmit={step === "phone" ? handlePhoneSubmit : handleOtpSubmit}
            >
              {step === "phone" && (
                <div className="space-y-4">
                  <div className="relative">
                    <PhoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="رقم الهاتف (e.g., +249...)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`${inputFieldClasses} ${
                        errors.phone
                          ? "border-red-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm">{errors.phone}</p>
                  )}
                  <button
                    type="submit"
                    className={btnPrimaryClasses}
                    disabled={loading}
                  >
                    {loading ? (
                      <SpinnerIcon className="w-6 h-6 animate-spin" />
                    ) : (
                      "إرسال الرمز"
                    )}
                  </button>
                </div>
              )}
              {step === "otp" && (
                <div className="space-y-4">
                  <p className="text-center text-slate-600 dark:text-slate-300">
                    أدخل الرمز المكون من 6 أرقام الذي تم إرساله إلى{" "}
                    <span dir="ltr" className="font-bold">
                      {phone}
                    </span>
                    .
                  </p>
                  <OTPInput value={otp} onChange={setOtp} />
                  {errors.otp && (
                    <p className="text-red-500 text-sm text-center">
                      {errors.otp}
                    </p>
                  )}
                  <button
                    type="submit"
                    className={btnPrimaryClasses}
                    disabled={loading}
                  >
                    {loading ? (
                      <SpinnerIcon className="w-6 h-6 animate-spin" />
                    ) : (
                      "تحقق"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="text-sm text-center w-full mt-2 text-slate-500 hover:text-primary"
                  >
                    تغيير الرقم
                  </button>
                </div>
              )}
            </form>
          )}

          {authMethod === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputFieldClasses} ${
                      errors.name
                        ? "border-red-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  />
                </div>
              )}
              <div className="relative">
                <EmailIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  dir="ltr"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputFieldClasses} ${
                    errors.email
                      ? "border-red-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                />
              </div>
              <div className="relative">
                <LockIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputFieldClasses} ${
                    errors.password
                      ? "border-red-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-slate-400" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
              {Object.values(errors)
                .filter((e) => e && e !== errors.api)
                .map((err, i) => (
                  <p key={i} className="text-red-500 text-sm">
                    {err}
                  </p>
                ))}

              {mode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(true)}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    هل نسيت كلمة المرور؟
                  </button>
                </div>
              )}

              <button
                type="submit"
                className={btnPrimaryClasses}
                disabled={loading}
              >
                {loading ? (
                  <SpinnerIcon className="w-6 h-6 animate-spin" />
                ) : mode === "login" ? (
                  "تسجيل الدخول"
                ) : (
                  "إنشاء حساب"
                )}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-slate-600 dark:text-slate-300">
            {mode === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setErrors({});
              }}
              className="font-semibold text-primary hover:underline mr-2"
            >
              {mode === "login" ? "أنشئ حساباً" : "سجل الدخول"}
            </button>
          </p>
        </div>
      </div>

      {/* Hidden recaptcha container */}
      <div ref={recaptchaContainerRef}></div>

      <PasswordResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSend={handleSendResetEmail}
      />
    </div>
  );
};

export default LoginScreen;
