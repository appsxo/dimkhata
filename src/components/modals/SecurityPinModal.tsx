import React, { useState } from 'react';
import { KeyRound, Cloud, RefreshCw, ShieldCheck } from 'lucide-react';
import { DimKhataStore } from '../../lib/storage-store';
import { verifyRolePin, sha256Hex } from '../../lib/security';
import { useLanguage } from '../../lib/i18n';
import { AppleModal, AppleOptionChips } from '../ui/AppleUI';

interface SecurityPinModalProps {
  mode: 'UNLOCK_ADMIN' | 'MANAGE_SECURITY';
  onClose: () => void;
  onSuccessUnlockAdmin?: (adminUser?: any) => void;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  mode,
  onClose,
  onSuccessUnlockAdmin,
}) => {
  const { t } = useLanguage();
  const company = DimKhataStore.getCompany();
  const cloudStatus = DimKhataStore.getCloudStatus();
  const allUsers = DimKhataStore.getUsers();
  const currentUser = DimKhataStore.getActiveUser();

  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState<'PIN' | 'CLOUD'>('PIN');
  const [targetUserId, setTargetUserId] = useState<string>(currentUser.id || allUsers[0]?.id || '');
  const [currentAdminPin, setCurrentAdminPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [savedNotice, setSavedNotice] = useState('');
  const [syncingNow, setSyncingNow] = useState(false);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setVerifying(true);
    const adminUser = await DimKhataStore.verifyAdminPin(pinInput);
    setVerifying(false);
    if (!adminUser) {
      setErrorMsg(t('ভুল অ্যাডমিন পিন! সঠিক পিন দিন', 'Incorrect Admin PIN!'));
      return;
    }
    if (onSuccessUnlockAdmin) onSuccessUnlockAdmin(adminUser);
    onClose();
  };

  const handleUpdatePins = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSavedNotice('');

    if (newPin.trim().length < 4) {
      setErrorMsg(t('নতুন পিন কমপক্ষে ৪ সংখ্যার হতে হবে!', 'New PIN must be at least 4 digits!'));
      return;
    }

    const adminUser = await DimKhataStore.verifyAdminPin(currentAdminPin);
    if (!adminUser) {
      setErrorMsg(t('বর্তমান অ্যাডমিন পিন সঠিক নয়!', 'Current Admin PIN is incorrect!'));
      return;
    }

    await DimKhataStore.updateUserPin(targetUserId, newPin.trim());

    const updatedUser = allUsers.find((u) => u.id === targetUserId);
    const updatedCompany = { ...company };
    if (updatedUser?.role === 'ADMIN') {
      updatedCompany.admin_pin_hash = await sha256Hex(newPin.trim());
    } else if (updatedUser?.role === 'STAFF') {
      updatedCompany.staff_pin_hash = await sha256Hex(newPin.trim());
    }
    DimKhataStore.updateCompany(updatedCompany);

    setCurrentAdminPin('');
    setNewPin('');
    setSavedNotice(
      t(
        `${updatedUser?.full_name || 'ব্যবহারকারী'}-এর পিন সফলভাবে আপডেট ও সেভ হয়েছে!`,
        `PIN updated and synced for ${updatedUser?.full_name || 'user'}!`
      )
    );
  };



  const handleManualSync = async () => {
    setSyncingNow(true);
    await DimKhataStore.syncWithSupabase();
    setSyncingNow(false);
  };

  return (
    <AppleModal
      isOpen={true}
      onClose={onClose}
      title={mode === 'UNLOCK_ADMIN' ? t('অ্যাডমিন নিরাপত্তা পিন', 'Admin Security PIN') : t('নিরাপত্তা ও ক্লাউড সেটিংস', 'Security & Cloud Sync')}
      subtitle={mode === 'UNLOCK_ADMIN' ? t('মালিক মোডে প্রবেশ করতে পিন দিন', 'Enter Admin PIN to unlock owner mode') : undefined}
      maxWidth="max-w-md"
    >
      {mode === 'UNLOCK_ADMIN' ? (
        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('অ্যাডমিন পিন কোড (৪ সংখ্যা)', 'Admin PIN Code (4+ digits)')}
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder={t('পিন লিখুন...', 'Enter PIN...')}
              className="input-apple w-full text-center text-[20px] tracking-[0.3em] font-semibold"
              required
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-[10px] bg-[#fff2f4] border border-[#ffd1d9] text-[#bf0013] text-[12px] font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => setPinInput((prev) => (prev.length < 8 ? prev + digit : prev))}
                className="h-11 rounded-[10px] bg-[#f5f5f7] hover:bg-[#e8e8ed] active:scale-95 text-[16px] font-semibold text-[#1d1d1f] transition-transform border border-[#e0e0e0]"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPinInput('')}
              className="col-span-2 h-11 rounded-[10px] bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[13px] font-semibold text-[#bf0013] border border-[#e0e0e0]"
            >
              {t('মুছুন (Clear)', 'Clear')}
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e0e0e0]">
            <button type="button" onClick={onClose} className="btn-outline text-[13px] px-4">
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" disabled={verifying || !pinInput} className="btn-primary text-[13px] px-5">
              <KeyRound className="w-4 h-4" />
              <span>{verifying ? t('যাচাই হচ্ছে...', 'Verifying...') : t('আনলক করুন', 'Unlock')}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <AppleOptionChips
            options={[
              { value: 'PIN', label: t('পিন পরিবর্তন', 'Change PIN'), icon: <KeyRound className="w-3.5 h-3.5" /> },
              { value: 'CLOUD', label: t('Supabase ক্লাউড', 'Supabase Cloud'), icon: <Cloud className="w-3.5 h-3.5" /> },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 'PIN' ? (
            <form onSubmit={handleUpdatePins} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('ব্যবহারকারী নির্বাচন করুন *', 'Select User *')}
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="input-apple w-full text-[13.5px] bg-white font-medium cursor-pointer"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role === 'ADMIN' ? t('মালিক / Admin', 'Admin') : t('স্টাফ / Staff', 'Staff')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('বর্তমান অ্যাডমিন পিন (যাচাইয়ের জন্য) *', 'Current Admin PIN (Verification) *')}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={currentAdminPin}
                  onChange={(e) => setCurrentAdminPin(e.target.value)}
                  placeholder={t('বর্তমান অ্যাডমিন পিন লিখুন...', 'Enter current Admin PIN...')}
                  className="input-apple w-full text-[14px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('নতুন সিক্রেট পিন (কমপক্ষে ৪ সংখ্যা) *', 'New Secret PIN (Min 4 digits) *')}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder={t('নতুন ৪ সংখ্যার পিন দিন', 'Enter new 4+ digit PIN')}
                  className="input-apple w-full text-[14px]"
                  required
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-[10px] bg-[#fff2f4] border border-[#ffd1d9] text-[#bf0013] text-[12px] font-semibold">
                  {errorMsg}
                </div>
              )}
              {savedNotice && (
                <div className="p-2.5 rounded-[10px] bg-[#eefbf3] border border-[#bbf7d0] text-[#00802b] text-[12px] font-semibold">
                  {savedNotice}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e0e0e0]">
                <button type="button" onClick={onClose} className="btn-outline text-[13px] px-4">
                  {t('বন্ধ করুন', 'Close')}
                </button>
                <button type="submit" className="btn-primary text-[13px] px-5">
                  {t('পিন সেভ করুন', 'Save PINs')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-[12px] bg-[#f5f5f7] border border-[#e0e0e0] flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-[#7a7a7a]">{t('ক্লাউড স্ট্যাটাস', 'Cloud Status')}</div>
                  <div className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5 flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        cloudStatus === 'ONLINE'
                          ? 'bg-[#00802b]'
                          : cloudStatus === 'NEEDS_SQL'
                          ? 'bg-[#bf4800]'
                          : 'bg-[#0066cc]'
                      }`}
                    />
                    <span>
                      {cloudStatus === 'ONLINE'
                        ? t('Supabase Live Sync সক্রিয়', 'Supabase Live Sync Active')
                        : cloudStatus === 'NEEDS_SQL'
                        ? t('SQL টেবিল সেটআপ প্রয়োজন', 'Needs SQL Table Setup')
                        : t('সিঙ্ক হচ্ছে...', 'Syncing...')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncingNow}
                  className="btn-outline !min-h-[34px] !px-3 !py-1 !text-[12px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingNow ? 'animate-spin' : ''}`} />
                  <span>{t('সিঙ্ক', 'Sync')}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#f5f5f7] border border-[#e0e0e0] space-y-2">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#1d1d1f]">
                  <ShieldCheck className="w-4 h-4 text-[#0066cc]" />
                  <span>{t('রিয়েল-টাইম ক্লাউড সুরক্ষা', 'Real-Time Cloud Security')}</span>
                </div>
                <p className="text-[11.5px] text-[#7a7a7a] leading-relaxed">
                  {t(
                    'সকল মেমো, ক্রয়-বিক্রয় ও খাতা হিসাব স্বয়ংক্রিয়ভাবে ক্লাউড ডাটাবেসে সুরক্ষিত থাকে। ডাটাবেসের সংযোগ ও নিরাপত্তা কি GitHub Repository Secrets-এর মাধ্যমে কঠোরভাবে সংরক্ষিত।',
                    'All transactions, memos, and ledger records are automatically synchronized in real-time. Database credentials and keys are strictly managed via GitHub Repository Secrets.'
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </AppleModal>
  );
};
