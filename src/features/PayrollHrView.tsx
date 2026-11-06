// ====================================================================
// DIMKHATA (ডিমখাতা) — Payroll & Employee Management (Req 11)
// ====================================================================

import React, { useState } from 'react';
import { Briefcase, Plus, DollarSign, Calendar, Printer, UserCheck, ShieldCheck } from 'lucide-react';
import { Employee, SalaryAdvance, PayrollRecord, FinancialAccount, Branch } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';

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
  branches,
  onRefresh,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // '2026-11'

  // Add Employee Modal
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [empName, setEmpName] = useState('');
  const [designation, setDesignation] = useState('স্টাফ / বিক্রয়কর্মী');
  const [empPhone, setEmpPhone] = useState('');
  const [baseSalary, setBaseSalary] = useState(18000);
  const [nidNumber, setNidNumber] = useState('');

  // Salary Advance Modal
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [advEmpId, setAdvEmpId] = useState(employees[0]?.id || '');
  const [advAmount, setAdvAmount] = useState(2000);
  const [advPurpose, setAdvPurpose] = useState('');
  const [advAccountId, setAdvAccountId] = useState(accounts[0]?.id || '');

  // Monthly Payroll Calculation Modal
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedEmpForPayroll, setSelectedEmpForPayroll] = useState<Employee | null>(null);
  const [bonus, setBonus] = useState<number>(0);
  const [payrollAccountId, setPayrollAccountId] = useState(accounts[0]?.id || '');

  // Printable Salary Slip
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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-700" />
            <span>কর্মচারীদের বেতন ও অ্যাডভান্স (Payroll Management - Req 11)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            কর্মচারী আইডি (SE-EMP), মাসিক বেতন, অগ্রিম কর্তন ও বেতন রসিদ প্রিন্ট
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdvanceOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs transition"
          >
            <DollarSign className="w-4 h-4 text-amber-700" />
            <span>অগ্রিম বেতন (Advance) এন্ট্রি</span>
          </button>
          <button
            onClick={() => setIsAddEmpOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কর্মচারী নিয়োগ</span>
          </button>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => {
          // Calculate this month's advances taken
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
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                      {emp.employee_code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">
                      {emp.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {emp.designation}
                    </p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                    {emp.salary_type === 'MONTHLY' ? 'মাসিক' : 'দৈনিক'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>মোবাইল:</span>
                    <span className="font-medium text-slate-800">{toBengaliNumber(emp.phone)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>মূল নির্ধারিত বেতন:</span>
                    <span className="font-bold text-slate-900">{formatTaka(emp.base_salary)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 bg-rose-50/60 p-1.5 rounded-lg border border-rose-200">
                    <span>চলতি মাসে নেওয়া অগ্রিম:</span>
                    <span className="font-bold">- {formatTaka(totalAdvancesTaken)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                {isPayrollPaid ? (
                  <div className="py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl text-center border border-emerald-200">
                    ✓ চলতি মাসের বেতন পরিশোধিত
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedEmpForPayroll(emp);
                      setIsPayrollModalOpen(true);
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>মাসিক পে-রোল প্রস্তুত ও পরিশোধ</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Salary Slips & History */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Printer className="w-4 h-4 text-amber-700" />
          <span>পরিশোধিত বেতন রসিদসমূহ (Salary Slips)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50">
                <th className="py-2.5 px-3">রসিদ কোড</th>
                <th className="py-2.5 px-3">কর্মচারীর নাম</th>
                <th className="py-2.5 px-3">বেতন মাস</th>
                <th className="py-2.5 px-3">মূল বেতন</th>
                <th className="py-2.5 px-3">অগ্রিম কর্তন</th>
                <th className="py-2.5 px-3 text-right">নীট প্রদেয়</th>
                <th className="py-2.5 px-3 text-center">রসিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    এখনো কোনো বেতন রসিদ তৈরি হয়নি।
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => {
                  const emp = employees.find((e) => e.id === p.employee_id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-800">
                        {p.payroll_code}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {emp?.full_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        {p.salary_month}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {formatTaka(p.base_salary)}
                      </td>
                      <td className="py-2.5 px-3 text-rose-700 font-semibold">
                        - {formatTaka(p.advances_deducted)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-800">
                        {formatTaka(p.net_payable)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSlipRecord(p)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-[11px] font-bold"
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

      {/* SALARY ADVANCE MODAL */}
      {isAdvanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              অগ্রিম বেতন (Advance) প্রদান
            </h3>

            <form onSubmit={handleSaveAdvance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কর্মচারী নির্বাচন
                </label>
                <select
                  value={advEmpId}
                  onChange={(e) => setAdvEmpId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অগ্রিম টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  required
                  value={advAmount}
                  onChange={(e) => setAdvAmount(Number(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কোন একাউন্ট থেকে দেওয়া হচ্ছে?
                </label>
                <select
                  value={advAccountId}
                  onChange={(e) => setAdvAccountId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatTaka(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কারণ / বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="উদা: পারিবারিক খরচ / চিকিৎসা"
                  value={advPurpose}
                  onChange={(e) => setAdvPurpose(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdvanceOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs"
                >
                  অগ্রিম প্রদান করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MONTHLY PAYROLL PROCESS MODAL */}
      {isPayrollModalOpen && selectedEmpForPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              মাসিক বেতন পে-রোল প্রস্তুত ({toBengaliNumber(currentMonthStr)})
            </h3>
            <p className="text-xs text-slate-500">
              কর্মচারী: <strong>{selectedEmpForPayroll.full_name}</strong> ({selectedEmpForPayroll.employee_code})
            </p>

            <form onSubmit={handleProcessPayroll} className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">নির্ধারিত মূল বেতন:</span>
                  <span className="font-bold">{formatTaka(selectedEmpForPayroll.base_salary)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-medium">
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বোনাস / বকশিশ (যদি থাকে)
                </label>
                <input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(Number(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পেমেন্ট মাধ্যম (একাউন্ট)
                </label>
                <select
                  value={payrollAccountId}
                  onChange={(e) => setPayrollAccountId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatTaka(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-sm font-black text-emerald-900">
                <span>নীট প্রদেয় বেতন:</span>
                <span>
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  বেতন পরিশোধ ও রসিদ তৈরি
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALARY SLIP MODAL */}
      {slipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 print-card">
            <div className="text-center border-b pb-3 border-slate-200">
              <h3 className="font-bold text-base text-amber-800">
                শরিফ এন্ড ইমান এন্টারপ্রাইজ
              </h3>
              <div className="text-xs text-slate-500 font-semibold uppercase">
                মাসিক বেতন রসিদ (Salary Slip)
              </div>
            </div>

            <div className="text-xs space-y-1.5 py-1">
              <div className="flex justify-between">
                <span className="text-slate-500">রসিদ নম্বর:</span>
                <span className="font-mono font-bold text-slate-800">{slipRecord.payroll_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">কর্মচারী:</span>
                <span className="font-bold text-slate-900">
                  {employees.find((e) => e.id === slipRecord.employee_id)?.full_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">বেতন মাস:</span>
                <span className="font-medium">{slipRecord.salary_month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">পরিশোধের তারিখ:</span>
                <span>{toBengaliNumber(slipRecord.payment_date)}</span>
              </div>
            </div>

            <div className="border-t border-b border-slate-200 py-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>মূল বেতন:</span>
                <span>{formatTaka(slipRecord.base_salary)}</span>
              </div>
              {slipRecord.bonus > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>বোনাস / ভাতা:</span>
                  <span>+ {formatTaka(slipRecord.bonus)}</span>
                </div>
              )}
              {slipRecord.advances_deducted > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>অগ্রিম কর্তন (Advance):</span>
                  <span>- {formatTaka(slipRecord.advances_deducted)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-1.5">
                <span>নীট প্রাপ্ত বেতন:</span>
                <span className="text-amber-800">{formatTaka(slipRecord.net_payable)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-center text-slate-500 pt-6">
              <div className="border-t border-slate-400 w-28 mx-auto">
                কর্মচারীর স্বাক্ষর
              </div>
              <div className="border-t border-slate-400 w-28 mx-auto">
                মালিকের স্বাক্ষর
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 no-print">
              <button
                onClick={() => setSlipRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
