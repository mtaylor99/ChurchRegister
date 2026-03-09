/**
 * Unit tests for registerNumberService
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('./api/ApiClient', () => ({
  apiClient: { get: mockGet, post: mockPost },
}));

import { registerNumberService } from './registerNumberService';

const mockPreview = {
  year: 2024,
  totalMembers: 30,
  totalNonMembers: 20,
  previewGenerated: '2024-01-01T00:00:00Z',
  members: [{ registerNumber: 1, memberId: 1, memberName: 'John Smith', memberSince: '2020-01-01', memberType: 'Member' as const }],
  nonMembers: [],
};

const mockGenerateResult = {
  year: 2024,
  totalMembersAssigned: 30,
  totalNonMembersAssigned: 20,
  generatedDateTime: '2024-01-01T00:00:00Z',
  generatedBy: 'admin',
};

const mockStatus = {
  year: 2024,
  isGenerated: true,
  totalAssignments: 50,
  generatedBy: 'admin',
  generatedDateTime: '2024-01-01T00:00:00Z',
};

describe('registerNumberService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('previewNumbers', () => {
    test('calls GET endpoint and returns preview data', async () => {
      mockGet.mockResolvedValue(mockPreview);
      const result = await registerNumberService.previewNumbers(2024);
      expect(mockGet).toHaveBeenCalledWith('/api/register-numbers/preview/2024');
      expect(result).toEqual(mockPreview);
    });

    test('propagates errors from apiClient', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));
      await expect(registerNumberService.previewNumbers(2024)).rejects.toThrow('Network error');
    });
  });

  describe('generateNumbers', () => {
    test('calls POST endpoint with request body', async () => {
      mockPost.mockResolvedValue(mockGenerateResult);
      const request = { targetYear: 2024, confirmGeneration: true };
      const result = await registerNumberService.generateNumbers(request);
      expect(mockPost).toHaveBeenCalledWith('/api/register-numbers/generate', request);
      expect(result).toEqual(mockGenerateResult);
    });

    test('propagates errors from apiClient', async () => {
      mockPost.mockRejectedValue(new Error('Conflict'));
      await expect(registerNumberService.generateNumbers({ targetYear: 2024, confirmGeneration: true })).rejects.toThrow('Conflict');
    });

    test('returns correct totalMembersAssigned and totalNonMembersAssigned', async () => {
      mockPost.mockResolvedValue(mockGenerateResult);
      const result = await registerNumberService.generateNumbers({ targetYear: 2024, confirmGeneration: true });
      expect(result.totalMembersAssigned).toBe(30);
      expect(result.totalNonMembersAssigned).toBe(20);
      expect(result.year).toBe(2024);
    });
  });

  describe('checkStatus', () => {
    test('calls GET status endpoint', async () => {
      mockGet.mockResolvedValue(mockStatus);
      const result = await registerNumberService.checkStatus(2024);
      expect(mockGet).toHaveBeenCalledWith('/api/register-numbers/status/2024');
      expect(result).toEqual(mockStatus);
    });

    test('returns status with isGenerated false when not yet generated', async () => {
      const notGeneratedStatus = { ...mockStatus, isGenerated: false, totalAssignments: 0, generatedBy: null, generatedDateTime: null };
      mockGet.mockResolvedValue(notGeneratedStatus);
      const result = await registerNumberService.checkStatus(2025);
      expect(result.isGenerated).toBe(false);
    });

    test('propagates errors from apiClient', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));
      await expect(registerNumberService.checkStatus(2024)).rejects.toThrow('Not found');
    });
  });
});
