import { apiClient } from '../services/api/ApiClient';

/**
 * Download individual monthly report PDFs
 * Note: Attendance Analytics is generated client-side from charts
 */

export const getPastoralCareReport = async (): Promise<Blob> => {
  return apiClient.getBlob('/api/reports/monthly-pack/pastoral-care');
};

export const getTrainingReport = async (): Promise<Blob> => {
  return apiClient.getBlob('/api/reports/monthly-pack/training');
};

export const getRiskAssessmentsReport = async (): Promise<Blob> => {
  return apiClient.getBlob('/api/reports/monthly-pack/risk-assessments');
};

export const getRemindersReport = async (): Promise<Blob> => {
  return apiClient.getBlob('/api/reports/monthly-pack/reminders');
};

export default {
  getPastoralCareReport,
  getTrainingReport,
  getRiskAssessmentsReport,
  getRemindersReport,
};
