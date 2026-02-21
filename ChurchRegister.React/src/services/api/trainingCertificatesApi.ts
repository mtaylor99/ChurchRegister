import { apiClient } from './ApiClient';
import type {
  TrainingCertificateDto,
  TrainingCertificateGridQuery,
  CreateTrainingCertificateRequest,
  UpdateTrainingCertificateRequest,
  TrainingCertificateTypeDto,
  CreateTrainingCertificateTypeRequest,
  UpdateTrainingCertificateTypeRequest,
  TrainingCertificateGroupSummaryDto,
  PagedTrainingCertificatesResult,
} from '../../types/trainingCertificates';

/**
 * Training Certificates API service for training certificate management operations
 */
export class TrainingCertificatesApi {
  private basePath = '/api/training-certificates';
  private typesPath = '/api/training-certificate-types';
  private dashboardPath = '/api/dashboard/training-summary';

  /**
   * Get training certificates with pagination, search, and filtering
   */
  async getTrainingCertificates(
    query: TrainingCertificateGridQuery
  ): Promise<PagedTrainingCertificatesResult> {
    const params = new URLSearchParams();
    params.append('page', query.page.toString());
    params.append('pageSize', query.pageSize.toString());
    params.append('sortBy', query.sortBy);
    params.append('sortDirection', query.sortDirection);
    params.append('expiringWithinDays', query.expiringWithinDays.toString());

    if (query.name) {
      params.append('name', query.name);
    }

    if (query.status) {
      params.append('status', query.status);
    }

    if (query.typeId !== undefined) {
      params.append('typeId', query.typeId.toString());
    }

    return apiClient.get<PagedTrainingCertificatesResult>(
      `${this.basePath}?${params.toString()}`
    );
  }

  /**
   * Get training certificate by ID
   */
  async getTrainingCertificateById(
    certificateId: number
  ): Promise<TrainingCertificateDto> {
    return apiClient.get<TrainingCertificateDto>(
      `${this.basePath}/${certificateId}`
    );
  }

  /**
   * Create a new training certificate
   */
  async createTrainingCertificate(
    request: CreateTrainingCertificateRequest
  ): Promise<TrainingCertificateDto> {
    return apiClient.post<
      TrainingCertificateDto,
      CreateTrainingCertificateRequest
    >(this.basePath, request);
  }

  /**
   * Update training certificate information
   */
  async updateTrainingCertificate(
    certificateId: number,
    request: Omit<UpdateTrainingCertificateRequest, 'id'>
  ): Promise<TrainingCertificateDto> {
    return apiClient.put<
      TrainingCertificateDto,
      Omit<UpdateTrainingCertificateRequest, 'id'>
    >(`${this.basePath}/${certificateId}`, request);
  }

  /**
   * Get all training certificate types with optional status filter
   */
  async getTrainingCertificateTypes(
    statusFilter?: string
  ): Promise<TrainingCertificateTypeDto[]> {
    const params = new URLSearchParams();
    if (statusFilter) {
      params.append('statusFilter', statusFilter);
    }

    const queryString = params.toString();
    const url = queryString ? `${this.typesPath}?${queryString}` : this.typesPath;

    return apiClient.get<TrainingCertificateTypeDto[]>(url);
  }

  /**
   * Create a new training certificate type
   */
  async createTrainingCertificateType(
    request: CreateTrainingCertificateTypeRequest
  ): Promise<TrainingCertificateTypeDto> {
    return apiClient.post<
      TrainingCertificateTypeDto,
      CreateTrainingCertificateTypeRequest
    >(this.typesPath, request);
  }

  /**
   * Update training certificate type (edit only, no delete)
   */
  async updateTrainingCertificateType(
    typeId: number,
    request: Omit<UpdateTrainingCertificateTypeRequest, 'id'>
  ): Promise<TrainingCertificateTypeDto> {
    return apiClient.put<
      TrainingCertificateTypeDto,
      Omit<UpdateTrainingCertificateTypeRequest, 'id'>
    >(`${this.typesPath}/${typeId}`, request);
  }

  /**
   * Get dashboard training summary with grouped alerts (5+ members threshold)
   */
  async getDashboardTrainingSummary(): Promise<
    TrainingCertificateGroupSummaryDto[]
  > {
    return apiClient.get<TrainingCertificateGroupSummaryDto[]>(
      this.dashboardPath
    );
  }
}

// Export a singleton instance
export const trainingCertificatesApi = new TrainingCertificatesApi();
