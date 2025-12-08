// Excel export utilities with column width control, RTL support, and styling
import * as XLSX from 'xlsx';

/**
 * Create Excel file with enhanced styling, headers, and summaries
 * Full RTL support: reversed column order, right-aligned text, RTL sheet direction
 */
export function createStyledExcel(
  sheets: Array<{
    name: string;
    title?: string;
    subtitle?: string;
    summaryRows?: Array<{ label: string; value: string }>;
    headers: string[];
    rows: (string | number | null | undefined)[][];
    columnWidths?: number[];
  }>,
  filename: string,
  rtl?: boolean
): void {
  const wb = XLSX.utils.book_new();
  
  sheets.forEach((sheetConfig, sheetIndex) => {
    let rows: any[][] = [];
    
    // Add title row if provided
    if (sheetConfig.title) {
      rows.push([sheetConfig.title]);
      rows.push([]); // Empty row for spacing
    }
    
    // Add subtitle if provided
    if (sheetConfig.subtitle) {
      rows.push([sheetConfig.subtitle]);
      rows.push([]); // Empty row for spacing
    }
    
    // Add summary rows if provided
    if (sheetConfig.summaryRows && sheetConfig.summaryRows.length > 0) {
      sheetConfig.summaryRows.forEach(summary => {
        rows.push([summary.label, summary.value]);
      });
      rows.push([]); // Empty row for spacing
    }
    
    // Prepare headers and data rows - REVERSE for RTL
    let headers = sheetConfig.headers;
    let dataRows = sheetConfig.rows;
    
    // Reverse column order for RTL (Hebrew reads right to left)
    if (rtl) {
      headers = [...headers].reverse();
      dataRows = dataRows.map(row => [...row].reverse());
    }
    
    // Add headers
    rows.push(headers);
    
    // Add data rows
    rows.push(...dataRows);
    
    // Create worksheet from array
    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // Set column widths if provided
    if (sheetConfig.columnWidths) {
      // For RTL, reverse the widths to match reversed columns
      const widths = rtl ? [...sheetConfig.columnWidths].reverse() : sheetConfig.columnWidths;
      ws['!cols'] = widths.map(width => ({ wch: width }));
    }
    
    // Set RTL direction and text alignment
    if (rtl) {
      // Set sheet view to RTL
      if (!ws['!views']) {
        ws['!views'] = [];
      }
      ws['!views'][0] = { rightToLeft: true };
      
      // Set text alignment to right for all cells
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          
          // Get existing cell or create new one
          const cell = ws[cellAddress];
          
          // Set alignment to right
          if (!cell.s) cell.s = {};
          if (!cell.s.alignment) cell.s.alignment = {};
          cell.s.alignment.horizontal = 'right';
          cell.s.alignment.vertical = 'center';
        }
      }
    }
    
    // Find header row index (after title, subtitle, and summary)
    let headerRowIndex = 0;
    if (sheetConfig.title) headerRowIndex += 2; // title + empty row
    if (sheetConfig.subtitle) headerRowIndex += 2; // subtitle + empty row
    if (sheetConfig.summaryRows) headerRowIndex += sheetConfig.summaryRows.length + 1; // summary rows + empty row
    
    // Freeze header row - adjust for RTL
    const headerRow = headerRowIndex + 1; // Excel is 1-indexed
    const numCols = headers.length;
    ws['!freeze'] = { 
      xSplit: 0, 
      ySplit: headerRow, 
      topLeftCell: rtl ? XLSX.utils.encode_cell({ r: headerRow, c: numCols - 1 }) : `A${headerRow + 1}`, 
      activePane: rtl ? 'bottomRight' : 'bottomLeft', 
      state: 'frozen' 
    };
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetConfig.name);
  });
  
  // Write file
  XLSX.writeFile(wb, filename);
}

/**
 * Create Excel file from headers and rows with column width control
 */
export function createExcelFromRows(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string,
  options?: {
    columnWidths?: number[];
    sheetName?: string;
    rtl?: boolean;
    title?: string;
    subtitle?: string;
    summaryRows?: Array<{ label: string; value: string }>;
  }
): void {
  createStyledExcel([{
    name: options?.sheetName || 'Sheet1',
    title: options?.title,
    subtitle: options?.subtitle,
    summaryRows: options?.summaryRows,
    headers,
    rows,
    columnWidths: options?.columnWidths
  }], filename, options?.rtl);
}

/**
 * Create Excel file with multiple sheets
 */
export function createExcelWithSheets(
  sheets: Array<{
    name: string;
    headers: string[];
    rows: (string | number | null | undefined)[][];
    columnWidths?: number[];
    title?: string;
    subtitle?: string;
    summaryRows?: Array<{ label: string; value: string }>;
  }>,
  filename: string,
  rtl?: boolean
): void {
  createStyledExcel(sheets, filename, rtl);
}
