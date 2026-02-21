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
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

interface YearSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (year: number) => void;
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

  // Generate array of last 5 years including current year
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleConfirm = () => {
    onConfirm(selectedYear);
  };

  const handleClose = () => {
    // Reset to current year when closing
    setSelectedYear(currentYear);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Export Member Contributions</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the year for which you want to export member contributions.
          </Typography>
          <FormControl fullWidth>
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
