// Google Drive export utilities
import * as XLSX from 'xlsx';

/**
 * Convert Excel workbook to ArrayBuffer for upload (browser compatible)
 */
function workbookToArrayBuffer(wb: XLSX.WorkBook): ArrayBuffer {
  // Use 'array' type which works in both browser and Node.js
  const array = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return array.buffer;
}

/**
 * Create Excel buffer from sheets configuration
 * Returns ArrayBuffer for browser compatibility
 */
export function createExcelBuffer(
  sheets: Array<{
    name: string;
    title?: string;
    subtitle?: string;
    summaryRows?: Array<{ label: string; value: string }>;
    headers: string[];
    rows: (string | number | null | undefined)[][];
    columnWidths?: number[];
  }>,
  rtl?: boolean
): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  
  sheets.forEach((sheetConfig) => {
    let rows: any[][] = [];
    
    // Add title row if provided
    if (sheetConfig.title) {
      rows.push([sheetConfig.title]);
      rows.push([]);
    }
    
    // Add subtitle if provided
    if (sheetConfig.subtitle) {
      rows.push([sheetConfig.subtitle]);
      rows.push([]);
    }
    
    // Add summary rows if provided
    if (sheetConfig.summaryRows && sheetConfig.summaryRows.length > 0) {
      sheetConfig.summaryRows.forEach(summary => {
        rows.push([summary.label, summary.value]);
      });
      rows.push([]);
    }
    
    // Prepare headers and data rows - REVERSE for RTL
    let headers = sheetConfig.headers;
    let dataRows = sheetConfig.rows;
    
    if (rtl) {
      headers = [...headers].reverse();
      dataRows = dataRows.map(row => [...row].reverse());
    }
    
    rows.push(headers);
    rows.push(...dataRows);
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // Set column widths
    if (sheetConfig.columnWidths) {
      const widths = rtl ? [...sheetConfig.columnWidths].reverse() : sheetConfig.columnWidths;
      ws['!cols'] = widths.map(width => ({ wch: width }));
    }
    
    // Set RTL direction and text alignment
    if (rtl) {
      if (!ws['!views']) {
        ws['!views'] = [];
      }
      ws['!views'][0] = { rightToLeft: true };
      
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          
          const cell = ws[cellAddress];
          if (!cell.s) cell.s = {};
          if (!cell.s.alignment) cell.s.alignment = {};
          cell.s.alignment.horizontal = 'right';
          cell.s.alignment.vertical = 'center';
        }
      }
    }
    
    // Find header row index
    let headerRowIndex = 0;
    if (sheetConfig.title) headerRowIndex += 2;
    if (sheetConfig.subtitle) headerRowIndex += 2;
    if (sheetConfig.summaryRows) headerRowIndex += sheetConfig.summaryRows.length + 1;
    
    // Freeze header row
    const headerRow = headerRowIndex + 1;
    const numCols = headers.length;
    ws['!freeze'] = { 
      xSplit: 0, 
      ySplit: headerRow, 
      topLeftCell: rtl ? XLSX.utils.encode_cell({ r: headerRow, c: numCols - 1 }) : `A${headerRow + 1}`, 
      activePane: rtl ? 'bottomRight' : 'bottomLeft', 
      state: 'frozen' 
    };
    
    XLSX.utils.book_append_sheet(wb, ws, sheetConfig.name);
  });
  
  return workbookToArrayBuffer(wb);
}

/**
 * Upload file to Google Drive via API route
 * Accepts ArrayBuffer (works in browser)
 */
export async function uploadToGoogleDrive(
  buffer: ArrayBuffer | Buffer,
  filename: string
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    // Convert buffer to base64 for transmission
    let base64: string;
    
    if (buffer instanceof ArrayBuffer) {
      // Browser environment - convert ArrayBuffer to base64
      const bytes = new Uint8Array(buffer);
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
      base64 = btoa(binary);
    } else {
      // Node.js environment - Buffer already available
      base64 = buffer.toString('base64');
    }
    
    const response = await fetch('/api/google-drive/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        fileData: base64,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error || 'שגיאה בהעלאת הקובץ' };
    }

    return { success: true, fileId: result.fileId };
  } catch (error: any) {
    return { success: false, error: error.message || 'שגיאה בהעלאת הקובץ ל-Google Drive' };
  }
}
