// Districts types matching our API contracts

export interface District {
  id: number;
  name: string;
  deaconId?: number | null;
  deaconName?: string | null;
  districtOfficerId?: number | null;
  districtOfficerName?: string | null;
  memberCount: number;
}

export interface ChurchMemberSummary {
  id: number;
  fullName: string;
}

export interface AssignDistrictRequest {
  districtId: number | null;
}

export interface AssignDeaconRequest {
  deaconId: number | null;
}

export interface AssignDistrictOfficerRequest {
  districtOfficerId: number | null;
}
