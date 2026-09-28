/**
 * Unit tests for AddOneOffContributionDrawer
 *
 * Covers the standard member Autocomplete flow plus the January-only
 * "last year's envelope number" toggle.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../test-utils';
import { AddOneOffContributionDrawer } from './AddOneOffContributionDrawer';

const mockAddOneOffContribution = vi.fn();
const mockGetChurchMembers = vi.fn();
const mockValidateRegisterNumber = vi.fn();

vi.mock('@services/api', () => ({
  contributionsApi: {
    addOneOffContribution: (...args: unknown[]) =>
      mockAddOneOffContribution(...args),
  },
  churchMembersApi: {
    getChurchMembers: (...args: unknown[]) => mockGetChurchMembers(...args),
  },
}));

vi.mock('../../services/attendanceService', () => ({
  envelopeContributionService: {
    validateRegisterNumber: (...args: unknown[]) =>
      mockValidateRegisterNumber(...args),
  },
}));

describe('AddOneOffContributionDrawer', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetChurchMembers.mockResolvedValue({
      items: [{ id: 1, fullName: 'John Doe', memberNumber: 57 }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('hides the last-year toggle outside January', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));

    render(<AddOneOffContributionDrawer {...defaultProps} />);

    expect(
      screen.queryByText("This relates to last year's envelope number")
    ).not.toBeInTheDocument();
  });

  test('shows the last-year toggle in January', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15'));

    render(<AddOneOffContributionDrawer {...defaultProps} />);

    expect(
      screen.getByText("This relates to last year's envelope number")
    ).toBeInTheDocument();
  });

  test('resolves a valid last year register number and displays the member name', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15'));
    mockValidateRegisterNumber.mockResolvedValue({
      valid: true,
      memberId: 42,
      memberName: 'Jane Smith',
    });

    render(<AddOneOffContributionDrawer {...defaultProps} />);

    fireEvent.click(
      screen.getByText("This relates to last year's envelope number")
    );

    const numberField = screen.getByLabelText("Last Year's Envelope Number");
    fireEvent.change(numberField, { target: { value: '12' } });
    fireEvent.blur(numberField);

    await waitFor(() => {
      expect(mockValidateRegisterNumber).toHaveBeenCalledWith(12, 2025);
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('shows the API error for an invalid last year register number and blocks submission', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15'));
    mockValidateRegisterNumber.mockResolvedValue({
      valid: false,
      error: 'Register number not found for current year',
    });

    render(<AddOneOffContributionDrawer {...defaultProps} />);

    fireEvent.click(
      screen.getByText("This relates to last year's envelope number")
    );

    const numberField = screen.getByLabelText("Last Year's Envelope Number");
    fireEvent.change(numberField, { target: { value: '999' } });
    fireEvent.blur(numberField);

    await waitFor(() => {
      expect(
        screen.getByText('Register number not found for current year')
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /add contribution/i }));

    expect(mockAddOneOffContribution).not.toHaveBeenCalled();
  });

  test('shows "Member is not active" for an inactive member match', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15'));
    mockValidateRegisterNumber.mockResolvedValue({
      valid: false,
      isActive: false,
      error: 'Member is not active',
    });

    render(<AddOneOffContributionDrawer {...defaultProps} />);

    fireEvent.click(
      screen.getByText("This relates to last year's envelope number")
    );

    const numberField = screen.getByLabelText("Last Year's Envelope Number");
    fireEvent.change(numberField, { target: { value: '5' } });
    fireEvent.blur(numberField);

    await waitFor(() => {
      expect(screen.getByText('Member is not active')).toBeInTheDocument();
    });
  });

  test('submits using the resolved memberId when in last-year mode', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15'));
    mockValidateRegisterNumber.mockResolvedValue({
      valid: true,
      memberId: 42,
      memberName: 'Jane Smith',
    });
    mockAddOneOffContribution.mockResolvedValue({
      contributionId: 1,
      message: 'OK',
      memberName: 'Jane Smith',
    });

    render(<AddOneOffContributionDrawer {...defaultProps} />);

    fireEvent.click(
      screen.getByText("This relates to last year's envelope number")
    );

    const numberField = screen.getByLabelText("Last Year's Envelope Number");
    fireEvent.change(numberField, { target: { value: '12' } });
    fireEvent.blur(numberField);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '25' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Late envelope' },
    });

    fireEvent.click(screen.getByRole('button', { name: /add contribution/i }));

    await waitFor(() => {
      expect(mockAddOneOffContribution).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: 42, amount: 25 })
      );
    });
  });

  test('clears last-year lookup state and restores the Autocomplete when toggled off', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15'));

    render(<AddOneOffContributionDrawer {...defaultProps} />);

    const checkbox = screen.getByText(
      "This relates to last year's envelope number"
    );
    fireEvent.click(checkbox);
    expect(
      screen.getByLabelText("Last Year's Envelope Number")
    ).toBeInTheDocument();

    fireEvent.click(checkbox);

    expect(
      screen.queryByLabelText("Last Year's Envelope Number")
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Member')).toBeInTheDocument();
  });

  test('normal Autocomplete submission flow is unaffected', async () => {
    mockAddOneOffContribution.mockResolvedValue({
      contributionId: 1,
      message: 'OK',
      memberName: 'John Doe',
    });

    render(<AddOneOffContributionDrawer {...defaultProps} />);

    const memberInput = screen.getByLabelText('Member');
    fireEvent.change(memberInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe (57)')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('John Doe (57)'));

    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Gift' },
    });

    fireEvent.click(screen.getByRole('button', { name: /add contribution/i }));

    await waitFor(() => {
      expect(mockAddOneOffContribution).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: 1, amount: 10 })
      );
    });
  });
});
