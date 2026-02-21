import { apiClient } from './api/ApiClient';

// Type definitions for register number operations

export interface RegisterNumberAssignment {
  registerNumber: number;
  memberId: number;
  memberName: string;
  memberSince: string;
  currentNumber?: number | null;
}

export interface PreviewRegisterNumbersResponse {
  year: number;
  totalActiveMembers: number;
  previewGenerated: string;
  assignments: RegisterNumberAssignment[];
}

export interface GenerateRegisterNumbersRequest {
  targetYear: number;
  confirmGeneration: boolean;
}

export interface GenerateRegisterNumbersResponse {
  year: number;
  totalMembersAssigned: number;
  generatedDateTime: string;
  generatedBy: string;
  preview: RegisterNumberAssignment[];
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
}

export const registerNumberService = new RegisterNumberService();
