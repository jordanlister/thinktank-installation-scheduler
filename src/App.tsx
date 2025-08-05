// Think Tank Technologies Installation Scheduler - Main Application

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MapPin, Users, Settings } from 'lucide-react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import DataProcessing from './pages/data-processing/DataProcessing';
import SchedulingDashboard from './pages/schedules/SchedulingDashboard';
import TeamManagement from './pages/team/TeamManagement';
import ReportsPage from './pages/reports/ReportsPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import { PageLoading } from './components/common/Loading';
import AuthForm from './components/forms/AuthForm';
import { useAppStore, useIsAuthenticated, useIsLoading } from './stores/useAppStore';
import { auth } from './services/supabase';

// Placeholder components for other pages

const InstallationsPage = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-primary-900">Installations</h1>
      <p className="mt-2 text-lg text-primary-600">
        Manage and track all installation requests
      </p>
    </div>
    <div className="card">
      <div className="card-body text-center py-16">
        <MapPin className="h-16 w-16 text-primary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-primary-900 mb-2">
          Installations Management
        </h3>
        <p className="text-primary-600 mb-4">
          This page will allow you to view, create, and manage installation requests.
        </p>
        <p className="text-sm text-primary-500">
          Feature coming soon - comprehensive installation tracking and management
        </p>
      </div>
    </div>
  </div>
);

const AssignmentsPage = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-primary-900">Assignments</h1>
      <p className="mt-2 text-lg text-primary-600">
        Assign leads and assistants to installation teams
      </p>
    </div>
    <div className="card">
      <div className="card-body text-center py-16">
        <Users className="h-16 w-16 text-primary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-primary-900 mb-2">
          Team Assignments
        </h3>
        <p className="text-primary-600 mb-4">
          This page will allow you to assign team members to installations and manage workload distribution.
        </p>
        <p className="text-sm text-primary-500">
          Feature coming soon - intelligent team assignment and workload balancing
        </p>
      </div>
    </div>
  </div>
);

const SettingsPage = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-primary-900">Settings</h1>
      <p className="mt-2 text-lg text-primary-600">
        Configure system preferences and user settings
      </p>
    </div>
    <div className="card">
      <div className="card-body text-center py-16">
        <Settings className="h-16 w-16 text-primary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-primary-900 mb-2">
          System Configuration
        </h3>
        <p className="text-primary-600 mb-4">
          This page will provide access to system-wide settings, user preferences, and configuration options.
        </p>
        <p className="text-sm text-primary-500">
          Feature coming soon - comprehensive settings management
        </p>
      </div>
    </div>
  </div>
);

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
    </ErrorBoundary>
  );
}

export default App;
