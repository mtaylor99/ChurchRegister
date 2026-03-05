import { apiClient } from './ApiClient';
import type { UploadHsbcStatementResponse } from '../../types/hsbcTransactions';

/**
 * API client for HSBC transaction operations
 */
class HsbcTransactionsApi {
  private basePath = '/api/financial/hsbc-transactions';

  /**
   * Upload HSBC bank statement CSV file
   * @param file CSV file to upload
   * @param onProgress Optional callback for upload progress
   * @returns Upload response with summary
   */
  async uploadHsbcStatement(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<UploadHsbcStatementResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post<UploadHsbcStatementResponse>(
        `${this.basePath}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percent);
            }
          },
        }
      );

      // apiClient.post already returns response.data
      return response;
    } catch (error) {
      // If we have a response with our expected structure, return it
      const axiosError = error as {
        response?: {
          data?: UploadHsbcStatementResponse & { message?: string };
        };
        message?: string;
      };
      if (axiosError.response?.data) {
        return axiosError.response.data as UploadHsbcStatementResponse;
      }

      // Otherwise, throw a formatted error
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.message ||
          'Failed to upload file'
      );
    }
  }
}

export const hsbcTransactionsApi = new HsbcTransactionsApi();
