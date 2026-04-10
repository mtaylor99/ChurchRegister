/**
 * Unit tests for excelExport utility
 * Mocks xlsx-js-style to test export logic without writing actual files
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// ─── Mock xlsx-js-style ───────────────────────────────────────────────────────
const mockWorksheet: Record<string, unknown> = {};
const mockWorkbook = {};

const mockJsonToSheet = vi.fn().mockReturnValue(mockWorksheet);
const mockBookNew = vi.fn().mockReturnValue(mockWorkbook);
const mockBookAppendSheet = vi.fn();
const mockEncodeCell = vi.fn(({ r, c }: { r: number; c: number }) => `${String.fromCharCode(65 + c)}${r + 1}`);
const mockDecodeRange = vi.fn().mockReturnValue({ s: { c: 0 }, e: { c: 4 } });
const mockWriteFile = vi.fn();

vi.mock('xlsx-js-style', () => ({
  default: {
    utils: {
      json_to_sheet: mockJsonToSheet,
      book_new: mockBookNew,
      book_append_sheet: mockBookAppendSheet,
      encode_cell: mockEncodeCell,
      decode_range: mockDecodeRange,
    },
    writeFile: mockWriteFile,
  },
  utils: {
    json_to_sheet: mockJsonToSheet,
    book_new: mockBookNew,
    book_append_sheet: mockBookAppendSheet,
    encode_cell: mockEncodeCell,
    decode_range: mockDecodeRange,
  },
  writeFile: mockWriteFile,
}));

import {
  exportMemberContributionsToExcel,
  exportChurchMembersWithDetailsToExcel,
  exportTrainingCertificatesToExcel,
  exportRemindersToExcel,
} from './excelExport';
import type { MemberContributionExportData } from './excelExport';
import type { ChurchMemberDetailDto } from '../types/churchMembers';
import type { TrainingCertificateDto } from '../types/trainingCertificates';
import type { Reminder } from '../types/reminders';

// ─── Test data helpers ────────────────────────────────────────────────────────
const makeMemberContributionData = (overrides: Partial<MemberContributionExportData> = {}): MemberContributionExportData => ({
  id: 1,
  fullName: 'John Smith',
  thisYearsContribution: 1200.0,
  giftAid: true,
  title: 'Mr',
  memberNumber: 42,
  bankReference: 'REF001',
  lastContributionDate: '2024-06-01',
  address: {
    nameNumber: '10',
    addressLineOne: 'Church Street',
    addressLineTwo: '',
    town: 'London',
    county: 'Greater London',
    postcode: 'SW1A 1AA',
  },
  ...overrides,
});

const makeChurchMember = (overrides: Partial<ChurchMemberDetailDto> = {}): ChurchMemberDetailDto => ({
  id: 1,
  firstName: 'Jane',
  lastName: 'Doe',
  fullName: 'Jane Doe',
  title: 'Mrs',
  email: 'jane@example.com',
  phone: '07700000000',
  status: 'Active',
  memberNumber: 10,
  memberSince: '2020-01-01',
  districtId: 1,
  districtName: 'District A',
  roles: [],
  baptised: true,
  giftAid: true,
  envelopes: false,
  pastoralCareRequired: false,
  address: {
    nameNumber: '1',
    addressLineOne: 'High Street',
    town: 'London',
    county: 'Greater London',
    postcode: 'EC1A 1BB',
  },
  bankReference: 'JD001',
  dataProtection: {
    allowNameInCommunications: true,
    allowHealthStatusInCommunications: false,
    allowPhotoInCommunications: true,
    allowPhotoInSocialMedia: false,
    groupPhotos: true,
    permissionForMyChildren: false,
  },
  createdAt: '2024-01-01T00:00:00',
  createdBy: 'admin',
  ...overrides,
} as ChurchMemberDetailDto);

const makeTrainingCertificate = (overrides: Partial<TrainingCertificateDto> = {}): TrainingCertificateDto => ({
  id: 1,
  memberId: 1,
  memberName: 'John Smith',
  trainingType: 'DBS Check',
  expires: '2025-12-31',
  status: 'In Validity',
  ragStatus: 'Green',
  ...overrides,
} as TrainingCertificateDto);

const makeReminder = (overrides: Partial<Reminder> = {}): Reminder => ({
  id: 1,
  description: 'Complete annual review',
  dueDate: '2024-12-31',
  assignedToUserId: 'user-1',
  assignedToUserName: 'Alice',
  categoryId: 1,
  categoryName: 'Administration',
  priority: false,
  status: 'Pending',
  completionNotes: null,
  completedBy: null,
  completedDateTime: null,
  createNext: false,
  nextInterval: null,
  customDueDate: null,
  ...overrides,
} as Reminder);

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('exportMemberContributionsToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJsonToSheet.mockReturnValue({ '!ref': 'A1:J5' });
    mockBookNew.mockReturnValue(mockWorkbook);
  });

  test('exports member contributions without throwing', async () => {
    const members = [makeMemberContributionData()];
    await expect(exportMemberContributionsToExcel(members)).resolves.toBeUndefined();
  });

  test('calls json_to_sheet with transformed member data', async () => {
    const members = [makeMemberContributionData({ giftAid: true, memberNumber: 7, title: 'Dr', bankReference: 'BREF' })];
    await exportMemberContributionsToExcel(members, 2024);
    expect(mockJsonToSheet).toHaveBeenCalledOnce();
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['2024 Contribution']).toBe('1200.00');
    expect(data[0]['Gift Aid']).toBe('Yes');
    expect(data[0]['Number']).toBe(7);
  });

  test('uses current year when year not specified', async () => {
    const members = [makeMemberContributionData()];
    await exportMemberContributionsToExcel(members);
    const [data] = mockJsonToSheet.mock.calls[0];
    const currentYear = new Date().getFullYear();
    expect(Object.keys(data[0])).toContain(`${currentYear} Contribution`);
  });

  test('calls writeFile with xlsx extension', async () => {
    await exportMemberContributionsToExcel([makeMemberContributionData()]);
    expect(mockWriteFile).toHaveBeenCalledOnce();
    const [, filename] = mockWriteFile.mock.calls[0];
    expect(filename).toMatch(/Member_Contributions_\d{4}_\d{4}-\d{2}-\d{2}\.xlsx/);
  });

  test('calls book_append_sheet with Member Contributions sheet name', async () => {
    await exportMemberContributionsToExcel([makeMemberContributionData()]);
    expect(mockBookAppendSheet).toHaveBeenCalledWith(mockWorkbook, expect.anything(), 'Member Contributions');
  });

  test('handles member with no address', async () => {
    const member = makeMemberContributionData({ address: undefined, memberNumber: undefined, bankReference: undefined, title: undefined, lastContributionDate: undefined, giftAid: false });
    await expect(exportMemberContributionsToExcel([member])).resolves.toBeUndefined();
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Gift Aid']).toBe('No');
    expect(data[0]['Postcode']).toBe('');
  });

  test('handles empty members array', async () => {
    await expect(exportMemberContributionsToExcel([])).resolves.toBeUndefined();
    expect(mockJsonToSheet).toHaveBeenCalledWith([]);
  });

  test('splits fullName into firstName and surname correctly', async () => {
    const member = makeMemberContributionData({ fullName: 'Mary Anne Jones' });
    await exportMemberContributionsToExcel([member]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['First Name']).toBe('Mary');
    expect(data[0]['Surname']).toBe('Anne Jones');
  });
});

describe('exportChurchMembersWithDetailsToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJsonToSheet.mockReturnValue({ '!ref': 'A1:R5' });
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 17 } });
    mockBookNew.mockReturnValue(mockWorkbook);
  });

  test('exports church members without throwing', async () => {
    const members = [makeChurchMember()];
    await expect(exportChurchMembersWithDetailsToExcel(members)).resolves.toBeUndefined();
  });

  test('calls writeFile with Church_Members xlsx filename', async () => {
    await exportChurchMembersWithDetailsToExcel([makeChurchMember()]);
    expect(mockWriteFile).toHaveBeenCalledOnce();
    const [, filename] = mockWriteFile.mock.calls[0];
    expect(filename).toMatch(/Church_Members_\d{4}-\d{2}-\d{2}\.xlsx/);
  });

  test('calls book_append_sheet with Church Members sheet name', async () => {
    await exportChurchMembersWithDetailsToExcel([makeChurchMember()]);
    expect(mockBookAppendSheet).toHaveBeenCalledWith(mockWorkbook, expect.anything(), 'Church Members');
  });

  test('handles member with Active status for color coding', async () => {
    const activeMember = makeChurchMember({ status: 'Active' });
    const ws: Record<string, unknown> = { '!ref': 'A1:R2', Q2: { v: 'Active', s: {} } };
    mockJsonToSheet.mockReturnValue(ws);
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 17 } });
    await expect(exportChurchMembersWithDetailsToExcel([activeMember])).resolves.toBeUndefined();
  });

  test('handles member with Inactive status for color coding', async () => {
    const member = makeChurchMember({ status: 'Inactive' });
    const ws: Record<string, unknown> = { '!ref': 'A1:R2', Q2: { v: 'Inactive', s: {} } };
    mockJsonToSheet.mockReturnValue(ws);
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 17 } });
    await expect(exportChurchMembersWithDetailsToExcel([member])).resolves.toBeUndefined();
  });

  test('handles member with Expired status', async () => {
    const member = makeChurchMember({ status: 'Expired' });
    const ws: Record<string, unknown> = { '!ref': 'A1:R2', Q2: { v: 'Expired', s: {} } };
    mockJsonToSheet.mockReturnValue(ws);
    await expect(exportChurchMembersWithDetailsToExcel([member])).resolves.toBeUndefined();
  });

  test('handles member with In Glory status', async () => {
    const member = makeChurchMember({ status: 'In Glory' });
    const ws: Record<string, unknown> = { '!ref': 'A1:R2', Q2: { v: 'In Glory', s: {} } };
    mockJsonToSheet.mockReturnValue(ws);
    await expect(exportChurchMembersWithDetailsToExcel([member])).resolves.toBeUndefined();
  });

  test('handles data protection Yes/No cells', async () => {
    const member = makeChurchMember();
    const ws: Record<string, unknown> = {
      '!ref': 'A1:R2',
      K2: { v: 'Yes' },
      L2: { v: 'No' },
      M2: { v: 'Yes' },
      N2: { v: 'No' },
      O2: { v: 'Yes' },
      P2: { v: 'Yes' },
    };
    mockJsonToSheet.mockReturnValue(ws);
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 17 } });
    await expect(exportChurchMembersWithDetailsToExcel([member])).resolves.toBeUndefined();
  });

  test('sorts members with register numbers first', async () => {
    const memberWithNumber = makeChurchMember({ id: 1 });
    const memberWithoutNumber = makeChurchMember({ id: 2 });
    const memberNumbers = new Map([[1, 5]]); // id 1 has register number 5
    mockJsonToSheet.mockReturnValue({ '!ref': 'A1:R3' });
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 17 } });
    await exportChurchMembersWithDetailsToExcel([memberWithoutNumber, memberWithNumber], memberNumbers);
    expect(mockJsonToSheet).toHaveBeenCalledOnce();
    const [data] = mockJsonToSheet.mock.calls[0];
    // First entry should be the one with a register number
    expect(data[0]['Number']).toBe(5);
  });

  test('handles member with no address fields', async () => {
    const member = makeChurchMember({ address: undefined });
    await expect(exportChurchMembersWithDetailsToExcel([member])).resolves.toBeUndefined();
  });

  test('exports empty array without errors', async () => {
    await expect(exportChurchMembersWithDetailsToExcel([])).resolves.toBeUndefined();
  });

  test('accepts optional memberNumbers map', async () => {
    const member = makeChurchMember({ id: 1 });
    await expect(exportChurchMembersWithDetailsToExcel([member], new Map([[1, 99]]))).resolves.toBeUndefined();
  });
});

describe('exportTrainingCertificatesToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJsonToSheet.mockReturnValue({ '!ref': 'A1:E5' });
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 4 } });
    mockBookNew.mockReturnValue(mockWorkbook);
  });

  test('exports training certificates without throwing', async () => {
    const certs = [makeTrainingCertificate()];
    await expect(exportTrainingCertificatesToExcel(certs)).resolves.toBeUndefined();
  });

  test('calls writeFile with Training_Certificates xlsx filename', async () => {
    await exportTrainingCertificatesToExcel([makeTrainingCertificate()]);
    expect(mockWriteFile).toHaveBeenCalledOnce();
    const [, filename] = mockWriteFile.mock.calls[0];
    expect(filename).toMatch(/Training_Certificates_\d{4}-\d{2}-\d{2}\.xlsx/);
  });

  test('calls book_append_sheet with Training Certificates sheet', async () => {
    await exportTrainingCertificatesToExcel([makeTrainingCertificate()]);
    expect(mockBookAppendSheet).toHaveBeenCalledWith(mockWorkbook, expect.anything(), 'Training Certificates');
  });

  test('maps Red ragStatus to Expired alert', async () => {
    const cert = makeTrainingCertificate({ ragStatus: 'Red' });
    await exportTrainingCertificatesToExcel([cert]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Alert']).toBe('Expired');
  });

  test('maps Amber ragStatus to Expiring alert', async () => {
    const cert = makeTrainingCertificate({ ragStatus: 'Amber' });
    await exportTrainingCertificatesToExcel([cert]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Alert']).toBe('Expiring');
  });

  test('maps Green ragStatus to empty alert', async () => {
    const cert = makeTrainingCertificate({ ragStatus: 'Green' });
    await exportTrainingCertificatesToExcel([cert]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Alert']).toBe('');
  });

  test('formats expires date in en-GB format', async () => {
    const cert = makeTrainingCertificate({ expires: '2025-06-15' });
    await exportTrainingCertificatesToExcel([cert]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Expires']).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  test('shows N/A when expires is null', async () => {
    const cert = makeTrainingCertificate({ expires: undefined });
    await exportTrainingCertificatesToExcel([cert]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Expires']).toBe('N/A');
  });

  test('applies color styling to Red alert cells from worksheet', async () => {
    const cert = makeTrainingCertificate({ ragStatus: 'Red', status: 'Expired' });
    const ws: Record<string, unknown> = {
      '!ref': 'A1:E2',
      C2: { v: 'Expired', s: {} },
      E2: { v: 'Expired', s: {} },
    };
    mockJsonToSheet.mockReturnValue(ws);
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 4 } });
    await exportTrainingCertificatesToExcel([cert]);
    // Just verify no exceptions thrown and writeFile was called
    expect(mockWriteFile).toHaveBeenCalled();
  });

  test('applies color styling to Amber alert cells', async () => {
    const cert = makeTrainingCertificate({ ragStatus: 'Amber', status: 'Pending' });
    const ws: Record<string, unknown> = {
      '!ref': 'A1:E2',
      C2: { v: 'Expiring', s: {} },
      E2: { v: 'Pending', s: {} },
    };
    mockJsonToSheet.mockReturnValue(ws);
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 4 } });
    await exportTrainingCertificatesToExcel([cert]);
    expect(mockWriteFile).toHaveBeenCalled();
  });

  test('applies color styling to In Validity status', async () => {
    const cert = makeTrainingCertificate({ ragStatus: 'Green', status: 'In Validity' });
    const ws: Record<string, unknown> = {
      '!ref': 'A1:E2',
      E2: { v: 'In Validity', s: {} },
    };
    mockJsonToSheet.mockReturnValue(ws);
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 4 } });
    await exportTrainingCertificatesToExcel([cert]);
    expect(mockWriteFile).toHaveBeenCalled();
  });

  test('applies color styling to Allow to Expire status', async () => {
    const cert = makeTrainingCertificate({ status: 'Allow to Expire', ragStatus: 'Green' });
    const ws: Record<string, unknown> = {
      '!ref': 'A1:E2',
      E2: { v: 'Allow to Expire', s: {} },
    };
    mockJsonToSheet.mockReturnValue(ws);
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 4 } });
    await exportTrainingCertificatesToExcel([cert]);
    expect(mockWriteFile).toHaveBeenCalled();
  });

  test('exports empty certificates array', async () => {
    await expect(exportTrainingCertificatesToExcel([])).resolves.toBeUndefined();
  });
});

describe('exportRemindersToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJsonToSheet.mockReturnValue({ '!ref': 'A1:I5' });
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 8 } });
    mockBookNew.mockReturnValue(mockWorkbook);
  });

  test('exports reminders without throwing', async () => {
    const reminders = [makeReminder()];
    await expect(exportRemindersToExcel(reminders)).resolves.toBeUndefined();
  });

  test('calls writeFile with Reminders xlsx filename', async () => {
    await exportRemindersToExcel([makeReminder()]);
    expect(mockWriteFile).toHaveBeenCalledOnce();
    const [, filename] = mockWriteFile.mock.calls[0];
    expect(filename).toMatch(/Reminders_\d{4}-\d{2}-\d{2}\.xlsx/);
  });

  test('calls book_append_sheet with Reminders sheet name', async () => {
    await exportRemindersToExcel([makeReminder()]);
    expect(mockBookAppendSheet).toHaveBeenCalledWith(mockWorkbook, expect.anything(), 'Reminders');
  });

  test('maps priority true to Important', async () => {
    const reminder = makeReminder({ priority: true });
    await exportRemindersToExcel([reminder]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Priority']).toBe('Important');
  });

  test('maps priority false to Normal', async () => {
    const reminder = makeReminder({ priority: false });
    await exportRemindersToExcel([reminder]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Priority']).toBe('Normal');
  });

  test('maps null categoryName to None', async () => {
    const reminder = makeReminder({ categoryName: null });
    await exportRemindersToExcel([reminder]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Category']).toBe('None');
  });

  test('formats dueDate in en-GB format', async () => {
    const reminder = makeReminder({ dueDate: '2024-06-15' });
    await exportRemindersToExcel([reminder]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Due Date']).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  test('handles null completionNotes and completedBy', async () => {
    const reminder = makeReminder({ completionNotes: null, completedBy: null, completedDateTime: null });
    await exportRemindersToExcel([reminder]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Completion Notes']).toBe('');
    expect(data[0]['Completed By']).toBe('');
    expect(data[0]['Completed Date']).toBe('');
  });

  test('formats completedDateTime in en-GB format', async () => {
    const reminder = makeReminder({ completedDateTime: '2024-09-01T10:30:00', status: 'Completed', completedBy: 'Bob' });
    await exportRemindersToExcel([reminder]);
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data[0]['Completed Date']).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  test('applies priority styling to Important reminders', async () => {
    const reminder = makeReminder({ priority: true });
    const ws: Record<string, unknown> = {
      '!ref': 'A1:I2',
      E2: { v: 'Important' },
      F2: { v: 'Pending' },
    };
    mockJsonToSheet.mockReturnValue(ws);
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 8 } });
    await exportRemindersToExcel([reminder]);
    expect(mockWriteFile).toHaveBeenCalled();
  });

  test('applies Completed status styling', async () => {
    const reminder = makeReminder({ status: 'Completed' });
    const ws: Record<string, unknown> = {
      '!ref': 'A1:I2',
      E2: { v: 'Normal' },
      F2: { v: 'Completed' },
    };
    mockJsonToSheet.mockReturnValue(ws);
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 8 } });
    await exportRemindersToExcel([reminder]);
    expect(mockWriteFile).toHaveBeenCalled();
  });

  test('applies Pending status styling', async () => {
    const reminder = makeReminder({ status: 'Pending' });
    const ws: Record<string, unknown> = {
      '!ref': 'A1:I2',
      F2: { v: 'Pending' },
    };
    mockJsonToSheet.mockReturnValue(ws);
    mockDecodeRange.mockReturnValue({ s: { c: 0 }, e: { c: 8 } });
    await exportRemindersToExcel([reminder]);
    expect(mockWriteFile).toHaveBeenCalled();
  });

  test('exports empty reminders array', async () => {
    await expect(exportRemindersToExcel([])).resolves.toBeUndefined();
  });

  test('handles multiple reminders', async () => {
    const reminders = [
      makeReminder({ id: 1, status: 'Pending', priority: true }),
      makeReminder({ id: 2, status: 'Completed', priority: false }),
      makeReminder({ id: 3, status: 'Pending', priority: false }),
    ];
    await expect(exportRemindersToExcel(reminders)).resolves.toBeUndefined();
    const [data] = mockJsonToSheet.mock.calls[0];
    expect(data).toHaveLength(3);
  });
});
