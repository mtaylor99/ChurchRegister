import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

export interface YearSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    year: number,
    envelopesFilter?: boolean,
    giftAidFilter?: boolean
  ) => void;
  isExporting?: boolean;
}

/**
 * Modal for selecting a year to filter contributions export
 * Shows the last 5 years including the current year in descending order
 * Defaults to the current year
 */
export const YearSelectionModal: React.FC<YearSelectionModalProps> = ({
  open,
  onClose,
  onConfirm,
  isExporting = false,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [memberType, setMemberType] = useState<string>('all');
  const [giftAidOnly, setGiftAidOnly] = useState<boolean>(false);

  // Generate array of last 5 years including current year
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleConfirm = () => {
    // Map member type selection to envelopesFilter value
    const envelopesFilter =
      memberType === 'envelopes'
        ? true
        : memberType === 'bankCredit'
          ? false
          : undefined; // 'all' -> undefined (no filter)

    // Only pass giftAidFilter if checkbox is checked
    const giftAidFilter = giftAidOnly ? true : undefined;

    onConfirm(selectedYear, envelopesFilter, giftAidFilter);
  };

  const handleClose = () => {
    // Reset to defaults when closing
    setSelectedYear(currentYear);
    setMemberType('all');
    setGiftAidOnly(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Export Member Contributions</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the year and contribution type for which you want to export
            member contributions.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              id="year-select"
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(e.target.value as number)}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="member-type-label">Contribution Type</InputLabel>
            <Select
              labelId="member-type-label"
              id="member-type-select"
              value={memberType}
              label="Contribution Type"
              onChange={(e) => setMemberType(e.target.value)}
            >
              <MenuItem value="all">All Contributions</MenuItem>
              <MenuItem value="envelopes">Envelopes Only</MenuItem>
              <MenuItem value="bankCredit">Bank Credit Only</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={giftAidOnly}
                onChange={(e) => setGiftAidOnly(e.target.checked)}
              />
            }
            label="Gift Aid only"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
