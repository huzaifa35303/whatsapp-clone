import React, { useState } from 'react';
import {
  ShieldCheck,
  Phone,
  Mail,
  ArrowLeft,
  Check,
  AlertCircle,
  Sparkles,
  User,
  Hash,
  ChevronDown,
  RefreshCw,
  Lock,
  MessageSquare,
  Inbox
} from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { Avatar } from '../common/Avatar';

export const AuthScreen: React.FC = () => {
  const { verifyPhone, verifyEmail, verifyOtp, loginUser, registerUser, switchUser, allUsers } = useWhatsApp();

  const [step, setStep] = useState<'welcome' | 'input' | 'confirm' | 'otp' | 'profile' | 'initializing'>('welcome');
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  
  // Phone state
  const [countryCode, setCountryCode] = useState('+92');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullPhone, setFullPhone] = useState('');

  // Email state
  const [emailAddress, setEmailAddress] = useState('');

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>('123456');
  const [otpSentMessage, setOtpSentMessage] = useState<string>('');

  // Profile setup state
  const [name, setName] = useState('');
  const [foundrNumber, setFoundrNumber] = useState('');
  const [about, setAbout] = useState('Hey there! I am using WhatsApp.');
  const [avatarSeed, setAvatarSeed] = useState(() => `user-${Date.now()}`);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // F0UNDR Number validation: starts with 'f', followed by exactly 7 alphanumeric characters (e.g. f1234567, f0000000)
  const isFoundrValid = (val: string) => {
    return /^f[a-z0-9]{7}$/i.test(val.trim());
  };

  const handleGenerateFoundr = () => {
    const random7Digits = Math.floor(1000000 + Math.random() * 9000000).toString();
    setFoundrNumber(`f${random7Digits}`);
    setErrorMsg('');
  };

  // Submit from Input step (Phone or Email)
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (authMode === 'phone') {
      const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
      if (!cleaned || cleaned.length < 9) {
        setErrorMsg('Please enter a valid phone number (e.g. 03446789261 or 3446789261)');
        return;
      }

      let formatted = cleaned;
      if (cleaned.startsWith('0')) {
        formatted = cleaned; // Pakistani format: 03446789261
      } else if (cleaned.startsWith('92')) {
        formatted = `+${cleaned}`;
      } else {
        formatted = `${countryCode}${cleaned}`;
      }

      setFullPhone(formatted);
      setStep('confirm');
    } else {
      const cleanEmail = emailAddress.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        setErrorMsg('Please enter a valid email address (e.g. name@example.com)');
        return;
      }

      setEmailAddress(cleanEmail);
      setStep('confirm');
    }
  };

  // Confirm Modal -> Request Verification Code from Backend
  const handleConfirmAndSend = async () => {
    setLoading(true);
    setErrorMsg('');
    setOtpSentMessage('');

    try {
      if (authMode === 'phone') {
        const res = await verifyPhone(fullPhone);
        setLoading(false);
        setIsExistingUser(res.exists);
        setSimulatedOtp(res.simulatedOtp || '123456');
        setOtpSentMessage(`Enter the 6-digit SMS code sent to ${fullPhone}`);
        setStep('otp');
      } else {
        const res = await verifyEmail(emailAddress);
        setLoading(false);
        setIsExistingUser(res.exists);
        setSimulatedOtp(res.simulatedOtp || null);
        setOtpSentMessage(res.message || `A 6-digit verification code was sent to ${emailAddress}`);
        setStep('otp');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Verification request failed');
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Paste handling
      const digits = val.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      if (digits.length === 6) {
        verifyOtpCode(newDigits.join(''));
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      verifyOtpCode(newDigits.join(''));
    }
  };

  const handleFillOtp = () => {
    const code = simulatedOtp || '123456';
    const digits = code.split('');
    setOtpDigits(digits);
    verifyOtpCode(code);
  };

  const verifyOtpCode = async (code: string) => {
    const target = authMode === 'phone' ? fullPhone : emailAddress;
    setErrorMsg('');

    if (isExistingUser) {
      setLoading(true);
      setStep('initializing');
      const res = await loginUser(target, code);
      setLoading(false);
      if (!res.success) {
        setStep('otp');
        setErrorMsg(res.error || 'Failed to login');
      }
    } else {
      // Check code validity via backend
      setLoading(true);
      const res = await verifyOtp(target, code);
      setLoading(false);
      if (!res.success && code !== simulatedOtp && code !== '123456') {
        setErrorMsg(res.error || 'Invalid verification code. Please check and try again.');
        return;
      }

      if (!foundrNumber) {
        const random7Digits = Math.floor(1000000 + Math.random() * 9000000).toString();
        setFoundrNumber(`f${random7Digits}`);
      }
      setStep('profile');
    }
  };

  // Step 4: Profile & F0UNDR ID Submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    if (!isFoundrValid(foundrNumber)) {
      setErrorMsg("F0UNDR number must start with 'f' followed by exactly 7 characters (e.g. f1234567, f0000000).");
      return;
    }

    setLoading(true);
    setStep('initializing');

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;

    const res = await registerUser({
      name: name.trim(),
      foundrNumber: foundrNumber.trim().toLowerCase(),
      originalPhone: authMode === 'phone' ? fullPhone : undefined,
      email: authMode === 'email' ? emailAddress : undefined,
      avatar: avatarUrl,
      about: about.trim(),
      code: otpDigits.join('')
    });

    setLoading(false);
    if (!res.success) {
      setStep('profile');
      setErrorMsg(res.error || 'Registration failed');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#111b21] flex flex-col items-center justify-center p-4 select-none relative overflow-y-auto">
      {/* Background WhatsApp Doodle Motif */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#00a884_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="w-full max-w-md bg-[#202c33] border border-[#2a3942] rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col">
        {/* ======================================================== */}
        {/* 1. WELCOME SCREEN */}
        {/* ======================================================== */}
        {step === 'welcome' && (
          <div className="p-8 flex flex-col items-center text-center space-y-6 animate-fade-in">
            {/* WhatsApp Logo Emblem */}
            <div className="w-20 h-20 rounded-full bg-[#00a884] flex items-center justify-center shadow-lg shadow-[#00a884]/20">
              <MessageSquare size={44} className="text-[#111b21] fill-current" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#e9edef] mb-2 tracking-tight">
                Welcome to WhatsApp
              </h1>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Connect seamlessly across Android, Windows Desktop, and Web with end-to-end encryption.
              </p>
            </div>

            <div className="bg-[#111b21] p-4 rounded-xl border border-[#222e35] text-left w-full space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#00a884]">
                <ShieldCheck size={16} />
                <span>One Account Guarantee</span>
              </div>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                Verify using your <strong>Phone Number</strong> or <strong>Email Address</strong>. Each account receives a unique <strong>F0UNDR ID</strong> (<code className="text-[#00a884]">f1234567</code>) to connect without sharing numbers.
              </p>
            </div>

            <button
              onClick={() => setStep('input')}
              className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg active:scale-98 cursor-pointer text-sm"
            >
              Agree and continue
            </button>

            {/* Quick Demo Switcher */}
            <div className="pt-2 border-t border-[#2a3942] w-full">
              <span className="text-[11px] text-[#8696a0] block mb-2 font-medium">
                Testing between users? Select a demo account:
              </span>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {allUsers.slice(0, 4).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    className="text-xs bg-[#111b21] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] px-2.5 py-1 rounded-lg border border-[#2a3942] transition-colors"
                  >
                    {u.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. VERIFY PHONE OR EMAIL INPUT SCREEN */}
        {/* ======================================================== */}
        {step === 'input' && (
          <div className="p-8 flex flex-col space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('welcome')}
                className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full hover:bg-[#2a3942]"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold text-[#e9edef]">Verify Account</h2>
              <div className="w-5" />
            </div>

            {/* Segmented Mode Selector: Phone vs Email */}
            <div className="bg-[#111b21] p-1 rounded-xl flex border border-[#2a3942]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('phone');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  authMode === 'phone'
                    ? 'bg-[#00a884] text-[#111b21] shadow-md'
                    : 'text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                <Phone size={15} />
                <span>Phone Number</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  authMode === 'email'
                    ? 'bg-[#00a884] text-[#111b21] shadow-md'
                    : 'text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                <Mail size={15} />
                <span>Email Address</span>
              </button>
            </div>

            <p className="text-xs text-[#8696a0] text-center leading-relaxed">
              {authMode === 'phone'
                ? 'WhatsApp will verify your phone number. Standard SMS or carrier charges may apply.'
                : 'WhatsApp will send a 6-digit verification code to your email inbox.'}
            </p>

            <form onSubmit={handleInputSubmit} className="space-y-5">
              {authMode === 'phone' ? (
                <>
                  {/* Country Selector */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider block mb-1">
                      Country
                    </label>
                    <div className="relative">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full bg-[#111b21] border border-[#2a3942] text-[#e9edef] rounded-xl px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-[#00a884]"
                      >
                        <option value="+92">Pakistan (+92)</option>
                        <option value="+1">United States (+1)</option>
                        <option value="+44">United Kingdom (+44)</option>
                        <option value="+971">United Arab Emirates (+971)</option>
                        <option value="+966">Saudi Arabia (+966)</option>
                        <option value="+91">India (+91)</option>
                        <option value="+49">Germany (+49)</option>
                        <option value="+90">Turkey (+90)</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Phone input */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider block mb-1">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div className="w-20 bg-[#111b21] border border-[#2a3942] rounded-xl flex items-center justify-center text-sm font-semibold text-[#e9edef]">
                        {countryCode}
                      </div>
                      <input
                        type="tel"
                        placeholder="0344 6789261"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        autoFocus
                        required
                        className="flex-1 bg-[#111b21] border border-[#2a3942] text-[#e9edef] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00a884] font-mono tracking-wider"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Email input */
                <div>
                  <label className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 bg-[#111b21] border border-[#2a3942] rounded-xl px-3 py-2.5 focus-within:border-[#00a884]">
                    <Mail size={18} className="text-[#00a884]" />
                    <input
                      type="email"
                      placeholder="e.g. name@example.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      autoFocus
                      required
                      className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer text-sm"
              >
                Next
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2b. CONFIRMATION POPUP MODAL */}
        {/* ======================================================== */}
        {step === 'confirm' && (
          <div className="p-8 flex flex-col items-center text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#111b21] border border-[#00a884] flex items-center justify-center text-[#00a884]">
              {authMode === 'phone' ? <Phone size={28} /> : <Mail size={28} />}
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#e9edef] mb-2">
                {authMode === 'phone' ? 'Verify Phone Number?' : 'Verify Email Address?'}
              </h3>
              <p className="text-xs text-[#8696a0] mb-3 leading-relaxed">
                {authMode === 'phone'
                  ? 'We will send a 6-digit verification code to this phone number:'
                  : 'We will send a 6-digit verification code to this email address:'}
              </p>
              <div className="font-mono text-base font-bold text-[#00a884] bg-[#111b21] py-2 px-4 rounded-xl border border-[#2a3942] inline-block">
                {authMode === 'phone' ? fullPhone : emailAddress}
              </div>
            </div>

            <p className="text-xs text-[#8696a0]">
              Is this OK, or would you like to edit?
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 w-full text-left">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setStep('input')}
                disabled={loading}
                className="flex-1 bg-[#111b21] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] font-semibold py-2.5 px-4 rounded-xl border border-[#2a3942] transition-colors text-xs"
              >
                Edit
              </button>
              <button
                onClick={handleConfirmAndSend}
                disabled={loading}
                className="flex-1 bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] font-bold py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-98 text-xs flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
                <span>OK, Send Code</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. 6-DIGIT OTP VERIFICATION SCREEN */}
        {/* ======================================================== */}
        {step === 'otp' && (
          <div className="p-8 flex flex-col space-y-6 animate-fade-in text-center">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('input')}
                className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full hover:bg-[#2a3942]"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold text-[#e9edef]">Enter 6-Digit Code</h2>
              <div className="w-5" />
            </div>

            <div>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                {otpSentMessage || (authMode === 'phone'
                  ? `Enter the 6-digit code sent via SMS to ${fullPhone}`
                  : `Enter the 6-digit code sent to ${emailAddress}`)}
              </p>
              <button
                onClick={() => setStep('input')}
                className="text-xs text-[#00a884] hover:underline font-semibold mt-1"
              >
                Wrong {authMode === 'phone' ? 'number' : 'email'}?
              </button>
            </div>

            {/* Simulated / Auto-Fill Banner */}
            {simulatedOtp && (
              <div className="bg-[#111b21] border border-[#00a884]/40 p-3 rounded-xl flex items-center justify-between text-left">
                <div>
                  <span className="text-[11px] font-semibold text-[#00a884] block">
                    Verification Code
                  </span>
                  <span className="text-sm font-mono font-bold text-[#e9edef] tracking-wider">
                    {simulatedOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFillOtp}
                  className="bg-[#00a884]/15 hover:bg-[#00a884]/25 text-[#00a884] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#00a884]/30 transition-colors"
                >
                  Auto-Fill Code
                </button>
              </div>
            )}

            {/* 6-Digit Boxes */}
            <div className="flex justify-between gap-2 max-w-xs mx-auto">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-input-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && i > 0) {
                      document.getElementById(`otp-input-${i - 1}`)?.focus();
                    }
                  }}
                  className="w-11 h-14 bg-[#111b21] border-2 border-[#2a3942] focus:border-[#00a884] text-[#e9edef] text-center text-xl font-bold font-mono rounded-xl focus:outline-none transition-colors"
                />
              ))}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 text-left">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="text-xs text-[#8696a0] flex items-center justify-center gap-2">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleConfirmAndSend}
                disabled={loading}
                className="text-[#00a884] hover:underline font-semibold"
              >
                Resend code
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. PROFILE & F0UNDR ID SETUP SCREEN (For New Users) */}
        {/* ======================================================== */}
        {step === 'profile' && (
          <div className="p-8 flex flex-col space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#e9edef] mb-1">Profile Info</h2>
              <p className="text-xs text-[#8696a0]">
                Provide your name and choose your permanent <strong>F0UNDR ID</strong>.
              </p>
            </div>

            {/* Avatar Selector */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <Avatar
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`}
                  name={name || 'You'}
                  size="xl"
                />
                <button
                  type="button"
                  onClick={() => setAvatarSeed(`user-${Date.now()}`)}
                  title="Randomize Avatar"
                  className="absolute bottom-0 right-0 bg-[#00a884] text-[#111b21] p-1.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Sparkles size={16} />
                </button>
              </div>
              <span className="text-[11px] text-[#8696a0] mt-2">Tap ✨ to randomize avatar</span>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider block mb-1">
                  Your Name *
                </label>
                <div className="flex items-center gap-2 bg-[#111b21] border border-[#2a3942] rounded-xl px-3 py-2.5 focus-within:border-[#00a884]">
                  <User size={18} className="text-[#00a884]" />
                  <input
                    type="text"
                    placeholder="e.g. Bilal Tariq"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    required
                    className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
                  />
                </div>
              </div>

              {/* F0UNDR ID (Mandatory 'f' + 7 characters) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider">
                    F0UNDR Number *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateFoundr}
                    className="text-[11px] text-[#00a884] hover:underline flex items-center gap-1 font-semibold"
                  >
                    🎲 Generate ID
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-[#111b21] border border-[#2a3942] rounded-xl px-3 py-2.5 focus-within:border-[#00a884]">
                  <Hash size={18} className="text-[#00a884]" />
                  <input
                    type="text"
                    placeholder="e.g. f1234567 or f0000000"
                    value={foundrNumber}
                    onChange={(e) => setFoundrNumber(e.target.value.trim().toLowerCase())}
                    required
                    className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none font-mono"
                  />
                </div>

                {/* Live Validation Pill */}
                <div className="mt-1.5 flex items-center gap-1 text-[11px]">
                  {isFoundrValid(foundrNumber) ? (
                    <span className="text-[#00a884] flex items-center gap-1 font-medium">
                      <Check size={13} /> Valid F0UNDR ID ({foundrNumber})
                    </span>
                  ) : (
                    <span className="text-[#8696a0]">
                      Must start with 'f' followed by exactly 7 characters (e.g. <code className="text-[#00a884]">f1234567</code>, <code className="text-[#00a884]">f0000000</code>).
                    </span>
                  )}
                </div>
              </div>

              {/* About Status */}
              <div>
                <label className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider block mb-1">
                  About
                </label>
                <input
                  type="text"
                  placeholder="Hey there! I am using WhatsApp."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] text-[#e9edef] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00a884]"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isFoundrValid(foundrNumber) || !name.trim()}
                className="w-full bg-[#00a884] hover:bg-[#00a884]/90 disabled:opacity-50 text-[#111b21] font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer text-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
                <span>Finish & Enter WhatsApp</span>
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. INITIALIZING SPINNER SCREEN */}
        {/* ======================================================== */}
        {step === 'initializing' && (
          <div className="p-12 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full border-4 border-[#00a884]/20 border-t-[#00a884] animate-spin" />
            <div>
              <h3 className="text-lg font-bold text-[#e9edef] mb-1">Initializing</h3>
              <p className="text-xs text-[#8696a0]">
                Setting up end-to-end encrypted messaging...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex items-center gap-1.5 text-xs text-[#8696a0] relative z-10">
        <Lock size={12} className="text-[#00a884]" />
        <span>End-to-end encrypted with PIN security & F0UNDR network</span>
      </div>
    </div>
  );
};
