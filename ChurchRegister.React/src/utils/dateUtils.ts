/**
 * Formats a Date object to ISO date string (YYYY-MM-DD) using local timezone
 * Avoids UTC conversion issues that can shift dates by one day
 * @param date - The date to format
 * @returns ISO date string in YYYY-MM-DD format
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets today's date in ISO format (YYYY-MM-DD) using local timezone
 * @returns Today's date as ISO string
 */
export function getTodayISO(): string {
  return formatDateToISO(new Date());
}
