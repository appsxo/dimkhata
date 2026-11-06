// ====================================================================
// DIMKHATA (ডিমখাতা) — KYC Document Upload Modal (Req 2)
// Features Client-Side WebP Compression (5MB -> <60KB) for Zero-Cost
// ====================================================================

import React, { useState } from 'react';
import { X, Upload, CheckCircle2, ShieldCheck, FileText, Image as ImageIcon } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#fafafa] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-light text-lg text-stone-900 leading-tight">
                কেওয়াইসি (KYC) ভেরিফিকেশন আপলোড
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                গ্রাহক/কর্মচারী: <span className="text-stone-800 font-medium">{entityName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/60 transition text-stone-500 hover:text-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Doc Type Selector */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              ডকুমেন্টের ধরন নির্বাচন করুন
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as KycDocument['doc_type'])}
              className="input-editorial w-full text-xs font-medium text-stone-800"
            >
              {Object.entries(docTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Box */}
          <div className="border-2 border-dashed border-stone-300 hover:border-stone-500 rounded-xl p-5 text-center transition bg-[#fafafa]">
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
              <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center shadow-xs">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-stone-900 hover:underline">
                  ফটো বা ডকুমেন্ট নির্বাচন করুন
                </span>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  ক্যামেরা দিয়ে তোলা ৫-১০ মেগাবাইট ছবি স্বয়ংক্রিয়ভাবে সংকুচিত (&lt;৬০ KB WebP) হবে
                </p>
              </div>
            </label>
          </div>

          {/* Compression Status & Preview */}
          {compressing && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-center text-xs text-stone-700 flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
              <span>ছবি অপ্টিমাইজ ও কম্প্রেস করা হচ্ছে...</span>
            </div>
          )}

          {result && !compressing && (
            <div className="space-y-3">
              {/* Savings Badge */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs text-stone-800">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-stone-700 shrink-0" />
                  <span>কম্প্রেশন সফল: {result.compressionRatio} সাইজ কমানো হয়েছে</span>
                </div>
                <div className="font-semibold text-stone-900">
                  {result.originalSizeKb} KB ➔ {result.compressedSizeKb} KB
                </div>
              </div>

              {/* Preview Image */}
              <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50 max-h-48 flex items-center justify-center">
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
        <div className="px-6 py-3.5 bg-[#fafafa] border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="btn-outline px-4 py-2 text-xs font-medium"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            disabled={!result || compressing}
            className="btn-primary flex items-center gap-1.5 px-5 py-2 text-xs font-medium disabled:opacity-40"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>কেওয়াইসি সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
