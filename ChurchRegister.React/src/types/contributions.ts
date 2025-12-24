/**
 * Contributions page types for church member financial contributions management
 * These types are specific to the Contributions UI feature
 */

/**
 * Contribution member DTO for grid display
 * Contains only the fields needed for the contributions grid
 */
export interface ContributionMemberDto {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string; // Computed: firstName + lastName
  statusId: number;
  statusName: string;
  statusColor: string; // For chip styling (e.g., 'success', 'warning', 'error', 'info', 'default')
  envelopeNumber: string | null;
  thisYearsContribution: number; // Decimal currency amount
}

/**
 * Contribution grid query parameters for filtering, sorting, and pagination
 */
export interface ContributionGridQuery {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  envelopeNumberFilter?: string;
}

/**
 * Contribution grid paginated response
 */
export interface ContributionGridResponse {
  items: ContributionMemberDto[]; // Using 'items' to match existing PagedResult pattern
  totalCount: number;
  currentPage: number; // Using 'currentPage' to match existing pattern
  pageSize: number;
  totalPages: number;
}

/**
 * Props for ContributionMemberGrid component
 */
export interface ContributionMemberGridProps {
  onViewContributions: (member: ContributionMemberDto) => void;
  initialQuery?: Partial<ContributionGridQuery>;
}

/**
 * Props for Financial Actions Header component
 */
export interface FinancialActionsHeaderProps {
  onUploadHsbc: () => void;
  onEnterBatch: () => void;
  onViewBatchHistory: () => void;
  onGenerateRegisterNumbers: () => void;
  userRoles: string[]; // Array of role names for conditional rendering
}
