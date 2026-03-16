import { describe, test, expect } from 'vitest';
import {
  churchMemberKeys,
  contributionKeys,
  userKeys,
  envelopeKeys,
  registerNumberKeys,
  authKeys,
  dashboardKeys,
  eventKeys,
  attendanceKeys,
  reminderKeys,
  reminderCategoryKeys,
  riskAssessmentKeys,
  trainingCertificateKeys,
  dataProtectionKeys,
  districtKeys,
  invalidatePatterns,
} from './queryKeys';

describe('queryKeys', () => {
  describe('churchMemberKeys', () => {
    test('all returns base key', () => {
      expect(churchMemberKeys.all).toEqual(['churchMembers']);
    });

    test('lists appends list segment', () => {
      expect(churchMemberKeys.lists()).toEqual(['churchMembers', 'list']);
    });

    test('list appends query to lists', () => {
      const query = { page: 1, pageSize: 10 } as any;
      expect(churchMemberKeys.list(query)).toEqual([
        'churchMembers',
        'list',
        query,
      ]);
    });

    test('details appends detail segment', () => {
      expect(churchMemberKeys.details()).toEqual(['churchMembers', 'detail']);
    });

    test('detail appends id', () => {
      expect(churchMemberKeys.detail(42)).toEqual([
        'churchMembers',
        'detail',
        42,
      ]);
    });

    test('roles returns roles key', () => {
      expect(churchMemberKeys.roles()).toEqual(['churchMembers', 'roles']);
    });

    test('statuses returns statuses key', () => {
      expect(churchMemberKeys.statuses()).toEqual([
        'churchMembers',
        'statuses',
      ]);
    });

    test('nextMemberNumber returns dedicated key', () => {
      expect(churchMemberKeys.nextMemberNumber()).toEqual([
        'nextAvailableMemberNumber',
      ]);
    });
  });

  describe('contributionKeys', () => {
    test('all returns base key', () => {
      expect(contributionKeys.all).toEqual(['contributions']);
    });

    test('lists builds on all', () => {
      expect(contributionKeys.lists()).toEqual(['contributions', 'list']);
    });

    test('history includes memberId and optional dates', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-12-31');
      expect(contributionKeys.history(5, start, end)).toEqual([
        'contributionHistory',
        5,
        start,
        end,
      ]);
    });

    test('history works without dates', () => {
      expect(contributionKeys.history(5)).toEqual([
        'contributionHistory',
        5,
        undefined,
        undefined,
      ]);
    });

    test('memberContributions returns dedicated key', () => {
      expect(contributionKeys.memberContributions()).toEqual([
        'contribution-members',
      ]);
    });
  });

  describe('userKeys', () => {
    test('all returns base key', () => {
      expect(userKeys.all).toEqual(['users']);
    });

    test('detail uses string id', () => {
      expect(userKeys.detail('user-123')).toEqual([
        'users',
        'detail',
        'user-123',
      ]);
    });

    test('roles returns systemRoles key', () => {
      expect(userKeys.roles()).toEqual(['systemRoles']);
    });
  });

  describe('envelopeKeys', () => {
    test('all returns base key', () => {
      expect(envelopeKeys.all).toEqual(['envelopeContributions']);
    });

    test('batch includes id', () => {
      expect(envelopeKeys.batch(7)).toEqual([
        'envelopeContributions',
        'batches',
        7,
      ]);
    });

    test('validateRegisterNumber includes number and year', () => {
      expect(envelopeKeys.validateRegisterNumber(100, 2025)).toEqual([
        'envelopeContributions',
        'validate',
        100,
        2025,
      ]);
    });
  });

  describe('registerNumberKeys', () => {
    test('preview includes year', () => {
      expect(registerNumberKeys.preview(2026)).toEqual([
        'registerNumbers',
        'preview',
        2026,
      ]);
    });

    test('status includes year', () => {
      expect(registerNumberKeys.status(2026)).toEqual([
        'registerNumbers',
        'status',
        2026,
      ]);
    });

    test('nextAvailable returns dedicated key', () => {
      expect(registerNumberKeys.nextAvailable()).toEqual([
        'registerNumbers',
        'nextAvailable',
      ]);
    });
  });

  describe('authKeys', () => {
    test('currentUser returns key', () => {
      expect(authKeys.currentUser()).toEqual(['currentUser']);
    });

    test('session returns key', () => {
      expect(authKeys.session()).toEqual(['session']);
    });
  });

  describe('dashboardKeys', () => {
    test('statistics returns key', () => {
      expect(dashboardKeys.statistics()).toEqual(['dashboardStatistics']);
    });
  });

  describe('eventKeys', () => {
    test('all returns base key', () => {
      expect(eventKeys.all).toEqual(['events']);
    });

    test('lists builds on all', () => {
      expect(eventKeys.lists()).toEqual(['events', 'list']);
    });

    test('detail includes id', () => {
      expect(eventKeys.detail(3)).toEqual(['events', 3]);
    });
  });

  describe('attendanceKeys', () => {
    test('all returns base key', () => {
      expect(attendanceKeys.all).toEqual(['attendance']);
    });

    test('records builds on all', () => {
      expect(attendanceKeys.records()).toEqual(['attendance', 'records']);
    });

    test('recentRecords builds on records', () => {
      expect(attendanceKeys.recentRecords()).toEqual([
        'attendance',
        'records',
        'recent',
      ]);
    });

    test('gridRecords includes query', () => {
      const q = { page: 0 };
      expect(attendanceKeys.gridRecords(q)).toEqual([
        'attendance',
        'grid',
        q,
      ]);
    });

    test('activeEvents builds on events', () => {
      expect(attendanceKeys.activeEvents()).toEqual([
        'attendance',
        'events',
        'active',
      ]);
    });

    test('analysisEvents builds on events', () => {
      expect(attendanceKeys.analysisEvents()).toEqual([
        'attendance',
        'events',
        'analysis',
      ]);
    });

    test('analytics includes eventId', () => {
      expect(attendanceKeys.analytics(5)).toEqual([
        'attendance',
        'analytics',
        5,
      ]);
    });

    test('allAnalytics returns key', () => {
      expect(attendanceKeys.allAnalytics()).toEqual([
        'attendance',
        'analytics',
        'all',
      ]);
    });

    test('monthlyAnalytics returns key', () => {
      expect(attendanceKeys.monthlyAnalytics()).toEqual([
        'attendance',
        'monthlyAnalytics',
      ]);
    });

    test('widgetData returns key', () => {
      expect(attendanceKeys.widgetData()).toEqual(['attendance', 'widget']);
    });
  });

  describe('reminderKeys', () => {
    test('all returns base key', () => {
      expect(reminderKeys.all).toEqual(['reminders']);
    });

    test('list includes params', () => {
      const params = { status: 'Active' } as any;
      expect(reminderKeys.list(params)).toEqual([
        'reminders',
        'list',
        params,
      ]);
    });

    test('detail includes id', () => {
      expect(reminderKeys.detail(9)).toEqual(['reminders', 'detail', 9]);
    });

    test('dashboardSummary returns key', () => {
      expect(reminderKeys.dashboardSummary()).toEqual([
        'reminders',
        'dashboard-summary',
      ]);
    });
  });

  describe('reminderCategoryKeys', () => {
    test('all returns base key', () => {
      expect(reminderCategoryKeys.all).toEqual(['reminderCategories']);
    });

    test('detail includes id', () => {
      expect(reminderCategoryKeys.detail(3)).toEqual([
        'reminderCategories',
        'detail',
        3,
      ]);
    });
  });

  describe('riskAssessmentKeys', () => {
    test('all returns base key', () => {
      expect(riskAssessmentKeys.all).toEqual(['riskAssessments']);
    });

    test('list includes filter params', () => {
      const result = riskAssessmentKeys.list(1, 'Active', true, 'Fire');
      expect(result).toEqual([
        'riskAssessments',
        'list',
        { categoryId: 1, status: 'Active', overdueOnly: true, title: 'Fire' },
      ]);
    });

    test('list works with null params', () => {
      const result = riskAssessmentKeys.list(null, null, false, null);
      expect(result).toEqual([
        'riskAssessments',
        'list',
        {
          categoryId: null,
          status: null,
          overdueOnly: false,
          title: null,
        },
      ]);
    });

    test('history includes id', () => {
      expect(riskAssessmentKeys.history(5)).toEqual([
        'riskAssessments',
        'history',
        5,
      ]);
    });

    test('categories returns key', () => {
      expect(riskAssessmentKeys.categories()).toEqual([
        'riskAssessments',
        'categories',
      ]);
    });

    test('dashboardSummary returns key', () => {
      expect(riskAssessmentKeys.dashboardSummary()).toEqual([
        'riskAssessments',
        'dashboard-summary',
      ]);
    });
  });

  describe('trainingCertificateKeys', () => {
    test('all returns base key', () => {
      expect(trainingCertificateKeys.all).toEqual(['trainingCertificates']);
    });

    test('types returns key', () => {
      expect(trainingCertificateKeys.types()).toEqual([
        'trainingCertificates',
        'types',
      ]);
    });

    test('activeTypes returns key', () => {
      expect(trainingCertificateKeys.activeTypes()).toEqual([
        'trainingCertificates',
        'types',
        'Active',
      ]);
    });

    test('groupSummary returns key', () => {
      expect(trainingCertificateKeys.groupSummary()).toEqual([
        'trainingCertificates',
        'group-summary',
      ]);
    });
  });

  describe('dataProtectionKeys', () => {
    test('all returns base key', () => {
      expect(dataProtectionKeys.all).toEqual(['dataProtection']);
    });

    test('byMember includes memberId', () => {
      expect(dataProtectionKeys.byMember(42)).toEqual([
        'dataProtection',
        'member',
        42,
      ]);
    });
  });

  describe('districtKeys', () => {
    test('all returns base key', () => {
      expect(districtKeys.all).toEqual(['districts']);
    });

    test('lists builds on all', () => {
      expect(districtKeys.lists()).toEqual(['districts', 'list']);
    });
  });

  describe('invalidatePatterns', () => {
    test('provides correct base keys for each domain', () => {
      expect(invalidatePatterns.churchMembers).toEqual(['churchMembers']);
      expect(invalidatePatterns.contributions).toEqual(['contributions']);
      expect(invalidatePatterns.users).toEqual(['users']);
      expect(invalidatePatterns.envelopes).toEqual(['envelopeContributions']);
      expect(invalidatePatterns.events).toEqual(['events']);
      expect(invalidatePatterns.attendance).toEqual(['attendance']);
    });
  });
});
