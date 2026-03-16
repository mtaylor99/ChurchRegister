import React, { useRef, useEffect } from 'react';
import { Box, Link, useTheme } from '@mui/material';

export interface SkipLink {
  /** Target element ID to skip to */
  target: string;
  /** Display text for the skip link */
  label: string;
  /** Optional keyboard shortcut */
  shortcut?: string;
}

export interface SkipNavigationProps {
  /** Array of skip links */
  links?: SkipLink[];
  /** Custom styling */
  sx?: object;
  /** Z-index for positioning */
  zIndex?: number;
}

const defaultSkipLinks: SkipLink[] = [
  { target: 'main-content', label: 'Skip to main content', shortcut: 'Alt+M' },
  { target: 'main-navigation', label: 'Skip to navigation', shortcut: 'Alt+N' },
  { target: 'page-footer', label: 'Skip to footer', shortcut: 'Alt+F' },
];

export const SkipNavigation: React.FC<SkipNavigationProps> = ({
  links = defaultSkipLinks,
  sx,
  zIndex = 9999,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      links.forEach((link) => {
        if (link.shortcut) {
          const keys = link.shortcut.split('+');
          const altKey = keys.includes('Alt');
          const ctrlKey = keys.includes('Ctrl');
          const shiftKey = keys.includes('Shift');
          const key = keys[keys.length - 1].toLowerCase();

          if (
            event.altKey === altKey &&
            event.ctrlKey === ctrlKey &&
            event.shiftKey === shiftKey &&
            event.key.toLowerCase() === key
          ) {
            event.preventDefault();
            const targetElement = document.getElementById(link.target);
            if (targetElement) {
              targetElement.focus();
              targetElement.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [links]);

  const handleSkipClick = (event: React.MouseEvent, target: string) => {
    event.preventDefault();
    const targetElement = document.getElementById(target);
    if (targetElement) {
      // Make the target focusable if it isn't already
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      targetElement.focus();
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Box
      ref={containerRef}
      component="nav"
      role="navigation"
      aria-label="Skip navigation links"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex,
        ...sx,
      }}
    >
      {links.map((link, index) => (
        <Link
          key={`skip-${link.target}-${index}`}
          href={`#${link.target}`}
          onClick={(event) => handleSkipClick(event, link.target)}
          sx={{
            position: 'absolute',
            left: '-9999px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            padding: theme.spacing(1, 2),
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            textDecoration: 'none',
            borderRadius: theme.shape.borderRadius,
            fontWeight: 'bold',
            fontSize: '1rem',
            whiteSpace: 'nowrap',
            border: `2px solid ${theme.palette.primary.dark}`,
            transition: 'all 0.3s ease',
            '&:focus': {
              position: 'static',
              width: 'auto',
              height: 'auto',
              left: theme.spacing(1),
              top: theme.spacing(1),
              zIndex: zIndex + 1,
              boxShadow: theme.shadows[8],
            },
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
          title={
            link.shortcut ? `${link.label} (${link.shortcut})` : link.label
          }
        >
          {link.label}
          {link.shortcut && (
            <Box
              component="span"
              sx={{
                ml: 1,
                fontSize: '0.875rem',
                opacity: 0.8,
              }}
            >
              ({link.shortcut})
            </Box>
          )}
        </Link>
      ))}
    </Box>
  );
};

export default SkipNavigation;
