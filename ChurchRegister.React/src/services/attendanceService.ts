import { apiClient } from './api/ApiClient';
import type {
  AttendanceGridQuery,
  AttendanceGridResponse,
  UploadAttendanceTemplateResponse,
} from '../types/attendance';

// Attendance types

export interface AttendanceRecord {
  id: number;
  eventId: number;
  eventName: string;
  date: string;
  attendance: number;
  createdBy: string;
  recordedByName: string;
  createdDateTime: string;
  modifiedBy?: string;
  modifiedDateTime?: string;
}

export interface CreateAttendanceRequest {
  eventId: number;
  date: string;
  attendance: number;
}

export interface UpdateAttendanceRequest {
  id: number;
  eventId: number;
  date: string;
  attendance: number;
}

export interface ChartDataPoint {
  date: string;
  attendance: number;
  monthYear?: string;
}

export interface AttendanceAnalyticsResponse {
  eventId: number;
  eventName: string;
  statistics: AttendanceStatistics;
  monthlyData: MonthlyAttendanceData[];
  recentRecords: AttendanceRecord[];
  dataPoints: ChartDataPoint[];
}

export interface AttendanceStatistics {
  totalRecords: number;
  averageAttendance: number;
  highestAttendance: number;
  lowestAttendance: number;
  trendPercentage?: number;
  currentMonthAverage: number;
  previousMonthAverage: number;
  percentageChange: number;
}

export interface MonthlyAttendanceData {
  month: string;
  year: number;
  averageAttendance: number;
  totalRecords: number;
  highestAttendance: number;
  lowestAttendance: number;
}

export interface AttendanceWidgetData {
  totalEvents: number;
  totalRecords: number;
  thisMonthRecords: number;
  totalEventsThisMonth: number;
  averageAttendance: number;
  averageAttendanceThisMonth: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
  recentAttendance: AttendanceRecord[];
  recentEntries: AttendanceRecord[];
}

export interface EmailAttendanceRequest {
  eventId?: number;
  email?: string;
  recipientEmails?: string[];
  subject?: string;
  includeCharts?: boolean;
  chartData?: ChartDataPoint[];
  period?: string;
  attachmentData?: string;
  attachmentName?: string;
}

/**
 * Attendance service for managing attendance records and analytics
 */
export class AttendanceService {
  private basePath = '/api/attendance';

