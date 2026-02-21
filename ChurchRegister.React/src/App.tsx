import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { ChurchThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts';
import { QueryProvider } from './providers/QueryProvider';
import { Layout } from './components/Layout';
import {
  ProtectedRoute,
  ProtectedAdminRoute,
  ProtectedAttendanceRoute,
  ProtectedChurchMembersRoute,
  ProtectedFinancialRoute,
  ProtectedTrainingRoute,
} from './components/auth';
import { ErrorBoundary } from './components/ErrorBoundary';

// Eager load LoginPage for initial render performance
import { LoginPage } from './pages/LoginPage';

// Lazy load all other pages for code splitting
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ChangePasswordPage = lazy(() =>
  import('./pages/auth/ChangePasswordPage').then((m) => ({
    default: m.ChangePasswordPage,
  }))
);
const NotFoundPage = lazy(() =>
  import('./pages/error').then((m) => ({ default: m.NotFoundPage }))
);
const ServerErrorPage = lazy(() =>
  import('./pages/error').then((m) => ({ default: m.ServerErrorPage }))
);
const UnauthorizedPage = lazy(() =>
  import('./pages/error').then((m) => ({ default: m.UnauthorizedPage }))
);
const AdministrationPage = lazy(() =>
  import('./pages/Administration/AdministrationPage').then((m) => ({
    default: m.AdministrationPage,
  }))
);
const AttendanceTabsPage = lazy(() =>
  import('./pages/Attendance').then((m) => ({ default: m.AttendanceTabsPage }))
);
const ChurchMembersPage = lazy(() =>
  import('./pages/Administration/ChurchMembersPage').then((m) => ({
    default: m.ChurchMembersPage,
  }))
);
const TrainingCertificatesPage = lazy(() =>
  import('./pages/Administration/TrainingCertificatesPage').then((m) => ({
    default: m.TrainingCertificatesPage,
  }))
);
const RemindersPage = lazy(() =>
  import('./pages/RemindersPage').then((m) => ({
    default: m.RemindersPage,
  }))
);
const RiskAssessmentsPage = lazy(() =>
  import('./pages/RiskAssessmentsPage').then((m) => ({
    default: m.RiskAssessmentsPage,
  }))
);
const ContributionsPage = lazy(() =>
  import('./pages/Financial/ContributionsPage').then((m) => ({
    default: m.ContributionsPage,
  }))
);
const EnvelopeBatchEntry = lazy(() =>
  import('./components/Financial').then((m) => ({
    default: m.EnvelopeBatchEntry,
  }))
);
const EnvelopeBatchHistory = lazy(() =>
  import('./components/Financial').then((m) => ({
    default: m.EnvelopeBatchHistory,
  }))
);
const GenerateRegisterNumbers = lazy(() =>
  import('./components/Administration').then((m) => ({
    default: m.GenerateRegisterNumbers,
  }))
);

// Loading fallback component
const PageLoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="400px"
  >
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <ErrorBoundary>
      <ChurchThemeProvider>
        <QueryProvider>
          <NotificationProvider>
            <AuthProvider>
              <Router>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    {/* Default Route - Redirect to Login */}
                    <Route
                      path="/"
                      element={<Navigate to="/login" replace />}
                    />

                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Error Routes - Public (can be accessed without authentication) */}
                    <Route path="/error/404" element={<NotFoundPage />} />
                    <Route path="/error/500" element={<ServerErrorPage />} />
                    <Route
                      path="/error/unauthorized"
                      element={<UnauthorizedPage />}
                    />

                    {/* Protected Routes */}
                    <Route
                      path="/app"
                      element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }
                    >
                      {/* Dashboard - Default Route */}
                      <Route
                        index
                        element={<Navigate to="/app/dashboard" replace />}
                      />
                      <Route path="dashboard" element={<DashboardPage />} />

                      {/* Change Password Route */}
                      <Route
                        path="change-password"
                        element={<ChangePasswordPage />}
                      />

                      {/* Attendance Routes */}
                      <Route
                        path="attendance"
                        element={
                          <ProtectedAttendanceRoute
                            requiredPermission="Attendance.View"
                            featureName="attendance management"
                          >
                            <AttendanceTabsPage />
                          </ProtectedAttendanceRoute>
                        }
                      />

                      {/* Church Members Routes */}
                      <Route
                        path="members"
                        element={
                          <ProtectedChurchMembersRoute
                            requiredPermission="ChurchMembers.View"
                            featureName="church members management"
                          >
                            <ChurchMembersPage />
                          </ProtectedChurchMembersRoute>
                        }
                      />

                      {/* Training Certificates Routes */}
                      <Route
                        path="training"
                        element={
                          <ProtectedTrainingRoute
                            requiredPermission="TrainingCertificates.View"
                            featureName="training certificates management"
                          >
                            <TrainingCertificatesPage />
                          </ProtectedTrainingRoute>
                        }
                      />

                      {/* Reminders Routes */}
                      <Route
                        path="reminders"
                        element={
                          <ProtectedRoute>
                            <RemindersPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Risk Assessments Routes */}
                      <Route
                        path="risk-assessments"
                        element={
                          <ProtectedRoute>
                            <RiskAssessmentsPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Contributions Routes */}
                      <Route
                        path="contributions"
                        element={
                          <ProtectedFinancialRoute featureName="contributions management">
                            <ContributionsPage />
                          </ProtectedFinancialRoute>
                        }
                      />

                      {/* Financial - Envelope Contributions Routes */}
                      <Route
                        path="financial/envelope-contributions/entry"
                        element={
                          <ProtectedFinancialRoute
                            requiredRoles={[
                              'SystemAdministration',
                              'FinancialAdministrator',
                              'FinancialContributor',
                            ]}
                            featureName="envelope contribution entry"
                          >
                            <EnvelopeBatchEntry />
                          </ProtectedFinancialRoute>
                        }
                      />
                      <Route
                        path="financial/envelope-contributions/history"
                        element={
                          <ProtectedFinancialRoute featureName="envelope contribution history">
                            <EnvelopeBatchHistory />
                          </ProtectedFinancialRoute>
                        }
                      />

                      {/* Administration Routes */}
                      <Route
                        path="administration/users"
                        element={
                          <ProtectedAdminRoute>
                            <AdministrationPage />
                          </ProtectedAdminRoute>
                        }
                      />
                      <Route
                        path="administration/register-numbers"
                        element={
                          <ProtectedFinancialRoute
                            requiredRoles={[
                              'SystemAdministration',
                              'FinancialAdministrator',
                            ]}
                            featureName="register number generation"
                          >
                            <GenerateRegisterNumbers />
                          </ProtectedFinancialRoute>
                        }
                      />
                    </Route>

                    {/* Catch-all route for 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </Router>
            </AuthProvider>
          </NotificationProvider>
        </QueryProvider>
      </ChurchThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
