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

    if (query.baptisedFilter !== undefined) {
      params.append('baptisedFilter', query.baptisedFilter.toString());
    }

    if (query.giftAidFilter !== undefined) {
      params.append('giftAidFilter', query.giftAidFilter.toString());
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
}

// Create singleton instance
export const churchMembersApi = new ChurchMembersApi();
export default churchMembersApi;
