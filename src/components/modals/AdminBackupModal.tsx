import React, { useState } from 'react';
import { Download, ShieldCheck, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DimKhataStore } from '../../lib/storage-store';
import { useLanguage } from '../../lib/i18n';
import { AppleModal } from '../ui/AppleUI';

interface AdminBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminBackupModal: React.FC<AdminBackupModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pinInput.trim()) {
      setErrorMsg(t('অনুগ্রহ করে অ্যাডমিন পিন কোড লিখুন', 'Please enter your Admin PIN'));
      return;
    }

    setVerifying(true);
    const adminUser = await DimKhataStore.verifyAdminPin(pinInput.trim());
    setVerifying(false);

    if (!adminUser) {
      setErrorMsg(t('ভুল অ্যাডমিন পিন! ব্যাকআপ ডাউনলোড অনুমোদিত নয়।', 'Incorrect Admin PIN! Unauthorized.'));
      return;
    }

    // Authorization passed! Trigger clean JSON export
    const json = DimKhataStore.exportFullBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DimKhata_Enterprise_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    DimKhataStore.logAudit('Security', 'UPDATE', adminUser.id, 'সম্পূর্ণ সিস্টেম ব্যাকআপ JSON ডাউনলোড করা হয়েছে');
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setPinInput('');
      onClose();
    }, 1500);
  };

  return (
    <AppleModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('অ্যাডমিন ব্যাকআপ ডাউনলোড', 'Admin Backup Download')}
      subtitle={t('ব্যাকআপ ফাইলটি ডাউনলোড করতে অ্যাডমিন সিক্রেট পিন দিন', 'Enter Admin PIN to authorize full enterprise backup download')}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleDownload} className="space-y-4">
        <div className="text-center p-3 rounded-2xl bg-[#0066cc]/5 border border-[#0066cc]/20">
          <div className="w-10 h-10 mx-auto rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center mb-1.5">
            <Download className="w-5 h-5" />
          </div>
          <div className="text-[12px] font-semibold text-[#1d1d1f]">
            {t('সম্পূর্ণ এনক্রিপ্টেড ডাটাবেস ব্যাকআপ', 'Complete System Database Export')}
          </div>
          <div className="text-[11px] text-[#7a7a7a] mt-0.5">
            {t('মালিকের অনুমোদন ছাড়া ব্যাকআপ ফাইল নেওয়া নিষিদ্ধ', 'Restricted exclusively to authorized business owners')}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1.5">
            {t('অ্যাডমিন পিন কোড দিন *', 'Enter Admin PIN *')}
          </label>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pinInput}
            onChange={(e) => {
              setErrorMsg('');
              setPinInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 8));
            }}
            placeholder={t('পিন লিখুন...', 'Enter PIN...')}
            className="input-apple w-full text-center text-[20px] tracking-[0.3em] font-semibold"
            required
          />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#ff3b30]/10 border border-[#ff3b30]/30 text-[#d70015] text-[12px] font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#30d158]/10 border border-[#30d158]/30 text-[#00802b] text-[12px] font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t('ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!', 'Backup downloaded successfully!')}</span>
          </div>
        )}



        <div className="flex justify-end gap-2 pt-2 border-t border-[#e0e0e0]">
          <button type="button" onClick={onClose} className="btn-outline text-[13px] px-4">
            {t('বাতিল', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={verifying || !pinInput}
            className="btn-primary text-[13px] px-5 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{verifying ? t('যাচাই হচ্ছে...', 'Verifying...') : t('ডাউনলোড করুন', 'Download')}</span>
          </button>
        </div>
      </form>
    </AppleModal>
  );
};
