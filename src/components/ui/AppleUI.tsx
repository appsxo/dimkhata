import React from 'react';
import { X, Search } from 'lucide-react';

interface AppleSectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export const AppleSectionHeader: React.FC<AppleSectionHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="min-w-0">
      <h2 className="text-[20px] sm:text-[26px] font-semibold text-[#1d1d1f] tracking-[-0.02em] leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[13px] text-[#7a7a7a] mt-0.5 leading-snug">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
  </div>
);

interface AppleStatCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: React.ReactNode;
  dark?: boolean;
  onClick?: () => void;
}

export const AppleStatCard: React.FC<AppleStatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  dark = false,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`${
      dark
        ? 'bg-[#272729] text-white border border-[#2a2a2c]'
        : 'bg-white text-[#1d1d1f] border border-[#e0e0e0]'
    } rounded-[18px] p-4 sm:p-5 flex flex-col justify-between transition ${
      onClick ? 'cursor-pointer active:scale-[0.98] hover:border-[#0066cc]' : ''
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <span className={`text-[12.5px] sm:text-[13px] ${dark ? 'text-[#cccccc]' : 'text-[#7a7a7a]'}`}>
        {label}
      </span>
      {icon && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            dark ? 'bg-[#2a2a2c] text-[#2997ff]' : 'bg-[#f5f5f7] text-[#0066cc]'
          }`}
        >
          {icon}
        </div>
      )}
    </div>
    <div className="mt-2">
      <div
        className={`text-[21px] sm:text-[26px] font-semibold tracking-[-0.02em] leading-tight ${
          dark ? 'text-white' : 'text-[#1d1d1f]'
        }`}
      >
        {value}
      </div>
      {subtext && (
        <div className={`text-[12px] mt-1 ${dark ? 'text-[#cccccc]' : 'text-[#7a7a7a]'}`}>
          {subtext}
        </div>
      )}
    </div>
  </div>
);

export interface AppleChipOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface AppleOptionChipsProps<T extends string> {
  options: AppleChipOption<T>[];
  value: T;
  onChange: (val: T) => void;
}

export function AppleOptionChips<T extends string>({
  options,
  value,
  onChange,
}: AppleOptionChipsProps<T>) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`chip-option shrink-0 ${
              selected ? 'chip-option-selected' : 'hover:border-[#7a7a7a]'
            }`}
          >
            {opt.icon && (
              <span className={selected ? 'text-[#0066cc]' : 'text-[#7a7a7a]'}>{opt.icon}</span>
            )}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  selected ? 'bg-[#0066cc] text-white' : 'bg-[#f5f5f7] text-[#7a7a7a]'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface AppleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export const AppleModal: React.FC<AppleModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-lg',
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div
        className={`bg-white w-full ${maxWidth} rounded-t-[22px] sm:rounded-[18px] border border-[#e0e0e0] max-h-[92vh] flex flex-col overflow-hidden`}
      >
        <div className="px-4 sm:px-5 py-3.5 bg-[#f5f5f7] border-b border-[#e0e0e0] flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-semibold text-[#1d1d1f]">{title}</h3>
            {subtitle && <p className="text-[12px] text-[#7a7a7a] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-icon-circle shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

interface AppleSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const AppleSearchInput: React.FC<AppleSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'খুঁজুন...',
  className = 'w-full sm:w-64',
}) => (
  <div className={`relative ${className}`}>
    <Search className="w-4 h-4 text-[#7a7a7a] absolute left-3.5 top-3.5 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="search-apple w-full"
    />
  </div>
);
