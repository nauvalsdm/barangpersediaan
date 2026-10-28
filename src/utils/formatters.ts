/**
 * Utility functions for formatting Indonesian currency, dates, barcodes, and CSV exports.
 */

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function generateRefNo(prefix: 'IN' | 'OUT' | 'ADJ' | 'OPN' | 'SKU' | 'BBM'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${random}`;
}

export function downloadCSV(filename: string, rows: (string | number)[][], headers: string[]) {
  const processRow = (row: (string | number)[]) =>
    row
      .map((val) => {
        let str = String(val ?? '');
        // Escape quotes
        if (str.includes('"') || str.includes(';') || str.includes(',') || str.includes('\n')) {
          str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(';');

  const csvContent = '\uFEFF' + [processRow(headers), ...rows.map(processRow)].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a barcode representation using SVG patterns
 */
export function generateBarcodeLines(code: string): boolean[] {
  // Simple deterministic pattern generator for SKU barcode preview
  const pattern: boolean[] = [true, false, true, false]; // Start guard
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const bits = (charCode % 16).toString(2).padStart(4, '0');
    for (const bit of bits) {
      pattern.push(bit === '1');
      pattern.push(false);
    }
    pattern.push(true);
  }
  pattern.push(false, true, false, true); // End guard
  return pattern;
}
