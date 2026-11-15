/**
 * Format a number into standard MMK currency notation: "15,000 MMK"
 */
export function formatMMK(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '0 MMK';
  return `${Number(amount).toLocaleString('en-US')} MMK`;
}

/**
 * Converts Western digits to Burmese digits (0-9 -> ၀-၉)
 */
export function toBurmeseDigits(numStr: string | number): string {
  const burmeseDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
  return String(numStr).replace(/[0-9]/g, (w) => burmeseDigits[+w]);
}

/**
 * Formats date into readable format: "15 Nov 2026" or "DD/MM/YY"
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    // If it's already in DD/MM/YY format, return it
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateString.trim())) {
      return dateString.trim();
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Gets today's date formatted as DD/MM/YY
 */
export function getTodayFormatted(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}
