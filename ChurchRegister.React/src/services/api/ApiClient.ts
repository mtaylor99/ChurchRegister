import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { tokenService } from '../auth/tokenService';
import { logger, notificationManager } from '../../utils';
import { env } from '../../config/env';

// API Configuration
const API_BASE_URL = env.VITE_API_BASE_URL;

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PagedResponse<T> {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * API Client with automatic error handling and toast notifications
 *
 * Features:
 * - Automatic authentication token injection
 * - Global error interceptor that displays toast notifications for API errors
 * - Supports validation error format: { message: string, errors: string[] }
 * - Handles 401 redirects to unauthorized page
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: env.VITE_API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling common errors
    this.client.interceptors.response.use(
      (response) => {
        // Log API responses for debugging
        if (env.VITE_DEBUG_MODE) {
          logger.info(`API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, response.data);
        }
        return response;
      },
      async (error) => {
        // Extract and display error messages
        this.handleErrorResponse(error);

        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to unauthorized page WITHOUT clearing tokens
          // The user is logged in but doesn't have permission for this resource
          logger.info('401 Unauthorized - redirecting to unauthorized page');
          window.location.href = '/error/unauthorized';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle error responses and show toast notifications
   */
  private handleErrorResponse(error: any): void {
    if (!error.response) {
      // Network error or no response
      notificationManager.showError(
        'Network error. Please check your connection.'
      );
      return;
    }

    const { status, data } = error.response;

    // Handle validation errors with the specific format: { message: string, errors: string[] }
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      // Show each validation error as a separate toast
      data.errors.forEach((errorMsg: string) => {
        notificationManager.showError(errorMsg);
      });
      return;
    }

    // Handle other error formats
    if (data?.message) {
      notificationManager.showError(data.message);
      return;
    }

    // Fallback error messages based on status code
    switch (status) {
      case 400:
        notificationManager.showError(
          'Invalid request. Please check your input.'
        );
        break;
      case 403:
        notificationManager.showError(
          'You do not have permission to perform this action.'
        );
        break;
      case 404:
        notificationManager.showError('The requested resource was not found.');
        break;
      case 500:
        notificationManager.showError(
          'A server error occurred. Please try again later.'
        );
        break;
      default:
        notificationManager.showError('An unexpected error occurred.');
    }
  }

  private getAuthToken(): string | null {
    return tokenService.getAccessToken();
  }

  private clearAuthToken(): void {
    tokenService.clearTokens();
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(
      url,
      data,
      config
    );
    return response.data;
  }

  async put<T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(
      url,
      data,
      config
    );
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  // Download file as Blob
  async getBlob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });
    return response.data;
  }

  // Authentication methods
  clearToken(): void {
    this.clearAuthToken();
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Helper methods for external use
  getBaseUrl(): string {
    return API_BASE_URL;
  }

  getToken(): string | null {
    return this.getAuthToken();
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;
