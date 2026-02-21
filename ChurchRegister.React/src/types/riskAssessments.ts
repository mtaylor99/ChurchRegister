/**
 * TypeScript interfaces for risk assessments
 * Mirrors API contracts from ChurchRegister.ApiService/Models/RiskAssessments
 */

// Risk Assessment Category DTO matching API contract
export interface RiskAssessmentCategory {
  id: number;
  name: string;
  description: string;
  createdBy: string;
  createdDateTime: string; // ISO date string
  modifiedBy?: string;
  modifiedDateTime?: string; // ISO date string
}

// Create Category Request matching API contract
export interface CreateCategoryRequest {
  name: string;
  description: string;
}

// Update Category Request matching API contract
export interface UpdateCategoryRequest {
  name: string;
  description: string;
}

// Create Risk Assessment Request matching API contract
export interface CreateRiskAssessmentRequest {
  categoryId: number;
  title: string;
  description?: string | null;
  reviewInterval: 1 | 2 | 3 | 5;
  scope?: string | null;
  notes?: string | null;
}

// Risk Assessment DTO matching API contract
export interface RiskAssessment {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryDescription: string; // Consolidated items from category
  title: string;
  description: string | null; // Assessment-specific notes
  reviewInterval: 1 | 2 | 3 | 5;
  lastReviewDate: string | null; // ISO date string
  nextReviewDate: string; // ISO date string
  status: 'Under Review' | 'Approved';
  scope: string | null;
  notes: string | null;
  approvalCount: number;
  minimumApprovalsRequired: number;
  isOverdue: boolean;
  alertStatus: 'red' | 'amber' | 'green';
  createdBy: string;
  createdDateTime: string; // ISO date string
  modifiedBy?: string;
  modifiedDateTime?: string; // ISO date string
}

// Risk Assessment Detail DTO (extends RiskAssessment with approvals)
export interface RiskAssessmentDetail extends RiskAssessment {
  approvals: RiskAssessmentApproval[];
}

// Risk Assessment Approval DTO matching API contract
export interface RiskAssessmentApproval {
  id: number;
  riskAssessmentId: number;
  approvedByChurchMemberId: number;
  approvedByMemberName: string;
  approvedDate: string; // ISO date string
  notes: string | null;
}

// Update Risk Assessment Request matching API contract
export interface UpdateRiskAssessmentRequest {
  title: string;
  description?: string | null;
  reviewInterval: 1 | 2 | 3 | 5;
  scope?: string | null;
  notes?: string | null;
}

// Approve Risk Assessment Request matching API contract
export interface ApproveRiskAssessmentRequest {
  deaconMemberIds: number[];
  notes?: string | null;
}

// Approve Risk Assessment Response matching API contract
export interface ApproveRiskAssessmentResponse {
  approvalRecorded: boolean;
  totalApprovalsReceived: number;
  minimumApprovalsRequired: number;
  assessmentApproved: boolean;
  nextReviewDate: string | null; // ISO date string
}

// Dashboard Risk Assessment Summary DTO matching API contract
export interface DashboardRiskAssessmentSummary {
  overdueCount: number;
  dueSoonCount: number;
  totalCount: number;
}

// Risk Assessment History DTO matching API contract
export interface RiskAssessmentHistory {
  id: number;
  title: string;
  categoryName: string;
  reviewCycles: ReviewCycle[];
}

// Review Cycle DTO matching API contract
export interface ReviewCycle {
  reviewDate: string | null; // ISO date string
  approvals: RiskAssessmentApproval[];
}
