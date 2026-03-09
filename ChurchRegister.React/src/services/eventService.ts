import { apiClient } from './api/ApiClient';

// Event types
export interface Event {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  showInAnalysis: boolean;
  dayOfWeek?: number; // 0=Sunday through 6=Saturday, null=no restriction
  createdBy: string;
  createdDateTime: string;
  modifiedBy?: string;
  modifiedDateTime?: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  isActive: boolean;
  showInAnalysis: boolean;
  dayOfWeek?: number; // 0=Sunday through 6=Saturday, null=no restriction
}

export interface UpdateEventRequest {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  showInAnalysis: boolean;
  dayOfWeek?: number; // 0=Sunday through 6=Saturday, null=no restriction
}

/**
 * Event service for managing church events
 */
export class EventService {
  private basePath = '/api/events';

  /**
   * Get all events
   */
  async getEvents(): Promise<Event[]> {
    return apiClient.get<Event[]>(this.basePath);
  }

  /**
   * Get active events only
   */
  async getActiveEvents(): Promise<Event[]> {
    const allEvents = await this.getEvents();
    return allEvents.filter((event) => event.isActive);
  }

  /**
   * Get events that should show in analysis
   */
  async getAnalysisEvents(): Promise<Event[]> {
    const allEvents = await this.getEvents();
    return allEvents.filter((event) => event.isActive && event.showInAnalysis);
  }

  /**
   * Get a specific event by ID
   */
  async getEvent(id: number): Promise<Event | null> {
    try {
      const events = await this.getEvents();
      return events.find((event) => event.id === id) || null;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(request: CreateEventRequest): Promise<void> {
    return apiClient.post<void>(this.basePath, request);
  }

  /**
   * Update an existing event
   */
  async updateEvent(request: UpdateEventRequest): Promise<void> {
    return apiClient.put<void>(`${this.basePath}/${request.id}`, request);
  }

  /**
   * Toggle event active status
   */
  async toggleEventStatus(id: number): Promise<void> {
    const event = await this.getEvent(id);
    if (!event) {
      throw new Error('Event not found');
    }

    const updateRequest: UpdateEventRequest = {
      ...event,
      isActive: !event.isActive,
    };

    return this.updateEvent(updateRequest);
  }

  /**
   * Toggle event analysis visibility
   */
  async toggleAnalysisVisibility(id: number): Promise<void> {
    const event = await this.getEvent(id);
    if (!event) {
      throw new Error('Event not found');
    }

    const updateRequest: UpdateEventRequest = {
      ...event,
      showInAnalysis: !event.showInAnalysis,
    };

    return this.updateEvent(updateRequest);
  }

  /**
   * Search events by name
   */
  async searchEvents(searchTerm: string): Promise<Event[]> {
    const allEvents = await this.getEvents();
    const term = searchTerm.toLowerCase();

    return allEvents.filter(
      (event) =>
        event.name.toLowerCase().includes(term) ||
        (event.description && event.description.toLowerCase().includes(term))
    );
  }

  /**
   * Get events with recent attendance activity
   */
  async getEventsWithRecentActivity(): Promise<Event[]> {
    // This would typically be enhanced with actual attendance data
    // For now, just return active events
    return this.getActiveEvents();
  }

  /**
   * Validate event name uniqueness
   */
  async isEventNameUnique(name: string, excludeId?: number): Promise<boolean> {
    const events = await this.getEvents();
    return !events.some(
      (event) =>
        event.name.toLowerCase() === name.toLowerCase() &&
        event.id !== excludeId
    );
  }
}

// Create and export singleton instance
export const eventService = new EventService();
