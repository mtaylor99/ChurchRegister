/**
 * Unit tests for exportAttendanceAnalyticsPdf utility
 * Mocks html2canvas and jsPDF to test PDF export logic
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock pdf instance ────────────────────────────────────────────────────────
const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
const mockPdfInstance = {
  setFontSize: vi.fn(),
  text: vi.fn(),
  addPage: vi.fn(),
  addImage: vi.fn(),
  output: vi.fn(() => mockBlob),
};

// ─── Mock dynamic imports ──────────────────────────────────────────────────────
vi.mock('html2canvas', () => ({
  default: vi.fn(async () => ({
    toDataURL: vi.fn(() => 'data:image/png;base64,abc123'),
    scrollWidth: 800,
    scrollHeight: 600,
  })),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function () {
    return mockPdfInstance;
  }),
}));

// ─── Mock URL utility ─────────────────────────────────────────────────────────
const mockCreateObjectURL = vi.fn(() => 'blob:http://localhost/test-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(window, 'URL', {
  value: { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL },
  writable: true,
});

import {
  generateAttendanceAnalyticsPdfFromCharts,
  downloadAttendanceAnalyticsPdf,
} from './exportAttendanceAnalyticsPdf';

// ─── Helper to create mock chart element ─────────────────────────────────────
function createMockChartsContainer(chartCount = 2): HTMLElement {
  const container = document.createElement('div');
  for (let i = 0; i < chartCount; i++) {
    const chart = document.createElement('div');
    chart.setAttribute('data-chart-container', 'true');
    container.appendChild(chart);
  }
  return container;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('generateAttendanceAnalyticsPdfFromCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPdfInstance.output.mockReturnValue(mockBlob);
  });

  test('generates PDF blob without throwing', async () => {
    const container = createMockChartsContainer(1);
    const result = await generateAttendanceAnalyticsPdfFromCharts(container, 3);
    expect(result).toBeInstanceOf(Blob);
  });

  test('renders title page with correct text', async () => {
    const container = createMockChartsContainer(0);
    await generateAttendanceAnalyticsPdfFromCharts(container, 5);
    const textCalls = mockPdfInstance.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('Attendance Analytics Report');
  });

  test('renders events count in title', async () => {
    const container = createMockChartsContainer(0);
    await generateAttendanceAnalyticsPdfFromCharts(container, 7);
    const textCalls = mockPdfInstance.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('7 Events Included');
  });

  test('calls html2canvas for each chart element', async () => {
    const { default: html2canvas } = await import('html2canvas');
    const container = createMockChartsContainer(3);
    await generateAttendanceAnalyticsPdfFromCharts(container, 3);
    expect(html2canvas).toHaveBeenCalledTimes(3);
  });

  test('calls addImage for each chart canvas', async () => {
    const container = createMockChartsContainer(2);
    await generateAttendanceAnalyticsPdfFromCharts(container, 2);
    expect(mockPdfInstance.addImage).toHaveBeenCalledTimes(2);
  });

  test('adds new page every 6 charts (chartsPerPage)', async () => {
    const container = createMockChartsContainer(7);
    await generateAttendanceAnalyticsPdfFromCharts(container, 7);
    // Should add a page at chart index 6 (second batch)
    expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(1);
  });

  test('does not add pages for 6 or fewer charts', async () => {
    const container = createMockChartsContainer(6);
    await generateAttendanceAnalyticsPdfFromCharts(container, 6);
    expect(mockPdfInstance.addPage).not.toHaveBeenCalled();
  });

  test('handles empty charts container without throwing', async () => {
    const container = createMockChartsContainer(0);
    const result = await generateAttendanceAnalyticsPdfFromCharts(container, 0);
    expect(result).toBeInstanceOf(Blob);
    expect(mockPdfInstance.addImage).not.toHaveBeenCalled();
  });

  test('returns pdf output as blob', async () => {
    const container = createMockChartsContainer(1);
    const result = await generateAttendanceAnalyticsPdfFromCharts(container, 1);
    expect(mockPdfInstance.output).toHaveBeenCalledWith('blob');
    expect(result).toBe(mockBlob);
  });
});

describe('downloadAttendanceAnalyticsPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPdfInstance.output.mockReturnValue(mockBlob);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('downloads PDF without throwing', async () => {
    // Create container BEFORE spying on createElement to avoid interfering with container setup
    const container = createMockChartsContainer(1);

    const mockClick = vi.fn();
    const mockLink = { href: '', download: '', click: mockClick };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await expect(downloadAttendanceAnalyticsPdf(container, 3)).resolves.toBeUndefined();
  });

  test('creates object URL from blob', async () => {
    const container = createMockChartsContainer(1);

    const mockLink = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await downloadAttendanceAnalyticsPdf(container, 3);
    expect(mockCreateObjectURL).toHaveBeenCalledOnce();
  });

  test('revokes object URL after download', async () => {
    const container = createMockChartsContainer(1);

    const mockLink = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await downloadAttendanceAnalyticsPdf(container, 3);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-url');
  });

  test('sets download filename with date format', async () => {
    const container = createMockChartsContainer(1);

    const mockLink = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await downloadAttendanceAnalyticsPdf(container, 3);
    expect(mockLink.download).toMatch(/attendance-analytics-\d{4}-\d{2}-\d{2}\.pdf/);
  });
});
