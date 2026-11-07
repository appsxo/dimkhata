import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Delete,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Store,
} from 'lucide-react';
import { DimKhataStore } from '../lib/storage-store';
import { useLanguage } from '../lib/i18n';
import { UserProfile } from '../types';

interface AuthGateViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthGateView: React.FC<AuthGateViewProps> = ({ onLoginSuccess }) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const company = DimKhataStore.getCompany();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const list = DimKhataStore.getUsers();
    setUsers(list);
    if (list.length > 0) {
      setSelectedUserId(list[0].id);
    }
  }, []);

  const handleKeypadPress = (val: string) => {
    setErrorMsg('');
    if (val === 'CLEAR') {
      setPin('');
    } else if (val === 'BACKSPACE') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (pin.length < 8) {
        setPin((prev) => prev + val);
      }
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUserId) {
      setErrorMsg(t('অনুগ্রহ করে একজন ব্যবহারকারী নির্বাচন করুন', 'Please select a user identity'));
      return;
    }
    if (!pin.trim()) {
      setErrorMsg(t('অনুগ্রহ করে সিক্রেট পিন কোড লিখুন', 'Please enter your secret PIN'));
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await DimKhataStore.loginWithPin(selectedUserId, pin);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(
          result.error
            ? t(result.error, result.error)
            : t('ভুল পিন কোড! সঠিক পিন লিখুন', 'Incorrect secret PIN code!')
        );
      }
    } catch {
      setErrorMsg(t('লগইন ব্যর্থ হয়েছে! পুনরায় চেষ্টা করুন', 'Authentication failed. Please retry.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-between items-center p-4 sm:p-6 font-sans select-none">
      {/* Top Bar with Language Toggle & App Header */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 flex items-center justify-center text-lg">
            🥚
          </div>
          <div className="text-[13px] font-semibold text-[#1d1d1f]">
            {lang === 'bn' ? company.company_name_bn : company.company_name_en}
          </div>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 bg-white border border-[#e0e0e0] hover:bg-[#f0f0f2] text-[#1d1d1f] rounded-full px-3 py-1.5 text-[12px] font-medium transition cursor-pointer active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-[#0066cc]" />
          <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md my-auto pt-4 pb-6">
        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-5 sm:p-7 space-y-6">
          {/* Lock Icon & Gate Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center">
              <KeyRound className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1d1d1f]">
                {t('সিক্রেট প্রবেশদ্বার', 'Secure Access Gate')}
              </h1>
              <p className="text-[12.5px] text-[#7a7a7a] mt-0.5">
                {t(
                  'সিস্টেমে প্রবেশ করতে আপনার পরিচয় ও পিন কোড দিন',
                  'Select identity and enter secret PIN to unlock system'
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Step 1: Identity Selection */}
            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-[#7a7a7a] mb-2">
                {t('১. পরিচয় নির্বাচন করুন', '1. Select User Identity')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {users.map((u) => {
                  const isSelected = u.id === selectedUserId;
                  const isAdmin = u.role === 'ADMIN';
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setErrorMsg('');
                      }}
                      className={`relative p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'border-[#0066cc] bg-[#0066cc]/5 ring-1 ring-[#0066cc]'
                          : 'border-[#e0e0e0] bg-white hover:bg-[#fafafa]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isAdmin
                              ? 'bg-[#0066cc] text-white'
                              : 'bg-[#8e8e93] text-white'
                          }`}
                        >
                          {isAdmin ? t('মালিক', 'ADMIN') : t('স্টাফ', 'STAFF')}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#0066cc]" />
                        )}
                      </div>
                      <div className="font-semibold text-[13px] text-[#1d1d1f] truncate">
                        {u.full_name.split(' ')[0]}
                      </div>
                      <div className="text-[11px] text-[#7a7a7a] truncate">
                        {u.role === 'ADMIN' ? t('মালিক', 'Owner') : t('ক্যাশিয়ার', 'Cashier')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: PIN Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
                  {t('২. সিক্রেট পিন কোড', '2. Secret PIN Code')}
                </label>
                {selectedUser && (
                  <span className="text-[11.5px] text-[#0066cc] font-medium">
                    {selectedUser.full_name}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => {
                    setErrorMsg('');
                    setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8));
                  }}
                  placeholder={t('পিন লিখুন...', 'Enter PIN...')}
                  className="w-full text-center tracking-[0.3em] font-mono text-xl sm:text-2xl py-3 px-10 rounded-xl border border-[#e0e0e0] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] focus:outline-none transition bg-[#fbfbfd]"
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7a7a] hover:text-[#1d1d1f] p-1.5 transition cursor-pointer"
                  title={showPin ? t('পিন লুকান', 'Hide PIN') : t('পিন দেখুন', 'Show PIN')}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#ff3b30]/10 border border-[#ff3b30]/30 text-[#d70015] text-[12.5px] animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* On-Screen Numeric Keypad for Mobile Touch Ease */}
            <div className="pt-1">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-12 rounded-xl bg-[#f5f5f7] hover:bg-[#ebebee] active:bg-[#e0e0e3] text-[#1d1d1f] text-lg font-semibold transition cursor-pointer active:scale-95 flex items-center justify-center font-mono"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('CLEAR')}
                  className="h-12 rounded-xl bg-[#f5f5f7] hover:bg-[#ebebee] active:bg-[#e0e0e3] text-[#ff3b30] text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center justify-center"
                >
                  {t('মুছুন', 'Clear')}
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 rounded-xl bg-[#f5f5f7] hover:bg-[#ebebee] active:bg-[#e0e0e3] text-[#1d1d1f] text-lg font-semibold transition cursor-pointer active:scale-95 flex items-center justify-center font-mono"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('BACKSPACE')}
                  className="h-12 rounded-xl bg-[#f5f5f7] hover:bg-[#ebebee] active:bg-[#e0e0e3] text-[#7a7a7a] hover:text-[#1d1d1f] text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center justify-center"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Default PIN Reference Note */}
            <div className="p-3 bg-[#f5f5f7] rounded-xl text-[11.5px] text-[#7a7a7a] space-y-1">
              <div className="font-medium text-[#1d1d1f] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>{t('ডিফল্ট নিরাপত্তা পিন:', 'Default Security PINs:')}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-0.5">
                <span>{t('মালিক (Sharif / Eman):', 'Admin (Sharif / Eman):')} <strong className="font-mono text-[#0066cc]">1234</strong></span>
                <span>{t('স্টাফ (Staff):', 'Staff:')} <strong className="font-mono text-[#0066cc]">0000</strong></span>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || !pin}
              className="w-full h-12 rounded-full bg-[#0066cc] hover:bg-[#0055b3] text-white font-semibold text-[14.5px] transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('যাচাই করা হচ্ছে...', 'Verifying...')}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('সিস্টেমে প্রবেশ করুন', 'Unlock & Enter System')}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Security Guarantee Footer */}
      <div className="w-full max-w-md text-center pb-2 text-[11px] text-[#7a7a7a] space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#30d158]" />
          <span>{t('256-bit SHA-256 এনক্রিপ্ট সিক্রেট', '256-bit SHA-256 Encrypted Secret')}</span>
        </div>
        <p>
          {t(
            'ইউআরএল থেকে সরাসরি প্রবেশ সম্পূর্ণ সুরক্ষিত ও নিষিদ্ধ',
            'Direct URL access blocked • Authentication required'
          )}
        </p>
      </div>
    </div>
  );
};
