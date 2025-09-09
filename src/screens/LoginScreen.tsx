import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { WarningIcon, UserIcon, PhoneIcon, LockIcon, EmailIcon, EyeIcon, EyeSlashIcon, SpinnerIcon } from '../assets/icons';
import Logo from '../components/Logo';
import OTPInput from '../components/OTPInput';

type AuthStep = 'phone' | 'otp' | 'details';
type AuthMethod = 'phone' | 'email';

// Style constants for this screen
const inputFieldClasses = "w-full appearance-none rounded-lg border bg-white dark:bg-slate-700 p-3 pr-10 text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-sm transition-colors duration-200 border-slate-300 dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50";
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
  const [error, setError] = useState('');
  
  const { user, loginWithEmail, registerWithEmail, signInWithPhone, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  
  const from = location.state?.from?.pathname || '/';
  
  useEffect(() => {
    if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.style.display = (authMethod === 'phone' && step === 'phone') ? 'block' : 'none';
    }
  }, [authMethod, step]);

  if (user) {
    return <Navigate to={from} replace />;
  }
  
  const validatePhoneNumber = (number: string) => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(number);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhoneNumber(phone)) {
        setError("رقم الهاتف غير صالح. يجب أن يبدأ بالرمز الدولي (e.g., +249...).");
        return;
    }
    if (!recaptchaContainerRef.current) return;
    setError('');
    setLoading(true);
    try {
      await signInWithPhone(phone, recaptchaContainerRef.current.id);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'فشل إرسال الرمز. يرجى التحقق من الرقم والمحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
        setError("Please enter a valid 6-digit OTP.");
        return;
    }
    setError('');
    setLoading(true);
    try {
      const firebaseUser = await verifyOTP(otp);
      if (!firebaseUser) {
        throw new Error("Verification failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || 'رمز التحقق غير صالح أو انتهت صلاحيته.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'signup' && !name)) {
      setError("Please fill in all required fields.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
    } catch (err: any) {
      const friendlyMessage = err.code === 'auth/invalid-credential' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' :
                              err.code === 'auth/email-already-in-use' ? 'هذا البريد الإلكتروني مستخدم بالفعل.' :
                              'حدث خطأ. يرجى المحاولة مرة أخرى.';
      setError(friendlyMessage);
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
          <button type="submit" className={btnPrimaryClasses} disabled={loading}>
            {loading ? <SpinnerIcon className="w-5 h-5 animate-spin mx-auto"/> : 'التحقق والمتابعة'}
          </button>
           <button type="button" onClick={() => { setStep('phone'); setError(''); }} className="w-full text-center text-sm text-slate-500 hover:underline">
            تغيير الرقم
          </button>
        </form>
      );
    }
    
    return (
      <form onSubmit={handlePhoneSubmit} className="space-y-6 animate-form-entry">
        <div className="relative">
          <PhoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
          <input
            type="tel"
            dir="ltr"
            placeholder="رقم الهاتف (e.g., +249...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputFieldClasses}
          />
        </div>
        <button type="submit" className={btnPrimaryClasses} disabled={loading}>
          {loading ? <SpinnerIcon className="w-5 h-5 animate-spin mx-auto"/> : 'إرسال الرمز'}
        </button>
      </form>
    );
  };
  
  const renderEmailAuth = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-6 animate-form-entry">
      {mode === 'signup' && (
        <div className="relative">
          <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
          <input type="text" placeholder="الاسم الكامل" value={name} onChange={e => setName(e.target.value)} className={inputFieldClasses} required />
        </div>
      )}
      <div className="relative">
        <EmailIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
        <input type="email" dir="ltr" placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} className={inputFieldClasses} required />
      </div>
      <div className="relative">
        <LockIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
        <input type={showPassword ? 'text' : 'password'} dir="ltr" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} className={inputFieldClasses} required />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2">
            {showPassword ? <EyeSlashIcon className="w-5 h-5 text-slate-400"/> : <EyeIcon className="w-5 h-5 text-slate-400"/>}
        </button>
      </div>
      <button type="submit" className={btnPrimaryClasses} disabled={loading}>
        {loading ? <SpinnerIcon className="w-5 h-5 animate-spin mx-auto"/> : (mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب')}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row">
        {/* Illustration Side */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 bg-primary/5 dark:bg-slate-900">
            <img src="/login-illustration.svg" alt="Salati Shopping Illustration" className="w-full max-w-lg" />
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

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 animate-fade-in">
                        <WarningIcon className="w-5 h-5"/>
                        <span>{error}</span>
                        </div>
                    )}

                    {authMethod === 'phone' ? renderPhoneAuth() : renderEmailAuth()}
                    
                    <div ref={recaptchaContainerRef} id="recaptcha-container" className="my-4 flex justify-center"></div>

                    <div className="mt-6 text-center text-sm">
                        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} className="font-semibold text-slate-500 hover:text-primary dark:hover:text-primary-light transition">
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
