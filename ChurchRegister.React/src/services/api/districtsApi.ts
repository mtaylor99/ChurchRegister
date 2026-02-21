import { apiClient } from './ApiClient';
import type {
  District,
  AssignDistrictRequest,
  AssignDeaconRequest,
  AssignDistrictOfficerRequest,
  ChurchMemberSummary,
  ChurchMemberDetailDto,
} from '../../types';

/**
 * Districts API service for managing church districts
 */
export class DistrictsApi {
  private basePath = '/api';

  /**
   * Get all available church districts
   * @returns List of all districts
   */
  async getDistricts(): Promise<District[]> {
    return await apiClient.get<District[]>(`${this.basePath}/districts`);
  }

  /**
   * Assign a district to a church member
   * @param memberId The ID of the church member
   * @param request The district assignment request
   * @returns Updated church member details
   */
  async assignDistrict(
    memberId: number,
    request: AssignDistrictRequest
  ): Promise<ChurchMemberDetailDto> {
    return await apiClient.put<ChurchMemberDetailDto>(
      `${this.basePath}/church-members/${memberId}/district`,
      request
    );
  }

  /**
   * Get all active church members with Deacon role
   * @returns List of active deacons
   */
  async getActiveDeacons(): Promise<ChurchMemberSummary[]> {
    return await apiClient.get<ChurchMemberSummary[]>(
      `${this.basePath}/districts/deacons`
    );
  }

  /**
   * Get all active church members with District Officer role
   * @param excludeMemberId Optional member ID to exclude from results
   * @returns List of active district officers
   */
  async getActiveDistrictOfficers(
    excludeMemberId?: number
  ): Promise<ChurchMemberSummary[]> {
    const params = excludeMemberId
      ? `?excludeMemberId=${excludeMemberId}`
      : '';
    return await apiClient.get<ChurchMemberSummary[]>(
      `${this.basePath}/districts/district-officers${params}`
    );
  }

  /**
   * Assign a deacon to a district
   * @param districtId The ID of the district
   * @param request The deacon assignment request
   */
  async assignDeacon(
    districtId: number,
    request: AssignDeaconRequest
  ): Promise<void> {
    return await apiClient.put<void>(
      `${this.basePath}/districts/${districtId}/assign-deacon`,
      request
    );
  }

  /**
   * Assign a district officer to a district
   * @param districtId The ID of the district
   * @param request The district officer assignment request
   */
  async assignDistrictOfficer(
    districtId: number,
    request: AssignDistrictOfficerRequest
  ): Promise<void> {
    return await apiClient.put<void>(
      `${this.basePath}/districts/${districtId}/assign-district-officer`,
      request
    );
  }

  /**
   * Export districts with members as PDF
   * @returns PDF file as Blob
   */
  async exportDistricts(): Promise<Blob> {
    const response = await fetch(
      `${apiClient.getBaseUrl()}${this.basePath}/districts/export`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export districts');
    }

    return await response.blob();
  }
}

/**
 * Singleton instance of DistrictsApi
 */
export const districtsApi = new DistrictsApi();
