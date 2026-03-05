/**
 * TypeScript interfaces for reminders
 * Mirrors API contracts from ChurchRegister.ApiService/Models/Reminders
 */

// Reminder DTO matching API contract
export interface Reminder {
  id: number;
  description: string;
  dueDate: string; // ISO date string
  assignedToUserId: string;
  assignedToUserName: string;
  categoryId: number | null;
  categoryName: string | null;
  categoryColorHex: string | null;
  priority: boolean | null;
  status: 'Pending' | 'Completed';
  completionNotes: string | null;
  completedBy: string | null;
  completedDateTime: string | null; // ISO date string
  createdBy: string;
  createdDateTime: string; // ISO date string
  modifiedBy?: string;
  modifiedDateTime?: string; // ISO date string
  alertStatus: 'red' | 'amber' | 'none';
  daysUntilDue: number;
}

// Create Reminder Request matching API contract
export interface CreateReminderRequest {
  description: string;
  dueDate: string; // ISO date string
  assignedToUserId: string;
  categoryId: number | null;
  priority: boolean | null;
}

// Update Reminder Request matching API contract
export interface UpdateReminderRequest {
  description: string;
  dueDate: string; // ISO date string
  assignedToUserId: string;
  categoryId: number | null;
  priority: boolean | null;
}

// Complete Reminder Request matching API contract
export interface CompleteReminderRequest {
  completionNotes: string;
  createNext: boolean;
  nextInterval: '3months' | '6months' | '12months' | 'custom' | null;
  customDueDate: string | null; // ISO date string
}

// Complete Reminder Response matching API contract
export interface CompleteReminderResponse {
  completed: Reminder;
  nextReminder: Reminder | null;
}

// Reminder Query Parameters matching API contract
export interface ReminderQueryParameters {
  status?: string;
  assignedToUserId?: string;
  categoryId?: number;
  description?: string;
  showCompleted?: boolean;
}

// Dashboard Reminder Summary matching API contract
export interface DashboardReminderSummary {
  upcomingCount: number;
}
