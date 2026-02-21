import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import {
  CheckCircleOutline,
  ErrorOutline,
  WarningAmberOutlined,
  InfoOutlined,
  ExpandMoreRounded,
  ExpandLessRounded,
} from '@mui/icons-material';
import {
  getPasswordStrengthColor,
  getPasswordStrengthDescription,
} from '../../utils/passwordSecurity';
import type {
  PasswordValidationResult,
  PasswordRequirement,
} from '../../utils/passwordSecurity';

export interface PasswordStrengthIndicatorProps {
  /** Password validation result */
  validationResult: PasswordValidationResult;
  /** Show detailed requirements list */
  showDetails?: boolean;
  /** Allow toggling details visibility */
  allowToggle?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Hide the progress bar */
  hideProgress?: boolean;
  /** Hide the strength label */
  hideLabel?: boolean;
  /** Custom styling */
  sx?: SxProps<Theme>;
}

export const PasswordStrengthIndicator: React.FC<
  PasswordStrengthIndicatorProps
> = ({
  validationResult,
  showDetails = false,
  allowToggle = true,
  compact = false,
  hideProgress = false,
  hideLabel = false,
  sx,
}) => {
  const theme = useTheme();
  const [detailsOpen, setDetailsOpen] = React.useState(showDetails);

  const { strength, score, requirements, errors, warnings, suggestions } =
    validationResult;

  const strengthColor = getPasswordStrengthColor(strength);
  const strengthDescription = getPasswordStrengthDescription(strength);

  const toggleDetails = () => {
    if (allowToggle) {
      setDetailsOpen(!detailsOpen);
    }
  };

  const getRequirementIcon = (requirement: PasswordRequirement) => {
    if (requirement.met) {
      return (
        <CheckCircleOutline
          sx={{ color: theme.palette.success.main, fontSize: 20 }}
        />
      );
    }

    switch (requirement.severity) {
      case 'required':
        return (
          <ErrorOutline
            sx={{ color: theme.palette.error.main, fontSize: 20 }}
          />
        );
      case 'recommended':
        return (
          <WarningAmberOutlined
            sx={{ color: theme.palette.warning.main, fontSize: 20 }}
          />
        );
      default:
        return (
          <InfoOutlined sx={{ color: theme.palette.info.main, fontSize: 20 }} />
        );
    }
  };

  const getRequirementTextColor = (requirement: PasswordRequirement) => {
    if (requirement.met) {
      return theme.palette.success.main;
    }

    switch (requirement.severity) {
      case 'required':
        return theme.palette.error.main;
      case 'recommended':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {/* Strength Indicator Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: compact ? 1 : 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!hideLabel && (
            <Typography
              variant={compact ? 'body2' : 'subtitle2'}
              sx={{ fontWeight: 500 }}
            >
              Password Strength:
            </Typography>
          )}

          <Chip
            label={strengthDescription}
            size={compact ? 'small' : 'medium'}
            sx={{
              backgroundColor: alpha(strengthColor, 0.1),
              color: strengthColor,
              fontWeight: 600,
              border: `1px solid ${alpha(strengthColor, 0.3)}`,
            }}
          />
        </Box>

        {allowToggle && (
          <Box
            onClick={toggleDetails}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: theme.palette.primary.main,
              '&:hover': {
                color: theme.palette.primary.dark,
              },
            }}
          >
            <Typography variant="body2" sx={{ mr: 0.5 }}>
              {detailsOpen ? 'Hide' : 'Show'} Details
            </Typography>
            {detailsOpen ? <ExpandLessRounded /> : <ExpandMoreRounded />}
          </Box>
        )}
      </Box>

      {/* Progress Bar */}
      {!hideProgress && (
        <Box sx={{ mb: compact ? 1 : 2 }}>
          <LinearProgress
            variant="determinate"
            value={score}
            sx={{
              height: compact ? 6 : 8,
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.grey[300], 0.3),
              '& .MuiLinearProgress-bar': {
                backgroundColor: strengthColor,
                borderRadius: 4,
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              mt: 0.5,
              display: 'block',
            }}
          >
            {score}% strength
          </Typography>
        </Box>
      )}

      {/* Detailed Requirements */}
      <Collapse in={detailsOpen} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2 }}>
          {/* Requirements List */}
          {requirements.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                Password Requirements
              </Typography>

              <List dense disablePadding>
                {requirements.map((requirement) => (
                  <ListItem
                    key={requirement.id}
                    disablePadding
                    sx={{
                      py: 0.25,
                      opacity: requirement.met ? 0.8 : 1,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      {getRequirementIcon(requirement)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            color: getRequirementTextColor(requirement),
                            textDecoration: requirement.met
                              ? 'line-through'
                              : 'none',
                          }}
                        >
                          {requirement.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: theme.palette.error.main,
                }}
              >
                Required Fixes
              </Typography>
              {errors.map((error, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    color: theme.palette.error.main,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <ErrorOutline fontSize="small" />
                  {error}
                </Typography>
              ))}
            </Box>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: theme.palette.warning.main,
                }}
              >
                Recommendations
              </Typography>
              {warnings.map((warning, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    color: theme.palette.warning.main,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <WarningAmberOutlined fontSize="small" />
                  {warning}
                </Typography>
              ))}
            </Box>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: theme.palette.info.main,
                }}
              >
                Suggestions for Improvement
              </Typography>
              {suggestions.map((suggestion, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    color: theme.palette.info.main,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <InfoOutlined fontSize="small" />
                  {suggestion}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default PasswordStrengthIndicator;
