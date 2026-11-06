// ====================================================================
// DIMKHATA (ডিমখাতা) — Digital Audit Trail & Multi-Branch (ElevenLabs)
// ====================================================================

import React, { useState } from 'react';
import { Shield, Plus, Search, Lock } from 'lucide-react';
import { Branch, AuditLog } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { toBengaliNumber } from '../lib/egg-units';

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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-light text-3xl text-[#0c0a09] tracking-tight">
            মাল্টি-গোডাউন শাখা ও ডিজিটাল অডিট ট্রেইল (Req 3, 4)
          </h2>
          <p className="text-xs text-[#777169] mt-0.5">
            কোন স্টাফ কখন সিস্টেমে এন্ট্রি বা পরিবর্তন করল তার ডিজিটাল রেকর্ড ও শাখা বিস্তার
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-[#f0efed] p-1 rounded-full text-xs font-medium">
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-4 py-1.5 rounded-full transition ${
                activeTab === 'AUDIT'
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'text-[#4e4e4e] hover:text-[#0c0a09]'
              }`}
            >
              ডিজিটাল অডিট লগ ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('BRANCHES')}
              className={`px-4 py-1.5 rounded-full transition ${
                activeTab === 'BRANCHES'
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'text-[#4e4e4e] hover:text-[#0c0a09]'
              }`}
            >
              শাখা ও গোডাউনসমূহ ({branches.length})
            </button>
          </div>

          {activeTab === 'BRANCHES' && (
            <button
              onClick={() => setIsAddBranchOpen(true)}
              className="btn-primary text-xs h-9 px-4"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন শাখা যোগ</span>
            </button>
          )}
        </div>
      </div>

      {/* AUDIT LOG TAB */}
      {activeTab === 'AUDIT' && (
        <div className="card-editorial space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0efed] pb-3">
            <div>
              <h3 className="font-serif font-light text-2xl text-[#0c0a09] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#777169]" />
                <span>অপরিবর্তনযোগ্য অডিট হিস্ট্রি (Immutable Audit Log)</span>
              </h3>
              <p className="text-xs text-[#777169]">
                কোনো কর্মচারী বা স্টাফ কোনো এন্ট্রি দিলে, এডিট বা ডিলিট করলে এখানে তারিখ ও সময়সহ স্থায়ীভাবে রেকর্ড থাকবে
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#777169] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="স্টাফের নাম বা বিবরণ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-editorial pl-8 text-xs h-9 py-1 w-48"
                />
              </div>

              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="input-editorial text-xs h-9 py-1"
              >
                <option value="ALL">সকল অ্যাকশন</option>
                <option value="INSERT">নতুন এন্ট্রি (INSERT)</option>
                <option value="UPDATE">তথ্য পরিবর্তন (UPDATE)</option>
                <option value="DELETE">মুছে ফেলা (DELETE)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e7e5e4] text-[#777169] text-left bg-[#fafafa]">
                  <th className="py-2.5 px-3">তারিখ ও সময়</th>
                  <th className="py-2.5 px-3">ব্যবহারকারী</th>
                  <th className="py-2.5 px-3">রোল</th>
                  <th className="py-2.5 px-3">অ্যাকশন</th>
                  <th className="py-2.5 px-3">মডিউল</th>
                  <th className="py-2.5 px-3">কার্যক্রমের বিবরণ (Summary)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0efed]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#a8a29e]">
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
                      <tr key={log.id} className="hover:bg-[#fafafa]">
                        <td className="py-2.5 px-3 text-[#777169] font-mono text-[11px] whitespace-nowrap">
                          {toBengaliNumber(dateFormatted)}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#0c0a09]">
                          {log.actor_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="badge-pill text-[10px] py-0 px-2">
                            {log.actor_role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="badge-pill text-[10px] py-0 px-2 font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#4e4e4e]">
                          {log.entity_name}
                        </td>
                        <td className="py-2.5 px-3 text-[#0c0a09]">
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
              className="card-editorial flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge-pill text-[10px] py-0 px-2">
                      {b.branch_code}
                    </span>
                    <h3 className="font-serif font-light text-2xl text-[#0c0a09] mt-1.5">
                      {b.name}
                    </h3>
                  </div>
                  {b.is_main && (
                    <span className="badge-pill text-[10px] py-0 px-2">
                      ★ প্রধান আড়ৎ
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-[#4e4e4e]">
                  <div>ঠিকানা: {b.address}</div>
                  {b.phone && <div>যোগাযোগ: {toBengaliNumber(b.phone)}</div>}
                </div>
              </div>

              <div className="pt-3 border-t border-[#f0efed] text-xs text-[#16a34a] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                <span>শাখা সক্রিয় রয়েছে</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD BRANCH MODAL */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#e7e5e4]">
            <h3 className="font-serif font-light text-2xl text-[#0c0a09]">
              নতুন শাখা বা গোডাউন যুক্ত করুন
            </h3>
            <p className="text-xs text-[#777169]">
              ভবিষ্যতে ব্যবসার শাখা বাড়লে একই সফটওয়্যার থেকে শাখাভিত্তিক স্টক ও সমন্বিত হিসাব দেখা যাবে
            </p>

            <form onSubmit={handleCreateBranch} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  শাখা বা গোডাউনের নাম
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মিরপুর শাখা গোডাউন"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">ঠিকানা</label>
                <input
                  type="text"
                  required
                  placeholder="শাখার বিস্তারিত ঠিকানা"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">ফোন নম্বর</label>
                <input
                  type="text"
                  placeholder="শাখা ইনচার্জের ফোন"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="btn-outline text-xs h-9 px-4"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs h-9 px-5"
                >
                  শাখা তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
