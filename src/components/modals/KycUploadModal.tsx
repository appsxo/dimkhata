import React, { useState } from 'react';
import { Upload, CheckCircle2, ShieldCheck } from 'lucide-react';
import { compressKycImage, CompressedImageResult } from '../../lib/image-compressor';
import { useLanguage } from '../../lib/i18n';
import { KycDocument } from '../../types';
import { AppleModal } from '../ui/AppleUI';

interface KycUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  onDocumentAdded: (doc: KycDocument) => void;
}

export const KycUploadModal: React.FC<KycUploadModalProps> = ({
  isOpen,
  onClose,
  entityName,
  onDocumentAdded,
}) => {
  const { t } = useLanguage();
  const [docType, setDocType] = useState<KycDocument['doc_type']>('NID_FRONT');
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState<CompressedImageResult | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const comp = await compressKycImage(file);
      setResult(comp);
    } catch {
      alert(t('ছবি প্রসেসিংয়ে সমস্যা হয়েছে।', 'Failed to process image.'));
    } finally {
      setCompressing(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    onDocumentAdded({
      id: `kyc-${Date.now()}`,
      doc_type: docType,
      file_name: result.file.name,
      data_url: result.dataUrl,
      uploaded_at: new Date().toISOString(),
    });
    onClose();
  };

  const docTypeLabels: Record<KycDocument['doc_type'], string> = {
    NID_FRONT: t('জাতীয় পরিচয়পত্র (NID সামনে)', 'National ID (Front)'),
    NID_BACK: t('জাতীয় পরিচয়পত্র (NID পিছনে)', 'National ID (Back)'),
    PASSPORT: t('পাসপোর্ট কপি', 'Passport Copy'),
    BIRTH_CERT: t('জন্ম সনদ', 'Birth Certificate'),
    PHOTO: t('পাসপোর্ট সাইজ ছবি', 'Photo'),
    TRADE_LICENSE: t('ট্রেড লাইসেন্স', 'Trade License'),
  };

  return (
    <AppleModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('কেওয়াইসি (KYC) ডকুমেন্ট আপলোড', 'KYC Document Upload')}
      subtitle={entityName}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
            {t('ডকুমেন্টের ধরন', 'Document Type')}
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as KycDocument['doc_type'])}
            className="input-apple w-full text-[14px]"
          >
            {Object.entries(docTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="border-2 border-dashed border-[#d2d2d7] hover:border-[#0066cc] rounded-[12px] p-4 text-center transition bg-[#f5f5f7]">
          <input
            type="file"
            accept="image/*"
            id="kyc-file-input"
            className="hidden"
            onChange={handleFileChange}
            disabled={compressing}
          />
          <label
            htmlFor="kyc-file-input"
            className="cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-[#e0e0e0] text-[#0066cc] flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#0066cc]">
              {t('ছবি নির্বাচন করুন (স্বয়ংক্রিয় WebP কম্প্রেশন)', 'Select Photo (Auto WebP Compression)')}
            </span>
          </label>
        </div>

        {compressing && (
          <div className="p-3 bg-[#f5f5f7] rounded-[12px] text-center text-xs text-[#1d1d1f]">
            {t('কম্প্রেস করা হচ্ছে...', 'Compressing image...')}
          </div>
        )}

        {result && !compressing && (
          <div className="space-y-2.5">
            <div className="p-2.5 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[10px] flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-semibold text-[#15803d]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {result.compressionRatio}
              </span>
              <span className="font-mono text-[#1d1d1f]">
                {result.originalSizeKb} KB ➔ {result.compressedSizeKb} KB
              </span>
            </div>
            <div className="rounded-[10px] overflow-hidden border border-[#e0e0e0] bg-[#f5f5f7] max-h-40 flex items-center justify-center">
              <img src={result.dataUrl} alt="KYC Preview" className="max-h-40 object-contain" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e0e0e0]">
          <button type="button" onClick={onClose} className="btn-outline px-4 text-[13px]">
            {t('বাতিল', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!result || compressing}
            className="btn-primary px-5 text-[13px] disabled:opacity-40"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('সংরক্ষণ করুন', 'Save KYC')}</span>
          </button>
        </div>
      </div>
    </AppleModal>
  );
};
