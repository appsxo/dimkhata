// ====================================================================
// DIMKHATA (ডিমখাতা) — KYC Document Upload Modal (Apple Design System)
// Features Client-Side WebP Compression (5MB -> <60KB) for Zero-Cost
// ====================================================================

import React, { useState } from 'react';
import { X, Upload, CheckCircle2, ShieldCheck } from 'lucide-react';
import { compressKycImage, CompressedImageResult } from '../../lib/image-compressor';
import { KycDocument } from '../../types';

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
  if (!isOpen) return null;

  const [docType, setDocType] = useState<KycDocument['doc_type']>('NID_FRONT');
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState<CompressedImageResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      const comp = await compressKycImage(file);
      setResult(comp);
    } catch (err) {
      console.error('Compression failed:', err);
      alert('ছবি প্রসেসিংয়ে সমস্যা হয়েছে। দয়া করে অন্য ছবি নির্বাচন করুন।');
    } finally {
      setCompressing(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    const newDoc: KycDocument = {
      id: `kyc-${Date.now()}`,
      doc_type: docType,
      file_name: result.file.name,
      data_url: result.dataUrl,
      uploaded_at: new Date().toISOString(),
    };
    onDocumentAdded(newDoc);
    onClose();
  };

  const docTypeLabels: Record<KycDocument['doc_type'], string> = {
    NID_FRONT: 'জাতীয় পরিচয়পত্র (NID সামনের অংশ)',
    NID_BACK: 'জাতীয় পরিচয়পত্র (NID পিছনের অংশ)',
    PASSPORT: 'পাসপোর্ট (Passport Copy)',
    BIRTH_CERT: 'জন্ম নিবন্ধন সনদ',
    PHOTO: 'পাসপোর্ট সাইজ ছবি',
    TRADE_LICENSE: 'ট্রেড লাইসেন্স কপি',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white rounded-t-[20px] sm:rounded-[18px] border border-[#e0e0e0] max-w-lg w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f5f5f7] border-b border-[#e0e0e0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[18px] text-[#1d1d1f] leading-tight">
                কেওয়াইসি (KYC) ভেরিফিকেশন আপলোড
              </h3>
              <p className="text-[12px] text-[#7a7a7a] mt-0.5">
                গ্রাহক/কর্মচারী: <span className="text-[#1d1d1f] font-semibold">{entityName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon-circle text-[#1d1d1f]"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Doc Type Selector */}
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1.5">
              ডকুমেন্টের ধরন নির্বাচন করুন
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

          {/* File Upload Box */}
          <div className="border-2 border-dashed border-[#d2d2d7] hover:border-[#0066cc] rounded-[12px] p-5 text-center transition bg-[#f5f5f7]">
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
              className="cursor-pointer flex flex-col items-center justify-center gap-2.5"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-[#e0e0e0] text-[#0066cc] flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[13px] font-semibold text-[#0066cc] hover:underline">
                  ফটো বা ডকুমেন্ট নির্বাচন করুন
                </span>
                <p className="text-[11px] text-[#7a7a7a] mt-0.5">
                  ক্যামেরা দিয়ে তোলা ৫-১০ মেগাবাইট ছবি স্বয়ংক্রিয়ভাবে সংকুচিত (&lt;৬০ KB WebP) হবে
                </p>
              </div>
            </label>
          </div>

          {/* Compression Status & Preview */}
          {compressing && (
            <div className="p-3 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] text-center text-xs text-[#1d1d1f] flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
              <span>ছবি অপ্টিমাইজ ও কম্প্রেস করা হচ্ছে...</span>
            </div>
          )}

          {result && !compressing && (
            <div className="space-y-3">
              {/* Savings Badge */}
              <div className="p-3 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] flex items-center justify-between text-xs text-[#1d1d1f]">
                <div className="flex items-center gap-1.5 font-semibold text-[#15803d]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>কম্প্রেশন সফল: {result.compressionRatio} সাইজ কমানো হয়েছে</span>
                </div>
                <div className="font-semibold text-[#1d1d1f]">
                  {result.originalSizeKb} KB ➔ {result.compressedSizeKb} KB
                </div>
              </div>

              {/* Preview Image */}
              <div className="relative rounded-[12px] overflow-hidden border border-[#e0e0e0] bg-[#f5f5f7] max-h-48 flex items-center justify-center">
                <img
                  src={result.dataUrl}
                  alt="KYC Preview"
                  className="max-h-48 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#f5f5f7] border-t border-[#e0e0e0] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="btn-outline px-4 text-[13px]"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            disabled={!result || compressing}
            className="btn-primary px-5 text-[13px] disabled:opacity-40"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>কেওয়াইসি সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
