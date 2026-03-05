import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  IconButton,
  CircularProgress,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export interface ExportYearSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (year: number) => void;
  title: string;
  isExporting: boolean;
}

/**
 * Reusable year-selection dialog for export operations that require a year parameter.
 * Offers two choices: Current Year and Next Year.
 */
export const ExportYearSelectorDialog: React.FC<
  ExportYearSelectorDialogProps
> = ({ open, onClose, onConfirm, title, isExporting }) => {
  const currentYear = new Date().getFullYear();
  const [selected, setSelected] = useState<'current' | 'next'>('current');

  // Reset to current year each time the dialog opens
  useEffect(() => {
    if (open) {
      setSelected('current');
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(selected === 'current' ? currentYear : currentYear + 1);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {title}
          <IconButton
            edge="end"
            onClick={onClose}
            disabled={isExporting}
            size="small"
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <FormLabel component="legend" sx={{ mb: 1 }}>
          Select year
        </FormLabel>
        <RadioGroup
          value={selected}
          onChange={(e) => setSelected(e.target.value as 'current' | 'next')}
        >
          <FormControlLabel
            value="current"
            control={<Radio disabled={isExporting} />}
            label={`Current Year (${currentYear})`}
          />
          <FormControlLabel
            value="next"
            control={<Radio disabled={isExporting} />}
            label={`Next Year (${currentYear + 1})`}
          />
        </RadioGroup>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isExporting}
          startIcon={
            isExporting ? <CircularProgress size={20} color="inherit" /> : undefined
          }
        >
          {isExporting ? 'Exporting…' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportYearSelectorDialog;

