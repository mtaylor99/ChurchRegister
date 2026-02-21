// Data Protection Consent Management types

/**
 * Status indicator for overall consent state
 */
export type DataProtectionStatus = 'all_granted' | 'partial' | 'all_denied';

/**
 * Data Protection Consent DTO matching API contract
 */
export interface DataProtection {
  id: number;
  churchMemberId: number;
  allowNameInCommunications: boolean;
  allowHealthStatusInCommunications: boolean;
  allowPhotoInCommunications: boolean;
  allowPhotoInSocialMedia: boolean;
  groupPhotos: boolean;
  permissionForMyChildren: boolean;
  modifiedBy: string;
  modifiedDateTime: string; // ISO date string
}

/**
 * Data Protection Summary DTO for grid display
 */
export interface DataProtectionSummary {
  status: DataProtectionStatus;
  allowNameInCommunications: boolean;
  allowHealthStatusInCommunications: boolean;
  allowPhotoInCommunications: boolean;
  allowPhotoInSocialMedia: boolean;
  groupPhotos: boolean;
  permissionForMyChildren: boolean;
  modifiedBy: string;
  modifiedDateTime: string; // ISO date string
}

/**
 * Update Data Protection Request for API
 */
export interface UpdateDataProtectionRequest {
  allowNameInCommunications: boolean;
  allowHealthStatusInCommunications: boolean;
  allowPhotoInCommunications: boolean;
  allowPhotoInSocialMedia: boolean;
  groupPhotos: boolean;
  permissionForMyChildren: boolean;
}
