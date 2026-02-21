import { apiClient } from './ApiClient';
import type {
  ReminderCategory,
  CreateReminderCategoryRequest,
  UpdateReminderCategoryRequest,
} from '../../types/reminderCategories';

/**
 * Reminder Categories API service for category management operations
 */
export class ReminderCategoriesApi {
  private basePath = '/api/reminder-categories';

  /**
   * Get all reminder categories ordered by sortOrder
   * Returns categories with their reminder counts
   */
  async getCategories(): Promise<ReminderCategory[]> {
    return apiClient.get<ReminderCategory[]>(this.basePath);
  }

  /**
   * Get reminder category by ID
   */
  async getCategoryById(id: number): Promise<ReminderCategory> {
    return apiClient.get<ReminderCategory>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new reminder category
   * Name must be unique (case-insensitive)
   * ColorHex must be valid #RRGGBB format if provided
   */
  async createCategory(
    request: CreateReminderCategoryRequest
  ): Promise<ReminderCategory> {
    return apiClient.post<ReminderCategory, CreateReminderCategoryRequest>(
      this.basePath,
      request
    );
  }

  /**
   * Update reminder category
   * Cannot rename system categories
   * Name must be unique (case-insensitive)
   * ColorHex must be valid #RRGGBB format if provided
   */
  async updateCategory(
    id: number,
    request: UpdateReminderCategoryRequest
  ): Promise<ReminderCategory> {
    return apiClient.put<ReminderCategory, UpdateReminderCategoryRequest>(
      `${this.basePath}/${id}`,
      request
    );
  }

  /**
   * Delete reminder category
   * Cannot delete system categories
   * Cannot delete categories with reminders (reminderCount > 0)
   */
  async deleteCategory(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

// Export singleton instance
export const reminderCategoriesApi = new ReminderCategoriesApi();
