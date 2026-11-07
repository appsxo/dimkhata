// ====================================================================
// DIMKHATA (ডিমখাতা) — Payroll & Employee HR (Apple Design System)
// ====================================================================

import React, { useState } from 'react';
import { Plus, DollarSign, Calendar, Printer } from 'lucide-react';
import { Employee, SalaryAdvance, PayrollRecord, FinancialAccount, Branch } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { AppleSectionHeader, AppleModal } from '../components/ui/AppleUI';

interface PayrollHrViewProps {
  employees: Employee[];
  advances: SalaryAdvance[];
  payrolls: PayrollRecord[];
  accounts: FinancialAccount[];
  branches: Branch[];
  onRefresh: () => void;
}

export const PayrollHrView: React.FC<PayrollHrViewProps> = ({
  employees,
  advances,
  payrolls,
  accounts,
  onRefresh,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [empName, setEmpName] = useState('');
  const [designation, setDesignation] = useState('স্টাফ / বিক্রয়কর্মী');
  const [empPhone, setEmpPhone] = useState('');
  const [baseSalary, setBaseSalary] = useState(18000);
  const [nidNumber, setNidNumber] = useState('');

  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [advEmpId, setAdvEmpId] = useState(employees[0]?.id || '');
  const [advAmount, setAdvAmount] = useState(2000);
  const [advPurpose, setAdvPurpose] = useState('');
  const [advAccountId, setAdvAccountId] = useState(accounts[0]?.id || '');

  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedEmpForPayroll, setSelectedEmpForPayroll] = useState<Employee | null>(null);
  const [bonus, setBonus] = useState<number>(0);
  const [payrollAccountId, setPayrollAccountId] = useState(accounts[0]?.id || '');

  const [slipRecord, setSlipRecord] = useState<PayrollRecord | null>(null);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empPhone) return;

    const code = DimKhataStore.getNextCode('EMP');
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employee_code: code,
      full_name: empName,
      designation,
      phone: empPhone,
      nid_number: nidNumber,
      kyc_docs: [],
      joining_date: new Date().toISOString().split('T')[0],
      salary_type: 'MONTHLY',
      base_salary: baseSalary,
      branch_id: 'br-01',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    DimKhataStore.saveEmployee(newEmp);
    alert(`কর্মচারী সফলভাবে নিবন্ধিত হয়েছেন! কর্মচারী আইডি: ${code}`);
    setIsAddEmpOpen(false);
    setEmpName('');
    setEmpPhone('');
    onRefresh();
  };

  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advEmpId || advAmount <= 0) return;

    const advance: SalaryAdvance = {
      id: `adv-${Date.now()}`,
      employee_id: advEmpId,
      advance_date: new Date().toISOString().split('T')[0],
      amount: advAmount,
      purpose: advPurpose || 'জরুরী ব্যক্তিগত প্রয়োজন',
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordSalaryAdvance(advance, advAccountId, 'br-01');
    alert('অগ্রিম বেতন সফলভাবে সংরক্ষিত হয়েছে ও ক্যাশ বুক থেকে বাদ দেওয়া হয়েছে!');
    setIsAdvanceOpen(false);
    onRefresh();
  };

  const handleProcessPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForPayroll) return;

    const totalAdvances = advances
      .filter((a) => a.employee_id === selectedEmpForPayroll.id && a.advance_date.startsWith(currentMonthStr))
      .reduce((sum, a) => sum + a.amount, 0);

    const netPayable = Math.max(0, selectedEmpForPayroll.base_salary + bonus - totalAdvances);
    const payCode = DimKhataStore.getNextCode('PAY');

    const record: PayrollRecord = {
      id: `pay-${Date.now()}`,
      payroll_code: payCode,
      employee_id: selectedEmpForPayroll.id,
      salary_month: currentMonthStr,
      base_salary: selectedEmpForPayroll.base_salary,
      bonus,
      deductions: 0,
      advances_deducted: totalAdvances,
      net_payable: netPayable,
      payment_status: 'PAID',
      payment_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordPayroll(record, payrollAccountId, 'br-01');
    alert(`মাসিক বেতন পরিশোধ সম্পন্ন! রসিদ নং: ${payCode}`);
    setIsPayrollModalOpen(false);
    setSlipRecord(record);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <AppleSectionHeader
        eyebrow="কর্মচারী ও এইচআর ব্যবস্থাপনা"
        title="কর্মচারীদের বেতন ও অ্যাডভান্স (Payroll)"
        subtitle="কর্মচারী আইডি (SE-EMP), মাসিক বেতন, অগ্রিম কর্তন ও বেতন রসিদ প্রিন্ট"
        actions={
          <>
            <button
              onClick={() => setIsAdvanceOpen(true)}
              className="btn-outline text-[13px] px-4"
            >
              <DollarSign className="w-4 h-4" />
              <span>অগ্রিম বেতন (Advance)</span>
            </button>
            <button
              onClick={() => setIsAddEmpOpen(true)}
              className="btn-primary text-[13px] px-4"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন কর্মচারী নিয়োগ</span>
            </button>
          </>
        }
      />

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => {
          const empAdvances = advances.filter(
            (a) => a.employee_id === emp.id && a.advance_date.startsWith(currentMonthStr)
          );
          const totalAdvancesTaken = empAdvances.reduce((sum, a) => sum + a.amount, 0);
          const isPayrollPaid = payrolls.some(
            (p) => p.employee_id === emp.id && p.salary_month === currentMonthStr
          );

          return (
            <div
              key={emp.id}
              className="card-apple p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge-blue text-[11px] py-0 px-2">
                      {emp.employee_code}
                    </span>
                    <h3 className="font-semibold text-[19px] text-[#1d1d1f] mt-1.5">
                      {emp.full_name}
                    </h3>
                    <p className="text-[12px] text-[#7a7a7a]">
                      {emp.designation}
                    </p>
                  </div>
                  <span className="badge-pill text-[10px] py-0 px-2">
                    {emp.salary_type === 'MONTHLY' ? 'মাসিক' : 'দৈনিক'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-[13px] text-[#4e4e4e]">
                  <div className="flex justify-between">
                    <span className="text-[#7a7a7a]">মোবাইল:</span>
                    <span>{toBengaliNumber(emp.phone)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7a7a7a]">নির্ধারিত মূল বেতন:</span>
                    <span className="font-semibold text-[#1d1d1f]">{formatTaka(emp.base_salary)}</span>
                  </div>
                  <div className="flex justify-between bg-[#f5f5f7] p-2.5 rounded-[10px] border border-[#e0e0e0] text-[#1d1d1f]">
                    <span>চলতি মাসের অগ্রিম:</span>
                    <span className="font-semibold text-[#d92916]">- {formatTaka(totalAdvancesTaken)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e0e0e0]">
                {isPayrollPaid ? (
                  <div className="py-2 bg-[#f5f5f7] text-[#15803d] text-[12px] font-semibold rounded-[980px] text-center border border-[#e0e0e0]">
                    ✓ চলতি মাসের বেতন পরিশোধিত
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedEmpForPayroll(emp);
                      setIsPayrollModalOpen(true);
                    }}
                    className="btn-primary w-full text-[13px] min-h-[42px]"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>মাসিক পে-রোল প্রস্তুত ও পরিশোধ</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Salary Slips */}
      <div className="card-apple p-5 sm:p-6 space-y-4">
        <h3 className="font-semibold text-[20px] text-[#1d1d1f] flex items-center gap-2">
          <Printer className="w-4 h-4 text-[#0066cc]" />
          <span>পরিশোধিত বেতন রসিদসমূহ (Salary Slips)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-left bg-[#f5f5f7]">
                <th className="py-2.5 px-3 font-semibold">রসিদ কোড</th>
                <th className="py-2.5 px-3 font-semibold">কর্মচারীর নাম</th>
                <th className="py-2.5 px-3 font-semibold">বেতন মাস</th>
                <th className="py-2.5 px-3 font-semibold">মূল বেতন</th>
                <th className="py-2.5 px-3 font-semibold">অগ্রিম কর্তন</th>
                <th className="py-2.5 px-3 font-semibold text-right">নীট প্রদেয়</th>
                <th className="py-2.5 px-3 font-semibold text-center">রসিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7a7a7a]">
                    এখনো কোনো বেতন রসিদ তৈরি হয়নি।
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => {
                  const emp = employees.find((e) => e.id === p.employee_id);
                  return (
                    <tr key={p.id} className="hover:bg-[#f5f5f7]">
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#0066cc]">
                        {p.payroll_code}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#1d1d1f]">
                        {emp?.full_name}
                      </td>
                      <td className="py-2.5 px-3 text-[#7a7a7a] font-mono">
                        {p.salary_month}
                      </td>
                      <td className="py-2.5 px-3 text-[#4e4e4e]">
                        {formatTaka(p.base_salary)}
                      </td>
                      <td className="py-2.5 px-3 text-[#d92916]">
                        - {formatTaka(p.advances_deducted)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#1d1d1f]">
                        {formatTaka(p.net_payable)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSlipRecord(p)}
                          className="btn-outline text-[11px] min-h-[32px] py-1 px-3"
                        >
                          স্লিপ দেখুন
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD NEW EMPLOYEE MODAL */}
      <AppleModal
        isOpen={isAddEmpOpen}
        onClose={() => setIsAddEmpOpen(false)}
        title="নতুন কর্মচারী নিয়োগ (SE-EMP)"
        subtitle="সফটওয়্যার স্বয়ংক্রিয়ভাবে কর্মচারী আইডি (SE-EMP-00X) জেনারেট করবে"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              কর্মচারীর পূর্ণ নাম
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: মো: সুমন মিয়া"
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                পদবি (Designation)
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="input-apple w-full text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                মোবাইল নম্বর
              </label>
              <input
                type="tel"
                required
                placeholder="018xxxxxxxx"
                value={empPhone}
                onChange={(e) => setEmpPhone(e.target.value)}
                className="input-apple w-full text-[14px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                মাসিক মূল বেতন (৳)
              </label>
              <input
                type="number"
                required
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                className="input-apple w-full text-[14px] font-semibold"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                জাতীয় পরিচয়পত্র (NID)
              </label>
              <input
                type="text"
                placeholder="NID নম্বর"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                className="input-apple w-full text-[14px] font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddEmpOpen(false)}
              className="btn-outline text-[13px] px-4"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              কর্মচারী নিবন্ধন করুন
            </button>
          </div>
        </form>
      </AppleModal>

      {/* SALARY ADVANCE MODAL */}
      <AppleModal
        isOpen={isAdvanceOpen}
        onClose={() => setIsAdvanceOpen(false)}
        title="অগ্রিম বেতন (Advance) প্রদান"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSaveAdvance} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              কর্মচারী নির্বাচন
            </label>
            <select
              value={advEmpId}
              onChange={(e) => setAdvEmpId(e.target.value)}
              className="input-apple w-full text-[14px]"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              অগ্রিম টাকার পরিমাণ (৳)
            </label>
            <input
              type="number"
              required
              value={advAmount}
              onChange={(e) => setAdvAmount(Number(e.target.value) || 0)}
              className="input-apple w-full text-[15px] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              উৎস একাউন্ট
            </label>
            <select
              value={advAccountId}
              onChange={(e) => setAdvAccountId(e.target.value)}
              className="input-apple w-full text-[14px]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatTaka(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              কারণ / বিবরণ
            </label>
            <input
              type="text"
              placeholder="উদা: পারিবারিক খরচ / চিকিৎসা"
              value={advPurpose}
              onChange={(e) => setAdvPurpose(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdvanceOpen(false)}
              className="btn-outline text-[13px] px-4"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              অগ্রিম প্রদান করুন
            </button>
          </div>
        </form>
      </AppleModal>

      {/* MONTHLY PAYROLL PROCESS MODAL */}
      <AppleModal
        isOpen={Boolean(isPayrollModalOpen && selectedEmpForPayroll)}
        onClose={() => setIsPayrollModalOpen(false)}
        title={`মাসিক বেতন পে-রোল প্রস্তুত (${toBengaliNumber(currentMonthStr)})`}
        subtitle={selectedEmpForPayroll ? `কর্মচারী: ${selectedEmpForPayroll.full_name} (${selectedEmpForPayroll.employee_code})` : ''}
      >
        {selectedEmpForPayroll && (
          <form onSubmit={handleProcessPayroll} className="space-y-3.5">
            <div className="bg-[#f5f5f7] p-3.5 rounded-[12px] border border-[#e0e0e0] space-y-2 text-[13px]">
              <div className="flex justify-between text-[#4e4e4e]">
                <span>নির্ধারিত মূল বেতন:</span>
                <span className="font-semibold text-[#1d1d1f]">{formatTaka(selectedEmpForPayroll.base_salary)}</span>
              </div>
              <div className="flex justify-between text-[#d92916]">
                <span>চলতি মাসের অগ্রিম কর্তন:</span>
                <span>
                  - {formatTaka(
                    advances
                      .filter(
                        (a) =>
                          a.employee_id === selectedEmpForPayroll.id &&
                          a.advance_date.startsWith(currentMonthStr)
                      )
                      .reduce((sum, a) => sum + a.amount, 0)
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                বোনাস / বকশিশ
              </label>
              <input
                type="number"
                value={bonus}
                onChange={(e) => setBonus(Number(e.target.value) || 0)}
                className="input-apple w-full text-[14px] font-semibold"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                পেমেন্ট মাধ্যম (একাউন্ট)
              </label>
              <select
                value={payrollAccountId}
                onChange={(e) => setPayrollAccountId(e.target.value)}
                className="input-apple w-full text-[14px]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatTaka(a.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] flex justify-between items-center text-[14px] font-semibold text-[#1d1d1f]">
              <span>নীট প্রদেয় বেতন:</span>
              <span className="font-semibold text-[22px] text-[#0066cc]">
                {formatTaka(
                  Math.max(
                    0,
                    selectedEmpForPayroll.base_salary +
                      bonus -
                      advances
                        .filter(
                          (a) =>
                            a.employee_id === selectedEmpForPayroll.id &&
                            a.advance_date.startsWith(currentMonthStr)
                        )
                        .reduce((sum, a) => sum + a.amount, 0)
                  )
                )}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPayrollModalOpen(false)}
                className="btn-outline text-[13px] px-4"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="btn-primary text-[13px] px-5"
              >
                বেতন পরিশোধ ও রসিদ তৈরি
              </button>
            </div>
          </form>
        )}
      </AppleModal>

      {/* SALARY SLIP MODAL */}
      {slipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3">
          <div className="bg-white rounded-[18px] max-w-md w-full p-8 space-y-4 print-card border border-[#e0e0e0]">
            <div className="text-center border-b pb-3 border-[#e0e0e0]">
              <h3 className="font-semibold text-[22px] text-[#1d1d1f]">
                শরিফ এন্ড ইমান এন্টারপ্রাইজ
              </h3>
              <div className="text-[12px] text-[#7a7a7a] uppercase tracking-wider mt-1">
                মাসিক বেতন রসিদ (Salary Slip)
              </div>
            </div>

            <div className="text-[13px] space-y-1.5 py-1 text-[#4e4e4e]">
              <div className="flex justify-between">
                <span className="text-[#7a7a7a]">রসিদ নম্বর:</span>
                <span className="font-mono text-[#0066cc] font-semibold">{slipRecord.payroll_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7a7a]">কর্মচারী:</span>
                <span className="font-semibold text-[#1d1d1f]">
                  {employees.find((e) => e.id === slipRecord.employee_id)?.full_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7a7a]">বেতন মাস:</span>
                <span className="font-semibold">{slipRecord.salary_month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7a7a]">পরিশোধের তারিখ:</span>
                <span>{toBengaliNumber(slipRecord.payment_date)}</span>
              </div>
            </div>

            <div className="border-t border-b border-[#e0e0e0] py-3 space-y-1.5 text-[13px] text-[#4e4e4e]">
              <div className="flex justify-between">
                <span>মূল বেতন:</span>
                <span>{formatTaka(slipRecord.base_salary)}</span>
              </div>
              {slipRecord.bonus > 0 && (
                <div className="flex justify-between">
                  <span>বোনাস / ভাতা:</span>
                  <span>+ {formatTaka(slipRecord.bonus)}</span>
                </div>
              )}
              {slipRecord.advances_deducted > 0 && (
                <div className="flex justify-between text-[#d92916]">
                  <span>অগ্রিম কর্তন:</span>
                  <span>- {formatTaka(slipRecord.advances_deducted)}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px] font-semibold text-[#1d1d1f] border-t border-[#e0e0e0] pt-2">
                <span>নীট প্রাপ্ত বেতন:</span>
                <span className="font-semibold text-[22px] text-[#0066cc]">{formatTaka(slipRecord.net_payable)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-center text-[#7a7a7a] pt-6">
              <div className="border-t border-[#7a7a7a] w-28 mx-auto pt-1">
                কর্মচারীর স্বাক্ষর
              </div>
              <div className="border-t border-[#7a7a7a] w-28 mx-auto pt-1">
                মালিকের স্বাক্ষর
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 no-print">
              <button
                onClick={() => setSlipRecord(null)}
                className="btn-outline text-[13px] px-4"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary text-[13px] px-5"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
