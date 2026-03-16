import { apiClient } from './ApiClient';
import type {
  Reminder,
  CreateReminderRequest,
  UpdateReminderRequest,
  CompleteReminderRequest,
  CompleteReminderResponse,
  ReminderQueryParameters,
  DashboardReminderSummary,
} from '../../types/reminders';

/**
 * Reminders API service for reminder management operations
 */
export class RemindersApi {
  private basePath = '/api/reminders';

  /**
   * Get reminders with optional filtering
   * Supports filtering by status, assignedToUserId, categoryId, description search, and showExpired flag
   */
  async getReminders(params: ReminderQueryParameters): Promise<Reminder[]> {
    const searchParams = new URLSearchParams();

    if (params.status) {
      searchParams.append('status', params.status);
    }

    if (params.assignedToUserId) {
      searchParams.append('assignedToUserId', params.assignedToUserId);
    }

    if (params.categoryId !== undefined) {
      searchParams.append('categoryId', params.categoryId.toString());
    }

    if (params.description) {
      searchParams.append('description', params.description);
    }

    if (params.showCompleted !== undefined) {
      searchParams.append('showCompleted', params.showCompleted.toString());
    }

    const queryString =
      searchParams.toString().length > 0 ? `?${searchParams.toString()}` : '';
    return apiClient.get<Reminder[]>(`${this.basePath}${queryString}`);
  }

  /**
   * Get reminder by ID
   */
  async getReminderById(id: number): Promise<Reminder> {
    return apiClient.get<Reminder>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new reminder
   * Status is automatically set to Pending
   */
  async createReminder(request: CreateReminderRequest): Promise<Reminder> {
    return apiClient.post<Reminder, CreateReminderRequest>(
      this.basePath,
      request
    );
  }

  /**
   * Update reminder
   * Cannot update reminders with Status='Completed'
   */
  async updateReminder(
    id: number,
    request: UpdateReminderRequest
  ): Promise<Reminder> {
    return apiClient.put<Reminder, UpdateReminderRequest>(
      `${this.basePath}/${id}`,
      request
    );
  }

  /**
   * Complete a reminder with completion notes
   * Optionally creates next reminder with specified interval (3/6/12 months or custom date)
   * Next reminder inherits description, assignedTo, category, and priority
   */
  async completeReminder(
    id: number,
    request: CompleteReminderRequest
  ): Promise<CompleteReminderResponse> {
    return apiClient.put<CompleteReminderResponse, CompleteReminderRequest>(
      `${this.basePath}/${id}/complete`,
      request
    );
  }

  /**
   * Delete reminder
   * Cannot delete reminders with Status='Completed'
   */
  async deleteReminder(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Get dashboard reminder summary
   * Returns count of pending reminders due within 60 days
   */
  async getDashboardSummary(): Promise<DashboardReminderSummary> {
    return apiClient.get<DashboardReminderSummary>(
      `${this.basePath}/dashboard-summary`
    );
  }
}

// Export singleton instance
export const remindersApi = new RemindersApi();
