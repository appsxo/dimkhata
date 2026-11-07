// ====================================================================
// DIMKHATA (ডিমখাতা) — Egg Unit Calculation Engine & Bilingual Formatters
// ====================================================================

import { getActiveLanguage } from './i18n';

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string | null | undefined): string {
  const isEn = getActiveLanguage() === 'en';
  if (num === null || num === undefined || num === '') return isEn ? '0' : '০';
  const str = String(num);
  if (isEn) return str;
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)] || digit);
}

export function formatTaka(amount: number | null | undefined, includeSymbol = true): string {
  const val = Number(amount || 0);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

  const localized = toBengaliNumber(formatted);
  return includeSymbol ? `৳${localized}` : localized;
}

export function formatQuantityPcs(qtyPcs: number, pcsPerCrate = 30): {
  totalPcs: number;
  totalPcsBn: string;
  shoBreakdown: string;
  crateBreakdown: string;
  haliBreakdown: string;
  summaryBadge: string;
} {
  const isEn = getActiveLanguage() === 'en';
  const pcs = Math.max(0, Math.floor(qtyPcs || 0));
  const pcsStr = toBengaliNumber(pcs);

  const unitPcs = isEn ? 'Pcs' : 'পিস';
  const unitSho = isEn ? 'Hundred' : 'শ';
  const unitCrate = isEn ? 'Crates' : 'খাঁচি';
  const unitHali = isEn ? 'Hali' : 'হালি';

  // Hundred (শ) breakdown
  const sho = Math.floor(pcs / 100);
  const remSho = pcs % 100;
  const shoText =
    sho > 0
      ? `${toBengaliNumber(sho)} ${unitSho}${remSho > 0 ? ` ${toBengaliNumber(remSho)} ${unitPcs}` : ''}`
      : `${pcsStr} ${unitPcs}`;

  // Crate (খাঁচি) breakdown
  const crateSize = pcsPerCrate > 0 ? pcsPerCrate : 30;
  const crates = Math.floor(pcs / crateSize);
  const remCrates = pcs % crateSize;
  const crateText =
    crates > 0
      ? `${toBengaliNumber(crates)} ${unitCrate}${remCrates > 0 ? ` + ${toBengaliNumber(remCrates)} ${unitPcs}` : ''}`
      : `${pcsStr} ${unitPcs}`;

  // Hali (হালি) breakdown
  const hali = Math.floor(pcs / 4);
  const remHali = pcs % 4;
  const haliText =
    hali > 0
      ? `${toBengaliNumber(hali)} ${unitHali}${remHali > 0 ? ` + ${toBengaliNumber(remHali)} ${unitPcs}` : ''}`
      : `${pcsStr} ${unitPcs}`;

  // Summary badge for POS and Cards
  const summaryBadge =
    crates > 0
      ? `${toBengaliNumber(crates)} ${unitCrate} (${pcsStr} ${unitPcs})`
      : `${pcsStr} ${unitPcs}`;

  return {
    totalPcs: pcs,
    totalPcsBn: pcsStr,
    shoBreakdown: shoText,
    crateBreakdown: crateText,
    haliBreakdown: haliText,
    summaryBadge,
  };
}

/**
 * Calculates Landed Cost per Egg piece
 */
export function calculateLandedCost(
  rawSubtotal: number,
  truckFare: number,
  laborCost: number,
  otherCost: number,
  totalPcs: number
): {
  totalLandedCost: number;
  effectiveLandedRatePerPc: number;
} {
  const total = (rawSubtotal || 0) + (truckFare || 0) + (laborCost || 0) + (otherCost || 0);
  const rate = totalPcs > 0 ? total / totalPcs : 0;
  return {
    totalLandedCost: Math.round(total * 100) / 100,
    effectiveLandedRatePerPc: Math.round(rate * 10000) / 10000,
  };
}

/**
 * Calculate Weighted Average Cost (WAC)
 */
export function calculateWeightedAverageCost(
  existingQtyPcs: number,
  existingWac: number,
  incomingQtyPcs: number,
  incomingRate: number
): number {
  const totalQty = (existingQtyPcs || 0) + (incomingQtyPcs || 0);
  if (totalQty <= 0) return incomingRate || 0;
  const totalVal =
    (existingQtyPcs || 0) * (existingWac || 0) + (incomingQtyPcs || 0) * (incomingRate || 0);
  return Math.round((totalVal / totalQty) * 10000) / 10000;
}
