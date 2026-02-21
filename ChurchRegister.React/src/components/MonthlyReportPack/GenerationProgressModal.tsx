import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Typography,
  Box,
} from '@mui/material';

interface GenerationProgressModalProps {
  open: boolean;
  currentReport: string;
  reportsCompleted: number;
  totalReports: number;
  onCancel: () => void;
}

const GenerationProgressModal = ({
  open,
  currentReport,
  reportsCompleted,
  totalReports,
  onCancel,
}: GenerationProgressModalProps) => {
  const progress = (reportsCompleted / totalReports) * 100;

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Downloading Monthly Reports</DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            {currentReport ? `Downloading ${currentReport}... ${reportsCompleted}/${totalReports}` : 'Starting...'}
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />
        </Box>
        <Typography variant="caption" color="text.secondary">
          Please wait while we download all reports. This may take up to 30 seconds.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerationProgressModal;
