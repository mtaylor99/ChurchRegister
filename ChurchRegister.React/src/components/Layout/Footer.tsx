import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  useTheme,
} from '@mui/material';
import { churchColors } from '../../theme';

export const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor:
          theme.palette.mode === 'light'
            ? churchColors.bgSecondary
            : churchColors.oceanDark,
        borderTop: `1px solid ${theme.palette.divider}`,
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: "space-between",
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: 2
          }}>
          {/* Left section - Branding */}
          <Box sx={{
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                color:
                  theme.palette.mode === 'light'
                    ? churchColors.textPrimary
                    : 'white',
                mb: 0.5,
              }}
            >
              Church Register System
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 1
              }}>
              Managing church activities with care and precision
            </Typography>
          </Box>

          {/* Right section - Links and Info */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: 'center', sm: 'flex-end' },
              gap: 1
            }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                justifyContent: "center"
              }}>
              <Link
                href="/privacy"
                underline="hover"
                variant="body2"
                sx={{
                  color: "text.secondary"
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                underline="hover"
                variant="body2"
                sx={{
                  color: "text.secondary"
                }}
              >
                Terms of Service
              </Link>
              <Link
                href="/help"
                underline="hover"
                variant="body2"
                sx={{
                  color: "text.secondary"
                }}
              >
                Help & Support
              </Link>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: { xs: 'center', sm: 'right' }
              }}>
              © {currentYear} Church Register. Built with React & Material-UI.
            </Typography>
          </Box>
        </Box>

        {/* Divider and additional info */}
        <Divider sx={{ my: 2, opacity: 0.6 }} />

        <Box sx={{
          textAlign: "center"
        }}>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontStyle: 'italic',
              opacity: 0.8
            }}>
            "For where two or three gather in my name, there am I with them." -
            Matthew 18:20
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
