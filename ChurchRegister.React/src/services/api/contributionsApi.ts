import { apiClient } from './ApiClient';
import type {
  ContributionMemberDto,
  ContributionGridQuery,
  ContributionGridResponse,
} from '../../types/contributions';
import type { AddressDto } from '../../types/churchMembers';

/**
 * Contributions API service for fetching contribution-focused member data
 */
export class ContributionsApi {
  private basePath = '/api/church-members'; // Reusing existing endpoint

  /**
   * Get church members with contribution-focused data
   * Includes: Name, Status, Envelope Number, This Year's Contribution
   *
   * @param query - Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of contribution members
   */
  async getContributionMembers(
    query: ContributionGridQuery
  ): Promise<ContributionGridResponse> {
    try {
      // Map our query to the existing church members endpoint query format
      const params = {
        page: query.page,
        pageSize: query.pageSize,
        searchTerm: query.searchTerm,
        statusFilter: 1, // Always filter to Active members only for contributions
        sortBy: query.sortBy || 'firstName',
        sortDirection: query.sortDirection || 'asc',
        ...(query.year && { year: query.year }), // Include year if provided
      };

      // Define the response type from the church members API
      interface ChurchMemberApiItem {
        id: number;
        firstName: string;
        lastName: string;
        fullName?: string;
        statusId?: number;
        status?: string;
        statusName?: string;
        statusColor?: string;
        thisYearsContribution?: number;
        memberNumber?: string | null;
        address?: AddressDto;
        bankReference?: string;
        lastContributionDate?: string;
        giftAid?: boolean;
      }

      // Call existing endpoint which already has ThisYearsContribution
      const response = await apiClient.get<{
        items: ChurchMemberApiItem[];
        totalCount: number;
        currentPage: number;
        pageSize: number;
        totalPages: number;
      }>(this.basePath, { params });

      // Transform the response to ContributionMemberDto format
      const items: ContributionMemberDto[] = response.items.map(
        (member: ChurchMemberApiItem) => ({
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          fullName: member.fullName || `${member.firstName} ${member.lastName}`,
          statusId: member.statusId || 0,
          statusName: member.statusName || member.status || 'Unknown',
          statusColor: this.getStatusColor(
            member.statusName || member.status || 'Unknown'
          ),
          envelopeNumber: member.memberNumber || null,
          address: member.address,
          bankReference: member.bankReference,
          thisYearsContribution: member.thisYearsContribution || 0,
          lastContributionDate: member.lastContributionDate,
          giftAid: member.giftAid || false,
        })
      );

      return {
        items,
        totalCount: response.totalCount,
        currentPage: response.currentPage,
        pageSize: response.pageSize,
        totalPages: response.totalPages,
      };
    } catch (error) {
      console.error('Error fetching contribution members:', error);
      throw error;
    }
  }

  /**
   * Map status name to Material-UI color for Chip display
   * @param statusName - Status name from API
   * @returns MUI color string
   */
  private getStatusColor(
    statusName: string
  ): 'success' | 'error' | 'warning' | 'info' | 'default' {
    const statusMap: Record<
      string,
      'success' | 'error' | 'warning' | 'info' | 'default'
    > = {
      Active: 'success',
      Inactive: 'default',
      InActive: 'default',
      Expired: 'warning',
      'In Glory': 'info',
    };

    return statusMap[statusName] || 'default';
  }

  /**
   * Add a one-off manual contribution
   * @param data - Contribution details
   * @returns Created contribution response
   */
  async addOneOffContribution(data: {
    memberId: number;
    amount: number;
    date: string;
    description: string;
  }): Promise<{
    contributionId: number;
    message: string;
    memberName: string;
  }> {
    try {
      const response = await apiClient.post<{
        contributionId: number;
        message: string;
        memberName: string;
      }>('/api/contributions/one-off', data);

      return response;
    } catch (error) {
      console.error('Error adding one-off contribution:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const contributionsApi = new ContributionsApi();
