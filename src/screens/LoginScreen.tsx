import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { WarningIcon, UserIcon, LocationMarkerIcon, PhoneIcon, KeyIcon, EmailIcon, LockIcon, EyeIcon, EyeSlashIcon, SpinnerIcon } from '../assets/icons';
import Logo from '../components/Logo';
import OTPInput from '../components/OTPInput';

type AuthStep = 'phone' | 'otp' | 'details';
type AuthMethod = 'phone' | 'email';

export const LoginScreen: React.FC = () => {
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
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, loginWithEmail, registerWithEmail, signInWithPhone, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  
  const from = location.state?.from?.pathname || '/';
  
  useEffect(() => {
    // Hide the reCAPTCHA container when it's not needed.
    if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.style.display = (authMethod === 'phone' && step === 'phone') ? 'block' : 'none';
    }
  }, [authMethod, step]);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaContainerRef.current || !phone) return;
    setError('');
    setLoading(true);
    try {
      await signInWithPhone(phone, recaptchaContainerRef.current.id);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check the number and try again.');
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
      // If the user has a name, they are an existing user.
      // The onAuthStateChanged listener will redirect them.
      // If it's a new user, prompt for details.
      if (!firebaseUser?.displayName) {
          setStep('details');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        if (mode === 'login') {
            await loginWithEmail(email, password);
        } else {
            await registerWithEmail(email, password, name);
        }
        // Redirect will be handled by the auth listener
    } catch (err: any) {
        setError(err.message || `Failed to ${mode}. Please check your credentials.`);
    } finally {
        setLoading(false);
    }
  };

  const resetFormState = () => {
    setError('');
    setPhone('');
    setOtp('');
    setEmail('');
    setPassword('');
    setName('');
    setStep('phone');
  };

  const handleAuthMethodChange = (method: AuthMethod) => {
    setAuthMethod(method);
    resetFormState();
  };
  
  const handleModeChange = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    resetFormState();
  };

  const renderPhoneForm = () => {
      switch (step) {
          case 'phone':
              return (
                  <form onSubmit={handlePhoneSubmit} className="space-y-6">
                      <div className="relative">
                          <PhoneIcon className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2"/>
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الهاتف (e.g., +249...)" dir="ltr" className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary transition bg-slate-50 dark:bg-slate-800" required/>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-secondary transition-colors disabled:bg-slate-400 flex justify-center items-center">
                          {loading ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : 'إرسال الرمز'}
                      </button>
                  </form>
              );
          case 'otp':
              return (
                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                      <p className="text-center text-slate-600 dark:text-slate-300">أدخل الرمز المكون من 6 أرقام الذي تم إرساله إلى <span dir="ltr" className="font-bold text-slate-800 dark:text-slate-100">{phone}</span>.</p>
                      <OTPInput value={otp} onChange={setOtp} />
                      <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-secondary transition-colors disabled:bg-slate-400 flex justify-center items-center">
                          {loading ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : 'تأكيد الرمز'}
                      </button>
                      <button onClick={() => setStep('phone')} type="button" className="text-sm text-slate-500 hover:underline text-center w-full">تغيير الرقم</button>
                  </form>
              )
          default: return null;
      }
  }
  
  const renderEmailForm = () => (
      <form onSubmit={handleEmailSubmit} className="space-y-6">
          {mode === 'signup' && (
              <div className="relative">
                  <UserIcon className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2"/>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الكامل" className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary transition bg-slate-50 dark:bg-slate-800" required/>
              </div>
          )}
          <div className="relative">
              <EmailIcon className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2"/>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" dir="ltr" className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary transition bg-slate-50 dark:bg-slate-800" required/>
          </div>
          <div className="relative">
              <LockIcon className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2"/>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" dir="ltr" className="w-full pl-12 pr-12 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary transition bg-slate-50 dark:bg-slate-800" required/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
              </button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-secondary transition-colors disabled:bg-slate-400 flex justify-center items-center">
              {loading ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : (mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب')}
          </button>
      </form>
  )
  
  const Tab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`flex-1 py-3 text-center font-bold transition-colors duration-300 rounded-t-lg border-b-2 ${active ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200'}`}>
        {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-warmBeige dark:bg-slate-950 flex animate-fade-in">
      <div id="recaptcha-container-id" ref={recaptchaContainerRef}></div>
      
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Branding Panel (visible on large screens and up) */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-cover bg-center" style={{backgroundImage: "url('https://res.cloudinary.com/dolmzcken/image/upload/v1756915579/pkvgg5q6i3n1g1vyurcn.png')"}}>
            <div className="w-full max-w-sm bg-black/30 backdrop-blur-md p-10 rounded-2xl shadow-2xl">
                <Logo
                    imgClassName="w-48"
                    textClassName="text-5xl text-white"
                />
            </div>
        </div>
        
        {/* Form Panel */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-12 animate-form-entry">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8">
                <Logo
                    imgClassName="w-24 mx-auto"
                    textClassName="text-4xl text-center"
                />
            </div>
          
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border dark:border-slate-800">
                <div className="flex border-b dark:border-slate-700 mb-6">
                    <Tab active={mode === 'login'} onClick={() => handleModeChange('login')}>تسجيل الدخول</Tab>
                    <Tab active={mode === 'signup'} onClick={() => handleModeChange('signup')}>حساب جديد</Tab>
                </div>
                
                <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
                    {mode === 'login' ? 'مرحباً بعودتك!' : 'انضم إلينا'}
                </h2>
                <p className="text-slate-500 text-center mb-6">
                    {mode === 'login' ? 'سجل دخولك للمتابعة' : 'أنشئ حسابك لبدء التسوق'}
                </p>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg mb-4 flex items-start text-red-700 dark:text-red-300">
                        <WarningIcon className="w-5 h-5 ml-2 flex-shrink-0 mt-0.5"/>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                
                <div className="flex items-center justify-center gap-4 mb-6">
                    <button onClick={() => handleAuthMethodChange('phone')} className={`px-4 py-2 text-sm rounded-full font-semibold transition ${authMethod === 'phone' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>باستخدام الهاتف</button>
                    <button onClick={() => handleAuthMethodChange('email')} className={`px-4 py-2 text-sm rounded-full font-semibold transition ${authMethod === 'email' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>باستخدام الإيميل</button>
                </div>

                {authMethod === 'phone' ? renderPhoneForm() : renderEmailForm()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};