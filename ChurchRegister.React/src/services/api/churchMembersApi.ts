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
  MemberStatistics,
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
      params.append(
        'unassignedDistrictFilter',
        query.unassignedDistrictFilter.toString()
      );
    }

    if (query.baptisedFilter !== undefined) {
      params.append('baptisedFilter', query.baptisedFilter.toString());
    }

    if (query.giftAidFilter !== undefined) {
      params.append('giftAidFilter', query.giftAidFilter.toString());
    }

    if (query.pastoralCareRequired !== undefined) {
      params.append(
        'pastoralCareRequired',
        query.pastoralCareRequired.toString()
      );
    }

    if (query.noBankReferenceFilter !== undefined) {
      params.append(
        'noBankReferenceFilter',
        query.noBankReferenceFilter.toString()
      );
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
  async getNextAvailableMemberNumber(params?: {
    isMember?: boolean;
    isBaptised?: boolean;
  }): Promise<{
    nextNumber: number;
    year: number;
  }> {
    const query = new URLSearchParams();
    if (params?.isMember !== undefined) query.set('isMember', String(params.isMember));
    if (params?.isBaptised !== undefined) query.set('isBaptised', String(params.isBaptised));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<{ nextNumber: number; year: number }>(
      `/api/administration/church-members/next-member-number${qs}`
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

  /**
   * Export envelope labels as PDF (Avery L7163).
   * Returns active envelope recipients ordered by register number for the given year.
   */
  async exportEnvelopeLabels(year: number): Promise<void> {
    const response = await fetch(
      `${apiClient.getBaseUrl()}${this.basePath}/export/envelope-labels?year=${year}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export envelope labels');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Envelope-Labels-${year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export address labels as PDF (Avery L7163) — one label per unique address.
   */
  async exportAddressLabels(): Promise<void> {
    const response = await fetch(
      `${apiClient.getBaseUrl()}${this.basePath}/export/address-labels`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export address labels');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.download = `Address-Labels-${today}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export envelope number review as Excel.
   * Always succeeds (HTTP 200); New Number column is blank when numbers not yet generated.
   */
  async exportEnvelopeNumbers(year: number): Promise<void> {
    const response = await fetch(
      `${apiClient.getBaseUrl()}${this.basePath}/export/envelope-numbers?year=${year}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export envelope numbers');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Envelope-Numbers-${year}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export address list as Excel.
   */
  async exportAddressList(): Promise<void> {
    const response = await fetch(
      `${apiClient.getBaseUrl()}${this.basePath}/export/address-list`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export address list');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.download = `Address-List-${today}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get member statistics: envelope count, residence count, no-address count, district breakdown
   */
  async getMemberStatistics(): Promise<MemberStatistics> {
    return apiClient.get<MemberStatistics>(`${this.basePath}/statistics`);
  }
}

// Create singleton instance
export const churchMembersApi = new ChurchMembersApi();
export default churchMembersApi;
