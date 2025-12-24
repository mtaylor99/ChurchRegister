import { apiClient } from './ApiClient';
import type { ContributionHistoryDto } from '../../types/contributionHistory';

/**
 * API service for church member contribution history operations
 */
export const contributionHistoryApi = {
  /**
   * Get contribution history for a specific church member
   * @param memberId - The church member ID
   * @param startDate - Optional start date filter (ISO string)
   * @param endDate - Optional end date filter (ISO string)
   * @returns List of contribution history records
   */
  async getContributionHistory(
    memberId: number,
    startDate?: string,
    endDate?: string
  ): Promise<ContributionHistoryDto[]> {
    const params: Record<string, string> = {};

    if (startDate) {
      params.startDate = startDate;
    }

    if (endDate) {
      params.endDate = endDate;
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `/api/church-members/${memberId}/contributions${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await apiClient.get<ContributionHistoryDto[]>(url);
    return response;
  },
};
