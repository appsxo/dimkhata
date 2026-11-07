import React, { useState } from 'react';
import { Plus, Lock } from 'lucide-react';
import { Branch, AuditLog } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { toBengaliNumber } from '../lib/egg-units';
import { useLanguage } from '../lib/i18n';
import { sanitizeText } from '../lib/security';
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
  const { lang, t } = useLanguage();
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

    const branchCode = `SE-BR-${String(branches.length + 1).padStart(3, '0')}`;
    DimKhataStore.addBranch({
      branch_code: branchCode,
      name: sanitizeText(branchName, 100),
      address: sanitizeText(branchAddress, 200),
      phone: sanitizeText(branchPhone, 30),
      is_main: false,
      is_active: true,
    });

    setIsAddBranchOpen(false);
    setBranchName('');
    setBranchAddress('');
    setBranchPhone('');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <AppleSectionHeader
        title={t('শাখা ও ডিজিটাল অডিট লগ', 'Branches & Digital Audit Trail')}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AppleOptionChips
              options={[
                {
                  value: 'AUDIT',
                  label: t(
                    `অডিট লগ (${toBengaliNumber(auditLogs.length)})`,
                    `Audit Log (${auditLogs.length})`
                  ),
                },
                {
                  value: 'BRANCHES',
                  label: t(
                    `শাখাসমূহ (${toBengaliNumber(branches.length)})`,
                    `Branches (${branches.length})`
                  ),
                },
              ]}
              value={activeTab}
              onChange={setActiveTab}
            />

            {activeTab === 'BRANCHES' && (
              <button
                type="button"
                onClick={() => setIsAddBranchOpen(true)}
                className="btn-primary text-[13px] px-4"
              >
                <Plus className="w-4 h-4" />
                <span>{t('+ নতুন শাখা', '+ Add Branch')}</span>
              </button>
            )}
          </div>
        }
      />

      {activeTab === 'AUDIT' && (
        <div className="card-apple p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#e0e0e0] pb-3">
            <h3 className="font-semibold text-[17px] text-[#1d1d1f] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0066cc]" />
              <span>{t('অডিট হিস্ট্রি', 'Audit History')}</span>
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              <AppleSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('খুঁজুন...', 'Search...')}
              />

              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="input-apple text-[13px] py-1.5"
              >
                <option value="ALL">{t('সকল অ্যাকশন', 'All Actions')}</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-left bg-[#f5f5f7]">
                  <th className="py-2 px-3 font-semibold">{t('তারিখ ও সময়', 'Timestamp')}</th>
                  <th className="py-2 px-3 font-semibold">{t('ব্যবহারকারী', 'Actor')}</th>
                  <th className="py-2 px-3 font-semibold">{t('রোল', 'Role')}</th>
                  <th className="py-2 px-3 font-semibold">{t('অ্যাকশন', 'Action')}</th>
                  <th className="py-2 px-3 font-semibold">{t('মডিউল', 'Module')}</th>
                  <th className="py-2 px-3 font-semibold">{t('বিবরণ', 'Summary')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-7 text-center text-[#7a7a7a]">
                      {t('কোনো অডিট লগ রেকর্ড নেই।', 'No audit logs found.')}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const dateFormatted = new Date(log.timestamp).toLocaleString(
                      lang === 'bn' ? 'bn-BD' : 'en-US',
                      { dateStyle: 'medium', timeStyle: 'short' }
                    );
                    return (
                      <tr key={log.id} className="hover:bg-[#f5f5f7]">
                        <td className="py-2 px-3 text-[#7a7a7a] font-mono text-[11px] whitespace-nowrap">
                          {toBengaliNumber(dateFormatted)}
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#1d1d1f]">{log.actor_name}</td>
                        <td className="py-2 px-3">
                          <span className="badge-pill text-[10px] py-0 px-2">{log.actor_role}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="badge-blue text-[10px] py-0 px-2 font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#4e4e4e]">{log.entity_name}</td>
                        <td className="py-2 px-3 text-[#1d1d1f]">{log.summary}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'BRANCHES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {branches.map((b) => (
            <div key={b.id} className="card-apple p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge-blue text-[11px] py-0 px-2">{b.branch_code}</span>
                    <h3 className="font-semibold text-[18px] text-[#1d1d1f] mt-1.5">{b.name}</h3>
                  </div>
                  {b.is_main && (
                    <span className="badge-pill text-[10px] py-0 px-2">
                      ★ {t('প্রধান আড়ৎ', 'Main Branch')}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 space-y-1 text-[13px] text-[#4e4e4e]">
                  <div>
                    {t('ঠিকানা:', 'Address:')} {b.address}
                  </div>
                  {b.phone && (
                    <div>
                      {t('ফোন:', 'Phone:')} {toBengaliNumber(b.phone)}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#e0e0e0] text-xs text-[#15803d] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                <span>{t('শাখা সক্রিয়', 'Active Branch')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AppleModal
        isOpen={isAddBranchOpen}
        onClose={() => setIsAddBranchOpen(false)}
        title={t('নতুন শাখা বা গোডাউন যুক্ত করুন', 'Add New Branch or Godown')}
      >
        <form onSubmit={handleCreateBranch} className="space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('শাখার নাম *', 'Branch Name *')}
            </label>
            <input
              type="text"
              required
              placeholder={t('যেমন: মিরপুর গোডাউন', 'e.g. Mirpur Godown')}
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('ঠিকানা *', 'Address *')}
            </label>
            <input
              type="text"
              required
              placeholder={t('বিস্তারিত ঠিকানা', 'Full branch address')}
              value={branchAddress}
              onChange={(e) => setBranchAddress(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('ফোন নম্বর', 'Phone Number')}
            </label>
            <input
              type="text"
              placeholder="017XX-XXXXXX"
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
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('শাখা তৈরি করুন', 'Create Branch')}
            </button>
          </div>
        </form>
      </AppleModal>
    </div>
  );
};
