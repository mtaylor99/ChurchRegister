/**
 * HSBC bank transaction data transfer object
 */
export interface HsbcTransaction {
  id: number;
  date: string;
  description: string;
  reference: string;
  moneyIn: number;
  createdBy: string;
  createdDateTime: string;
}

/**
 * Summary of upload results
 */
export interface HsbcUploadSummary {
  totalProcessed: number;
  newTransactions: number;
  duplicatesSkipped: number;
  ignoredNoMoneyIn: number;
}

/**
 * Summary of contribution processing results
 */
export interface ContributionProcessingSummary {
  matchedTransactions: number;
  unmatchedTransactions: number;
  totalAmountProcessed: number;
  unmatchedReferences: string[];
}

/**
 * Response for HSBC statement upload operation
 */
export interface UploadHsbcStatementResponse {
  success: boolean;
  message: string;
  summary?: HsbcUploadSummary;
  processingSummary?: ContributionProcessingSummary;
  errors?: string[];
}
