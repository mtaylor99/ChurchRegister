// Administration types matching our API contracts

export const UserAccountStatus = {
  Pending: 1,
  Active: 2,
  Locked: 3,
  Inactive: 4,
  Invited: 5,
} as const;

export type UserAccountStatus =
  (typeof UserAccountStatus)[keyof typeof UserAccountStatus];

export const UserStatusAction = {
  Activate: 0,
  Deactivate: 1,
  Lock: 2,
  Unlock: 3,
  ResendInvitation: 4,
} as const;

export type UserStatusAction =
  (typeof UserStatusAction)[keyof typeof UserStatusAction];

// User Profile DTO matching API contract
export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  phoneNumber?: string;
  status: UserAccountStatus;
  dateJoined: string; // ISO date string
  emailConfirmed: boolean;
  createdAt: string; // ISO date string
  lastModified?: string; // ISO date string
  modifiedBy?: string;
  roles: string[];
  avatar: string;
  fullName: string; // Computed property
  lastLogin?: string; // ISO date string
}

// Grid Query parameters matching API contract
export interface UserGridQuery {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: UserAccountStatus;
  roleFilter?: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

// Paged Result matching API contract
export interface PagedResult<T> {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// System Role DTO matching API contract
export interface SystemRoleDto {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  isHighPrivilege: boolean;
}

// Create User Request matching API contract
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  phoneNumber?: string;
  roles: string[];
  sendInvitationEmail: boolean;
}

// Create User Response matching API contract
export interface CreateUserResponse {
  userId: string;
  message: string;
  emailVerificationSent: boolean;
  user: UserProfileDto;
}

// Update User Request matching API contract
export interface UpdateUserRequest {
  userId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  phoneNumber?: string;
  roles: string[];
}

// Update User Status Request matching API contract
export interface UpdateUserStatusRequest {
  userId: string;
  action: UserStatusAction;
  reason?: string;
}

// UI-specific types for forms and components
export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  phoneNumber?: string;
  roles: string[];
  sendInvitationEmail: boolean;
}

export interface UserGridFilters {
  searchTerm: string;
  statusFilter?: UserAccountStatus;
  roleFilter?: string;
}

export interface UserGridSorting {
  field: string;
  direction: 'asc' | 'desc';
}

// Status display configuration
export interface StatusConfig {
  label: string;
  color: 'success' | 'error' | 'warning' | 'info' | 'default';
  icon: string;
}

export const UserStatusConfig: Record<UserAccountStatus, StatusConfig> = {
  [UserAccountStatus.Invited]: {
    label: 'Invited',
    color: 'info',
    icon: 'Email',
  },
  [UserAccountStatus.Pending]: {
    label: 'Pending',
    color: 'warning',
    icon: 'Schedule',
  },
  [UserAccountStatus.Active]: {
    label: 'Active',
    color: 'success',
    icon: 'CheckCircle',
  },
  [UserAccountStatus.Locked]: {
    label: 'Locked',
    color: 'error',
    icon: 'Lock',
  },
  [UserAccountStatus.Inactive]: {
    label: 'Inactive',
    color: 'default',
    icon: 'Cancel',
  },
};

// Action button configuration
export interface ActionButtonConfig {
  label: string;
  action: UserStatusAction;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  icon: string;
  requiresConfirmation: boolean;
}

export const getAvailableActions = (
  status: UserAccountStatus
): ActionButtonConfig[] => {
  switch (status) {
    case UserAccountStatus.Active:
      return [
        {
          label: 'Deactivate',
          action: UserStatusAction.Deactivate,
          color: 'warning',
          icon: 'Cancel',
          requiresConfirmation: true,
        },
        {
          label: 'Lock',
          action: UserStatusAction.Lock,
          color: 'error',
          icon: 'Lock',
          requiresConfirmation: true,
        },
      ];
    case UserAccountStatus.Inactive:
      return [
        {
          label: 'Activate',
          action: UserStatusAction.Activate,
          color: 'success',
          icon: 'CheckCircle',
          requiresConfirmation: false,
        },
      ];
    case UserAccountStatus.Locked:
      return [
        {
          label: 'Unlock',
          action: UserStatusAction.Unlock,
          color: 'primary',
          icon: 'LockOpen',
          requiresConfirmation: false,
        },
      ];
    case UserAccountStatus.Invited:
      return [
        {
          label: 'Resend Invitation',
          action: UserStatusAction.ResendInvitation,
          color: 'info',
          icon: 'Email',
          requiresConfirmation: false,
        },
      ];
    case UserAccountStatus.Pending:
      return [
        {
          label: 'Activate',
          action: UserStatusAction.Activate,
          color: 'success',
          icon: 'CheckCircle',
          requiresConfirmation: false,
        },
      ];
    default:
      return [];
  }
};

// ===== Envelope Contribution / Register Number Types =====

export interface EnvelopeEntry {
  registerNumber: number;
  amount: number;
}

export interface SubmitEnvelopeBatchRequest {
  collectionDate: string; // ISO date string (YYYY-MM-DD)
  envelopes: EnvelopeEntry[];
}

export interface ProcessedEnvelope {
  registerNumber: number;
  memberName: string;
  amount: number;
  contributionId: number;
}

export interface SubmitEnvelopeBatchResponse {
  batchId: number;
  batchDate: string; // ISO date string
  totalAmount: number;
  envelopeCount: number;
  processedContributions: ProcessedEnvelope[];
}

export interface BatchValidationError {
  registerNumber: number;
  error: string;
}

export interface BatchSummary {
  batchId: number;
  batchDate: string; // ISO date string
  totalAmount: number;
  envelopeCount: number;
  submittedBy: string; // User ID
  submittedByName: string; // User's full name
  submittedDateTime: string; // ISO date string
}

export interface EnvelopeDetail {
  contributionId: number;
  registerNumber: number;
  memberId: number;
  memberName: string;
  amount: number;
}

export interface GetBatchDetailsResponse extends BatchSummary {
  status: string;
  envelopes: EnvelopeDetail[];
}

export interface GetBatchListResponse {
  batches: BatchSummary[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface ValidateRegisterNumberResponse {
  valid: boolean;
  registerNumber: number;
  year: number;
  memberId?: number;
  memberName?: string;
  isActive?: boolean;
  error?: string;
}

export interface RegisterNumberAssignment {
  registerNumber: number;
  memberId: number;
  memberName: string;
  memberSince: string; // ISO date string
}

export interface GenerateRegisterNumbersRequest {
  targetYear: number;
  confirmGeneration: boolean;
}

export interface GenerateRegisterNumbersResponse {
  year: number;
  totalMembersAssigned: number;
  generatedDateTime: string; // ISO date string
  generatedBy: string;
  preview: RegisterNumberAssignment[];
}

export interface PreviewRegisterNumbersResponse {
  year: number;
  totalActiveMembers: number;
  previewGenerated: string; // ISO date string
  assignments: RegisterNumberAssignment[];
}
