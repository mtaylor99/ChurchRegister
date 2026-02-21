// Church Members types matching our API contracts

import type { DataProtectionSummary } from './dataProtection';

// Church Member Role DTO matching API contract
export interface ChurchMemberRoleDto {
  id: number;
  type: string;
}

// Church Member Status DTO matching API contract
export interface ChurchMemberStatusDto {
  id: number;
  name: string;
}

// Address DTO matching API contract
export interface AddressDto {
  id?: number;
  nameNumber?: string;
  addressLineOne?: string;
  addressLineTwo?: string;
  town?: string;
  county?: string;
  postcode?: string;
}

// Church Member DTO matching API contract (for list views)
export interface ChurchMemberDto {
  id: number;
  title?: string;
  firstName: string;
  lastName: string;
  fullName: string; // Computed property
  email?: string;
  phone?: string;
  memberNumber?: string; // Current year member/envelope number
  memberSince?: string; // ISO date string
  status: string;
  statusId?: number;
  roles: string[];
  baptised: boolean;
  giftAid: boolean;
  pastoralCareRequired: boolean;
  thisYearsContribution: number;
  districtId?: number | null;
  districtName?: string | null;
  dataProtectionId?: number | null;
  dataProtection?: DataProtectionSummary | null;
  createdAt: string; // ISO date string
  lastModified?: string; // ISO date string
}

// Church Member Detail DTO matching API contract (for detailed views)
export interface ChurchMemberDetailDto {
  id: number;
  title?: string;
  firstName: string;
  lastName: string;
  fullName: string; // Computed property
  email?: string;
  phone?: string;
  bankReference?: string;
  memberSince?: string; // ISO date string
  status: string;
  statusId?: number;
  roles: ChurchMemberRoleDto[];
  baptised: boolean;
  giftAid: boolean;
  pastoralCareRequired: boolean;
  address?: AddressDto;
  districtId?: number | null;
  districtName?: string | null;
  dataProtectionId?: number | null;
  dataProtection?: DataProtectionSummary | null;
  createdAt: string; // ISO date string
  lastModified?: string; // ISO date string
  createdBy: string;
  modifiedBy?: string;
}

// Church Member Grid Query matching API contract
export interface ChurchMemberGridQuery {
  page: number;
  pageSize: number;
  searchTerm?: string;
  statusFilter?: number;
  roleFilter?: number;
  districtFilter?: number;
  unassignedDistrictFilter?: boolean;
  baptisedFilter?: boolean;
  giftAidFilter?: boolean;
  pastoralCareRequired?: boolean;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

// Create Church Member Request matching API contract
export interface CreateChurchMemberRequest {
  title?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  bankReference?: string;
  memberSince: string; // ISO date string
  statusId: number;
  baptised: boolean;
  giftAid: boolean;
  pastoralCareRequired: boolean;
  address?: AddressDto;
  roleIds: number[];
}

// Update Church Member Request matching API contract
export interface UpdateChurchMemberRequest {
  id: number;
  title?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  bankReference?: string;
  memberSince: string; // ISO date string
  statusId: number;
  baptised: boolean;
  giftAid: boolean;
  pastoralCareRequired: boolean;
  address?: AddressDto;
  roleIds: number[];
}

// Update Church Member Status Request matching API contract
export interface UpdateChurchMemberStatusRequest {
  statusId: number;
  note?: string;
}

// Create Church Member Response matching API contract
export interface CreateChurchMemberResponse {
  id: number;
  message: string;
  member?: ChurchMemberDetailDto;
}

// ==== Pastoral Care Types ====

// Pastoral Care Member DTO for PDFreport
export interface PastoralCareMemberDto {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string; // Computed property - will be `${firstName} ${lastName}`
}

// Pastoral Care District DTO for PDF report
export interface PastoralCareDistrictDto {
  districtName: string;
  deaconName: string;
  members: PastoralCareMemberDto[];
}

// Pastoral Care Report DTO for PDF export
export interface PastoralCareReportDto {
  districts: PastoralCareDistrictDto[];
  totalMembers: number;
  generatedDate: string; // ISO date string
}

// ==== UI-specific types for forms and components ====
export interface ChurchMemberFormData {
  title?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  bankReference?: string;
  memberSince: Date | null;
  statusId: number;
  baptised: boolean;
  giftAid: boolean;
  pastoralCareRequired: boolean;
  address?: AddressDto;
  roleIds: number[];
}

export interface ChurchMemberGridFilters {
  searchTerm: string;
  statusFilter?: number;
  roleFilter?: number;
  baptisedFilter?: boolean;
  giftAidFilter?: boolean;
}

export interface ChurchMemberGridSorting {
  field: string;
  direction: 'asc' | 'desc';
}

// Status display configuration
export interface ChurchMemberStatusConfig {
  label: string;
  color: 'success' | 'error' | 'warning' | 'info' | 'default';
  icon: string;
}

// Predefined status configurations (will be populated from API)
export const getChurchMemberStatusConfig = (
  statusName: string
): ChurchMemberStatusConfig => {
  const configs: Record<string, ChurchMemberStatusConfig> = {
    Active: {
      label: 'Active',
      color: 'success',
      icon: 'CheckCircle',
    },
    Inactive: {
      label: 'Inactive',
      color: 'default',
      icon: 'Cancel',
    },
    InActive: {
      label: 'Inactive',
      color: 'default',
      icon: 'Cancel',
    },
    Expired: {
      label: 'Expired',
      color: 'warning',
      icon: 'Warning',
    },
    'In Glory': {
      label: 'In Glory',
      color: 'info',
      icon: 'Stars',
    },
  };

  return (
    configs[statusName] || {
      label: statusName,
      color: 'default',
      icon: 'Circle',
    }
  );
};
