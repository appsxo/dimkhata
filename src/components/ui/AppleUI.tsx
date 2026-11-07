// ====================================================================
// DIMKHATA (ডিমখাতা) — Reusable Apple Design System UI Primitives
// Strictly follows DESIGN.md: Action Blue #0066cc, Focus #0071e3,
// Store Utility Cards (18px, 1px #e0e0e0, 0 shadow), Dark Tiles (#272729)
// ====================================================================

import React from 'react';
import { X, Search } from 'lucide-react';

/**
 * 1. Page / Section Header ({typography.display-md} + Action Area)
 */
interface AppleSectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export const AppleSectionHeader: React.FC<AppleSectionHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
      <div>
        {eyebrow && (
          <div className="text-[12px] font-semibold uppercase tracking-wider text-[#0066cc] mb-1">
            {eyebrow}
          </div>
        )}
        <h2 className="text-[26px] sm:text-[34px] font-semibold text-[#1d1d1f] tracking-[-0.374px] leading-[1.15]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[15px] text-[#7a7a7a] font-normal mt-1 leading-[1.43]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
};

/**
 * 2. Store Utility Stat Card ({component.store-utility-card} or {component.product-tile-dark})
 */
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
}) => {
  return (
    <div
      onClick={onClick}
      className={`${
        dark
          ? 'bg-[#272729] text-white border border-[#2a2a2c]'
          : 'bg-white text-[#1d1d1f] border border-[#e0e0e0]'
      } rounded-[18px] p-5 sm:p-6 flex flex-col justify-between transition ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[14px] font-normal tracking-[-0.224px] ${
            dark ? 'text-[#cccccc]' : 'text-[#7a7a7a]'
          }`}
        >
          {label}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              dark ? 'bg-[#2a2a2c] text-[#2997ff]' : 'bg-[#f5f5f7] text-[#0066cc]'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div
          className={`text-[26px] sm:text-[32px] font-semibold tracking-[-0.374px] leading-tight ${
            dark ? 'text-white' : 'text-[#1d1d1f]'
          }`}
        >
          {value}
        </div>
        {subtext && (
          <div
            className={`text-[13px] font-normal mt-1.5 ${
              dark ? 'text-[#cccccc]' : 'text-[#7a7a7a]'
            }`}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 3. Configurator Option Chips ({component.configurator-option-chip} & -selected)
 */
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
              <span className={selected ? 'text-[#0066cc]' : 'text-[#7a7a7a]'}>
                {opt.icon}
              </span>
            )}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  selected
                    ? 'bg-[#0066cc] text-white'
                    : 'bg-[#f5f5f7] text-[#7a7a7a]'
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

/**
 * 4. Mobile-First Modal Dialog ({component.store-utility-card} + {component.button-icon-circular})
 */
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
        <div className="px-5 py-4 bg-[#f5f5f7] border-b border-[#e0e0e0] flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[20px] font-semibold text-[#1d1d1f] tracking-[-0.28px]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[13px] text-[#7a7a7a] font-normal mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="btn-icon-circle shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

/**
 * 5. Pill Search Input ({component.search-input})
 */
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
  className = 'w-full sm:w-72',
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-[#7a7a7a] absolute left-4 top-3.5 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-apple w-full"
      />
    </div>
  );
};
