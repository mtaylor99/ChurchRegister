import { apiClient } from './ApiClient';
import type {
  UserProfileDto,
  UserGridQuery,
  PagedResult,
  SystemRoleDto,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserStatusRequest,
} from '../../types/administration';

/**
 * Administration API service for user management operations
 */
export class AdministrationApi {
  private basePath = '/api/administration';

  /**
   * Get users with pagination, search, and filtering
   */
  async getUsers(query: UserGridQuery): Promise<PagedResult<UserProfileDto>> {
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

    if (query.roleFilter) {
      params.append('roleFilter', query.roleFilter);
    }

    return apiClient.get<PagedResult<UserProfileDto>>(
      `${this.basePath}/users?${params.toString()}`
    );
  }

  /**
   * Create a new user
   */
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    return apiClient.post<CreateUserResponse, CreateUserRequest>(
      `${this.basePath}/users`,
      request
    );
  }

  /**
   * Update user information
   */
  async updateUser(
    userId: string,
    request: Omit<UpdateUserRequest, 'userId'>
  ): Promise<UserProfileDto> {
    return apiClient.put<UserProfileDto, Omit<UpdateUserRequest, 'userId'>>(
      `${this.basePath}/users/${userId}`,
      request
    );
  }

  /**
   * Update user status (activate, deactivate, lock, unlock)
   */
  async updateUserStatus(
    userId: string,
    request: Omit<UpdateUserStatusRequest, 'userId'>
  ): Promise<UserProfileDto> {
    return apiClient.patch<
      UserProfileDto,
      Omit<UpdateUserStatusRequest, 'userId'>
    >(`${this.basePath}/users/${userId}/status`, request);
  }

  /**
   * Resend invitation email to a user
   */
  async resendInvitation(
    userId: string
  ): Promise<{ message: string; emailSent: boolean }> {
    return apiClient.post<{ message: string; emailSent: boolean }>(
      `${this.basePath}/users/${userId}/resend-invitation`,
      {}
    );
  }

  /**
   * Get all system roles
   */
  async getSystemRoles(): Promise<SystemRoleDto[]> {
    return apiClient.get<SystemRoleDto[]>(`${this.basePath}/roles`);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserProfileDto> {
    return apiClient.get<UserProfileDto>(`${this.basePath}/users/${userId}`);
  }
}

// Create singleton instance
export const administrationApi = new AdministrationApi();
export default administrationApi;
