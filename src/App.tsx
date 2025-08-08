// Think Tank Technologies Installation Scheduler - Main Application

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MapPin, Users, Settings } from 'lucide-react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import DataProcessing from './pages/data-processing/DataProcessing';
import SchedulingDashboard from './pages/schedules/SchedulingDashboard';
import TeamManagement from './pages/team/TeamManagement';
import AssignmentsPage from './pages/assignments/AssignmentsPage';
import ReportsPage from './pages/reports/ReportsPage';
import InstallationsPage from './pages/installations/InstallationsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import { PageLoading } from './components/common/Loading';
import AuthForm from './components/forms/AuthForm';
import { useAppStore, useIsAuthenticated, useIsLoading } from './stores/useAppStore';
import { auth } from './services/supabase';
import { RealtimeProvider } from './contexts/RealtimeProvider';



// Authentication wrapper component
const LoginPage = () => {
  return <AuthForm />;
};

function App() {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsLoading();
  const { setLoading, setAuthenticated, setUser } = useAppStore();

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      setLoading(true);
      
      try {
        const { user, error } = await auth.getCurrentUser();
        if (error) {
          console.warn('Auth service not available:', error.message);
        } else if (user) {
          setAuthenticated(true);
          // Extract user data from Supabase user object
          setUser({
            id: user.id,
            email: user.email || '',
            firstName: user.user_metadata?.first_name || 'User',
            lastName: user.user_metadata?.last_name || '',
            role: user.user_metadata?.role || 'scheduler',
            isActive: user.user_metadata?.is_active ?? true,
            createdAt: user.created_at || new Date().toISOString(),
            updatedAt: user.updated_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Session check failed:', error);
        // Don't crash the app, just log the error
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [setLoading, setAuthenticated, setUser]);

  if (isLoading) {
    return <PageLoading message="Loading Think Tank Technologies..." />;
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <LoginPage />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <RealtimeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="schedules" element={<SchedulingDashboard />} />
              <Route path="installations" element={<InstallationsPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="team" element={<TeamManagement />} />
              <Route path="data-processing" element={<DataProcessing />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </RealtimeProvider>
    </ErrorBoundary>
  );
}

export default App;
