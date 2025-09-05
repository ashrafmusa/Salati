import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { WarningIcon, UserIcon, LocationMarkerIcon, PhoneIcon, KeyIcon, EmailIcon, LockIcon, EyeIcon, EyeSlashIcon } from '../assets/icons';
import SalatiLogo from '../components/Logo';

type AuthStep = 'phone' | 'otp' | 'details';
type AuthMethod = 'phone' | 'email';

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
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, loading: authLoading, signInWithPhone, verifyOTP, updateUserDetails, registerWithEmail, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const otpInputRef = useRef<HTMLInputElement>(null);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
        otpInputRef.current.focus();
    }
  }, [step]);
  
  // --- PHONE AUTH HANDLERS ---
  const validatePhone = () => {
    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
        setErrors({ phone: "Please enter a valid phone number in E.164 format (e.g., +249912345678)." });
        return false;
    }
    setErrors({});
    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    setIsLoading(true);
    setErrors({});
    try {
      await signInWithPhone(phone, 'recaptcha-container');
      setStep('otp');
    } catch (error: any) {
      setErrors({ api: "Failed to send verification code. Please check the number or try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
        setErrors({ otp: "Please enter the 6-digit code." });
        return;
    }
    setErrors({});
    setIsLoading(true);
    
    try {
      const fbUser = await verifyOTP(otp);
      if (fbUser) {
        // The AuthContext listener will fetch the user data.
        // We check if the profile is complete on the ProtectedRoute.
        // If it's a signup, force them to the details screen.
        if (mode === 'signup' && (!fbUser.displayName || fbUser.displayName === "عميل جديد")) {
          setStep('details');
        } else {
          // Login successful, navigation is handled by the redirect logic below.
        }
      }
    } catch (err: any) {
        setErrors({ api: err.code === 'auth/invalid-verification-code' ? 'Invalid verification code.' : 'An error occurred.' });
    } finally {
        setIsLoading(false);
    }
  };

  // --- EMAIL AUTH HANDLERS ---
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) {
            setErrors({ name: 'Name is required.'});
            setIsLoading(false);
            return;
        }
        await registerWithEmail(email, password, name);
      }
    } catch (error: any) {
      let message = 'An unknown error occurred.';
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-email': message = 'Please enter a valid email address.'; break;
          case 'auth/user-not-found': case 'auth/invalid-credential': message = 'Invalid email or password.'; break;
          case 'auth/wrong-password': message = 'Incorrect password. Please try again.'; break;
          case 'auth/email-already-in-use': message = 'An account with this email already exists.'; break;
          case 'auth/weak-password': message = 'Password should be at least 6 characters.'; break;
          default: message = "Authentication failed. Please try again.";
        }
      }
      setErrors({ api: message });
    } finally {
      setIsLoading(false);
    }
  };


  const handleDetailsSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: { [key: string]: string } = {};
      if (!name.trim()) newErrors.name = "Full name is required.";
      if (!address.trim()) newErrors.address = "Address is required.";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setIsLoading(true);
      try {
        await updateUserDetails({ name, address });
        // Redirect is handled by the effect below
      } catch (err: any) {
        setErrors({ api: err.message || 'An unexpected error occurred.' });
      } finally {
        setIsLoading(false);
      }
  };
  
  if (authLoading) {
    return <div className="login-container min-h-screen"></div>;
  }
  
  if (user) {
    if (user.role === 'admin') {
        window.location.href = './admin.html';
        return null; 
    }
    // For new users, profile completion is enforced by ProtectedRoute
    return <Navigate to={from} replace />;
  }

  const renderPhoneForm = () => {
    switch (step) {
      case 'otp':
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-center text-gray-300 text-sm">
                Enter the code sent to <span dir="ltr" className="font-semibold">{phone}</span>.
                <button type="button" onClick={() => setStep('phone')} className="text-primary hover:underline font-bold mr-2">Change</button>
            </p>
            <div>
              <div dir="ltr" className={`flex items-center electro-input rounded-md overflow-hidden ${errors.otp ? 'error' : ''}`}>
                <span className="pl-4 text-gray-400"><KeyIcon className="w-5 h-5"/></span>
                <input ref={otpInputRef} type="tel" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} placeholder="XXXXXX" maxLength={6} className="bg-transparent w-full px-3 py-3 focus:outline-none tracking-[1em] text-center" required />
              </div>
              {errors.otp && <p className="text-red-400 text-xs mt-1 px-1">{errors.otp}</p>}
            </div>
            <button type="submit" className="electro-button w-full py-3 rounded-md flex justify-center items-center" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        );
      case 'details':
        return (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
             <p className="text-center text-gray-300 text-sm">Phone number verified! Just a few more details to create your account.</p>
             <div>
              <div className={`flex items-center electro-input rounded-md overflow-hidden ${errors.name ? 'error' : ''}`}>
                 <span className="pl-4 text-gray-400"><UserIcon className="w-5 h-5"/></span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="bg-transparent w-full px-3 py-3 focus:outline-none" required />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1 px-1">{errors.name}</p>}
            </div>
            <div>
              <div className={`flex items-center electro-input rounded-md overflow-hidden ${errors.address ? 'error' : ''}`}>
                 <span className="pl-4 text-gray-400"><LocationMarkerIcon className="w-5 h-5"/></span>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Detailed Address" className="bg-transparent w-full px-3 py-3 focus:outline-none" required />
              </div>
              {errors.address && <p className="text-red-400 text-xs mt-1 px-1">{errors.address}</p>}
            </div>
             <button type="submit" className="electro-button w-full py-3 rounded-md flex justify-center items-center" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        );
      case 'phone':
      default:
        return (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <div dir="ltr" className={`flex items-center electro-input rounded-md overflow-hidden ${errors.phone ? 'error' : ''}`}>
                 <span className="pl-4 text-gray-400"><PhoneIcon className="w-5 h-5"/></span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+249XXXXXXXXX" className="bg-transparent w-full px-3 py-3 focus:outline-none" required />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1 px-1">{errors.phone}</p>}
            </div>
            <button type="submit" className="electro-button w-full py-3 rounded-md flex justify-center items-center" disabled={isLoading}>
              {isLoading ? 'Sending...' : (mode === 'login' ? 'Login' : 'Sign Up')}
            </button>
          </form>
        );
    }
  };

  const renderEmailForm = () => (
    <form onSubmit={handleEmailAuth} className="space-y-6">
        {mode === 'signup' && (
            <div>
                <div className={`flex items-center electro-input rounded-md overflow-hidden ${errors.name ? 'error' : ''}`}>
                    <span className="pl-4 text-gray-400"><UserIcon className="w-5 h-5" /></span>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="bg-transparent w-full px-3 py-3 focus:outline-none" required />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1 px-1">{errors.name}</p>}
            </div>
        )}
        <div>
            <div dir="ltr" className={`flex items-center electro-input rounded-md overflow-hidden ${errors.email ? 'error' : ''}`}>
                <span className="pl-4 text-gray-400"><EmailIcon className="w-5 h-5" /></span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="bg-transparent w-full px-3 py-3 focus:outline-none" required />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1 px-1">{errors.email}</p>}
        </div>
        <div>
            <div dir="ltr" className={`flex items-center electro-input rounded-md overflow-hidden ${errors.password ? 'error' : ''}`}>
                <span className="pl-4 text-gray-400"><LockIcon className="w-5 h-5" /></span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="bg-transparent w-full px-3 py-3 focus:outline-none" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-4 text-gray-400">
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1 px-1">{errors.password}</p>}
        </div>
        <button type="submit" className="electro-button w-full py-3 rounded-md flex justify-center items-center" disabled={isLoading}>
            {isLoading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Sign Up')}
        </button>
    </form>
  );

  return (
    <div className="login-container flex items-center justify-center min-h-screen p-4 font-sans">
      <div id="recaptcha-container"></div>
      <div className="login-form w-full max-w-md">
        <div className="form-content p-8 md:p-12 text-white">
          <div className="text-center mb-8">
            <SalatiLogo className="w-64 h-auto mx-auto filter drop-shadow-[0_0_15px_rgba(34,197,94,0.7)]" />
            <p className="text-gray-300 mt-4">مرحباً بك في عالم التسوق السهل</p>
          </div>

          {errors.api && (
            <div className="error-box">
                <WarningIcon className="w-6 h-6 flex-shrink-0" />
                <span>{errors.api}</span>
            </div>
          )}
          
          <div className="flex border-b border-gray-700 mb-6">
            <button onClick={() => setMode('login')} className={`w-1/2 py-3 text-sm font-bold uppercase tracking-wider transition-colors duration-200 focus:outline-none ${mode === 'login' ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-gray-200'}`}>
              تسجيل الدخول
            </button>
            <button onClick={() => setMode('signup')} className={`w-1/2 py-3 text-sm font-bold uppercase tracking-wider transition-colors duration-200 focus:outline-none ${mode === 'signup' ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-gray-200'}`}>
              إنشاء حساب
            </button>
          </div>

          <div className="flex justify-center items-center bg-gray-900/50 rounded-full p-1 mb-6">
              <button onClick={() => setAuthMethod('phone')} className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-all ${authMethod === 'phone' ? 'bg-primary text-white shadow' : 'text-gray-300'}`}>
                  عبر الهاتف
              </button>
              <button onClick={() => setAuthMethod('email')} className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-all ${authMethod === 'email' ? 'bg-primary text-white shadow' : 'text-gray-300'}`}>
                  عبر الإيميل
              </button>
          </div>
          
          {authMethod === 'phone' ? renderPhoneForm() : renderEmailForm()}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;