import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, Printer, Users } from 'lucide-react';
import { Employee, SalaryAdvance, PayrollRecord, FinancialAccount, Branch } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { useLanguage } from '../lib/i18n';
import { sanitizeText } from '../lib/security';
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
  const { t } = useLanguage();
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

  useEffect(() => {
    if (!advEmpId && employees[0]?.id) setAdvEmpId(employees[0].id);
  }, [employees, advEmpId]);

  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedEmpForPayroll, setSelectedEmpForPayroll] = useState<Employee | null>(null);
  const [bonus, setBonus] = useState<number>(0);
  const [payrollAccountId, setPayrollAccountId] = useState(accounts[0]?.id || '');
  const [slipRecord, setSlipRecord] = useState<PayrollRecord | null>(null);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empPhone) return;

    const code = DimKhataStore.getNextCode('EMP');
    const newEmpId = `emp-${Date.now()}`;
    const cleanName = sanitizeText(empName, 100);
    const cleanPhone = sanitizeText(empPhone, 30);

    DimKhataStore.saveEmployee({
      id: newEmpId,
      employee_code: code,
      full_name: cleanName,
      designation: sanitizeText(designation, 80),
      phone: cleanPhone,
      nid_number: sanitizeText(nidNumber, 40),
      kyc_docs: [],
      joining_date: new Date().toISOString().split('T')[0],
      salary_type: 'MONTHLY',
      base_salary: baseSalary,
      branch_id: 'br-01',
      is_active: true,
      created_at: new Date().toISOString(),
    });

    // Also register as a STAFF user profile for secure login
    DimKhataStore.saveUser({
      id: `user-${newEmpId}`,
      employee_code: code,
      full_name: cleanName,
      role: 'STAFF',
      phone: cleanPhone,
      is_active: true,
    });

    alert(t(`কর্মচারী ও স্টাফ আইডি নিবন্ধিত হয়েছেন! আইডি: ${code}`, `Staff employee & login identity registered! ID: ${code}`));
    setIsAddEmpOpen(false);
    setEmpName('');
    setEmpPhone('');
    onRefresh();
  };

  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advEmpId || advAmount <= 0) return;

    DimKhataStore.recordSalaryAdvance(
      {
        id: `adv-${Date.now()}`,
        employee_id: advEmpId,
        advance_date: new Date().toISOString().split('T')[0],
        amount: advAmount,
        purpose: sanitizeText(advPurpose, 150) || t('ব্যক্তিগত অগ্রিম', 'Salary Advance'),
        created_at: new Date().toISOString(),
      },
      advAccountId,
      'br-01'
    );
    alert(t('অগ্রিম বেতন সংরক্ষিত হয়েছে!', 'Salary advance recorded!'));
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
    setIsPayrollModalOpen(false);
    setSlipRecord(record);
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <AppleSectionHeader
        title={t('কর্মচারীদের বেতন ও অ্যাডভান্স (Payroll)', 'Employee Payroll & Advances')}
        subtitle={t('কর্মচারী আইডি (SE-EMP), মাসিক বেতন, অগ্রিম কর্তন ও বেতন রসিদ', 'Staff IDs (SE-EMP), monthly payroll, advances & salary slips')}
        actions={
          <>
            {employees.length > 0 && (
              <button onClick={() => setIsAdvanceOpen(true)} className="btn-outline text-[13px] px-3.5">
                <DollarSign className="w-4 h-4" />
                <span>{t('অগ্রিম বেতন', 'Salary Advance')}</span>
              </button>
            )}
            <button onClick={() => setIsAddEmpOpen(true)} className="btn-primary text-[13px] px-4">
              <Plus className="w-4 h-4" />
              <span>{t('+ কর্মচারী নিয়োগ', '+ Add Employee')}</span>
            </button>
          </>
        }
      />

      {employees.length === 0 ? (
        <div className="card-apple p-8 text-center space-y-2.5">
          <div className="w-11 h-11 rounded-full bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center mx-auto">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-[16px] font-semibold text-[#1d1d1f]">
            {t('এখনো কোনো কর্মচারী যুক্ত করা হয়নি', 'No Employees Registered Yet')}
          </h3>
          <button type="button" onClick={() => setIsAddEmpOpen(true)} className="btn-primary mx-auto mt-1 text-[13px]">
            <Plus className="w-4 h-4" />
            <span>{t('+ প্রথম কর্মচারী যোগ করুন', '+ Add First Employee')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const totalAdvancesTaken = advances
              .filter((a) => a.employee_id === emp.id && a.advance_date.startsWith(currentMonthStr))
              .reduce((sum, a) => sum + a.amount, 0);
            const isPayrollPaid = payrolls.some((p) => p.employee_id === emp.id && p.salary_month === currentMonthStr);

            return (
              <div key={emp.id} className="card-apple p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="badge-blue text-[11px] py-0 px-2">{emp.employee_code}</span>
                      <h3 className="font-semibold text-[18px] text-[#1d1d1f] mt-1">{emp.full_name}</h3>
                      <p className="text-[12px] text-[#7a7a7a]">{emp.designation}</p>
                    </div>
                    <span className="badge-pill text-[10px] py-0 px-2">
                      {emp.salary_type === 'MONTHLY' ? t('মাসিক', 'Monthly') : t('দৈনিক', 'Daily')}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-[13px] text-[#4e4e4e]">
                    <div className="flex justify-between">
                      <span className="text-[#7a7a7a]">{t('মোবাইল:', 'Phone:')}</span>
                      <span>{toBengaliNumber(emp.phone)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7a7a7a]">{t('মূল বেতন:', 'Base Salary:')}</span>
                      <span className="font-semibold text-[#1d1d1f]">{formatTaka(emp.base_salary)}</span>
                    </div>
                    <div className="flex justify-between bg-[#f5f5f7] p-2 rounded-[10px] border border-[#e0e0e0] text-[#1d1d1f]">
                      <span>{t('চলতি মাসের অগ্রিম:', 'Month Advance:')}</span>
                      <span className="font-semibold text-[#d92916]">- {formatTaka(totalAdvancesTaken)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#e0e0e0]">
                  {isPayrollPaid ? (
                    <div className="py-2 bg-[#f5f5f7] text-[#15803d] text-[12px] font-semibold rounded-[980px] text-center border border-[#e0e0e0]">
                      ✓ {t('চলতি মাসের বেতন পরিশোধিত', 'Paid for This Month')}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedEmpForPayroll(emp);
                        setIsPayrollModalOpen(true);
                      }}
                      className="btn-primary w-full text-[13px] min-h-[40px]"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{t('মাসিক বেতন পরিশোধ', 'Pay Monthly Salary')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card-apple p-4 sm:p-5 space-y-3">
        <h3 className="font-semibold text-[16px] text-[#1d1d1f] flex items-center gap-2">
          <Printer className="w-4 h-4 text-[#0066cc]" />
          <span>{t('পরিশোধিত বেতন রসিদসমূহ (Salary Slips)', 'Paid Salary Slips')}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-left bg-[#f5f5f7]">
                <th className="py-2 px-3 font-semibold">{t('রসিদ কোড', 'Code')}</th>
                <th className="py-2 px-3 font-semibold">{t('কর্মচারী', 'Employee')}</th>
                <th className="py-2 px-3 font-semibold">{t('মাস', 'Month')}</th>
                <th className="py-2 px-3 font-semibold">{t('মূল বেতন', 'Base')}</th>
                <th className="py-2 px-3 font-semibold">{t('অগ্রিম কর্তন', 'Advance')}</th>
                <th className="py-2 px-3 font-semibold text-right">{t('নীট প্রদেয়', 'Net Paid')}</th>
                <th className="py-2 px-3 font-semibold text-center">{t('রসিদ', 'Slip')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#7a7a7a]">
                    {t('এখনো কোনো বেতন রসিদ তৈরি হয়নি।', 'No salary slips generated yet.')}
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => {
                  const emp = employees.find((e) => e.id === p.employee_id);
                  return (
                    <tr key={p.id} className="hover:bg-[#f5f5f7]">
                      <td className="py-2 px-3 font-mono font-semibold text-[#0066cc]">{p.payroll_code}</td>
                      <td className="py-2 px-3 font-semibold text-[#1d1d1f]">{emp?.full_name}</td>
                      <td className="py-2 px-3 text-[#7a7a7a] font-mono">{p.salary_month}</td>
                      <td className="py-2 px-3 text-[#4e4e4e]">{formatTaka(p.base_salary)}</td>
                      <td className="py-2 px-3 text-[#d92916]">- {formatTaka(p.advances_deducted)}</td>
                      <td className="py-2 px-3 text-right font-semibold text-[#1d1d1f]">{formatTaka(p.net_payable)}</td>
                      <td className="py-2 px-3 text-center">
                        <button onClick={() => setSlipRecord(p)} className="btn-outline text-[11px] min-h-[30px] py-1 px-2.5">
                          {t('স্লিপ', 'Slip')}
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

      <AppleModal
        isOpen={isAddEmpOpen}
        onClose={() => setIsAddEmpOpen(false)}
        title={t('নতুন কর্মচারী নিয়োগ (SE-EMP)', 'Register Employee (SE-EMP)')}
      >
        <form onSubmit={handleCreateEmployee} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('কর্মচারীর নাম', 'Full Name')}</label>
            <input
              type="text"
              required
              placeholder={t('যেমন: মো: সুমন মিয়া', 'e.g., Md. Sumon Mia')}
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('পদবি', 'Designation')}</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="input-apple w-full text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('মোবাইল নম্বর', 'Phone Number')}</label>
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
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('মাসিক মূল বেতন (৳)', 'Monthly Salary (৳)')}</label>
              <div className="relative flex items-center">
                <span className="input-prefix-symbol">৳</span>
                <input
                  type="number"
                  required
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                  className="input-apple input-has-prefix w-full text-[14px] font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('জাতীয় পরিচয়পত্র (NID)', 'NID Number')}</label>
              <input
                type="text"
                placeholder="NID"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                className="input-apple w-full text-[14px] font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAddEmpOpen(false)} className="btn-outline text-[13px] px-4">
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('সংরক্ষণ করুন', 'Save')}
            </button>
          </div>
        </form>
      </AppleModal>

      <AppleModal
        isOpen={isAdvanceOpen}
        onClose={() => setIsAdvanceOpen(false)}
        title={t('অগ্রিম বেতন প্রদান', 'Record Salary Advance')}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSaveAdvance} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('কর্মচারী নির্বাচন', 'Employee')}</label>
            <select value={advEmpId} onChange={(e) => setAdvEmpId(e.target.value)} className="input-apple w-full text-[14px]">
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('অগ্রিম টাকার পরিমাণ (৳)', 'Advance Amount (৳)')}</label>
            <div className="relative flex items-center">
              <span className="input-prefix-symbol">৳</span>
              <input
                type="number"
                required
                value={advAmount}
                onChange={(e) => setAdvAmount(Number(e.target.value) || 0)}
                className="input-apple input-has-prefix w-full text-[15px] font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('উৎস একাউন্ট', 'Account')}</label>
            <select value={advAccountId} onChange={(e) => setAdvAccountId(e.target.value)} className="input-apple w-full text-[14px]">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatTaka(a.current_balance)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('কারণ / বিবরণ', 'Reason')}</label>
            <input
              type="text"
              placeholder={t('উদা: পারিবারিক খরচ', 'e.g., Personal need')}
              value={advPurpose}
              onChange={(e) => setAdvPurpose(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAdvanceOpen(false)} className="btn-outline text-[13px] px-4">
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('প্রদান করুন', 'Save Advance')}
            </button>
          </div>
        </form>
      </AppleModal>

      <AppleModal
        isOpen={Boolean(isPayrollModalOpen && selectedEmpForPayroll)}
        onClose={() => setIsPayrollModalOpen(false)}
        title={t(`মাসিক বেতন পরিশোধ (${toBengaliNumber(currentMonthStr)})`, `Pay Monthly Salary (${currentMonthStr})`)}
        subtitle={selectedEmpForPayroll ? `${selectedEmpForPayroll.full_name} (${selectedEmpForPayroll.employee_code})` : ''}
      >
        {selectedEmpForPayroll && (
          <form onSubmit={handleProcessPayroll} className="space-y-3.5">
            <div className="bg-[#f5f5f7] p-3.5 rounded-[12px] border border-[#e0e0e0] space-y-1.5 text-[13px]">
              <div className="flex justify-between text-[#4e4e4e]">
                <span>{t('মূল বেতন:', 'Base Salary:')}</span>
                <span className="font-semibold text-[#1d1d1f]">{formatTaka(selectedEmpForPayroll.base_salary)}</span>
              </div>
              <div className="flex justify-between text-[#d92916]">
                <span>{t('চলতি মাসের অগ্রিম কর্তন:', 'Advance Deducted:')}</span>
                <span>
                  - {formatTaka(
                    advances
                      .filter((a) => a.employee_id === selectedEmpForPayroll.id && a.advance_date.startsWith(currentMonthStr))
                      .reduce((sum, a) => sum + a.amount, 0)
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('বোনাস / ভাতা', 'Bonus')}</label>
              <div className="relative flex items-center">
                <span className="input-prefix-symbol">৳</span>
                <input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(Number(e.target.value) || 0)}
                  className="input-apple input-has-prefix w-full text-[14px] font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('পেমেন্ট একাউন্ট', 'Payment Account')}</label>
              <select value={payrollAccountId} onChange={(e) => setPayrollAccountId(e.target.value)} className="input-apple w-full text-[14px]">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatTaka(a.current_balance)})</option>
                ))}
              </select>
            </div>

            <div className="p-3.5 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] flex justify-between items-center text-[14px] font-semibold text-[#1d1d1f]">
              <span>{t('নীট প্রদেয় বেতন:', 'Net Payable:')}</span>
              <span className="font-semibold text-[20px] text-[#0066cc]">
                {formatTaka(
                  Math.max(
                    0,
                    selectedEmpForPayroll.base_salary +
                      bonus -
                      advances
                        .filter((a) => a.employee_id === selectedEmpForPayroll.id && a.advance_date.startsWith(currentMonthStr))
                        .reduce((sum, a) => sum + a.amount, 0)
                  )
                )}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsPayrollModalOpen(false)} className="btn-outline text-[13px] px-4">
                {t('বাতিল', 'Cancel')}
              </button>
              <button type="submit" className="btn-primary text-[13px] px-5">
                {t('পরিশোধ ও রসিদ তৈরি', 'Pay & Generate Slip')}
              </button>
            </div>
          </form>
        )}
      </AppleModal>

      <AppleModal
        isOpen={Boolean(slipRecord)}
        onClose={() => setSlipRecord(null)}
        title={t('মাসিক বেতন রসিদ (Salary Slip)', 'Monthly Salary Slip')}
        subtitle={t('শরিফ এন্ড ইমান এন্টারপ্রাইজ', 'Sharif & Eman Enterprise')}
        maxWidth="max-w-md"
      >
        {slipRecord && (
          <div className="space-y-4 print-card">
            <div className="text-[13px] space-y-1.5 text-[#4e4e4e]">
              <div className="flex justify-between">
                <span className="text-[#7a7a7a]">{t('রসিদ নম্বর:', 'Slip Code:')}</span>
                <span className="font-mono text-[#0066cc] font-semibold">{slipRecord.payroll_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7a7a]">{t('কর্মচারী:', 'Employee:')}</span>
                <span className="font-semibold text-[#1d1d1f]">
                  {employees.find((e) => e.id === slipRecord.employee_id)?.full_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7a7a]">{t('বেতন মাস:', 'Salary Month:')}</span>
                <span className="font-semibold">{slipRecord.salary_month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7a7a]">{t('তারিখ:', 'Date:')}</span>
                <span>{toBengaliNumber(slipRecord.payment_date)}</span>
              </div>
            </div>

            <div className="border-t border-b border-[#e0e0e0] py-3 space-y-1.5 text-[13px] text-[#4e4e4e]">
              <div className="flex justify-between">
                <span>{t('মূল বেতন:', 'Base Salary:')}</span>
                <span>{formatTaka(slipRecord.base_salary)}</span>
              </div>
              {slipRecord.bonus > 0 && (
                <div className="flex justify-between">
                  <span>{t('বোনাস:', 'Bonus:')}</span>
                  <span>+ {formatTaka(slipRecord.bonus)}</span>
                </div>
              )}
              {slipRecord.advances_deducted > 0 && (
                <div className="flex justify-between text-[#d92916]">
                  <span>{t('অগ্রিম কর্তন:', 'Advance Deducted:')}</span>
                  <span>- {formatTaka(slipRecord.advances_deducted)}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px] font-semibold text-[#1d1d1f] border-t border-[#e0e0e0] pt-2">
                <span>{t('নীট প্রাপ্ত বেতন:', 'Net Paid:')}</span>
                <span className="font-semibold text-[20px] text-[#0066cc]">{formatTaka(slipRecord.net_payable)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-center text-[#7a7a7a] pt-5">
              <div className="border-t border-[#7a7a7a] w-28 mx-auto pt-1">{t('কর্মচারীর স্বাক্ষর', 'Employee Sign')}</div>
              <div className="border-t border-[#7a7a7a] w-28 mx-auto pt-1">{t('মালিকের স্বাক্ষর', 'Owner Sign')}</div>
            </div>

            <div className="flex justify-end gap-2 pt-3 no-print">
              <button onClick={() => setSlipRecord(null)} className="btn-outline text-[13px] px-4">
                {t('বন্ধ করুন', 'Close')}
              </button>
              <button onClick={() => window.print()} className="btn-primary text-[13px] px-5">
                <Printer className="w-4 h-4" />
                <span>{t('প্রিন্ট করুন', 'Print')}</span>
              </button>
            </div>
          </div>
        )}
      </AppleModal>
    </div>
  );
};
