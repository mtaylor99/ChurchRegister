import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormHelperText,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  AccountBalance as FinancialIcon,
  EventAvailable as AttendanceIcon,
  Person as MemberIcon,
  Email as CommunicationIcon,
} from '@mui/icons-material';
import type { SystemRoleDto } from '../../types/administration';

export interface RoleHierarchySelectorProps {
  selectedRoles: string[];
  onRoleChange: (roles: string[]) => void;
  availableRoles: SystemRoleDto[];
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  size?: 'small' | 'medium';
}

// Role hierarchy definition
const roleHierarchy: Record<string, string[]> = {
  SystemAdministration: [
    'FinancialAdministration',
    'AttendanceAdministration',
    'MemberAdministration',
    'CommunicationAdministration',
  ],
  FinancialAdministration: ['FinancialUser'],
  AttendanceAdministration: ['AttendanceUser'],
  MemberAdministration: ['MemberUser'],
  CommunicationAdministration: ['CommunicationUser'],
};

const roleIcons: Record<string, React.ReactElement> = {
  SystemAdministration: <AdminIcon />,
  FinancialAdministration: <FinancialIcon />,
  AttendanceAdministration: <AttendanceIcon />,
  MemberAdministration: <MemberIcon />,
  CommunicationAdministration: <CommunicationIcon />,
};

export const RoleHierarchySelector: React.FC<RoleHierarchySelectorProps> = ({
  selectedRoles,
  onRoleChange,
  availableRoles,
  error,
  helperText,
  disabled = false,
  required = false,
  label = 'Roles',
  size = 'medium',
}) => {
  const [internalSelectedRoles, setInternalSelectedRoles] =
    useState<string[]>(selectedRoles);

  useEffect(() => {
    setInternalSelectedRoles(selectedRoles);
  }, [selectedRoles]);

  // Get all roles that should be automatically selected based on hierarchy
  const getImpliedRoles = (roles: string[]): string[] => {
    const implied = new Set<string>();

    roles.forEach((role) => {
      implied.add(role);
      const childRoles = roleHierarchy[role];
      if (childRoles) {
        childRoles.forEach((childRole) => {
          implied.add(childRole);
          // Recursively add child roles
          const nestedChildren = getImpliedRoles([childRole]);
          nestedChildren.forEach((nested) => implied.add(nested));
        });
      }
    });

    return Array.from(implied);
  };

  // Get roles that should be automatically deselected when a role is removed
  const getRolesToRemove = (
    roleToRemove: string,
    currentRoles: string[]
  ): string[] => {
    const rolesToRemove = new Set<string>([roleToRemove]);

    // Remove all child roles
    const childRoles = roleHierarchy[roleToRemove];
    if (childRoles) {
      childRoles.forEach((childRole) => {
        rolesToRemove.add(childRole);
        const nestedChildren = getRolesToRemove(childRole, currentRoles);
        nestedChildren.forEach((nested) => rolesToRemove.add(nested));
      });
    }

    // Remove parent roles that no longer have any selected child roles
    Object.entries(roleHierarchy).forEach(([parentRole, children]) => {
      if (children.includes(roleToRemove)) {
        const hasOtherSelectedChildren = children.some(
          (child) => currentRoles.includes(child) && !rolesToRemove.has(child)
        );
        if (!hasOtherSelectedChildren) {
          const parentRolesToRemove = getRolesToRemove(
            parentRole,
            currentRoles
          );
          parentRolesToRemove.forEach((role) => rolesToRemove.add(role));
        }
      }
    });

    return Array.from(rolesToRemove);
  };

  const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    const previousRoles = internalSelectedRoles;

    // Determine which role was added or removed
    const addedRoles = value.filter((role) => !previousRoles.includes(role));
    const removedRoles = previousRoles.filter((role) => !value.includes(role));

    let newRoles: string[];

    if (addedRoles.length > 0) {
      // Role was added - include implied roles
      newRoles = getImpliedRoles(value);
    } else if (removedRoles.length > 0) {
      // Role was removed - remove dependent roles
      const rolesToRemove = getRolesToRemove(removedRoles[0], previousRoles);
      newRoles = previousRoles.filter((role) => !rolesToRemove.includes(role));
    } else {
      newRoles = value;
    }

    // Filter to only available roles
    const filteredRoles = newRoles.filter((role) =>
      availableRoles.some((availableRole) => availableRole.name === role)
    );

    setInternalSelectedRoles(filteredRoles);
    onRoleChange(filteredRoles);
  };

  const getRoleDisplayName = (roleName: string): string => {
    const role = availableRoles.find((r) => r.name === roleName);
    return role?.name || roleName;
  };

  const isRoleIndented = (roleName: string): boolean => {
    return Object.values(roleHierarchy).some((children) =>
      children.includes(roleName)
    );
  };

  return (
    <FormControl
      fullWidth
      error={Boolean(error)}
      size={size}
      required={required}
    >
      <InputLabel id="role-hierarchy-selector-label">{label}</InputLabel>
      <Select
        labelId="role-hierarchy-selector-label"
        multiple
        value={internalSelectedRoles}
        onChange={handleRoleChange}
        disabled={disabled}
        label={label}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(selected as string[]).map((value) => (
              <Chip
                key={value}
                label={getRoleDisplayName(value)}
                size="small"
                icon={roleIcons[value]}
              />
            ))}
          </Box>
        )}
      >
        {availableRoles.map((role) => (
          <MenuItem key={role.id} value={role.name}>
            <Checkbox checked={internalSelectedRoles.includes(role.name)} />
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}
            >
              {roleIcons[role.name] && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    ml: isRoleIndented(role.name) ? 3 : 0,
                    opacity: isRoleIndented(role.name) ? 0.7 : 1,
                  }}
                >
                  {roleIcons[role.name]}
                </Box>
              )}
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isRoleIndented(role.name) ? 400 : 500,
                      ml:
                        isRoleIndented(role.name) && !roleIcons[role.name]
                          ? 3
                          : 0,
                    }}
                  >
                    {role.name}
                  </Typography>
                }
              />
            </Box>
          </MenuItem>
        ))}
      </Select>
      {(error || helperText) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};
