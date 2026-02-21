/**
 * Query Key Factory
 *
 * Centralized management of React Query keys for type safety and consistency.
 * This factory pattern ensures:
 * - Type-safe query key management
 * - Easy invalidation of related queries
 * - Consistent naming across the application
 * - Better debugging and cache inspection
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */

import type { ChurchMemberGridQuery } from '../types/churchMembers';
import type { ContributionGridQuery } from '../types/contributions';
import type { UserGridQuery } from '../types/administration';

/**
 * Query keys for church members domain
 */
export const churchMemberKeys = {
  all: ['churchMembers'] as const,
  lists: () => [...churchMemberKeys.all, 'list'] as const,
  list: (query: ChurchMemberGridQuery) =>
    [...churchMemberKeys.lists(), query] as const,
  details: () => [...churchMemberKeys.all, 'detail'] as const,
  detail: (id: number) => [...churchMemberKeys.details(), id] as const,
  roles: () => [...churchMemberKeys.all, 'roles'] as const,
  statuses: () => [...churchMemberKeys.all, 'statuses'] as const,
  nextMemberNumber: () => ['nextAvailableMemberNumber'] as const,
} as const;

/**
 * Query keys for contributions domain
 */
export const contributionKeys = {
  all: ['contributions'] as const,
  lists: () => [...contributionKeys.all, 'list'] as const,
  list: (query: ContributionGridQuery) =>
    [...contributionKeys.lists(), query] as const,
  history: (memberId: number, startDate?: Date, endDate?: Date) =>
    ['contributionHistory', memberId, startDate, endDate] as const,
  memberContributions: () => ['contribution-members'] as const,
  memberContributionList: (query: ContributionGridQuery) =>
    [...contributionKeys.memberContributions(), query] as const,
} as const;

/**
 * Query keys for users/administration domain
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (query: UserGridQuery) => [...userKeys.lists(), query] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  roles: () => ['systemRoles'] as const,
} as const;

/**
 * Query keys for envelope contributions domain
 */
export const envelopeKeys = {
  all: ['envelopeContributions'] as const,
  batches: () => [...envelopeKeys.all, 'batches'] as const,
  batch: (id: number) => [...envelopeKeys.batches(), id] as const,
  validateRegisterNumber: (number: number, year: number) =>
    [...envelopeKeys.all, 'validate', number, year] as const,
} as const;

/**
 * Query keys for register numbers domain
 */
export const registerNumberKeys = {
  all: ['registerNumbers'] as const,
  preview: (year: number) =>
    [...registerNumberKeys.all, 'preview', year] as const,
  nextAvailable: () => [...registerNumberKeys.all, 'nextAvailable'] as const,
} as const;

/**
 * Query keys for authentication domain
 */
export const authKeys = {
  currentUser: () => ['currentUser'] as const,
  session: () => ['session'] as const,
} as const;

/**
 * Query keys for dashboard/statistics
 */
export const dashboardKeys = {
  statistics: () => ['dashboardStatistics'] as const,
} as const;

/**
 * Query keys for events domain
 */
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  detail: (id: number) => [...eventKeys.all, id] as const,
} as const;

/**
 * Query keys for attendance domain
 */
export const attendanceKeys = {
  all: ['attendance'] as const,
  lists: () => [...attendanceKeys.all, 'list'] as const,
  analytics: (eventId: number) =>
    [...attendanceKeys.all, 'analytics', eventId] as const,
} as const;

/**
 * Utility to invalidate all queries for a specific domain
 *
 * Example usage:
 * ```ts
 * queryClient.invalidateQueries({ queryKey: churchMemberKeys.all });
 * ```
 */
export const invalidatePatterns = {
  churchMembers: churchMemberKeys.all,
  contributions: contributionKeys.all,
  users: userKeys.all,
  envelopes: envelopeKeys.all,
  events: eventKeys.all,
  attendance: attendanceKeys.all,
} as const;
