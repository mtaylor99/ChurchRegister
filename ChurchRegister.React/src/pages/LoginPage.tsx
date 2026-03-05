import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Church,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/useAuth';

// Styled components to match Blazor design
const LoginBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  padding: theme.spacing(3),
  position: 'relative',
  backgroundImage: `linear-gradient(
    to right,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0.4) 30%,
    rgba(0, 0, 0, 0.2) 60%,
    transparent 100%
  ), url(/images/Calvary_Cross.png)`,
  backgroundSize: 'cover',
  backgroundPosition: 'center right',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    backgroundAttachment: 'scroll',
    backgroundImage: `linear-gradient(
      rgba(0, 0, 0, 0.5),
      rgba(0, 0, 0, 0.3)
    ), url(/images/Calvary_Cross.png)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
}));

const LoginContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 400,
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  minHeight: `calc(100vh - ${theme.spacing(6)})`,
  justifyContent: 'flex-start',
  marginTop: 0,
  paddingTop: 0,
  [theme.breakpoints.down('md')]: {
    maxWidth: '100%',
    minHeight: `calc(100vh - ${theme.spacing(4)})`,
  },
}));

const LoginCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  borderRadius: theme.spacing(3),
  boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3)`,
  padding: theme.spacing(3, 4, 4, 4),
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #D2B48C 0%, #87CEEB 50%, #D2B48C 100%)',
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2, 3, 3, 3),
    borderRadius: theme.spacing(2),
  },
}));

const ChurchIcon = styled(Church)(({ theme }) => ({
  width: 60,
  height: 60,
  margin: `0 auto ${theme.spacing(2)} auto`,
  display: 'block',
  color: '#D2B48C',
  [theme.breakpoints.down('md')]: {
    width: 48,
    height: 48,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.spacing(1),
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#D2B48C',
        borderWidth: 2,
      },
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#D2B48C',
  },
}));

const LoginButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  background: 'linear-gradient(135deg, #D2B48C 0%, #C4A47C 100%)',
  '&:hover': {
    background: 'linear-gradient(135deg, #C4A47C 0%, #B8956C 100%)',
    boxShadow: '0 4px 12px rgba(210, 180, 140, 0.3)',
  },
  '&:disabled': {
    background: 'rgba(210, 180, 140, 0.5)',
  },
}));

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@churchregister.com');
  const [password, setPassword] = useState('AdminPassword123!');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state as { from?: { pathname: string } } | null;
      const redirectTo = from?.from?.pathname || '/app/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password, rememberMe);
      // Navigation will be handled by the useEffect hook
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      );
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <LoginBackground>
      <LoginContainer>
        <LoginCard>
          <CardContent
            sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <ChurchIcon />
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  color: '#333',
                  mb: 0.5,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                Church Register
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: '#666',
                  fontWeight: 500,
                }}
              >
                Welcome Back
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1 }}>
              <StyledTextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#999' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <StyledTextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#999' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: '#D2B48C',
                      '&.Mui-checked': {
                        color: '#D2B48C',
                      },
                    }}
                  />
                }
                label="Remember me"
                sx={{ mb: 3, alignSelf: 'flex-start' }}
              />

              <LoginButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{ mb: 2, py: 1.5 }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress
                      size={20}
                      sx={{ mr: 1, color: 'white' }}
                    />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </LoginButton>

              {/* Development Note */}
              <Typography
                variant="caption"
                sx={{
                  color: '#999',
                  textAlign: 'center',
                  mt: 2,
                  fontStyle: 'italic',
                }}
              >
                Demo credentials pre-filled for testing
              </Typography>
            </Box>
          </CardContent>
        </LoginCard>
      </LoginContainer>
    </LoginBackground>
  );
};
