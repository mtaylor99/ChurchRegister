import { apiClient } from './api/ApiClient';

// Type definitions for register number operations

export interface RegisterNumberAssignment {
  registerNumber: number;
  memberId: number;
  memberName: string;
  memberSince: string | null;
  currentNumber?: number | null;
  memberType: 'Member' | 'Non-Member';
}

export interface PreviewRegisterNumbersResponse {
  year: number;
  totalMembers: number;
  totalNonBaptisedMembers: number;
  totalNonMembers: number;
  previewGenerated: string;
  members: RegisterNumberAssignment[];
  nonBaptisedMembers: RegisterNumberAssignment[];
  nonMembers: RegisterNumberAssignment[];
}

export interface GenerateRegisterNumbersRequest {
  targetYear: number;
  confirmGeneration: boolean;
}

export interface GenerateRegisterNumbersResponse {
  year: number;
  totalMembersAssigned: number;
  totalNonBaptisedMembersAssigned: number;
  totalNonMembersAssigned: number;
  generatedDateTime: string;
  generatedBy: string;
}

export interface CheckGenerationStatusResponse {
  year: number;
  isGenerated: boolean;
  totalAssignments: number;
  generatedBy?: string | null;
  generatedDateTime?: string | null;
}

/**
 * Service for managing church member register numbers
 */
class RegisterNumberService {
  /**
   * Preview register number assignments for a target year without saving
   */
  async previewNumbers(year: number): Promise<PreviewRegisterNumbersResponse> {
    return apiClient.get<PreviewRegisterNumbersResponse>(
      `/api/register-numbers/preview/${year}`
    );
  }

  /**
   * Generate and persist register numbers for all active members
   */
  async generateNumbers(
    request: GenerateRegisterNumbersRequest
  ): Promise<GenerateRegisterNumbersResponse> {
    return apiClient.post<GenerateRegisterNumbersResponse>(
      '/api/register-numbers/generate',
      request
    );
  }

  /**
   * Check if register numbers have been generated for a specific year
   */
  async checkStatus(year: number): Promise<CheckGenerationStatusResponse> {
    return apiClient.get<CheckGenerationStatusResponse>(
      `/api/register-numbers/status/${year}`
    );
  }

  /**
   * Download the register number preview as a single-sheet Excel workbook
   */
  async exportToExcel(year: number): Promise<void> {
    const blob = await apiClient.getBlob(
      `/api/register-numbers/export/${year}`
    );
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Register-Numbers-${year}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const registerNumberService = new RegisterNumberService();
