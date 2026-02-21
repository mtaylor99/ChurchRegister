import React from 'react';
import { TableRow, TableCell, Skeleton, Box } from '@mui/material';

export interface SkeletonRowsProps {
  count?: number;
  columns?: number;
}

export const SkeletonRows: React.FC<SkeletonRowsProps> = ({
  count = 5,
  columns = 6,
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`}>
          {/* Avatar column */}
          <TableCell>
            <Box display="flex" alignItems="center" gap={2}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box>
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="text" width={80} height={16} />
              </Box>
            </Box>
          </TableCell>

          {/* Status column */}
          <TableCell>
            <Skeleton variant="rounded" width={80} height={24} />
          </TableCell>

          {/* Job Title column */}
          <TableCell>
            <Skeleton variant="text" width={100} />
          </TableCell>

          {/* Roles column */}
          <TableCell>
            <Box display="flex" gap={1}>
              <Skeleton variant="rounded" width={60} height={20} />
              <Skeleton variant="rounded" width={45} height={20} />
            </Box>
          </TableCell>

          {/* Date Joined column */}
          <TableCell>
            <Skeleton variant="text" width={90} />
          </TableCell>

          {/* Actions column */}
          <TableCell>
            <Box display="flex" gap={1}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          </TableCell>

          {/* Additional columns if needed */}
          {Array.from({ length: Math.max(0, columns - 6) }).map(
            (_, colIndex) => (
              <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                <Skeleton variant="text" />
              </TableCell>
            )
          )}
        </TableRow>
      ))}
    </>
  );
};

export default SkeletonRows;
