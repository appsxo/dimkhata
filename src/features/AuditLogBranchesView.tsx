// ====================================================================
// DIMKHATA (ডিমখাতা) — Digital Audit Trail & Multi-Branch (Apple Design)
// ====================================================================

import React, { useState } from 'react';
import { Plus, Lock } from 'lucide-react';
import { Branch, AuditLog } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { toBengaliNumber } from '../lib/egg-units';
import {
  AppleSectionHeader,
  AppleOptionChips,
  AppleSearchInput,
  AppleModal,
} from '../components/ui/AppleUI';

interface AuditLogBranchesViewProps {
  branches: Branch[];
  auditLogs: AuditLog[];
  onRefresh: () => void;
}

export const AuditLogBranchesView: React.FC<AuditLogBranchesViewProps> = ({
  branches,
  auditLogs,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'BRANCHES'>('AUDIT');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (
      searchQuery &&
      !log.actor_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.summary.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName || !branchAddress) return;

    const count = branches.length + 1;
    const branchCode = `SE-BR-${String(count).padStart(3, '0')}`;

    DimKhataStore.addBranch({
      branch_code: branchCode,
      name: branchName,
      address: branchAddress,
      phone: branchPhone,
      is_main: false,
      is_active: true,
    });

    alert(`শাখা সফলভাবে যুক্ত হয়েছে! শাখা কোড: ${branchCode}`);
    setIsAddBranchOpen(false);
    setBranchName('');
    setBranchAddress('');
    setBranchPhone('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <AppleSectionHeader
        eyebrow="নিরাপত্তা ও মাল্টি-গোডাউন স্কেলিং"
        title="শাখা ও ডিজিটাল অডিট ট্রেইল (Audit Log)"
        subtitle="কোন স্টাফ কখন সিস্টেমে এন্ট্রি বা পরিবর্তন করল তার ডিজিটাল রেকর্ড ও শাখা ব্যবস্থাপনা"
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <AppleOptionChips
              options={[
                { value: 'AUDIT', label: `ডিজিটাল অডিট লগ (${toBengaliNumber(auditLogs.length)})` },
                { value: 'BRANCHES', label: `শাখা ও গোডাউনসমূহ (${toBengaliNumber(branches.length)})` },
              ]}
              value={activeTab}
              onChange={setActiveTab}
            />

            {activeTab === 'BRANCHES' && (
              <button
                onClick={() => setIsAddBranchOpen(true)}
                className="btn-primary text-[13px] px-4"
              >
                <Plus className="w-4 h-4" />
                <span>+ নতুন শাখা যোগ</span>
              </button>
            )}
          </div>
        }
      />

      {/* AUDIT LOG TAB */}
      {activeTab === 'AUDIT' && (
        <div className="card-apple p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0e0e0] pb-3.5">
            <div>
              <h3 className="font-semibold text-[20px] text-[#1d1d1f] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0066cc]" />
                <span>অপরিবর্তনযোগ্য অডিট হিস্ট্রি (Immutable Audit Log)</span>
              </h3>
              <p className="text-[12px] text-[#7a7a7a]">
                কোনো কর্মচারী বা স্টাফ কোনো এন্ট্রি দিলে, এডিট বা ডিলিট করলে এখানে তারিখ ও সময়সহ স্থায়ীভাবে রেকর্ড থাকবে
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <AppleSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="স্টাফের নাম বা বিবরণ..."
              />

              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="input-apple text-[13px] py-1.5"
              >
                <option value="ALL">সকল অ্যাকশন</option>
                <option value="INSERT">নতুন এন্ট্রি (INSERT)</option>
                <option value="UPDATE">তথ্য পরিবর্তন (UPDATE)</option>
                <option value="DELETE">মুছে ফেলা (DELETE)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-left bg-[#f5f5f7]">
                  <th className="py-2.5 px-3 font-semibold">তারিখ ও সময়</th>
                  <th className="py-2.5 px-3 font-semibold">ব্যবহারকারী</th>
                  <th className="py-2.5 px-3 font-semibold">রোল</th>
                  <th className="py-2.5 px-3 font-semibold">অ্যাকশন</th>
                  <th className="py-2.5 px-3 font-semibold">মডিউল</th>
                  <th className="py-2.5 px-3 font-semibold">কার্যক্রমের বিবরণ (Summary)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#7a7a7a]">
                      কোনো অডিট লগ রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const dateFormatted = new Date(log.timestamp).toLocaleString('bn-BD', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });

                    return (
                      <tr key={log.id} className="hover:bg-[#f5f5f7]">
                        <td className="py-2.5 px-3 text-[#7a7a7a] font-mono text-[11px] whitespace-nowrap">
                          {toBengaliNumber(dateFormatted)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#1d1d1f]">
                          {log.actor_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="badge-pill text-[10px] py-0 px-2">
                            {log.actor_role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="badge-blue text-[10px] py-0 px-2 font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#4e4e4e]">
                          {log.entity_name}
                        </td>
                        <td className="py-2.5 px-3 text-[#1d1d1f]">
                          {log.summary}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BRANCHES TAB */}
      {activeTab === 'BRANCHES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => (
            <div
              key={b.id}
              className="card-apple p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge-blue text-[11px] py-0 px-2">
                      {b.branch_code}
                    </span>
                    <h3 className="font-semibold text-[20px] text-[#1d1d1f] mt-1.5">
                      {b.name}
                    </h3>
                  </div>
                  {b.is_main && (
                    <span className="badge-pill text-[10px] py-0 px-2">
                      ★ প্রধান আড়ৎ
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-[13px] text-[#4e4e4e]">
                  <div>ঠিকানা: {b.address}</div>
                  {b.phone && <div>যোগাযোগ: {toBengaliNumber(b.phone)}</div>}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e0e0e0] text-xs text-[#15803d] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                <span>শাখা সক্রিয় রয়েছে</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD BRANCH MODAL */}
      <AppleModal
        isOpen={isAddBranchOpen}
        onClose={() => setIsAddBranchOpen(false)}
        title="নতুন শাখা বা গোডাউন যুক্ত করুন"
        subtitle="ভবিষ্যতে ব্যবসার শাখা বাড়লে একই সফটওয়্যার থেকে শাখাভিত্তিক স্টক ও সমন্বিত হিসাব দেখা যাবে"
      >
        <form onSubmit={handleCreateBranch} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              শাখা বা গোডাউনের নাম
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: মিরপুর শাখা গোডাউন"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">ঠিকানা</label>
            <input
              type="text"
              required
              placeholder="শাখার বিস্তারিত ঠিকানা"
              value={branchAddress}
              onChange={(e) => setBranchAddress(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">ফোন নম্বর</label>
            <input
              type="text"
              placeholder="শাখা ইনচার্জের ফোন"
              value={branchPhone}
              onChange={(e) => setBranchPhone(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddBranchOpen(false)}
              className="btn-outline text-[13px] px-4"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              শাখা তৈরি করুন
            </button>
          </div>
        </form>
      </AppleModal>
    </div>
  );
};
