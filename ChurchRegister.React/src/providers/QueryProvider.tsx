import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache time: 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests up to 3 times
      retry: 3,
      // Refetch on window focus in production
      refetchOnWindowFocus:
        typeof import.meta !== 'undefined' && import.meta.env.PROD,
      // Don't refetch on reconnect for better UX
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
