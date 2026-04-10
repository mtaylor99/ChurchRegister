import { describe, test, expect, vi, beforeEach } from 'vitest';
import { RiskAssessmentsApi } from './riskAssessmentsApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const BASE = '/api/risk-assessments';
const CAT_BASE = '/api/risk-assessment-categories';

describe('RiskAssessmentsApi', () => {
  let api: RiskAssessmentsApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new RiskAssessmentsApi();
    vi.mocked(apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.put).mockResolvedValue({});
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);
  });

  // ─── getRiskAssessments ───────────────────────────────────────────────────

  describe('getRiskAssessments', () => {
    test('calls base endpoint with no params when all undefined', async () => {
      await api.getRiskAssessments();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(BASE);
    });

    test('includes categoryId in query string', async () => {
      await api.getRiskAssessments(3);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('categoryId=3');
    });

    test('includes status in query string', async () => {
      await api.getRiskAssessments(null, 'Active');
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('status=Active');
    });

    test('includes overdueOnly in query string', async () => {
      await api.getRiskAssessments(null, null, true);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('overdueOnly=true');
    });

    test('includes title in query string', async () => {
      await api.getRiskAssessments(null, null, undefined, 'Fire Safety');
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('title=Fire+Safety');
    });

    test('combines multiple filters', async () => {
      await api.getRiskAssessments(2, 'Under Review', false, 'Safety');
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).toContain('categoryId=2');
      expect(url).toContain('status=Under+Review');
      expect(url).toContain('overdueOnly=false');
      expect(url).toContain('title=Safety');
    });

    test('does not include null categoryId', async () => {
      await api.getRiskAssessments(null);
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).not.toContain('categoryId');
    });

    test('does not include empty status', async () => {
      await api.getRiskAssessments(null, '');
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
      expect(url).not.toContain('status');
    });
  });

  // ─── getRiskAssessmentById ────────────────────────────────────────────────

  describe('getRiskAssessmentById', () => {
    test('calls the correct endpoint with id', async () => {
      await api.getRiskAssessmentById(42);
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/42`);
    });
  });

  // ─── createRiskAssessment ─────────────────────────────────────────────────

  describe('createRiskAssessment', () => {
    test('posts to base endpoint with request body', async () => {
      const request = { title: 'Fire Safety', categoryId: 1, riskLevel: 'High', reviewIntervalDays: 90 };
      await api.createRiskAssessment(request as unknown as Parameters<RiskAssessmentsApi['createRiskAssessment']>[0]);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(BASE, request);
    });
  });

  // ─── getAssessmentHistory ─────────────────────────────────────────────────

  describe('getAssessmentHistory', () => {
    test('calls history endpoint for given id', async () => {
      await api.getAssessmentHistory(5);
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/5/history`);
    });
  });

  // ─── updateRiskAssessment ─────────────────────────────────────────────────

  describe('updateRiskAssessment', () => {
    test('puts to the correct endpoint with request body', async () => {
      const request = { title: 'Updated', riskLevel: 'Low' };
      await api.updateRiskAssessment(7, request as unknown as Parameters<RiskAssessmentsApi['updateRiskAssessment']>[1]);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(`${BASE}/7`, request);
    });
  });

  // ─── startReview ──────────────────────────────────────────────────────────

  describe('startReview', () => {
    test('posts to start-review endpoint with empty body', async () => {
      await api.startReview(9);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(`${BASE}/9/start-review`, {});
    });
  });

  // ─── approveRiskAssessment ────────────────────────────────────────────────

  describe('approveRiskAssessment', () => {
    test('posts to approve endpoint with request body', async () => {
      const request = { comment: 'Looks good' };
      await api.approveRiskAssessment(11, request as unknown as Parameters<RiskAssessmentsApi['approveRiskAssessment']>[1]);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(`${BASE}/11/approve`, request);
    });
  });

  // ─── getDashboardSummary ──────────────────────────────────────────────────

  describe('getDashboardSummary', () => {
    test('calls dashboard-summary endpoint', async () => {
      await api.getDashboardSummary();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${BASE}/dashboard-summary`);
    });
  });

  // ─── Category methods ─────────────────────────────────────────────────────

  describe('getCategories', () => {
    test('calls risk-assessment-categories endpoint', async () => {
      await api.getCategories();
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(CAT_BASE);
    });
  });

  describe('getCategoryById', () => {
    test('calls category endpoint with id', async () => {
      await api.getCategoryById(3);
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`${CAT_BASE}/3`);
    });
  });

  describe('createCategory', () => {
    test('posts to categories endpoint with request body', async () => {
      const request = { name: 'Security' };
      await api.createCategory(request as unknown as Parameters<RiskAssessmentsApi['createCategory']>[0]);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(CAT_BASE, request);
    });
  });

  describe('updateCategory', () => {
    test('puts to the correct category endpoint', async () => {
      const request = { name: 'Renamed' };
      await api.updateCategory(4, request as unknown as Parameters<RiskAssessmentsApi['updateCategory']>[1]);
      expect(vi.mocked(apiClient.put)).toHaveBeenCalledWith(`${CAT_BASE}/4`, request);
    });
  });

  describe('deleteCategory', () => {
    test('calls delete on the correct category endpoint', async () => {
      await api.deleteCategory(6);
      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith(`${CAT_BASE}/6`);
    });
  });
});
