import type { ChurchMemberDetailDto, AddressDto } from '../types/churchMembers';
import type { TrainingCertificateDto } from '../types/trainingCertificates';
import type { Reminder } from '../types/reminders';

/**
 * Member contribution data for export
 */
export interface MemberContributionExportData {
  id: number;
  title?: string;
  fullName: string;
  address?: AddressDto;
  memberNumber?: string;
  bankReference?: string;
  thisYearsContribution: number;
  lastContributionDate?: string;
  giftAid: boolean;
}

/**
 * Export church member contributions to Excel
 * Uses dynamic import to load xlsx library only when needed
 */
export async function exportMemberContributionsToExcel(
  members: MemberContributionExportData[],
  year?: number
): Promise<void> {
  // Dynamically import xlsx library to reduce initial bundle size
  const XLSX = await import('xlsx-js-style');
  
  const exportYear = year ?? new Date().getFullYear();

  // Transform member data to Excel format for contributions
  const excelData = members.map((member) => {
    const nameParts = member.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const surname = nameParts.slice(1).join(' ') || '';

    return {
      Title: member.title || '',
      'First Name': firstName,
      Surname: surname,
      'Name/Number': formatNameNumber(member.address),
      Postcode: member.address?.postcode || '',
      Number: member.memberNumber || '',
      'Bank Reference': member.bankReference || '',
      [`${exportYear} Contribution`]: member.thisYearsContribution.toFixed(2),
      'Last Contribution Date': member.lastContributionDate
        ? new Date(member.lastContributionDate).toLocaleDateString('en-GB')
        : '',
      'Gift Aid': member.giftAid ? 'Yes' : 'No',
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 10 }, // Title
    { wch: 20 }, // First Name
    { wch: 20 }, // Surname
    { wch: 30 }, // Name/Number
    { wch: 12 }, // Postcode
    { wch: 12 }, // Number
    { wch: 20 }, // Bank Reference
    { wch: 20 }, // Year Contribution
    { wch: 18 }, // Last Contribution Date
    { wch: 10 }, // Gift Aid
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Member Contributions');

  // Generate filename with date and year
  const now = new Date();
  const timestamp = now.toISOString().substring(0, 10);
  const filename = `Member_Contributions_${exportYear}_${timestamp}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename);
}

/**
 * Export church members to Excel with combined data from list and detail DTOs
 * Status column: Green (Active), Grey (Inactive), Amber (Expired), Blue (In Glory)
 * Uses dynamic import to load xlsx library only when needed
 */
export async function exportChurchMembersWithDetailsToExcel(
  members: ChurchMemberDetailDto[],
  memberNumbers?: Map<number, string>
): Promise<void> {
  // Dynamically import xlsx library to reduce initial bundle size
  const XLSX = await import('xlsx-js-style');
  
  // Transform member data to Excel format - ordered to match grid columns
  const excelData = members.map((member) => ({
    Title: member.title || '',
    Name: member.fullName,
    Address: formatAddress(member.address),
    Number: memberNumbers?.get(member.id) || '',
    Roles: member.roles.map((r) => r.type).join(', '),
    'E-Mail Address': member.email || '',
    'Contact Number': member.phone || '',
    District: member.districtName || '',
    Baptised: member.baptised ? 'Yes' : 'No',
    'Gift Aid': member.giftAid ? 'Yes' : 'No',
    'Name in Communications': member.dataProtection?.allowNameInCommunications ? 'Yes' : 'No',
    'Health Status Mentions': member.dataProtection?.allowHealthStatusInCommunications ? 'Yes' : 'No',
    'Photo in Print': member.dataProtection?.allowPhotoInCommunications ? 'Yes' : 'No',
    'Photo on Social Media': member.dataProtection?.allowPhotoInSocialMedia ? 'Yes' : 'No',
    'Group Photos': member.dataProtection?.groupPhotos ? 'Yes' : 'No',
    'Permission for Children': member.dataProtection?.permissionForMyChildren ? 'Yes' : 'No',
    Status: member.status,
    'Member Since': member.memberSince ? new Date(member.memberSince).toLocaleDateString() : '',
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 8 },  // Title
    { wch: 25 }, // Name
    { wch: 50 }, // Address
    { wch: 10 }, // Number
    { wch: 30 }, // Roles
    { wch: 30 }, // E-Mail Address
    { wch: 15 }, // Contact Number
    { wch: 12 }, // District
    { wch: 10 }, // Baptised
    { wch: 10 }, // Gift Aid
    { wch: 12 }, // Name in Communications
    { wch: 12 }, // Health Status Mentions
    { wch: 12 }, // Photo in Print
    { wch: 12 }, // Photo on Social Media
    { wch: 12 }, // Group Photos
    { wch: 12 }, // Permission for Children
    { wch: 15 }, // Status
    { wch: 15 }, // Member Since
  ];
  worksheet['!cols'] = columnWidths;

  // Apply color styling to Status column (column Q)
  members.forEach((member, index) => {
    const rowNumber = index + 2; // +1 for 0-based index, +1 for header row
    const statusCell = `Q${rowNumber}`;
    
    if (worksheet[statusCell] && member.status) {
      let statusColor: string | null = null;
      
      if (member.status === 'Active') {
        statusColor = '4CAF50'; // Green (MUI success)
      } else if (member.status === 'Inactive' || member.status === 'InActive') {
        statusColor = '9E9E9E'; // Grey (MUI default)
      } else if (member.status === 'Expired') {
        statusColor = 'FF9800'; // Amber (MUI warning)
      } else if (member.status === 'In Glory') {
        statusColor = '2196F3'; // Blue (MUI info)
      }

      if (statusColor) {
        if (!worksheet[statusCell].s) {
          worksheet[statusCell].s = {};
        }
        worksheet[statusCell].s = {
          ...worksheet[statusCell].s,
          fill: {
            fgColor: { rgb: statusColor },
          },
          font: {
            color: { rgb: 'FFFFFF' }, // White text
            bold: true,
          },
        };
      }
    }

    // Apply color styling to Data Protection columns (columns K through P)
    const dataProtectionColumns = ['K', 'L', 'M', 'N', 'O', 'P'];
    dataProtectionColumns.forEach((col) => {
      const cellAddress = `${col}${rowNumber}`;
      if (worksheet[cellAddress]) {
        const cellValue = worksheet[cellAddress].v;
        let backgroundColor: string | null = null;

        if (cellValue === 'Yes') {
          backgroundColor = 'd4edda'; // Green background for Yes
        } else if (cellValue === 'No') {
          backgroundColor = 'f8d7da'; // Red background for No
        }

        if (backgroundColor) {
          if (!worksheet[cellAddress].s) {
            worksheet[cellAddress].s = {};
          }
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,
            fill: {
              fgColor: { rgb: backgroundColor },
            },
          };
        }
      }
    });
  });

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Church Members');

  // Generate filename with date
  const now = new Date();
  const timestamp = now.toISOString().substring(0, 10);
  const filename = `Church_Members_${timestamp}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename, { cellStyles: true });
}

/**
 * Format Name/Number concatenated with Address Line 1
 */
function formatNameNumber(address?: AddressDto): string {
  if (!address) return '';

  const parts = [address.nameNumber, address.addressLineOne].filter(
    (part) => part && part.trim() !== ''
  );

  return parts.join(', ');
}

/**
 * Format address fields into a comma-separated string
 */
function formatAddress(address?: AddressDto): string {
  if (!address) return '';

  const parts = [
    address.nameNumber,
    address.addressLineOne,
    address.addressLineTwo,
    address.town,
    address.county,
    address.postcode,
  ].filter((part) => part && part.trim() !== '');

  return parts.join(', ');
}



/**
 * Export training certificates to Excel with cell-specific color styling
 * Alert column: Red (Expired) or Amber (Expiring)
 * Status column: Green (In Validity), Amber (Pending), Red (Expired), Grey (Allow to Expire)
 * Uses dynamic import to load xlsx library only when needed
 */
export async function exportTrainingCertificatesToExcel(
  certificates: TrainingCertificateDto[]
): Promise<void> {
  // Dynamically import xlsx library to reduce initial bundle size
  const XLSX = await import('xlsx-js-style');
  
  // Transform certificate data to Excel format matching grid column order
  const excelData = certificates.map((cert) => ({
    'Member Name': cert.memberName,
    'Training/Check Type': cert.trainingType,
    'Alert': cert.ragStatus === 'Red' ? 'Expired' : cert.ragStatus === 'Amber' ? 'Expiring' : '',
    'Expires': cert.expires
      ? new Date(cert.expires).toLocaleDateString('en-GB')
      : 'N/A',
    'Status': cert.status,
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 30 }, // Member Name
    { wch: 30 }, // Training/Check Type
    { wch: 12 }, // Alert
    { wch: 12 }, // Expires
    { wch: 15 }, // Status
  ];
  worksheet['!cols'] = columnWidths;

  // Apply color styling to Alert and Status cells
  // Row 1 is the header, data starts at row 2
  certificates.forEach((cert, index) => {
    const rowNumber = index + 2; // +1 for 0-based index, +1 for header row
    
    // Color the Alert column (column C) based on RAG status
    const alertCell = `C${rowNumber}`;
    if (worksheet[alertCell] && cert.ragStatus) {
      let alertColor: string | null = null;
      if (cert.ragStatus === 'Red') {
        alertColor = 'F44336'; // Red matching chip color
      } else if (cert.ragStatus === 'Amber') {
        alertColor = 'FF9800'; // Amber/Orange matching chip color
      }

      if (alertColor) {
        if (!worksheet[alertCell].s) {
          worksheet[alertCell].s = {};
        }
        worksheet[alertCell].s = {
          ...worksheet[alertCell].s,
          fill: {
            fgColor: { rgb: alertColor },
          },
          font: {
            color: { rgb: 'FFFFFF' }, // White text
            bold: true,
          },
        };
      }
    }

    // Color the Status column (column E) based on status value
    const statusCell = `E${rowNumber}`;
    if (worksheet[statusCell] && cert.status) {
      let statusColor: string | null = null;
      if (cert.status === 'In Validity') {
        statusColor = '4CAF50'; // Green (MUI success)
      } else if (cert.status === 'Pending') {
        statusColor = 'FF9800'; // Amber (MUI warning)
      } else if (cert.status === 'Expired') {
        statusColor = 'F44336'; // Red (MUI error)
      } else if (cert.status === 'Allow to Expire') {
        statusColor = '9E9E9E'; // Grey (MUI default)
      }

      if (statusColor) {
        if (!worksheet[statusCell].s) {
          worksheet[statusCell].s = {};
        }
        worksheet[statusCell].s = {
          ...worksheet[statusCell].s,
          fill: {
            fgColor: { rgb: statusColor },
          },
          font: {
            color: { rgb: 'FFFFFF' }, // White text
            bold: true,
          },
        };
      }
    }
  });

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Training Certificates');

  // Generate filename with date
  const now = new Date();
  const timestamp = now.toISOString().substring(0, 10);
  const filename = `Training_Certificates_${timestamp}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename, { cellStyles: true });
}

/**
 * Export reminders to Excel
 * Status column: Green (Completed), Blue (Pending)
 * Priority: Yellow background for important reminders
 * Uses dynamic import to load xlsx library only when needed
 */
export async function exportRemindersToExcel(
  reminders: Reminder[]
): Promise<void> {
  // Dynamically import xlsx library to reduce initial bundle size
  const XLSX = await import('xlsx-js-style');
  
  // Transform reminder data to Excel format
  const excelData = reminders.map((reminder) => ({
    Description: reminder.description,
    'Due Date': new Date(reminder.dueDate).toLocaleDateString('en-GB'),
    'Assigned To': reminder.assignedToUserName,
    Category: reminder.categoryName || 'None',
    Priority: reminder.priority ? 'Important' : 'Normal',
    Status: reminder.status,
    'Completion Notes': reminder.completionNotes || '',
    'Completed By': reminder.completedBy || '',
    'Completed Date': reminder.completedDateTime
      ? new Date(reminder.completedDateTime).toLocaleDateString('en-GB')
      : '',
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 40 }, // Description
    { wch: 12 }, // Due Date
    { wch: 20 }, // Assigned To
    { wch: 15 }, // Category
    { wch: 12 }, // Priority
    { wch: 12 }, // Status
    { wch: 30 }, // Completion Notes
    { wch: 20 }, // Completed By
    { wch: 15 }, // Completed Date
  ];
  worksheet['!cols'] = columnWidths;

  // Apply header styling
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1976D2' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  }

  // Apply color styling to data rows
  reminders.forEach((reminder, index) => {
    const rowNumber = index + 2; // +2 because Excel is 1-based and row 1 is headers

    // Style Priority column (E) - Yellow background for Important
    const priorityCell = `E${rowNumber}`;
    if (worksheet[priorityCell] && reminder.priority) {
      worksheet[priorityCell].s = {
        fill: { fgColor: { rgb: 'FFF9C4' } },
        font: { bold: true },
      };
    }

    // Style Status column (F) - Green for Completed, Blue for Pending
    const statusCell = `F${rowNumber}`;
    if (worksheet[statusCell]) {
      let statusColor: string | null = null;

      if (reminder.status === 'Completed') {
        statusColor = '4CAF50'; // Green
      } else if (reminder.status === 'Pending') {
        statusColor = '2196F3'; // Blue
      }

      if (statusColor) {
        worksheet[statusCell].s = {
          fill: { fgColor: { rgb: statusColor } },
          font: { color: { rgb: 'FFFFFF' }, bold: true },
        };
      }
    }
  });

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reminders');

  // Generate filename with date
  const now = new Date();
  const timestamp = now.toISOString().substring(0, 10);
  const filename = `Reminders_${timestamp}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename, { cellStyles: true });
}