  /**
   * Get all attendance records
   */
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    return apiClient.get<AttendanceRecord[]>(this.basePath);
  }

  /**
   * Get attendance records with grid query support (pagination, filtering, sorting)
   */
  async getAttendanceGridData(
    query: AttendanceGridQuery
  ): Promise<AttendanceGridResponse> {
    // For now, implement client-side filtering and pagination until backend supports it
    const allRecords = await this.getAttendanceRecords();

    // Apply filters
    let filteredRecords = allRecords;

    if (query.filters.eventTypeId) {
      filteredRecords = filteredRecords.filter(
        (record) => record.eventId.toString() === query.filters.eventTypeId
      );
    }

    if (query.filters.startDate) {
      filteredRecords = filteredRecords.filter(
        (record) => new Date(record.date) >= query.filters.startDate!
      );
    }

    if (query.filters.endDate) {
      filteredRecords = filteredRecords.filter(
        (record) => new Date(record.date) <= query.filters.endDate!
      );
    }

    // Apply sorting
    filteredRecords.sort((a, b) => {
      const aValue = this.getRecordValue(a, query.sortBy);
      const bValue = this.getRecordValue(b, query.sortBy);

      if (aValue < bValue) return query.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return query.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const totalCount = filteredRecords.length;
    const totalPages = Math.ceil(totalCount / query.pageSize);
    const startIndex = (query.page - 1) * query.pageSize;
    const endIndex = startIndex + query.pageSize;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    // Transform to grid rows
    const data = paginatedRecords.map((record) => ({
      id: record.id,
      eventId: record.eventId,
      eventName: record.eventName,
      date: record.date,
      attendance: record.attendance,
      createdBy: record.createdBy,
      recordedByName: record.recordedByName,
      createdDateTime: record.createdDateTime,
      modifiedBy: record.modifiedBy,
      modifiedDateTime: record.modifiedDateTime,
      actions: '', // Placeholder for action buttons
    }));

    return {
      data,
      totalCount,
      page: query.page,
      pageSize: query.pageSize,
      totalPages,
    };
  }

  /**
   * Helper method to get a sortable value from a record
   */
  private getRecordValue(
    record: AttendanceRecord,
    field: string
  ): string | number | Date {
    switch (field) {
      case 'eventName':
        return record.eventName;
      case 'date':
        return new Date(record.date);
      case 'attendance':
        return record.attendance;
      case 'createdBy':
        return record.createdBy;
      case 'createdDateTime':
        return new Date(record.createdDateTime);
      default:
        return new Date(record.date); // default sort by date
    }
  }

  /**
   * Create a new attendance record
   */
  async createAttendanceRecord(
    request: CreateAttendanceRequest
  ): Promise<void> {
    return apiClient.post<void>(this.basePath, request);
  }

  /**
   * Update an existing attendance record
   */
  async updateAttendanceRecord(
    request: UpdateAttendanceRequest
  ): Promise<void> {
    return apiClient.put<void>(`${this.basePath}/${request.id}`, request);
  }

  /**
   * Delete an attendance record
   */
  async deleteAttendanceRecord(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Get attendance analytics for a specific event
   */
  async getAttendanceAnalytics(
    eventId: number
  ): Promise<AttendanceAnalyticsResponse> {
    return apiClient.get<AttendanceAnalyticsResponse>(
      `${this.basePath}/analytics/${eventId}`
    );
  }

  /**
   * Email attendance analytics
   */
  async emailAttendanceAnalytics(
    request: EmailAttendanceRequest
  ): Promise<void> {
    return apiClient.post<void>(`${this.basePath}/email-analytics`, request);
  }

  /**
   * Check if attendance record exists for event and date
   */
  async checkDuplicateAttendance(
    eventId: number,
    date: string
  ): Promise<boolean> {
    const existingRecords = await this.getAttendanceRecords();
    return existingRecords.some(
      (record) =>
        record.eventId === eventId &&
        new Date(record.date).toDateString() === new Date(date).toDateString()
    );
  }

  /**
   * Get attendance records for a specific event
   */
  async getAttendanceByEvent(eventId: number): Promise<AttendanceRecord[]> {
    const allRecords = await this.getAttendanceRecords();
    return allRecords.filter((record) => record.eventId === eventId);
  }

  /**
   * Get recent attendance records (last 30 days)
   */
  async getRecentAttendance(): Promise<AttendanceRecord[]> {
    const allRecords = await this.getAttendanceRecords();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return allRecords
      .filter((record) => new Date(record.date) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Upload attendance template Excel file (.xlsx) for bulk import
   *
   * @param file - Excel file to upload (.xlsx format, max 5MB)
   * @returns Upload results with summary and any errors
   * @throws Error if file validation fails or server returns error
   */
  async uploadAttendanceTemplate(
    file: File
  ): Promise<UploadAttendanceTemplateResponse> {
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('file', file);

    // POST to upload endpoint with FormData
    // Explicitly set Content-Type to multipart/form-data
    return apiClient.post<UploadAttendanceTemplateResponse>(
      `${this.basePath}/upload-template`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }
}

// Create and export singleton instance
export const attendanceService = new AttendanceService();

/**
 * Envelope Contribution Service for managing envelope batches
 */
import type {
  SubmitEnvelopeBatchRequest,
  SubmitEnvelopeBatchResponse,
  GetBatchListResponse,
  GetBatchDetailsResponse,
  ValidateRegisterNumberResponse,
} from '../types/administration';

export class EnvelopeContributionService {
  private basePath = '/api/financial/envelope-contributions';

  /**
   * Submit a new envelope contribution batch
   */
  async submitBatch(
    request: SubmitEnvelopeBatchRequest
  ): Promise<SubmitEnvelopeBatchResponse> {
    return apiClient.post<SubmitEnvelopeBatchResponse>(
      `${this.basePath}/batches`,
      request
    );
  }

  /**
   * Get paginated list of envelope batches with optional date filtering
   */
  async getBatchList(
    startDate?: string,
    endDate?: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<GetBatchListResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('pageNumber', pageNumber.toString());
    params.append('pageSize', pageSize.toString());

    return apiClient.get<GetBatchListResponse>(
      `${this.basePath}/batches?${params.toString()}`
    );
  }

  /**
   * Get details of a specific batch including all envelopes
   */
  async getBatchDetails(batchId: number): Promise<GetBatchDetailsResponse> {
    return apiClient.get<GetBatchDetailsResponse>(
      `${this.basePath}/batches/${batchId}`
    );
  }

  /**
   * Validate a register number for a specific year
   */
  async validateRegisterNumber(
    registerNumber: number,
    year: number
  ): Promise<ValidateRegisterNumberResponse> {
    return apiClient.get<ValidateRegisterNumberResponse>(
      `${this.basePath}/validate-register-number/${registerNumber}/${year}`
    );
  }

  /**
   * Validate a register number for the current year
   */
  async validateRegisterNumberForCurrentYear(
    registerNumber: number
  ): Promise<ValidateRegisterNumberResponse> {
    const currentYear = new Date().getFullYear();
    return this.validateRegisterNumber(registerNumber, currentYear);
  }
}

// Create and export singleton instance
export const envelopeContributionService = new EnvelopeContributionService();

/**
 * Register Number Service for managing annual register number generation
 */
import type {
  GenerateRegisterNumbersRequest,
  GenerateRegisterNumbersResponse,
  PreviewRegisterNumbersResponse,
} from '../types/administration';

export class RegisterNumberService {
  private basePath = '/api/administration/church-members';

  /**
   * Generate or preview register numbers for a specific year
   */
  async generateRegisterNumbers(
    request: GenerateRegisterNumbersRequest
  ): Promise<GenerateRegisterNumbersResponse> {
    return apiClient.post<GenerateRegisterNumbersResponse>(
      `${this.basePath}/generate-register-numbers`,
      request
    );
  }

  /**
   * Preview register numbers for a specific year without generating
   */
  async previewRegisterNumbers(
    year: number
  ): Promise<PreviewRegisterNumbersResponse> {
    return apiClient.get<PreviewRegisterNumbersResponse>(
      `${this.basePath}/register-numbers/preview/${year}`
    );
  }

  /**
   * Generate register numbers for the current year
   */
  async generateForCurrentYear(): Promise<GenerateRegisterNumbersResponse> {
    const currentYear = new Date().getFullYear();
    return this.generateRegisterNumbers({
      targetYear: currentYear,
      confirmGeneration: true,
    });
  }

  /**
   * Preview register numbers for the current year
   */
  async previewForCurrentYear(): Promise<PreviewRegisterNumbersResponse> {
    const currentYear = new Date().getFullYear();
    return this.previewRegisterNumbers(currentYear);
  }

  /**
   * Generate register numbers for next year
   */
  async generateForNextYear(): Promise<GenerateRegisterNumbersResponse> {
    const nextYear = new Date().getFullYear() + 1;
    return this.generateRegisterNumbers({
      targetYear: nextYear,
      confirmGeneration: true,
    });
  }

  /**
   * Preview register numbers for next year
   */
  async previewForNextYear(): Promise<PreviewRegisterNumbersResponse> {
    const nextYear = new Date().getFullYear() + 1;
    return this.previewRegisterNumbers(nextYear);
  }
}

// Create and export singleton instance
export const registerNumberService = new RegisterNumberService();
