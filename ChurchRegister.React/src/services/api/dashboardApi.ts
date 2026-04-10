import { apiClient } from './ApiClient';

/**
 * Training alert item
 */
export interface TrainingAlertItem {
  trainingType: string;
  memberCount: number;
  expiryDate?: string | null;
  status?: string | null;
  message: string;
}

/**
 * Dashboard statistics response
 */
export interface DashboardStatistics {
  totalMembers: number;
  newMembersThisMonth: number;
  newMembersThisWeek: number;
  memberGrowthPercentage: number;
  sundayMorningAverage: number;
  sundayMorningChangePercentage: number;
  sundayEveningAverage: number;
  sundayEveningChangePercentage: number;
  bibleStudyAverage: number;
  bibleStudyChangePercentage: number;
  trainingAlerts: TrainingAlertItem[];
}

/**
 * Dashboard API service for retrieving dashboard statistics
 */
export class DashboardApi {
  private basePath = '/api/dashboard';

  /**
   * Get dashboard statistics
   */
  async getStatistics(): Promise<DashboardStatistics> {
    return apiClient.get<DashboardStatistics>(`${this.basePath}/statistics`);
  }
}

// Create singleton instance
export const dashboardApi = new DashboardApi();
export default dashboardApi;
