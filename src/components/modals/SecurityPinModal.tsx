import React, { useState } from 'react';
import { KeyRound, Cloud, Copy, CheckCircle2, RefreshCw } from 'lucide-react';
import { DimKhataStore } from '../../lib/storage-store';
import { verifyRolePin, sha256Hex } from '../../lib/security';
import { useLanguage } from '../../lib/i18n';
import { AppleModal, AppleOptionChips } from '../ui/AppleUI';

interface SecurityPinModalProps {
  mode: 'UNLOCK_ADMIN' | 'MANAGE_SECURITY';
  onClose: () => void;
  onSuccessUnlockAdmin?: () => void;
}

const SUPABASE_KV_SQL = `-- Run once in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.dimkhata_kv_store (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dimkhata_kv_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow publishable key sync on dimkhata_kv_store" ON public.dimkhata_kv_store;
CREATE POLICY "Allow publishable key sync on dimkhata_kv_store"
    ON public.dimkhata_kv_store
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);`;

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  mode,
  onClose,
  onSuccessUnlockAdmin,
}) => {
  const { t } = useLanguage();
  const company = DimKhataStore.getCompany();
  const cloudStatus = DimKhataStore.getCloudStatus();

  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState<'PIN' | 'CLOUD'>(
    cloudStatus === 'NEEDS_SQL' ? 'CLOUD' : 'PIN'
  );
  const [currentAdminPin, setCurrentAdminPin] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [savedNotice, setSavedNotice] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setVerifying(true);
    const ok = await verifyRolePin('ADMIN', pinInput, company);
    setVerifying(false);
    if (!ok) {
      setErrorMsg(t('ভুল অ্যাডমিন পিন! সঠিক পিন দিন (ডিফল্ট: 1234)', 'Incorrect Admin PIN! (Default: 1234)'));
      return;
    }
    if (onSuccessUnlockAdmin) onSuccessUnlockAdmin();
    onClose();
  };

  const handleUpdatePins = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSavedNotice('');

    const isCurrentValid = await verifyRolePin('ADMIN', currentAdminPin, company);
    if (!isCurrentValid) {
      setErrorMsg(t('বর্তমান অ্যাডমিন পিন সঠিক নয়! (ডিফল্ট: 1234)', 'Current Admin PIN is incorrect! (Default: 1234)'));
      return;
    }

    const updatedCompany = { ...company };
    if (newAdminPin.trim().length >= 4) {
      updatedCompany.admin_pin_hash = await sha256Hex(newAdminPin.trim());
    }
    if (newStaffPin.trim().length >= 4) {
      updatedCompany.staff_pin_hash = await sha256Hex(newStaffPin.trim());
    }

    DimKhataStore.updateCompany(updatedCompany);
    setCurrentAdminPin('');
    setNewAdminPin('');
    setNewStaffPin('');
    setSavedNotice(t('পিন আপডেট ও ক্লাউডে সংরক্ষিত হয়েছে!', 'PINs updated and synced to Supabase!'));
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_KV_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
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
              placeholder={t('পিন লিখুন (ডিফল্ট: 1234)', 'Enter PIN (Default: 1234)')}
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
                  {t('বর্তমান অ্যাডমিন পিন *', 'Current Admin PIN *')}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={currentAdminPin}
                  onChange={(e) => setCurrentAdminPin(e.target.value)}
                  placeholder={t('বর্তমান পিন (ডিফল্ট: 1234)', 'Current PIN (Default: 1234)')}
                  className="input-apple w-full text-[14px]"
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('নতুন অ্যাডমিন পিন (কমপক্ষে ৪ সংখ্যা)', 'New Admin PIN (Min 4 digits)')}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={newAdminPin}
                  onChange={(e) => setNewAdminPin(e.target.value)}
                  placeholder={t('নতুন অ্যাডমিন পিন দিন', 'Enter new Admin PIN')}
                  className="input-apple w-full text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('নতুন স্টাফ পিন (ঐচ্ছিক)', 'New Staff PIN (Optional)')}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  placeholder={t('স্টাফ পিন দিন (ডিফল্ট: 0000)', 'Enter Staff PIN (Default: 0000)')}
                  className="input-apple w-full text-[14px]"
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold text-[#1d1d1f]">Supabase SQL (`supabase/schema.sql`)</span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0066cc] hover:underline"
                  >
                    {copiedSql ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00802b]" />
                        <span>{t('কপি হয়েছে!', 'Copied!')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t('কপি করুন', 'Copy SQL')}</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-[10px] bg-[#1d1d1f] text-[#f5f5f7] text-[11px] overflow-x-auto max-h-40 font-mono leading-relaxed">
                  {SUPABASE_KV_SQL}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </AppleModal>
  );
};
