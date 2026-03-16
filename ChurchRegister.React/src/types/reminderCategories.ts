/**
 * TypeScript interfaces for reminder categories
 * Mirrors API contracts from ChurchRegister.ApiService/Models/Reminders
 */

// Reminder Category DTO matching API contract
export interface ReminderCategory {
  id: number;
  name: string;
  colorHex: string | null;
  isSystemCategory: boolean;
  sortOrder: number;
  createdBy: string;
  createdDateTime: string; // ISO date string
  modifiedBy?: string;
  modifiedDateTime?: string; // ISO date string
  reminderCount: number;
}

// Create Reminder Category Request matching API contract
export interface CreateReminderCategoryRequest {
  name: string;
  colorHex: string | null;
}

// Update Reminder Category Request matching API contract
export interface UpdateReminderCategoryRequest {
  name: string;
  colorHex: string | null;
}
