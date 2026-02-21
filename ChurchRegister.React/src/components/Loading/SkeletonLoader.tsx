import { forwardRef } from 'react';
import { Skeleton, Box, Card, CardContent } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SkeletonLoaderProps {
  /** Type of skeleton to display */
  variant?: 'text' | 'card' | 'table' | 'list' | 'profile' | 'custom';
  /** Number of skeleton items to display */
  count?: number;
  /** Height of skeleton items */
  height?: string | number;
  /** Width of skeleton items */
  width?: string | number;
  /** Animation type */
  animation?: 'pulse' | 'wave' | false;
  /** Custom styling */
  sx?: SxProps<Theme>;
  /** Custom content for complex layouts */
  children?: React.ReactNode;
}

const SkeletonLoader = forwardRef<HTMLDivElement, SkeletonLoaderProps>(
  (
    {
      variant = 'text',
      count = 1,
      height,
      width,
      animation = 'pulse',
      sx,
      children,
    },
    ref
  ) => {
    const renderTextSkeleton = () => (
      <Box ref={ref} sx={sx}>
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            height={height || 24}
            width={width || '100%'}
            animation={animation}
            sx={{ mb: index < count - 1 ? 1 : 0 }}
          />
        ))}
      </Box>
    );

    const renderCardSkeleton = () => (
      <Box
        ref={ref}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, ...sx }}
      >
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Skeleton
                  variant="circular"
                  width={40}
                  height={40}
                  animation={animation}
                />
                <Box flex={1}>
                  <Skeleton
                    variant="text"
                    height={20}
                    width="60%"
                    animation={animation}
                  />
                  <Skeleton
                    variant="text"
                    height={16}
                    width="40%"
                    animation={animation}
                  />
                </Box>
              </Box>
              <Skeleton
                variant="text"
                height={16}
                width="100%"
                animation={animation}
                sx={{ mb: 1 }}
              />
              <Skeleton
                variant="text"
                height={16}
                width="80%"
                animation={animation}
                sx={{ mb: 1 }}
              />
              <Skeleton
                variant="text"
                height={16}
                width="90%"
                animation={animation}
              />
            </CardContent>
          </Card>
        ))}
      </Box>
    );

    const renderTableSkeleton = () => (
      <Box ref={ref} sx={sx}>
        {/* Table Header */}
        <Box display="flex" gap={2} mb={2} p={2} bgcolor="action.hover">
          <Skeleton
            variant="text"
            height={20}
            width="20%"
            animation={animation}
          />
          <Skeleton
            variant="text"
            height={20}
            width="30%"
            animation={animation}
          />
          <Skeleton
            variant="text"
            height={20}
            width="25%"
            animation={animation}
          />
          <Skeleton
            variant="text"
            height={20}
            width="25%"
            animation={animation}
          />
        </Box>

        {/* Table Rows */}
        {Array.from({ length: count }).map((_, index) => (
          <Box
            key={index}
            display="flex"
            gap={2}
            p={2}
            borderBottom={1}
            borderColor="divider"
          >
            <Skeleton
              variant="text"
              height={20}
              width="20%"
              animation={animation}
            />
            <Skeleton
              variant="text"
              height={20}
              width="30%"
              animation={animation}
            />
            <Skeleton
              variant="text"
              height={20}
              width="25%"
              animation={animation}
            />
            <Skeleton
              variant="text"
              height={20}
              width="25%"
              animation={animation}
            />
          </Box>
        ))}
      </Box>
    );

    const renderListSkeleton = () => (
      <Box ref={ref} sx={sx}>
        {Array.from({ length: count }).map((_, index) => (
          <Box
            key={index}
            display="flex"
            alignItems="center"
            gap={2}
            py={2}
            borderBottom={1}
            borderColor="divider"
          >
            <Skeleton
              variant="circular"
              width={32}
              height={32}
              animation={animation}
            />
            <Box flex={1}>
              <Skeleton
                variant="text"
                height={18}
                width="70%"
                animation={animation}
              />
              <Skeleton
                variant="text"
                height={14}
                width="40%"
                animation={animation}
              />
            </Box>
            <Skeleton
              variant="rectangular"
              width={60}
              height={24}
              animation={animation}
            />
          </Box>
        ))}
      </Box>
    );

    const renderProfileSkeleton = () => (
      <Box ref={ref} sx={sx}>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} sx={{ mb: index < count - 1 ? 2 : 0 }}>
            <CardContent>
              {/* Profile Header */}
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Skeleton
                  variant="circular"
                  width={64}
                  height={64}
                  animation={animation}
                />
                <Box flex={1}>
                  <Skeleton
                    variant="text"
                    height={24}
                    width="50%"
                    animation={animation}
                  />
                  <Skeleton
                    variant="text"
                    height={18}
                    width="70%"
                    animation={animation}
                  />
                  <Skeleton
                    variant="text"
                    height={16}
                    width="40%"
                    animation={animation}
                  />
                </Box>
              </Box>

              {/* Profile Details */}
              <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                gap={2}
              >
                <Box>
                  <Skeleton
                    variant="text"
                    height={16}
                    width="30%"
                    animation={animation}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    height={20}
                    width="80%"
                    animation={animation}
                  />
                </Box>
                <Box>
                  <Skeleton
                    variant="text"
                    height={16}
                    width="25%"
                    animation={animation}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    height={20}
                    width="70%"
                    animation={animation}
                  />
                </Box>
                <Box>
                  <Skeleton
                    variant="text"
                    height={16}
                    width="35%"
                    animation={animation}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    height={20}
                    width="60%"
                    animation={animation}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );

    const renderCustomSkeleton = () => (
      <Box ref={ref} sx={sx}>
        {children || (
          <Skeleton
            variant="rectangular"
            height={height || 200}
            width={width || '100%'}
            animation={animation}
          />
        )}
      </Box>
    );

    switch (variant) {
      case 'card':
        return renderCardSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'profile':
        return renderProfileSkeleton();
      case 'custom':
        return renderCustomSkeleton();
      case 'text':
      default:
        return renderTextSkeleton();
    }
  }
);

SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;
