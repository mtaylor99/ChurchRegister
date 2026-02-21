import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Chip,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  SearchOff as SearchOffIcon,
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  Extension as ComponentIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ErrorPageLayout } from './ErrorPageLayout';

interface SuggestedRoute {
  path: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
}

const suggestedRoutes: SuggestedRoute[] = [
  {
    path: '/app/dashboard',
    label: 'Dashboard',
    description: 'Main application dashboard',
    icon: <DashboardIcon />,
    keywords: ['dashboard', 'home', 'main', 'overview'],
  },
  {
    path: '/app/components',
    label: 'Components',
    description: 'UI Components library and examples',
    icon: <ComponentIcon />,
    keywords: ['components', 'ui', 'library', 'examples', 'design'],
  },
  {
    path: '/login',
    label: 'Login',
    description: 'Sign in to your account',
    icon: <PersonIcon />,
    keywords: ['login', 'signin', 'auth', 'authentication'],
  },
];

export interface NotFoundPageProps {
  /**
   * Custom search suggestions to display
   */
  customSuggestions?: SuggestedRoute[];

  /**
   * Whether to show the search functionality
   */
  showSearch?: boolean;

  /**
   * Custom message to display instead of default
   */
  customMessage?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  customSuggestions = suggestedRoutes,
  showSearch = true,
  customMessage,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = customSuggestions.filter(
    (route) =>
      route.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      route.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuggestionClick = (path: string) => {
    navigate(path);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  };

  const SearchContent = showSearch ? (
    <Box sx={{ mb: 4 }}>
      <TextField
        fullWidth
        placeholder="Search for pages..."
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{
          maxWidth: 400,
          mx: 'auto',
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      <Collapse in={showSuggestions && filteredSuggestions.length > 0}>
        <Paper
          elevation={2}
          sx={{
            maxWidth: 500,
            mx: 'auto',
            mt: 2,
            borderRadius: 2,
          }}
        >
          <List sx={{ py: 1 }}>
            {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
              <ListItem
                key={suggestion.path}
                component="div"
                onClick={() => handleSuggestionClick(suggestion.path)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  mb: index < filteredSuggestions.length - 1 ? 1 : 0,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {suggestion.icon}
                </ListItemIcon>
                <ListItemText
                  primary={suggestion.label}
                  secondary={suggestion.description}
                  primaryTypographyProps={{
                    fontWeight: 'medium',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Collapse>

      {showSuggestions &&
        filteredSuggestions.length === 0 &&
        searchTerm.length > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, fontStyle: 'italic' }}
          >
            No matching pages found. Try different keywords.
          </Typography>
        )}
    </Box>
  ) : null;

  const SuggestionsContent =
    !showSuggestions && customSuggestions.length > 0 ? (
      <Box sx={{ mb: 4 }}>
        <Button
          variant="text"
          endIcon={showSuggestions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setShowSuggestions(!showSuggestions)}
          sx={{ mb: 2 }}
        >
          Suggested Pages
        </Button>

        <Collapse in={!showSuggestions}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'center',
              maxWidth: 400,
              mx: 'auto',
            }}
          >
            {customSuggestions.slice(0, 3).map((suggestion) => (
              <Chip
                key={suggestion.path}
                label={suggestion.label}
                onClick={() => handleSuggestionClick(suggestion.path)}
                clickable
                variant="outlined"
                icon={suggestion.icon as React.ReactElement}
              />
            ))}
          </Box>
        </Collapse>
      </Box>
    ) : null;

  return (
    <ErrorPageLayout
      errorCode="404"
      title="Page Not Found"
      description={
        customMessage ||
        "The page you're looking for doesn't exist. It might have been moved, deleted, or you might have mistyped the URL."
      }
      icon={
        <SearchOffIcon
          sx={{
            fontSize: { xs: 60, sm: 80, md: 100 },
            color: 'primary.main',
          }}
        />
      }
      variant="info"
      showBackButton={true}
      showHomeButton={true}
      showRefreshButton={false}
    >
      {SearchContent}
      {SuggestionsContent}
    </ErrorPageLayout>
  );
};

export default NotFoundPage;
