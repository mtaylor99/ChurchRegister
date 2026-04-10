/**
 * TypeScript interfaces for attendance-related data structures
 */

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

export interface Event {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  showInAnalysis: boolean;
  dayOfWeek?: number; // 0=Sunday, 1=Monday, ..., 6=Saturday, null=no restriction
  createdAt: string;
  createdBy: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  isActive: boolean;
  showInAnalysis: boolean;
  dayOfWeek?: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export interface UpdateEventRequest {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  showInAnalysis: boolean;
  dayOfWeek?: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export interface AttendanceAnalyticsResponse {
  eventId: number;
  eventName: string;
  dataPoints: AttendanceDataPoint[];
  statistics: AttendanceStatistics;
}

export interface AttendanceDataPoint {
  date: string;
  attendance: number;
  monthYear: string;
}

export interface AttendanceStatistics {
  average: number;
  maximum: number;
  minimum: number;
  trendPercentage: number;
  trendDirection: 'up' | 'down' | 'stable';
  totalRecords: number;
}

export interface EmailAttendanceRequest {
  email: string;
  eventId?: number; // If undefined, send all events
  chartData?: string; // Base64 encoded chart image
}

// Chart-related interfaces for Recharts integration
export interface ChartDataPoint {
  date: string;
  attendance: number;
  monthYear: string;
  formattedDate: string;
}

export interface ChartConfiguration {
  width: number;
  height: number;
  showGrid: boolean;
  showTooltip: boolean;
  showLegend: boolean;
  colors: {
    line: string;
    area: string;
    grid: string;
  };
}

// Monthly analytics interfaces for charts
export interface MonthlyAverage {
  month: string; // 'Jan', 'Feb', etc.
  monthYear: string; // 'Jan 2025' for tooltip
  averageAttendance: number;
  recordCount: number;
  monthIndex: number; // For proper ordering (0-11)
}

export interface MonthlyAnalyticsResponse {
  eventId: number;
  eventName: string;
  monthlyData: MonthlyAverage[];
  totalMonths: number;
  hasData: boolean;
}

// Dashboard widget interfaces
export interface AttendanceWidgetData {
  recentEntries: AttendanceRecord[];
  totalEventsThisMonth: number;
  averageAttendanceThisMonth: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

// Form validation interfaces
export interface AttendanceFormData {
  eventId: number | null;
  date: Date | null;
  attendance: number | null;
}

export interface AttendanceFormErrors {
  eventId?: string;
  date?: string;
  attendance?: string;
  general?: string;
}

// Grid/Table interfaces for DataGrid
export interface AttendanceGridRow {
  id: number;
  eventName: string;
  date: string;
  attendance: number;
  createdBy: string;
  createdDateTime: string;
  actions: string; // For action buttons
}

export interface EventGridRow {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  showInAnalysis: boolean;
  createdAt: string;
  createdBy: string;
  actions: string; // For action buttons
}

// Attendance Grid Types for DataGrid implementation
export interface AttendanceGridQuery {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: AttendanceFilterState;
}

export interface AttendanceFilterState {
  eventTypeId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AttendanceGridRow {
  id: number;
  eventId: number;
  eventName: string;
  date: string;
  attendance: number;
  createdBy: string;
  createdDateTime: string;
  modifiedBy?: string;
  modifiedDateTime?: string;
}

export interface AttendanceGridResponse {
  data: AttendanceGridRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Upload Template Interfaces

/**
 * Response from attendance template upload operation
 */
export interface UploadAttendanceTemplateResponse {
  success: boolean;
  summary: AttendanceUploadSummary;
  errors: UploadError[];
  warnings: string[];
}

/**
 * Summary statistics for template upload
 */
export interface AttendanceUploadSummary {
  totalRows: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
}

/**
 * Details of an error during upload processing
 */
export interface UploadError {
  row: number; // Row number in Excel file (1-based)
  event?: string; // Event name if applicable
  date?: string; // Date value if applicable
  message: string; // Error description
}
