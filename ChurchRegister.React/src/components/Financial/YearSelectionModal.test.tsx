import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { YearSelectionModal } from './YearSelectionModal';

describe('YearSelectionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    isExporting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal with year and contribution type dropdowns', () => {
    render(<YearSelectionModal {...defaultProps} />);

    expect(screen.getByText('Export Member Contributions')).toBeInTheDocument();
    expect(screen.getByLabelText('Year')).toBeInTheDocument();
    expect(screen.getByLabelText('Contribution Type')).toBeInTheDocument();
  });

  test('defaults to current year and "All Contributions"', () => {
    render(<YearSelectionModal {...defaultProps} />);

    const currentYear = new Date().getFullYear();
    
    // Check year - MUI Select stores value in hidden input
    const yearInput = screen.getByRole('combobox', { name: /year/i });
    expect(yearInput).toHaveTextContent(currentYear.toString());
    
    // Check member type - should show "All Contributions" as default
    const memberTypeInput = screen.getByRole('combobox', { name: /contribution type/i });
    expect(memberTypeInput).toHaveTextContent('All Contributions');
  });

  test('shows contribution type options', async () => {
    render(<YearSelectionModal {...defaultProps} />);

    const memberTypeSelect = screen.getByRole('combobox', { name: /contribution type/i });
    fireEvent.mouseDown(memberTypeSelect);

    // MUI renders menu items in a portal, so we need to search globally
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'All Contributions' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Envelopes Only' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Bank Credit Only' })).toBeInTheDocument();
    });
  });

  test('calls onConfirm with year and undefined filter for "All Contributions"', () => {
    render(<YearSelectionModal {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const currentYear = new Date().getFullYear();
    expect(mockOnConfirm).toHaveBeenCalledWith(currentYear, undefined);
  });

  test('calls onConfirm with year and true filter for "Envelopes Only"', async () => {
    render(<YearSelectionModal {...defaultProps} />);

    // Select "Envelopes Only"
    const memberTypeSelect = screen.getByRole('combobox', { name: /contribution type/i });
    fireEvent.mouseDown(memberTypeSelect);

    await waitFor(() => {
      const envelopesOption = screen.getByRole('option', { name: 'Envelopes Only' });
      fireEvent.click(envelopesOption);
    });

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const currentYear = new Date().getFullYear();
    expect(mockOnConfirm).toHaveBeenCalledWith(currentYear, true);
  });

  test('calls onConfirm with year and false filter for "Bank Credit Only"', async () => {
    render(<YearSelectionModal {...defaultProps} />);

    // Select "Bank Credit Only"
    const memberTypeSelect = screen.getByRole('combobox', { name: /contribution type/i });
    fireEvent.mouseDown(memberTypeSelect);

    await waitFor(() => {
      const bankCreditOption = screen.getByRole('option', { name: 'Bank Credit Only' });
      fireEvent.click(bankCreditOption);
    });

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const currentYear = new Date().getFullYear();
    expect(mockOnConfirm).toHaveBeenCalledWith(currentYear, false);
  });

  test('resets to defaults when closing', async () => {
    const { rerender } = render(<YearSelectionModal {...defaultProps} />);

    // Change year
    const yearSelect = screen.getByRole('combobox', { name: /year/i });
    fireEvent.mouseDown(yearSelect);
    
    await waitFor(() => {
      const year2023 = screen.getByRole('option', { name: '2023' });
      fireEvent.click(year2023);
    });

    // Change member type
    const memberTypeSelect = screen.getByRole('combobox', { name: /contribution type/i });
    fireEvent.mouseDown(memberTypeSelect);

    await waitFor(() => {
      const envelopesOption = screen.getByRole('option', { name: 'Envelopes Only' });
      fireEvent.click(envelopesOption);
    });

    // Close modal
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    
    // Reopen modal to verify reset
    rerender(<YearSelectionModal {...defaultProps} open={true} />);
    
    const currentYear = new Date().getFullYear();
    const yearInput = screen.getByRole('combobox', { name: /year/i });
    const memberTypeInput = screen.getByRole('combobox', { name: /contribution type/i });
    
    expect(yearInput).toHaveTextContent(currentYear.toString());
    expect(memberTypeInput).toHaveTextContent('All Contributions');
  });

  test('disables buttons when exporting', () => {
    render(<YearSelectionModal {...defaultProps} isExporting={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    const exportButton = screen.getByRole('button', { name: /exporting/i });

    expect(cancelButton).toBeDisabled();
    expect(exportButton).toBeDisabled();
  });

  test('shows "Exporting..." text when isExporting is true', () => {
    render(<YearSelectionModal {...defaultProps} isExporting={true} />);

    expect(screen.getByText('Exporting...')).toBeInTheDocument();
  });
});
