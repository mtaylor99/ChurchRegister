/**
 * Unit tests for TrainingCertificatesPage
 *
 * Strategy: mock all heavy sub-components and API modules.
 * Test heading, tabs, and basic rendering.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils';
import { TrainingCertificatesPage } from './TrainingCertificatesPage';

// Mock API modules
vi.mock('../../services/api', () => ({
  trainingCertificatesApi: {
    getCertificates: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    exportToExcel: vi.fn().mockResolvedValue(new Blob()),
  },
}));

vi.mock('../../utils/excelExport', () => ({
  exportTrainingCertificatesToExcel: vi.fn().mockResolvedValue(undefined),
}));

// Mock heavy sub-components
vi.mock('../../components/TrainingCertificates', () => ({
  TrainingCertificateGrid: ({ onCertificateClick }: { onCertificateClick?: (c: unknown) => void }) => (
    <div data-testid="training-certificate-grid">
      <button onClick={() => onCertificateClick?.({ id: 1 })}>Certificate</button>
    </div>
  ),
  TrainingCertificateDrawer: ({ open, mode }: { open: boolean; mode: string }) =>
    open ? <div data-testid="training-certificate-drawer" data-mode={mode}>Drawer</div> : null,
  TrainingCertificateTypeGrid: ({}: Record<string, unknown>) => (
    <div data-testid="training-type-grid">Types</div>
  ),
}));

describe('TrainingCertificatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the Training & Certifications heading', () => {
    render(<TrainingCertificatesPage />, { withRouter: true });
    expect(screen.getByRole('heading', { name: /training & certifications/i })).toBeDefined();
  });

  test('renders two tabs: Certifications and Training Types', () => {
    render(<TrainingCertificatesPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  test('renders the TrainingCertificateGrid by default', () => {
    render(<TrainingCertificatesPage />, { withRouter: true });
    expect(screen.getByTestId('training-certificate-grid')).toBeDefined();
  });

  test('switches to the second tab on click', () => {
    render(<TrainingCertificatesPage />, { withRouter: true });
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    expect(screen.getByTestId('training-type-grid')).toBeDefined();
  });
});
