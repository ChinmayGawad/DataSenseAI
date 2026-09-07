/**
 * DataSense AI - Indian Standards & Currency Formatting Utilities
 * Standardized locale formatting for INR (₹), Indian numbering (Lakhs/Crores), and DD/MM/YYYY dates.
 */

/**
 * Formats a numeric value into an Indian Rupee string:
 * e.g., 128430 -> "₹1,28,430"
 * e.g., 1420000 (compact) -> "₹14.20 L"
 * e.g., 12500000 (compact) -> "₹1.25 Cr"
 */
export function formatINR(value: number | string, compact = false): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(num)) return '₹0';

  if (compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1e7) {
      return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
    }
    if (abs >= 1e5) {
      return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
    }
    if (abs >= 1e3) {
      return `${sign}₹${(abs / 1e3).toFixed(1)} K`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a numeric value with standard Indian comma grouping (2,2,3):
 * e.g., 128430 -> "1,28,430"
 * e.g., 1000000 -> "10,00,000"
 */
export function formatIndianNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Formats date strings to Indian Standard DD/MM/YYYY:
 * e.g., "2024-01-15" -> "15/01/2024"
 * e.g., "2024-01-15T12:00:00Z" -> "15/01/2024"
 */
export function formatIndianDate(dateStr: string, style: 'numeric' | 'verbal' = 'numeric'): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (style === 'verbal') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${monthNames[d.getMonth()]} ${year}`;
  }

  return `${day}/${month}/${year}`;
}
