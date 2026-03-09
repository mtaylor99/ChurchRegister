/**
 * Unit tests for exportRiskAssessmentsPdf utility
 * Mocks jsPDF to test PDF export logic without actual PDF generation
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// ─── Hoist MockJsPDF and mockPdfMethods before vi.mock is evaluated ───────────
const { MockJsPDF, mockPdfMethods } = vi.hoisted(() => {
  const methods = {
    internal: {
      pageSize: { getWidth: vi.fn(() => 297), getHeight: vi.fn(() => 210) },
      pages: [null, 'page1'] as unknown[],
    },
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    setFillColor: vi.fn(),
    setTextColor: vi.fn(),
    rect: vi.fn(),
    circle: vi.fn(),
    addPage: vi.fn(),
    setPage: vi.fn(),
    save: vi.fn(),
    splitTextToSize: vi.fn((text: string) => [text]),
  };
  // Use a regular function so it can be called with `new`
  const Ctor = vi.fn(function () {
    return methods;
  });
  return { MockJsPDF: Ctor, mockPdfMethods: methods };
});

vi.mock('jspdf', () => ({
  jsPDF: MockJsPDF,
}));

// Convenient alias used throughout tests
const mockPdfInstance = mockPdfMethods;

import { exportRiskAssessmentsPdf } from './exportRiskAssessmentsPdf';
import type { RiskAssessment } from '../types/riskAssessments';

// ─── Test data helpers ────────────────────────────────────────────────────────
const makeAssessment = (overrides: Partial<RiskAssessment> = {}): RiskAssessment => ({
  id: 1,
  title: 'Fire Safety Assessment',
  description: 'Annual fire safety review',
  categoryId: 1,
  categoryName: 'Safety',
  lastReviewDate: '2024-01-15',
  nextReviewDate: '2025-01-15',
  status: 'Approved',
  isOverdue: false,
  alertStatus: 'green',
  approvalCount: 2,
  minimumApprovalsRequired: 2,
  createdBy: 'admin',
  createdDateTime: '2024-01-01T00:00:00',
  ...overrides,
} as RiskAssessment);

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('exportRiskAssessmentsPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset internal pages to simulate single page
    mockPdfInstance.internal.pages = [null, 'page1'];
    mockPdfInstance.internal.pageSize.getWidth.mockReturnValue(297);
    mockPdfInstance.internal.pageSize.getHeight.mockReturnValue(210);
    mockPdfInstance.splitTextToSize.mockImplementation((text: string) => [text]);
    // Re-setup MockJsPDF so it always returns the mock instance
    MockJsPDF.mockImplementation(function () { return mockPdfInstance; });
  });

  test('exports assessments without throwing', async () => {
    const assessments = [makeAssessment()];
    await expect(exportRiskAssessmentsPdf(assessments)).resolves.toBeUndefined();
  });

  test('calls pdf.save with correct filename format', async () => {
    await exportRiskAssessmentsPdf([makeAssessment()]);
    expect(mockPdfInstance.save).toHaveBeenCalledOnce();
    const [filename] = mockPdfInstance.save.mock.calls[0];
    expect(filename).toMatch(/Risk-Assessments-\d{4}-\d{2}-\d{2}\.pdf/);
  });

  test('exports empty assessments array without throwing', async () => {
    await expect(exportRiskAssessmentsPdf([])).resolves.toBeUndefined();
    expect(mockPdfInstance.save).toHaveBeenCalledOnce();
  });

  test('renders title header text', async () => {
    await exportRiskAssessmentsPdf([makeAssessment()]);
    const textCalls = mockPdfInstance.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('Risk Assessment Register');
  });

  test('renders total assessments count in header', async () => {
    const assessments = [makeAssessment(), makeAssessment({ id: 2, title: 'Security Assessment' })];
    await exportRiskAssessmentsPdf(assessments);
    const textCalls = mockPdfInstance.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => String(t).includes('2'))).toBe(true);
  });

  test('renders assessment title in table', async () => {
    await exportRiskAssessmentsPdf([makeAssessment({ title: 'My Risk Assessment' })]);
    const textCalls = mockPdfInstance.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => String(t).includes('My Risk Assessment'))).toBe(true);
  });

  test('truncates long title to 45 chars with ellipsis', async () => {
    const longTitle = 'A'.repeat(50);
    await exportRiskAssessmentsPdf([makeAssessment({ title: longTitle })]);
    const textCalls = mockPdfInstance.text.mock.calls.map((c: unknown[]) => c[0]);
    const truncated = textCalls.find((t: unknown) => String(t).endsWith('...'));
    expect(truncated).toBeDefined();
  });

  test('truncates long category name to 25 chars with ellipsis', async () => {
    const longCategory = 'C'.repeat(30);
    await exportRiskAssessmentsPdf([makeAssessment({ categoryName: longCategory })]);
    const textCalls = mockPdfInstance.text.mock.calls.map((c: unknown[]) => c[0]);
    const truncated = textCalls.find((t: unknown) => String(t).endsWith('...'));
    expect(truncated).toBeDefined();
  });

  test('renders approval count in format count/required', async () => {
    await exportRiskAssessmentsPdf([makeAssessment({ approvalCount: 1, minimumApprovalsRequired: 3 })]);
    const textCalls = mockPdfInstance.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('1/3');
  });

  test('applies red text color for overdue assessments', async () => {
    await exportRiskAssessmentsPdf([makeAssessment({ isOverdue: true, alertStatus: 'red' })]);
    // setTextColor should be called with red (244, 67, 54)
    const redCall = mockPdfInstance.setTextColor.mock.calls.find(
      (c: number[]) => c[0] === 244 && c[1] === 67 && c[2] === 54
    );
    expect(redCall).toBeDefined();
  });

  test('applies amber text color for amber alert status', async () => {
    await exportRiskAssessmentsPdf([makeAssessment({ isOverdue: false, alertStatus: 'amber' })]);
    const amberCall = mockPdfInstance.setTextColor.mock.calls.find(
      (c: number[]) => c[0] === 255 && c[1] === 152 && c[2] === 0
    );
    expect(amberCall).toBeDefined();
  });

  test('applies green text color for Approved status', async () => {
    await exportRiskAssessmentsPdf([makeAssessment({ status: 'Approved' })]);
    const greenCall = mockPdfInstance.setTextColor.mock.calls.find(
      (c: number[]) => c[0] === 76 && c[1] === 175 && c[2] === 80
    );
    expect(greenCall).toBeDefined();
  });

  test('draws red circle alert indicator for overdue', async () => {
    await exportRiskAssessmentsPdf([makeAssessment({ isOverdue: true })]);
    const redFill = mockPdfInstance.setFillColor.mock.calls.find(
      (c: number[]) => c[0] === 244 && c[1] === 67 && c[2] === 54
    );
    expect(redFill).toBeDefined();
    expect(mockPdfInstance.circle).toHaveBeenCalled();
  });

  test('draws amber circle alert indicator for amber status', async () => {
    await exportRiskAssessmentsPdf([makeAssessment({ isOverdue: false, alertStatus: 'amber' })]);
    const amberFill = mockPdfInstance.setFillColor.mock.calls.find(
      (c: number[]) => c[0] === 255 && c[1] === 152 && c[2] === 0
    );
    expect(amberFill).toBeDefined();
  });

  test('draws green circle for non-overdue non-amber', async () => {
    await exportRiskAssessmentsPdf([makeAssessment({ isOverdue: false, alertStatus: 'green' })]);
    const greenFill = mockPdfInstance.setFillColor.mock.calls.find(
      (c: number[]) => c[0] === 76 && c[1] === 175 && c[2] === 80
    );
    expect(greenFill).toBeDefined();
  });

  test('renders description text when present', async () => {
    mockPdfInstance.splitTextToSize.mockReturnValue(['Annual fire safety review']);
    await exportRiskAssessmentsPdf([makeAssessment({ description: 'Annual fire safety review' })]);
    expect(mockPdfInstance.splitTextToSize).toHaveBeenCalled();
  });

  test('handles assessment with no description', async () => {
    await expect(exportRiskAssessmentsPdf([makeAssessment({ description: '' })])).resolves.toBeUndefined();
  });

  test('handles assessment with null dates', async () => {
    await expect(exportRiskAssessmentsPdf([makeAssessment({
      lastReviewDate: null,
      nextReviewDate: '2025-01-01',
    })])).resolves.toBeUndefined();
  });

  test('handles assessment with null categoryName', async () => {
    await expect(exportRiskAssessmentsPdf([makeAssessment({ categoryName: '' })])).resolves.toBeUndefined();
  });

  test('handles assessment with null title', async () => {
    await expect(exportRiskAssessmentsPdf([makeAssessment({ title: '' })])).resolves.toBeUndefined();
  });

  test('alternates row background colors for even rows', async () => {
    const assessments = [makeAssessment({ id: 1 }), makeAssessment({ id: 2 })];
    await exportRiskAssessmentsPdf(assessments);
    // setFillColor(245, 245, 245) should be called for even rows
    const lightGrayFill = mockPdfInstance.setFillColor.mock.calls.find(
      (c: number[]) => c[0] === 245 && c[1] === 245 && c[2] === 245
    );
    expect(lightGrayFill).toBeDefined();
  });

  test('adds page footer with page numbers', async () => {
    mockPdfInstance.internal.pages = [null, 'page1'];
    await exportRiskAssessmentsPdf([makeAssessment()]);
    // setPage should be called for footer rendering
    expect(mockPdfInstance.setPage).toHaveBeenCalledWith(1);
  });

  test('triggers page break when page height exceeded', async () => {
    // Simulate a very small page height to force page break
    mockPdfInstance.internal.pageSize.getHeight.mockReturnValue(30);
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({ id: i + 1, title: `Assessment ${i + 1}` })
    );
    await exportRiskAssessmentsPdf(assessments);
    expect(mockPdfInstance.addPage).toHaveBeenCalled();
  });

  test('handles description that exceeds 2 lines', async () => {
    mockPdfInstance.splitTextToSize.mockReturnValue(['line1', 'line2', 'line3', 'line4']);
    await expect(exportRiskAssessmentsPdf([makeAssessment({ description: 'Very long description that spans multiple lines in the PDF' })])).resolves.toBeUndefined();
  });

  test('throws error with meaningful message on jsPDF failure', async () => {
    MockJsPDF.mockImplementationOnce(function () {
      throw new Error('PDF library error');
    });
    await expect(exportRiskAssessmentsPdf([makeAssessment()])).rejects.toThrow('Failed to generate PDF. Please try again.');
  });
});
