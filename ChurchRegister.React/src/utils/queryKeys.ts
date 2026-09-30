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
import type { ReminderQueryParameters } from '../types/reminders';
import type { TrainingCertificateGridQuery } from '../types/trainingCertificates';

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
  status: (year: number) =>
    [...registerNumberKeys.all, 'status', year] as const,
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
  records: () => [...attendanceKeys.all, 'records'] as const,
  recentRecords: () => [...attendanceKeys.records(), 'recent'] as const,
  gridRecords: (query: unknown) =>
    [...attendanceKeys.all, 'grid', query] as const,
  events: () => [...attendanceKeys.all, 'events'] as const,
  activeEvents: () => [...attendanceKeys.events(), 'active'] as const,
  analysisEvents: () => [...attendanceKeys.events(), 'analysis'] as const,
  analytics: (eventId: number) =>
    [...attendanceKeys.all, 'analytics', eventId] as const,
  allAnalytics: () => [...attendanceKeys.all, 'analytics', 'all'] as const,
  monthlyAnalytics: () => [...attendanceKeys.all, 'monthlyAnalytics'] as const,
  widgetData: () => [...attendanceKeys.all, 'widget'] as const,
} as const;

/**
 * Query keys for reminders domain
 */
export const reminderKeys = {
  all: ['reminders'] as const,
  lists: () => [...reminderKeys.all, 'list'] as const,
  list: (params: ReminderQueryParameters) =>
    [...reminderKeys.lists(), params] as const,
  details: () => [...reminderKeys.all, 'detail'] as const,
  detail: (id: number) => [...reminderKeys.details(), id] as const,
  dashboardSummary: () => [...reminderKeys.all, 'dashboard-summary'] as const,
} as const;

/**
 * Query keys for reminder categories domain
 */
export const reminderCategoryKeys = {
  all: ['reminderCategories'] as const,
  lists: () => [...reminderCategoryKeys.all, 'list'] as const,
  details: () => [...reminderCategoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...reminderCategoryKeys.details(), id] as const,
} as const;

/**
 * Query keys for risk assessments domain
 */
export const riskAssessmentKeys = {
  all: ['riskAssessments'] as const,
  lists: () => [...riskAssessmentKeys.all, 'list'] as const,
  list: (
    categoryId?: number | null,
    status?: string | null,
    overdueOnly?: boolean,
    title?: string | null
  ) =>
    [
      ...riskAssessmentKeys.lists(),
      { categoryId, status, overdueOnly, title },
    ] as const,
  details: () => [...riskAssessmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...riskAssessmentKeys.details(), id] as const,
  history: (id: number) => [...riskAssessmentKeys.all, 'history', id] as const,
  categories: () => [...riskAssessmentKeys.all, 'categories'] as const,
  dashboardSummary: () =>
    [...riskAssessmentKeys.all, 'dashboard-summary'] as const,
} as const;

/**
 * Query keys for training certificates domain
 */
export const trainingCertificateKeys = {
  all: ['trainingCertificates'] as const,
  lists: () => [...trainingCertificateKeys.all, 'list'] as const,
  list: (query: TrainingCertificateGridQuery) =>
    [...trainingCertificateKeys.lists(), query] as const,
  types: () => [...trainingCertificateKeys.all, 'types'] as const,
  activeTypes: () => [...trainingCertificateKeys.types(), 'Active'] as const,
  groupSummary: () =>
    [...trainingCertificateKeys.all, 'group-summary'] as const,
} as const;

/**
 * Query keys for data protection domain
 */
export const dataProtectionKeys = {
  all: ['dataProtection'] as const,
  byMember: (memberId: number) =>
    [...dataProtectionKeys.all, 'member', memberId] as const,
} as const;

/**
 * Query keys for districts domain
 */
export const districtKeys = {
  all: ['districts'] as const,
  lists: () => [...districtKeys.all, 'list'] as const,
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
  reminders: reminderKeys.all,
  reminderCategories: reminderCategoryKeys.all,
  riskAssessments: riskAssessmentKeys.all,
  trainingCertificates: trainingCertificateKeys.all,
  dataProtection: dataProtectionKeys.all,
  districts: districtKeys.all,
} as const;
