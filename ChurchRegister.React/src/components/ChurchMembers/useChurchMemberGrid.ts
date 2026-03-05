import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { churchMembersApi } from '@services/api';
import type {
  ChurchMemberDto,
  ChurchMemberDetailDto,
  ChurchMemberGridQuery,
} from '../../types/churchMembers';
import { useRBAC } from '../../hooks/useRBAC';
import { useDistricts } from '../../hooks/useDistricts';
import { PERMISSIONS } from '../../utils/rbac';

export interface ChurchMemberGridProps {
  onEditMember?: (member: ChurchMemberDetailDto) => void;
  onViewMember?: (member: ChurchMemberDetailDto) => void;
  initialQuery?: Partial<ChurchMemberGridQuery>;
}

export function useChurchMemberGrid({
  onEditMember,
  onViewMember,
  initialQuery,
}: ChurchMemberGridProps) {
  const queryClient = useQueryClient();

  // RBAC
  const { hasPermission } = useRBAC();
  const canManageChurchMembers = hasPermission(PERMISSIONS.CHURCH_MEMBERS_EDIT);

  // Pagination & sort state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: initialQuery?.page ? initialQuery.page - 1 : 0,
    pageSize: initialQuery?.pageSize || 20,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: initialQuery?.sortBy || 'memberNumber',
      sort: (initialQuery?.sortDirection || 'asc') as 'asc' | 'desc',
    },
  ]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState(initialQuery?.searchTerm || '');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(
    initialQuery?.statusFilter
  );
  const [roleFilter, setRoleFilter] = useState<number | undefined>(
    initialQuery?.roleFilter
  );
  const [baptisedFilter, setBaptisedFilter] = useState<boolean | undefined>(
    initialQuery?.baptisedFilter
  );
  const [giftAidFilter, setGiftAidFilter] = useState<boolean | undefined>(
    initialQuery?.giftAidFilter
  );
  const [districtFilter, setDistrictFilter] = useState<number | undefined>(
    initialQuery?.districtFilter
  );
  const [unassignedDistrictFilter, setUnassignedDistrictFilter] = useState<
    boolean | undefined
  >(initialQuery?.unassignedDistrictFilter);
  const [pastoralCareFilter, setPastoralCareFilter] = useState<
    boolean | undefined
  >(initialQuery?.pastoralCareRequired);

  // Composed query
  const [searchQuery, setSearchQuery] = useState<ChurchMemberGridQuery>({
    page: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    searchTerm: initialQuery?.searchTerm,
    statusFilter: initialQuery?.statusFilter,
    roleFilter: initialQuery?.roleFilter,
    baptisedFilter: initialQuery?.baptisedFilter,
    giftAidFilter: initialQuery?.giftAidFilter,
    districtFilter: initialQuery?.districtFilter,
    unassignedDistrictFilter: initialQuery?.unassignedDistrictFilter,
    pastoralCareRequired: initialQuery?.pastoralCareRequired,
    sortBy: sortModel[0]?.field || 'memberNumber',
    sortDirection: sortModel[0]?.sort || 'asc',
  });

  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<ChurchMemberDto | null>(
    null
  );

  // Drawer states
  const [dataProtectionDrawer, setDataProtectionDrawer] = useState<{
    open: boolean;
    member: ChurchMemberDetailDto | null;
  }>({ open: false, member: null });

  const [assignDistrictDrawer, setAssignDistrictDrawer] = useState<{
    open: boolean;
    member: ChurchMemberDetailDto | null;
  }>({ open: false, member: null });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<ChurchMemberDto | null>(
    null
  );

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['churchMembers', searchQuery],
    queryFn: () => churchMembersApi.getChurchMembers(searchQuery),
    placeholderData: (previousData) => previousData,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['churchMemberRoles'],
    queryFn: () => churchMembersApi.getRoles(),
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['churchMemberStatuses'],
    queryFn: () => churchMembersApi.getStatuses(),
  });

  const { data: districts = [] } = useDistricts();

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updatePastoralCareStatusMutation = useMutation({
    mutationFn: ({
      memberId,
      pastoralCareRequired,
    }: {
      memberId: number;
      pastoralCareRequired: boolean;
    }) =>
      churchMembersApi.getChurchMemberById(memberId).then((member) =>
        churchMembersApi.updateChurchMember(memberId, {
          title: member.title,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          bankReference: member.bankReference,
          memberSince: member.memberSince || new Date().toISOString(),
          statusId: member.statusId || 1,
          baptised: member.baptised,
          giftAid: member.giftAid,
          envelopes: member.envelopes,
          pastoralCareRequired,
          address: member.address,
          roleIds: member.roles.map((r) => r.id),
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churchMembers'] });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (memberId: number) =>
      churchMembersApi.deleteChurchMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churchMembers'] });
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);

      const timeoutId = setTimeout(() => {
        setSearchQuery((prev) => ({
          ...prev,
          searchTerm: value || undefined,
          page: 1,
        }));
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 500);

      return () => clearTimeout(timeoutId);
    },
    []
  );

  const handleFilterChange = useCallback(() => {
    setSearchQuery((prev) => ({
      ...prev,
      statusFilter,
      roleFilter,
      baptisedFilter,
      giftAidFilter,
      districtFilter,
      unassignedDistrictFilter,
      pastoralCareRequired: pastoralCareFilter,
      page: 1,
    }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [
    statusFilter,
    roleFilter,
    baptisedFilter,
    giftAidFilter,
    districtFilter,
    unassignedDistrictFilter,
    pastoralCareFilter,
  ]);

  // Apply filters when they change
  React.useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setRoleFilter(undefined);
    setBaptisedFilter(undefined);
    setGiftAidFilter(undefined);
    setDistrictFilter(undefined);
    setUnassignedDistrictFilter(undefined);
    setPastoralCareFilter(undefined);
    setSearchQuery((prev) => ({
      ...prev,
      searchTerm: undefined,
      statusFilter: undefined,
      roleFilter: undefined,
      baptisedFilter: undefined,
      giftAidFilter: undefined,
      districtFilter: undefined,
      unassignedDistrictFilter: undefined,
      pastoralCareRequired: undefined,
      page: 1,
    }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      searchTerm ||
      statusFilter !== undefined ||
      roleFilter !== undefined ||
      baptisedFilter !== undefined ||
      giftAidFilter !== undefined ||
      districtFilter !== undefined ||
      unassignedDistrictFilter !== undefined ||
      pastoralCareFilter !== undefined,
    [
      searchTerm,
      statusFilter,
      roleFilter,
      baptisedFilter,
      giftAidFilter,
      districtFilter,
      unassignedDistrictFilter,
      pastoralCareFilter,
    ]
  );

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModel(model);
      setSearchQuery((prev) => ({
        ...prev,
        page: model.page + 1,
        pageSize: model.pageSize,
      }));
    },
    []
  );

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    setSortModel(model);
    const sort = model[0];
    if (sort) {
      setSearchQuery((prev) => ({
        ...prev,
        sortBy: sort.field,
        sortDirection: sort.sort || 'asc',
      }));
    }
  }, []);

  const handleActionMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, member: ChurchMemberDto) => {
      setActionMenuAnchorEl(event.currentTarget);
      setSelectedMember(member);
    },
    []
  );

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchorEl(null);
    setSelectedMember(null);
  }, []);

  const handleViewMember = useCallback(
    async (member: ChurchMemberDto) => {
      handleActionMenuClose();
      const details = await churchMembersApi.getChurchMemberById(member.id);
      onViewMember?.(details);
    },
    [onViewMember, handleActionMenuClose]
  );

  const handleEditMember = useCallback(
    async (member: ChurchMemberDto) => {
      handleActionMenuClose();
      const details = await churchMembersApi.getChurchMemberById(member.id);
      onEditMember?.(details);
    },
    [onEditMember, handleActionMenuClose]
  );

  const handleManageDataProtection = useCallback(
    async (member: ChurchMemberDto) => {
      handleActionMenuClose();
      const fullMember = await churchMembersApi.getChurchMemberById(member.id);
      setDataProtectionDrawer({ open: true, member: fullMember });
    },
    [handleActionMenuClose]
  );

  const handleDataProtectionSuccess = useCallback(() => {
    setDataProtectionDrawer({ open: false, member: null });
  }, []);

  const handleAssignDistrict = useCallback(
    async (member: ChurchMemberDto) => {
      handleActionMenuClose();
      const fullMember = await churchMembersApi.getChurchMemberById(member.id);
      setAssignDistrictDrawer({ open: true, member: fullMember });
    },
    [handleActionMenuClose]
  );

  const handleAssignDistrictSuccess = useCallback(() => {
    setAssignDistrictDrawer({ open: false, member: null });
  }, []);

  const handleMarkPastoralCareRequired = useCallback(
    (member: ChurchMemberDto, required: boolean) => {
      handleActionMenuClose();
      updatePastoralCareStatusMutation.mutate({
        memberId: member.id,
        pastoralCareRequired: required,
      });
    },
    [handleActionMenuClose, updatePastoralCareStatusMutation]
  );

  const handleDeleteMember = useCallback(
    (member: ChurchMemberDto) => {
      handleActionMenuClose();
      setMemberToDelete(member);
      setDeleteDialogOpen(true);
    },
    [handleActionMenuClose]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (memberToDelete) {
      deleteMemberMutation.mutate(memberToDelete.id);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  }, [memberToDelete, deleteMemberMutation]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  }, []);

  const handleDistrictFilterChange = useCallback((value: string) => {
    if (value === 'unassigned') {
      setDistrictFilter(undefined);
      setUnassignedDistrictFilter(true);
    } else if (value === '') {
      setDistrictFilter(undefined);
      setUnassignedDistrictFilter(undefined);
    } else {
      setDistrictFilter(Number(value));
      setUnassignedDistrictFilter(undefined);
    }
  }, []);

  return {
    // RBAC
    canManageChurchMembers,

    // Grid state
    paginationModel,
    sortModel,
    searchTerm,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    baptisedFilter,
    setBaptisedFilter,
    giftAidFilter,
    setGiftAidFilter,
    districtFilter,
    unassignedDistrictFilter,
    pastoralCareFilter,
    setPastoralCareFilter,
    hasActiveFilters,

    // Remote data
    membersResponse,
    isLoadingMembers,
    roles,
    statuses,
    districts,

    // Mutation state
    isDeleting: deleteMemberMutation.isPending,

    // UI state
    actionMenuAnchorEl,
    selectedMember,
    dataProtectionDrawer,
    assignDistrictDrawer,
    deleteDialogOpen,
    memberToDelete,

    // Handlers
    handleSearchChange,
    handleClearAllFilters,
    handlePaginationModelChange,
    handleSortModelChange,
    handleActionMenuOpen,
    handleActionMenuClose,
    handleViewMember,
    handleEditMember,
    handleManageDataProtection,
    handleDataProtectionSuccess,
    handleAssignDistrict,
    handleAssignDistrictSuccess,
    handleMarkPastoralCareRequired,
    handleDeleteMember,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleDistrictFilterChange,
    setDataProtectionDrawer,
    setAssignDistrictDrawer,
  };
}
