// ====================================================================
// DIMKHATA (ডিমখাতা) — Multi-Branch & Digital Audit Trail (Req 3, 4)
// ====================================================================

import React, { useState } from 'react';
import { Shield, Building2, Plus, Search, Filter, History, Lock, AlertCircle } from 'lucide-react';
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

  // Add Branch Modal
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-700" />
            <span>মাল্টি-গোডাউন শাখা ও ডিজিটাল অডিট ট্রেইল (Req 3, 4)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            কোন স্টাফ কখন সিস্টেমে এন্ট্রি বা পরিবর্তন করল তার ডিজিটাল রেকর্ড ও শাখা বিস্তার
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-4 py-1.5 rounded-lg transition ${
                activeTab === 'AUDIT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              ডিজিটাল অডিট লগ ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('BRANCHES')}
              className={`px-4 py-1.5 rounded-lg transition ${
                activeTab === 'BRANCHES'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              ব্যবসার শাখা ও গোডাউনসমূহ ({branches.length})
            </button>
          </div>

          {activeTab === 'BRANCHES' && (
            <button
              onClick={() => setIsAddBranchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন শাখা যোগ</span>
            </button>
          )}
        </div>
      </div>

      {/* AUDIT LOG TAB */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>অপরিবর্তনযোগ্য অডিট হিস্ট্রি (Immutable Audit Log)</span>
              </h3>
              <p className="text-xs text-slate-400">
                কোনো কর্মচারী বা স্টাফ কোনো এন্ট্রি দিলে, এডিট বা ডিলিট করলে এখানে তারিখ ও সময়সহ স্থায়ীভাবে রেকর্ড থাকবে
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="স্টাফের নাম বা বিবরণ দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-48 focus:outline-none"
                />
              </div>

              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
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
                <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50">
                  <th className="py-2.5 px-3">তারিখ ও সময়</th>
                  <th className="py-2.5 px-3">ব্যবহারকারী (Actor)</th>
                  <th className="py-2.5 px-3">রোল</th>
                  <th className="py-2.5 px-3">অ্যাকশন</th>
                  <th className="py-2.5 px-3">মডিউল</th>
                  <th className="py-2.5 px-3">কার্যক্রমের বিবরণ (Summary)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      কোনো অডিট লগ রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const actionColors = {
                      INSERT: 'bg-emerald-100 text-emerald-800',
                      UPDATE: 'bg-amber-100 text-amber-800',
                      DELETE: 'bg-rose-100 text-rose-800',
                    };
                    const dateFormatted = new Date(log.timestamp).toLocaleString('bn-BD', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {toBengaliNumber(dateFormatted)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {log.actor_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              log.actor_role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.actor_role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${actionColors[log.action]}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {log.entity_name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">
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
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-400 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                      {b.branch_code}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1">
                      {b.name}
                    </h3>
                  </div>
                  {b.is_main && (
                    <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      ★ প্রধান আড়ৎ
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div>ঠিকানা: {b.address}</div>
                  {b.phone && <div>যোগাযোগ: {toBengaliNumber(b.phone)}</div>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>শাখা সক্রিয় রয়েছে</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD BRANCH MODAL */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              নতুন শাখা বা গোডাউন যুক্ত করুন
            </h3>
            <p className="text-xs text-slate-500">
              ভবিষ্যতে ব্যবসার শাখা বাড়লে একই সফটওয়্যার থেকে শাখাভিত্তিক স্টক ও সমন্বিত হিসাব দেখা যাবে
            </p>

            <form onSubmit={handleCreateBranch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শাখা বা গোডাউনের নাম
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মিরপুর শাখা গোডাউন / কারওয়ান বাজার সেলস পয়েন্ট"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  required
                  placeholder="শাখার বিস্তারিত ঠিকানা"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ফোন নম্বর</label>
                <input
                  type="text"
                  placeholder="শাখা ইনচার্জের ফোন"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs"
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
