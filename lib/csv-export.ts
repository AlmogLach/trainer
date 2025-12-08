// Safe CSV export utilities
// Handles commas, quotes, and newlines in data

/**
 * Escape a CSV field value
 * Wraps in quotes if contains comma, quote, or newline
 */
export function escapeCsvField(value: string | number | null | undefined, minWidth?: number): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  let escaped = stringValue;
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    escaped = `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  // For RTL, we don't add padding to individual cells
  // Instead, we use a width hint row to help Excel auto-expand
  return escaped;
}

/**
 * Create a CSV row from an array of values (RTL - reversed order for Hebrew)
 */
export function createCsvRow(values: (string | number | null | undefined)[], minWidths?: number[]): string {
  // Reverse for RTL (Hebrew reads right to left)
  const reversedValues = [...values].reverse();
  const reversedWidths = minWidths ? [...minWidths].reverse() : undefined;
  
  return reversedValues.map((val, idx) => 
    escapeCsvField(val, reversedWidths ? reversedWidths[idx] : undefined)
  ).join(',');
}

/**
 * Create CSV content from headers and rows (RTL - reversed order for Hebrew)
 * Adds a width hint row to help Excel auto-expand columns
 */
export function createCsvContent(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  minWidths?: number[]
): string {
  const headerRow = createCsvRow(headers, minWidths);
  
  // Add a width hint row using the header text with padding
  // Excel will use this to determine column widths
  let widthHintRow = '';
  if (minWidths) {
    const reversedWidths = [...minWidths].reverse();
    const reversedHeaders = [...headers].reverse();
    
    // Create hint row using header text with additional spaces to reach minWidth
    widthHintRow = reversedHeaders.map((header, idx) => {
      const minWidth = reversedWidths[idx];
      const headerLength = String(header).length;
      const paddingNeeded = Math.max(0, minWidth - headerLength);
      // Add padding spaces after the header text
      return escapeCsvField(header + ' '.repeat(paddingNeeded));
    }).join(',');
  }
  
  const dataRows = rows.map(row => createCsvRow(row, minWidths));
  
  // Combine: header, width hint (if exists), then data rows
  if (widthHintRow) {
    return [headerRow, widthHintRow, ...dataRows].join('\n');
  }
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file with BOM for Hebrew support and RTL formatting
 */
export function downloadCsv(
  content: string,
  filename: string
): void {
  // Add BOM for Hebrew support
  const BOM = '\uFEFF';
  // Add RTL marker at the beginning for proper Hebrew display
  const rtlMarker = '\u200F'; // Right-to-left mark
  const blob = new Blob([BOM + rtlMarker + content], { 
    type: 'text/csv;charset=utf-8;' 
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}



