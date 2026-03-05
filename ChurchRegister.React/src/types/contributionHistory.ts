/**
 * Contribution history types for church member contributions
 */

/**
 * Data transfer object for church member contribution history
 */
export interface ContributionHistoryDto {
  id: number;
  date: string; // ISO date string
  amount: number;
  contributionType: string;
  transactionRef?: string;
  description?: string;
  createdDateTime: string; // ISO date string
  createdBy: string; // User ID
  createdByName: string; // User's full name
}

/**
 * Request parameters for getting contribution history
 */
export interface GetContributionHistoryRequest {
  memberId: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}
