/**
 * TypeScript interfaces for training certificates and checks
 * Mirrors API contracts from ChurchRegister.ApiService/Models/TrainingCertificates
 */

// Training Certificate DTO matching API contract
export interface TrainingCertificateDto {
  id: number;
  churchMemberId: number;
  memberName: string;
  memberRole?: string;
  memberContact?: string;
  trainingCertificateTypeId: number;
  trainingType: string;
  status: string; // Pending, In Validity, Expired, Allow to Expire
  expires?: string; // ISO date string
  notes?: string;
  ragStatus: string; // 'Red', 'Amber', or empty
  createdBy: string;
  createdDateTime: string; // ISO date string
  modifiedBy?: string;
  modifiedDateTime?: string; // ISO date string
}

// Training Certificate Grid Query matching API contract
export interface TrainingCertificateGridQuery {
  page: number;
  pageSize: number;
  name?: string; // Search by member name
  status?: string; // Filter by certificate status
  typeId?: number; // Filter by training certificate type
  expiringWithinDays: number; // Default 60
  sortBy: string; // Default "Expires"
  sortDirection: 'asc' | 'desc'; // Default "asc"
}

// Create Training Certificate Request matching API contract
export interface CreateTrainingCertificateRequest {
  churchMemberId: number;
  trainingCertificateTypeId: number;
  status: string; // Pending, In Validity, Expired, Allow to Expire
  expires?: string; // ISO date string
  notes?: string;
}

// Update Training Certificate Request matching API contract
export interface UpdateTrainingCertificateRequest {
  id: number;
  status: string; // Pending, In Validity, Expired, Allow to Expire
  expires?: string; // ISO date string
  notes?: string;
}

// Training Certificate Type DTO matching API contract
export interface TrainingCertificateTypeDto {
  id: number;
  type: string;
  description?: string;
  status: string; // Active, InActive
  createdBy: string;
  createdDateTime: string; // ISO date string
  modifiedBy?: string;
  modifiedDateTime?: string; // ISO date string
}

// Create Training Certificate Type Request matching API contract
export interface CreateTrainingCertificateTypeRequest {
  type: string;
  description?: string;
  status: string; // Active, InActive (default: Active)
}

// Update Training Certificate Type Request matching API contract
export interface UpdateTrainingCertificateTypeRequest {
  id: number;
  type: string;
  description?: string;
  status: string; // Active, InActive
}

// Training Certificate Dashboard Item DTO matching API contract
export interface TrainingCertificateDashboardItemDto {
  id: number;
  memberName: string;
  trainingType: string;
  status: string;
  expires?: string; // ISO date string
  daysUntilExpiry?: number; // Negative if expired
}

// Training Certificate Group Summary DTO for dashboard alerts
export interface TrainingCertificateGroupSummaryDto {
  trainingType: string;
  memberCount: number; // Number of members in this group
  expiryDate?: string; // ISO date string, null for pending items
  status?: string; // For pending items
  message: string; // Alert message
}

// Paged Result for Training Certificates matching API contract
export interface PagedTrainingCertificatesResult {
  items: TrainingCertificateDto[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

// Constants for Training Certificate Statuses
export const TRAINING_CERTIFICATE_STATUSES = {
  PENDING: 'Pending',
  IN_VALIDITY: 'In Validity',
  EXPIRED: 'Expired',
  ALLOW_TO_EXPIRE: 'Allow to Expire',
} as const;

// Constants for Training Certificate Type Statuses
export const TRAINING_TYPE_STATUSES = {
  ACTIVE: 'Active',
  INACTIVE: 'InActive',
} as const;

// Constants for RAG Status
export const RAG_STATUS = {
  RED: 'Red',
  AMBER: 'Amber',
  NONE: '',
} as const;

// Type for certificate status
export type CertificateStatus = typeof TRAINING_CERTIFICATE_STATUSES[keyof typeof TRAINING_CERTIFICATE_STATUSES];

// Type for type status
export type TypeStatus = typeof TRAINING_TYPE_STATUSES[keyof typeof TRAINING_TYPE_STATUSES];

// Type for RAG status
export type RagStatus = typeof RAG_STATUS[keyof typeof RAG_STATUS];
