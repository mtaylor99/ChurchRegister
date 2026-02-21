import { apiClient } from './ApiClient';
import type {
  DataProtection,
  UpdateDataProtectionRequest,
} from '../../types/dataProtection';

/**
 * Data Protection API service for managing GDPR consent preferences
 */
export class DataProtectionApi {
  private basePath = '/api/church-members';

  /**
   * Get data protection consent information for a church member
   * @param memberId The ID of the church member
   * @returns Data protection consent information
   */
  async getDataProtection(memberId: number): Promise<DataProtection> {
    return await apiClient.get<DataProtection>(
      `${this.basePath}/${memberId}/data-protection`
    );
  }

  /**
   * Update data protection consent information for a church member
   * @param memberId The ID of the church member
   * @param request The consent preferences to update
   * @returns Updated data protection consent information
   */
  async updateDataProtection(
    memberId: number,
    request: UpdateDataProtectionRequest
  ): Promise<DataProtection> {
    return await apiClient.put<DataProtection>(
      `${this.basePath}/${memberId}/data-protection`,
      request
    );
  }
}

/**
 * Singleton instance of DataProtectionApi
 */
export const dataProtectionApi = new DataProtectionApi();
