import { apiClient } from './ApiClient';
import type {
  ChurchMemberDto,
  ChurchMemberDetailDto,
  ChurchMemberGridQuery,
  ChurchMemberRoleDto,
  ChurchMemberStatusDto,
  CreateChurchMemberRequest,
  CreateChurchMemberResponse,
  UpdateChurchMemberRequest,
  UpdateChurchMemberStatusRequest,
} from '../../types/churchMembers';
import type { PagedResult } from '../../types/administration';

/**
 * Church Members API service for church member management operations
 */
export class ChurchMembersApi {
  private basePath = '/api/church-members';

  /**
   * Get church members with pagination, search, and filtering
   */
  async getChurchMembers(
    query: ChurchMemberGridQuery
  ): Promise<PagedResult<ChurchMemberDto>> {
    const params = new URLSearchParams();
    params.append('page', query.page.toString());
    params.append('pageSize', query.pageSize.toString());
    params.append('sortBy', query.sortBy);
    params.append('sortDirection', query.sortDirection);

    if (query.searchTerm) {
      params.append('searchTerm', query.searchTerm);
    }

    if (query.statusFilter !== undefined) {
      params.append('statusFilter', query.statusFilter.toString());
    }

    if (query.roleFilter !== undefined) {
      params.append('roleFilter', query.roleFilter.toString());
    }

    if (query.districtFilter !== undefined) {
      params.append('districtFilter', query.districtFilter.toString());
    }

    if (query.unassignedDistrictFilter !== undefined) {
      params.append('unassignedDistrictFilter', query.unassignedDistrictFilter.toString());
    }

    if (query.baptisedFilter !== undefined) {
      params.append('baptisedFilter', query.baptisedFilter.toString());
    }

    if (query.giftAidFilter !== undefined) {
      params.append('giftAidFilter', query.giftAidFilter.toString());
    }

    if (query.pastoralCareRequired !== undefined) {
      params.append('pastoralCareRequired', query.pastoralCareRequired.toString());
    }

    return apiClient.get<PagedResult<ChurchMemberDto>>(
      `${this.basePath}?${params.toString()}`
    );
  }

  /**
   * Get church member by ID
   */
  async getChurchMemberById(memberId: number): Promise<ChurchMemberDetailDto> {
    return apiClient.get<ChurchMemberDetailDto>(`${this.basePath}/${memberId}`);
  }

  /**
   * Create a new church member
   */
  async createChurchMember(
    request: CreateChurchMemberRequest
  ): Promise<CreateChurchMemberResponse> {
    return apiClient.post<
      CreateChurchMemberResponse,
      CreateChurchMemberRequest
    >(this.basePath, request);
  }

  /**
   * Update church member information
   */
  async updateChurchMember(
    memberId: number,
    request: Omit<UpdateChurchMemberRequest, 'id'>
  ): Promise<ChurchMemberDetailDto> {
    return apiClient.put<
      ChurchMemberDetailDto,
      Omit<UpdateChurchMemberRequest, 'id'>
    >(`${this.basePath}/${memberId}`, request);
  }

  /**
   * Update church member status
   */
  async updateChurchMemberStatus(
    memberId: number,
    request: UpdateChurchMemberStatusRequest
  ): Promise<ChurchMemberDetailDto> {
    return apiClient.patch<
      ChurchMemberDetailDto,
      UpdateChurchMemberStatusRequest
    >(`${this.basePath}/${memberId}/status`, request);
  }

  /**
   * Delete church member (hard delete - for members entered in error)
   */
  async deleteChurchMember(memberId: number): Promise<void> {
    return apiClient.delete(`${this.basePath}/${memberId}`);
  }

  /**
   * Get all available church member roles
   */
  async getRoles(): Promise<ChurchMemberRoleDto[]> {
    return apiClient.get<ChurchMemberRoleDto[]>(`${this.basePath}/roles`);
  }

  /**
   * Get all available church member statuses
   */
  async getStatuses(): Promise<ChurchMemberStatusDto[]> {
    return apiClient.get<ChurchMemberStatusDto[]>(`${this.basePath}/statuses`);
  }

  /**
   * Get the next available member number for the current year
   */
  async getNextAvailableMemberNumber(): Promise<{
    nextNumber: number;
    year: number;
  }> {
    return apiClient.get<{ nextNumber: number; year: number }>(
      '/api/administration/church-members/next-member-number'
    );
  }

  /**
   * Export pastoral care report as PDF
   * Downloads a PDF file containing members requiring pastoral care, grouped by district
   */
  async exportPastoralCareReport(): Promise<void> {
    const response = await fetch(
      `${apiClient.getBaseUrl()}${this.basePath}/pastoral-care/export`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export pastoral care report');
    }

    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pastoral-Care-Report-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const churchMembersApi = new ChurchMembersApi();
export default churchMembersApi;
