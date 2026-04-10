import { describe, test, expect, vi, beforeEach } from 'vitest';
import { hsbcTransactionsApi } from './hsbcTransactionsApi';
import { apiClient } from './ApiClient';

vi.mock('./ApiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('hsbcTransactionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeFile = (name = 'statement.csv') => new File(['col1,col2\nval1,val2'], name, { type: 'text/csv' });

  describe('uploadHsbcStatement', () => {
    test('calls post on the upload endpoint with FormData', async () => {
      const mockResponse = { imported: 10, skipped: 0, errors: [] };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const file = makeFile();
      const result = await hsbcTransactionsApi.uploadHsbcStatement(file);

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/api/financial/hsbc-transactions/upload',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      );
      expect(result).toEqual(mockResponse);
    });

    test('calls onProgress callback via onUploadProgress', async () => {
      vi.mocked(apiClient.post).mockImplementation(async (_url, _body, config) => {
        const progressEvent = { loaded: 50, total: 100 } as import('axios').AxiosProgressEvent;
        config?.onUploadProgress?.(progressEvent);
        return { imported: 1, skipped: 0, errors: [] };
      });

      const onProgress = vi.fn();
      await hsbcTransactionsApi.uploadHsbcStatement(makeFile(), onProgress);
      expect(onProgress).toHaveBeenCalledWith(50);
    });

    test('does not call onProgress when total is missing', async () => {
      vi.mocked(apiClient.post).mockImplementation(async (_url, _body, config) => {
        const progressEvent = { loaded: 50, total: undefined } as import('axios').AxiosProgressEvent;
        config?.onUploadProgress?.(progressEvent);
        return { imported: 1, skipped: 0, errors: [] };
      });

      const onProgress = vi.fn();
      await hsbcTransactionsApi.uploadHsbcStatement(makeFile(), onProgress);
      expect(onProgress).not.toHaveBeenCalled();
    });

    test('returns error response data when API error has response.data', async () => {
      const errorData = { imported: 0, skipped: 0, errors: ['Parse error'], message: 'Bad file' };
      const axiosError = { response: { data: errorData }, message: 'Request failed' };
      vi.mocked(apiClient.post).mockRejectedValue(axiosError);

      const result = await hsbcTransactionsApi.uploadHsbcStatement(makeFile());
      expect(result).toEqual(errorData);
    });

    test('throws formatted error when no response data', async () => {
      const axiosError = { response: undefined, message: 'Network error' };
      vi.mocked(apiClient.post).mockRejectedValue(axiosError);

      await expect(hsbcTransactionsApi.uploadHsbcStatement(makeFile())).rejects.toThrow('Network error');
    });

    test('throws "Failed to upload file" when error has no message', async () => {
      vi.mocked(apiClient.post).mockRejectedValue({});

      await expect(hsbcTransactionsApi.uploadHsbcStatement(makeFile())).rejects.toThrow('Failed to upload file');
    });
  });
});
