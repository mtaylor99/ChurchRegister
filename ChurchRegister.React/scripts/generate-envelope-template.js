/**
 * Generate Envelope Upload Template Excel file
 * Run with: node scripts/generate-envelope-template.js
 */

import XLSX from 'xlsx-js-style';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet data
const wsData = [
  // Row 1: Collection Date (B1)
  ['', 'ENTER SUNDAY DATE HERE (e.g., 2026-02-16)', '', 'Instructions'],
  // Row 2: Headers
  ['Member Number', 'Amount', '', 'How to use this template:'],
  // Row 3-7: Sample data
  [101, 25.00, '', '1. Enter the Sunday collection date in cell B1'],
  [102, 50.00, '', '2. Starting from row 3, enter Member Numbers in Column A'],
  [103, 35.50, '', '3. Enter corresponding Amounts in Column B'],
  [104, 100.00, '', '4. You can add as many rows as needed'],
  [105, 15.00, '', '5. Save the file and upload it in the Envelope Batch Entry dialog'],
  // Row 8: Empty row
  ['', '', '', ''],
  // Row 9-11: Additional instructions
  ['', '', '', 'Important Notes:'],
  ['', '', '', '- Collection date MUST be a Sunday'],
  ['', '', '', '- Member numbers must be valid register numbers for the current year'],
  ['', '', '', '- Amounts must be positive numbers'],
  ['', '', '', '- Empty rows will be skipped automatically'],
  ['', '', '', '- Only columns A and B will be used (you can add reference data in other columns)'],
];

// Create worksheet
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths
ws['!cols'] = [
  { wch: 15 }, // Column A: Member Number
  { wch: 12 }, // Column B: Amount
  { wch: 3 },  // Column C: Empty
  { wch: 80 }, // Column D: Instructions
];

// Style B1 cell (Collection Date)
if (ws['B1']) {
  ws['B1'].s = {
    fill: { fgColor: { rgb: 'FFFF00' } }, // Yellow background
    font: { bold: true, sz: 14 },
    alignment: { horizontal: 'left', vertical: 'center' },
  };
}

// Style header row (Row 2)
['A2', 'B2'].forEach(cell => {
  if (ws[cell]) {
    ws[cell].s = {
      fill: { fgColor: { rgb: '4472C4' } }, // Blue background
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }
});

// Style sample data (Rows 3-7)
for (let row = 3; row <= 7; row++) {
  // Column A: Member Number
  const cellA = `A${row}`;
  if (ws[cellA]) {
    ws[cellA].s = {
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'D0D0D0' } },
        bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
        left: { style: 'thin', color: { rgb: 'D0D0D0' } },
        right: { style: 'thin', color: { rgb: 'D0D0D0' } },
      },
    };
  }
  
  // Column B: Amount
  const cellB = `B${row}`;
  if (ws[cellB]) {
    ws[cellB].t = 'n'; // Number type
    ws[cellB].z = '£#,##0.00'; // Currency format
    ws[cellB].s = {
      alignment: { horizontal: 'right', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'D0D0D0' } },
        bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
        left: { style: 'thin', color: { rgb: 'D0D0D0' } },
        right: { style: 'thin', color: { rgb: 'D0D0D0' } },
      },
    };
  }
}

// Style instructions column
for (let row = 1; row <= 14; row++) {
  const cellD = `D${row}`;
  if (ws[cellD]) {
    ws[cellD].s = {
      fill: { fgColor: { rgb: 'F2F2F2' } }, // Light gray background
      font: { sz: 10, italic: row >= 9 },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    };
  }
}

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Envelope Contributions');

// Ensure output directory exists
const outputDir = join(__dirname, '../../docs/templates');
try {
  mkdirSync(outputDir, { recursive: true });
} catch (err) {
  // Directory already exists
}

// Write file
const outputPath = join(outputDir, 'Envelope-Upload-Template.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Template generated successfully: ${outputPath}`);
console.log('📋 Template includes:');
console.log('   - Cell B1: Collection date input (yellow highlight)');
console.log('   - Column A: Member numbers');
console.log('   - Column B: Amounts (currency format)');
console.log('   - Column D: Instructions and notes');
console.log('   - 5 sample data rows (rows 3-7)');
