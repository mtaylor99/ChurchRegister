import type { RegisterNumberAssignment } from '../services/registerNumberService';

/**
 * Export register number assignments to CSV file
 * @param assignments - Array of register number assignments
 * @param year - Target year for the register numbers
 */
export function exportRegisterNumbersToCSV(
  assignments: RegisterNumberAssignment[],
  year: number
): void {
  // Define CSV headers
  const headers = [
    'Register Number',
    'Member Name',
    'Member Since',
    'Current Number',
  ];

  // Convert assignments to CSV rows
  const rows = assignments.map((assignment) => [
    assignment.registerNumber.toString(),
    assignment.memberName,
    new Date(assignment.memberSince).toLocaleDateString('en-GB'), // DD/MM/YYYY format
    assignment.currentNumber?.toString() || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    // Create download link
    const url = URL.createObjectURL(blob);
    const filename = `Church Member Number ${year}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  }
}

/**
 * Export data to CSV with custom configuration
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 * @param headers - Optional custom headers
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);

  // Convert data to CSV rows
  const rows = data.map((item) =>
    csvHeaders.map((header) => {
      const value = item[header];
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    })
  );

  // Combine headers and rows
  const csvContent = [
    csvHeaders.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().substring(0, 10);
    const fullFilename = `${filename}_${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fullFilename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
