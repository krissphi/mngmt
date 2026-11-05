/**
 * Indonesian Rupiah (IDR) Currency Formatter & Helper
 */

export function formatIDR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp\u00A00';
  }
  const num = Math.round(Number(amount));
  const formatted = num.toLocaleString('id-ID');
  // Use non-breaking space (\u00A0) so "Rp" is NEVER split onto a separate line above the number
  return `Rp\u00A0${formatted}`;
}

export function parseIDR(formattedStr: string): number {
  if (!formattedStr) return 0;
  // Remove non-digit characters except minus sign
  const cleaned = formattedStr.replace(/[^0-9-]/g, '');
  const val = parseInt(cleaned, 10);
  return isNaN(val) ? 0 : val;
}

export function formatCompactIDR(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp\u00A0${(amount / 1_000_000_000).toFixed(1)}\u00A0B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp\u00A0${(amount / 1_000_000).toFixed(1)}\u00A0M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp\u00A0${(amount / 1_000).toFixed(0)}\u00A0k`;
  }
  return formatIDR(amount);
}
