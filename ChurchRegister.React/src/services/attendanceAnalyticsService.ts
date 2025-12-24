import {
  attendanceService,
  type AttendanceAnalyticsResponse,
  type EmailAttendanceRequest,
  type AttendanceWidgetData,
  type AttendanceRecord,
  type ChartDataPoint,
} from './attendanceService';
import { eventService, type Event } from './eventService';
import { logger } from '../utils/logger';
import type {
  AttendanceDataPoint,
  MonthlyAverage,
  MonthlyAnalyticsResponse,
} from '../types/attendance';

/**
 * Service for attendance analytics and reporting functionality
 */
export class AttendanceAnalyticsService {
  /**
   * Get analytics data for a specific event
   */
  async getEventAnalytics(
    eventId: number
  ): Promise<AttendanceAnalyticsResponse> {
    return attendanceService.getAttendanceAnalytics(eventId);
  }

  /**
   * Get analytics for all events that show in analysis
   */
  async getAllEventsAnalytics(): Promise<AttendanceAnalyticsResponse[]> {
    const analysisEvents = await eventService.getAnalysisEvents();
    const analyticsPromises = analysisEvents.map((event) =>
      this.getEventAnalytics(event.id)
    );

    return Promise.all(analyticsPromises);
  }

  /**
   * Transform analytics data for chart display
   */
  transformDataForChart(
    analytics: AttendanceAnalyticsResponse
  ): ChartDataPoint[] {
    return analytics.dataPoints.map((point) => ({
      date: point.date,
      attendance: point.attendance,
      monthYear: point.monthYear,
      formattedDate: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }

  /**
   * Aggregate attendance data points into monthly averages
   */
  aggregateDataByMonth(
    dataPoints: AttendanceDataPoint[] | ChartDataPoint[]
  ): MonthlyAverage[] {
    if (!dataPoints || dataPoints.length === 0) {
      return [];
    }

    // Group data points by month and year
    const monthlyGroups = new Map<
      string,
      { total: number; count: number; monthIndex: number; year: number }
    >();

    dataPoints.forEach((point) => {
      const date = new Date(point.date);
      const month = date.getMonth(); // 0-11
      const year = date.getFullYear();
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, {
          total: 0,
          count: 0,
          monthIndex: month,
          year,
        });
      }

      const group = monthlyGroups.get(monthKey)!;
      group.total += point.attendance;
      group.count += 1;
    });

    // Convert to MonthlyAverage array and sort by date
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const monthlyAverages: MonthlyAverage[] = [];

    for (const [, group] of monthlyGroups) {
      const averageAttendance = Math.round(group.total / group.count);
      const month = monthNames[group.monthIndex];
      const monthYear = `${month} ${group.year}`;

      monthlyAverages.push({
        month,
        monthYear,
        averageAttendance,
        recordCount: group.count,
        monthIndex: group.monthIndex,
      });
    }

    // Sort by year and month chronologically (most recent first)
    return monthlyAverages.sort((a, b) => {
      const aDate = new Date(a.monthYear);
      const bDate = new Date(b.monthYear);
      return bDate.getTime() - aDate.getTime();
    });
  }

  /**
   * Get monthly analytics for a specific event
   */
  async getEventMonthlyAnalytics(
    eventId: number
  ): Promise<MonthlyAnalyticsResponse> {
    logger.debug(`Getting monthly analytics for event ${eventId}`);

    const analytics = await this.getEventAnalytics(eventId);
    logger.debug(`Raw analytics for event ${eventId}`, { analytics });

    const monthlyData = this.aggregateDataByMonth(analytics.dataPoints);
    logger.debug(`Monthly data for event ${eventId}`, { monthlyData });

    const response = {
      eventId: analytics.eventId,
      eventName: analytics.eventName,
      monthlyData,
      totalMonths: monthlyData.length,
      hasData: monthlyData.length > 0,
    };

    logger.debug(`Final response for event ${eventId}`, { response });
    return response;
  }

  /**
   * Get data for dashboard attendance widget
   */
  async getDashboardWidgetData(): Promise<AttendanceWidgetData> {
    const recentEntries = await attendanceService.getRecentAttendance();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter entries for current month
    const thisMonthEntries = recentEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === currentMonth &&
        entryDate.getFullYear() === currentYear
      );
    });

    // Calculate previous month for trend
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear =
      currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthEntries = recentEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === previousMonth &&
        entryDate.getFullYear() === previousMonthYear
      );
    });

    // Calculate statistics
    const thisMonthAverage =
      thisMonthEntries.length > 0
        ? thisMonthEntries.reduce((sum, entry) => sum + entry.attendance, 0) /
          thisMonthEntries.length
        : 0;

    const previousMonthAverage =
      previousMonthEntries.length > 0
        ? previousMonthEntries.reduce(
            (sum, entry) => sum + entry.attendance,
            0
          ) / previousMonthEntries.length
        : 0;

    // Calculate trend
    const trendPercentage =
      previousMonthAverage > 0
        ? ((thisMonthAverage - previousMonthAverage) / previousMonthAverage) *
          100
        : 0;

    const trendDirection =
      trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';

    // Get unique events count for this month
    const uniqueEvents = new Set(
      thisMonthEntries.map((entry) => entry.eventId)
    );

    return {
      totalEvents: await eventService
        .getEvents()
        .then((events) => events.length),
      totalRecords: recentEntries.length,
      thisMonthRecords: thisMonthEntries.length,
      averageAttendance:
        recentEntries.length > 0
          ? Math.round(
              recentEntries.reduce((sum, entry) => sum + entry.attendance, 0) /
                recentEntries.length
            )
          : 0,
      recentAttendance: recentEntries.slice(0, 5),
      recentEntries: recentEntries.slice(0, 5), // Show last 5 entries
      totalEventsThisMonth: uniqueEvents.size,
      averageAttendanceThisMonth: Math.round(thisMonthAverage),
      trendDirection,
      trendPercentage: Math.abs(trendPercentage),
    };
  }

  /**
   * Email analytics for a specific event
   */
  async emailEventAnalytics(
    email: string,
    eventId: number,
    chartData?: ChartDataPoint[]
  ): Promise<void> {
    const request: EmailAttendanceRequest = {
      email,
      eventId,
      chartData,
    };

    return attendanceService.emailAttendanceAnalytics(request);
  }

  /**
   * Email analytics for all events
   */
  async emailAllEventsAnalytics(email: string): Promise<void> {
    const request: EmailAttendanceRequest = {
      email,
      // eventId is undefined to get all events
    };

    return attendanceService.emailAttendanceAnalytics(request);
  }

  /**
   * Generate PDF-ready data for charts
   */
  async generatePDFData(eventIds?: number[]): Promise<{
    events: Event[];
    analytics: AttendanceAnalyticsResponse[];
    chartData: ChartDataPoint[][];
  }> {
    let events: Event[];

    if (eventIds && eventIds.length > 0) {
      // Get specific events
      const allEvents = await eventService.getEvents();
      events = allEvents.filter((event) => eventIds.includes(event.id));
    } else {
      // Get all analysis events
      events = await eventService.getAnalysisEvents();
    }

    // Get analytics for each event
    const analytics = await Promise.all(
      events.map((event) => this.getEventAnalytics(event.id))
    );

    // Transform data for charts
    const chartData = analytics.map((analytic) =>
      this.transformDataForChart(analytic)
    );

    return {
      events,
      analytics,
      chartData,
    };
  }

  /**
   * Calculate attendance trends over time
   */
  calculateTrends(records: AttendanceRecord[]): {
    monthly: { month: string; average: number; total: number; count: number }[];
    overall: { direction: 'up' | 'down' | 'stable'; percentage: number };
  } {
    // Group by month
    const monthlyData = new Map<string, AttendanceRecord[]>();

    records.forEach((record) => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }
      monthlyData.get(monthKey)!.push(record);
    });

    // Calculate monthly averages
    const monthly = Array.from(monthlyData.entries())
      .map(([monthKey, monthRecords]) => {
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month - 1);
        const total = monthRecords.reduce(
          (sum, record) => sum + record.attendance,
          0
        );

        return {
          month: date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          average: Math.round(total / monthRecords.length),
          total,
          count: monthRecords.length,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate overall trend
    let overallTrend: {
      direction: 'up' | 'down' | 'stable';
      percentage: number;
    } = {
      direction: 'stable',
      percentage: 0,
    };

    if (monthly.length >= 2) {
      const firstHalf = monthly.slice(0, Math.ceil(monthly.length / 2));
      const secondHalf = monthly.slice(Math.floor(monthly.length / 2));

      const firstAverage =
        firstHalf.reduce((sum, item) => sum + item.average, 0) /
        firstHalf.length;
      const secondAverage =
        secondHalf.reduce((sum, item) => sum + item.average, 0) /
        secondHalf.length;

      if (firstAverage > 0) {
        const percentage =
          ((secondAverage - firstAverage) / firstAverage) * 100;
        overallTrend = {
          direction:
            percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable',
          percentage: Math.abs(percentage),
        };
      }
    }

    return {
      monthly,
      overall: overallTrend,
    };
  }

  /**
   * Get attendance comparison between events
   */
  async getEventComparison(): Promise<
    {
      eventName: string;
      averageAttendance: number;
      totalRecords: number;
      lastRecorded: string;
    }[]
  > {
    const events = await eventService.getActiveEvents();
    const allRecords = await attendanceService.getAttendanceRecords();

    return events
      .map((event) => {
        const eventRecords = allRecords.filter(
          (record) => record.eventId === event.id
        );
        const totalAttendance = eventRecords.reduce(
          (sum, record) => sum + record.attendance,
          0
        );
        const averageAttendance =
          eventRecords.length > 0 ? totalAttendance / eventRecords.length : 0;
        const lastRecord = eventRecords.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];

        return {
          eventName: event.name,
          averageAttendance: Math.round(averageAttendance),
          totalRecords: eventRecords.length,
          lastRecorded: lastRecord ? lastRecord.date : 'Never',
        };
      })
      .sort((a, b) => b.averageAttendance - a.averageAttendance);
  }

  /**
   * Email attendance analytics report
   */
  async emailReport(emailRequest: {
    period: string;
    reportData: AttendanceAnalyticsResponse;
    pdfAttachment: Blob;
  }): Promise<void> {
    // Convert blob to base64 for API
    const arrayBuffer = await emailRequest.pdfAttachment.arrayBuffer();
    const base64String = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    const emailData: EmailAttendanceRequest = {
      period: emailRequest.period,
      attachmentData: base64String,
      attachmentName: `Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`,
    };

    return attendanceService.emailAttendanceAnalytics(emailData);
  }

  /**
   * Export analytics data to various formats
   */
  exportToFormat(
    data: AttendanceAnalyticsResponse,
    format: 'csv' | 'json'
  ): string {
    if (format === 'csv') {
      const headers = ['Date', 'Event', 'Attendance'];
      const rows = data.dataPoints.map((point) => [
        point.date,
        data.eventName,
        point.attendance.toString(),
      ]);

      return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }

    return JSON.stringify(data, null, 2);
  }
}

// Create and export singleton instance
export const attendanceAnalyticsService = new AttendanceAnalyticsService();
