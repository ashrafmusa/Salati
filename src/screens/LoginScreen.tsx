import React, { useState, useRef, useEffect, useMemo } from 'react';
// FIX: Switched to a namespace import for react-router-dom to fix module resolution errors in the build environment.
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { WarningIcon, UserIcon, PhoneIcon, LockIcon, EmailIcon, EyeIcon, EyeSlashIcon, SpinnerIcon } from '../assets/icons';
import Logo from '../components/Logo';
import OTPInput from '../components/OTPInput';
import { useSettings } from '../contexts/SettingsContext';
import fallbackIllustration from '/login-illustration.svg';

type AuthStep = 'phone' | 'otp' | 'details';
type AuthMethod = 'phone' | 'email';

// Style constants for this screen
const inputFieldClasses = "w-full appearance-none rounded-lg border bg-white dark:bg-slate-700 p-3 pr-10 text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50";
const btnPrimaryClasses = "w-full flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 dark:focus:ring-offset-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-500";


const LoginScreen: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [step, setStep] = useState<AuthStep>('phone');

  // Phone state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Shared state
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user, loginWithEmail, registerWithEmail, signInWithPhone, verifyOTP } = useAuth();
  const { settings } = useSettings();
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  
  const from = (location.state as any)?.from?.pathname || '/';

  const illustrationSrc = useMemo(() => {
    if (settings?.loginIllustrationSvg) {
        try {
            return `data:image/svg+xml;base64,${btoa(settings.loginIllustrationSvg)}`;
        } catch (e) {
            console.error("Error encoding custom SVG, using fallback.", e);
            return fallbackIllustration;
        }
    }
    return fallbackIllustration;
  }, [settings]);
  
  useEffect(() => {
    if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.style.display = (authMethod === 'phone' && step === 'phone') ? 'block' : 'none';
    }
  }, [authMethod, step]);

  useEffect(() => {
    if (user) {
        const isAdminRole = ['super-admin', 'admin', 'sub-admin', 'driver', 'supplier'].includes(user.role);
        
        // If the user has an admin-type role, always redirect to the admin panel.
        if (isAdminRole) {
            window.location.href = './admin.html';
        } else {
            // Otherwise, send them to their intended customer page.
            navigate(from, { replace: true });
        }
    }
  }, [user, from, navigate]);
  
  const validatePhoneNumber = (number: string) => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(number);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!validatePhoneNumber(phone)) {
        newErrors.phone = "رقم الهاتف غير صالح. يجب أن يبدأ بالرمز الدولي (e.g., +249...).";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!recaptchaContainerRef.current) return;

    setLoading(true);
    try {
      await signInWithPhone(phone, recaptchaContainerRef.current.id);
      setStep('otp');
    } catch (err: any) {
      setErrors({ form: err.message || 'فشل إرسال الرمز. يرجى التحقق من الرقم والمحاولة مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (otp.length !== 6) {
        newErrors.otp = "الرجاء إدخال رمز صالح مكون من 6 أرقام.";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const firebaseUser = await verifyOTP(otp);
      if (!firebaseUser) {
        throw new Error("Verification failed. Please try again.");
      }
    } catch (err: any) {
      setErrors({ form: err.message || 'رمز التحقق غير صالح أو انتهت صلاحيته.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "البريد الإلكتروني مطلوب.";
    if (!password) newErrors.password = "كلمة المرور مطلوبة.";
    if (mode === 'signup' && !name) newErrors.name = "الاسم مطلوب.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
    } catch (err: any) {
      const friendlyMessage = (err as any).code === 'auth/invalid-credential' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' :
                              (err as any).code === 'auth/email-already-in-use' ? 'هذا البريد الإلكتروني مستخدم بالفعل.' :
                              'حدث خطأ. يرجى المحاولة مرة أخرى.';
      setErrors({ form: friendlyMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneAuth = () => {
    if (step === 'otp') {
      return (
        <form onSubmit={handleOtpSubmit} className="space-y-6 animate-form-entry">
          <p className="text-center text-slate-600 dark:text-slate-300">
            أدخل الرمز المكون من 6 أرقام الذي تم إرساله إلى <span dir="ltr" className="font-bold">{phone}</span>
          </p>
          <OTPInput value={otp} onChange={setOtp} />
          {errors.otp && <p className="text-red-500 text-xs mt-1 text-center">{errors.otp}</p>}
          <button type="submit" className={btnPrimaryClasses} disabled={loading}>
            {loading ? <SpinnerIcon className="w-5 h-5 animate-spin mx-auto"/> : 'التحقق والمتابعة'}
          </button>
           <button type="button" onClick={() => { setStep('phone'); setErrors({}); }} className="w-full text-center text-sm text-slate-500 hover:underline">
            تغيير الرقم
          </button>
        </form>
      );
    }
    
    return (
      <form onSubmit={handlePhoneSubmit} className="space-y-6 animate-form-entry">
        <div>
          <div className="relative">
            <PhoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
            <input
              type="tel"
              dir="ltr"
              placeholder="رقم الهاتف (e.g., +249...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${inputFieldClasses} ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-slate-600'}`}
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
        <button type="submit" className={btnPrimaryClasses} disabled={loading}>
          {loading ? <SpinnerIcon className="w-5 h-5 animate-spin mx-auto"/> : 'إرسال الرمز'}
        </button>
      </form>
    );
  };
  
  const renderEmailAuth = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-4 animate-form-entry">
      {mode === 'signup' && (
        <div>
          <div className="relative">
            <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
            <input type="text" placeholder="الاسم الكامل" value={name} onChange={e => setName(e.target.value)} className={`${inputFieldClasses} ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-slate-600'}`} required />
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
      )}
      <div>
        <div className="relative">
          <EmailIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
          <input type="email" dir="ltr" placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} className={`${inputFieldClasses} ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-slate-600'}`} required />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>
      <div>
        <div className="relative">
          <LockIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
          <input type={showPassword ? 'text' : 'password'} dir="ltr" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} className={`${inputFieldClasses} ${errors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-slate-600'}`} required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeSlashIcon className="w-5 h-5 text-slate-400"/> : <EyeIcon className="w-5 h-5 text-slate-400"/>}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>
      <button type="submit" className={`${btnPrimaryClasses} mt-6`} disabled={loading}>
        {loading ? <SpinnerIcon className="w-5 h-5 animate-spin mx-auto"/> : (mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب')}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row">
        {/* Illustration Side */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 bg-primary/5 dark:bg-slate-900">
            <img src={illustrationSrc} alt="Salati Shopping Illustration" className="w-full max-w-lg" />
        </div>
        
        {/* Form Side */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md animate-slide-in-up">
                <Logo wrapperClassName="mb-8" imgClassName="w-20" textClassName="text-3xl"/>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border dark:border-slate-700">
                    <h1 className="text-3xl font-bold font-display text-center text-slate-800 dark:text-slate-100 mb-2">
                        {mode === 'login' ? 'مرحباً بعودتك!' : 'إنشاء حساب جديد'}
                    </h1>
                    <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
                        {mode === 'login' ? 'سجل الدخول للمتابعة' : 'انضم إلينا اليوم'}
                    </p>

                    <div className="flex justify-center bg-slate-100 dark:bg-slate-900/50 rounded-lg p-1 mb-6">
                        <button onClick={() => setAuthMethod('phone')} className={`auth-tab ${authMethod === 'phone' ? 'active' : ''}`}>الهاتف</button>
                        <button onClick={() => setAuthMethod('email')} className={`auth-tab ${authMethod === 'email' ? 'active' : ''}`}>البريد الإلكتروني</button>
                    </div>

                    {errors.form && (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 animate-fade-in">
                        <WarningIcon className="w-5 h-5"/>
                        <span>{errors.form}</span>
                        </div>
                    )}

                    {authMethod === 'phone' ? renderPhoneAuth() : renderEmailAuth()}
                    
                    <div ref={recaptchaContainerRef} id="recaptcha-container" className="my-4 flex justify-center"></div>

                    <div className="mt-6 text-center text-sm">
                        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrors({}); }} className="font-semibold text-slate-500 hover:text-primary dark:hover:text-primary-light transition">
                        {mode === 'login' ? 'ليس لديك حساب؟ إنشاء حساب' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LoginScreen;