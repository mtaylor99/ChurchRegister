import { apiClient } from './ApiClient';
import type {
  RiskAssessment,
  RiskAssessmentDetail,
  RiskAssessmentCategory,
  RiskAssessmentHistory,
  CreateRiskAssessmentRequest,
  UpdateRiskAssessmentRequest,
  ApproveRiskAssessmentRequest,
  ApproveRiskAssessmentResponse,
  DashboardRiskAssessmentSummary,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../types/riskAssessments';

/**
 * Risk Assessments API service for risk assessment management operations
 */
export class RiskAssessmentsApi {
  private basePath = '/api/risk-assessments';
  private categoriesPath = '/api/risk-assessment-categories';

  /**
   * Get risk assessments with optional filtering
   * Supports filtering by categoryId, status, overdueOnly flag, and title
   */
  async getRiskAssessments(
    categoryId?: number | null,
    status?: string | null,
    overdueOnly?: boolean,
    title?: string | null
  ): Promise<RiskAssessment[]> {
    const searchParams = new URLSearchParams();

    if (categoryId !== undefined && categoryId !== null) {
      searchParams.append('categoryId', categoryId.toString());
    }

    if (status) {
      searchParams.append('status', status);
    }

    if (overdueOnly !== undefined) {
      searchParams.append('overdueOnly', overdueOnly.toString());
    }

    if (title) {
      searchParams.append('title', title);
    }

    const queryString =
      searchParams.toString().length > 0 ? `?${searchParams.toString()}` : '';
    return apiClient.get<RiskAssessment[]>(`${this.basePath}${queryString}`);
  }

  /**
   * Get risk assessment by ID with full details including approvals
   */
  async getRiskAssessmentById(id: number): Promise<RiskAssessmentDetail> {
    return apiClient.get<RiskAssessmentDetail>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new risk assessment
   * Initial status will be "Under Review" with next review date calculated from interval
   */
  async createRiskAssessment(
    request: CreateRiskAssessmentRequest
  ): Promise<RiskAssessment> {
    return apiClient.post<RiskAssessment, CreateRiskAssessmentRequest>(
      this.basePath,
      request
    );
  }

  /**
   * Get risk assessment history with review cycles and approvals
   */
  async getAssessmentHistory(id: number): Promise<RiskAssessmentHistory> {
    return apiClient.get<RiskAssessmentHistory>(
      `${this.basePath}/${id}/history`
    );
  }

  /**
   * Update risk assessment
   * Cannot change CategoryId. Changes to critical fields clear approvals.
   */
  async updateRiskAssessment(
    id: number,
    request: UpdateRiskAssessmentRequest
  ): Promise<RiskAssessment> {
    return apiClient.put<RiskAssessment, UpdateRiskAssessmentRequest>(
      `${this.basePath}/${id}`,
      request
    );
  }

  /**
   * Start a new review cycle
   * Sets status to "Under Review" and clears all approvals
   */
  async startReview(id: number): Promise<RiskAssessment> {
    return apiClient.post<RiskAssessment, object>(
      `${this.basePath}/${id}/start-review`,
      {}
    );
  }

  /**
   * Approve a risk assessment
   * Records deacon approval. Auto-activates when minimum approvals met.
   */
  async approveRiskAssessment(
    id: number,
    request: ApproveRiskAssessmentRequest
  ): Promise<ApproveRiskAssessmentResponse> {
    return apiClient.post<
      ApproveRiskAssessmentResponse,
      ApproveRiskAssessmentRequest
    >(`${this.basePath}/${id}/approve`, request);
  }

  /**
   * Get dashboard summary statistics
   * Returns overdue count, due soon count, and total count
   */
  async getDashboardSummary(): Promise<DashboardRiskAssessmentSummary> {
    return apiClient.get<DashboardRiskAssessmentSummary>(
      `${this.basePath}/dashboard-summary`
    );
  }

  /**
   * Get all risk assessment categories
   * Returns categories ordered alphabetically by name
   */
  async getCategories(): Promise<RiskAssessmentCategory[]> {
    return apiClient.get<RiskAssessmentCategory[]>(this.categoriesPath);
  }

  /**
   * Get risk assessment category by ID
   */
  async getCategoryById(id: number): Promise<RiskAssessmentCategory> {
    return apiClient.get<RiskAssessmentCategory>(`${this.categoriesPath}/${id}`);
  }

  /**
   * Create a new risk assessment category
   */
  async createCategory(request: CreateCategoryRequest): Promise<RiskAssessmentCategory> {
    return apiClient.post<RiskAssessmentCategory, CreateCategoryRequest>(
      this.categoriesPath,
      request
    );
  }

  /**
   * Update an existing risk assessment category
   */
  async updateCategory(
    id: number,
    request: UpdateCategoryRequest
  ): Promise<RiskAssessmentCategory> {
    return apiClient.put<RiskAssessmentCategory, UpdateCategoryRequest>(
      `${this.categoriesPath}/${id}`,
      request
    );
  }

  /**
   * Delete a risk assessment category
   * Returns error if category has associated risk assessments
   */
  async deleteCategory(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.categoriesPath}/${id}`);
  }
}

// Export singleton instance
export const riskAssessmentsApi = new RiskAssessmentsApi();
