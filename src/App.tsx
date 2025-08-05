// Think Tank Technologies Installation Scheduler - Main Application

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import DataProcessing from './pages/data-processing/DataProcessing';
import SchedulingDashboard from './pages/schedules/SchedulingDashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
import { PageLoading } from './components/common/Loading';
import AuthForm from './components/forms/AuthForm';
import { useAppStore, useIsAuthenticated, useIsLoading } from './stores/useAppStore';
import { auth } from './services/supabase';

// Placeholder components for other pages

const InstallationsPage = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-semibold text-primary-900 mb-6">Installations</h1>
    <div className="card">
      <div className="card-body text-center py-12">
        <p className="text-primary-600">Installations page coming soon...</p>
      </div>
    </div>
  </div>
);

const AssignmentsPage = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-semibold text-primary-900 mb-6">Assignments</h1>
    <div className="card">
      <div className="card-body text-center py-12">
        <p className="text-primary-600">Assignments page coming soon...</p>
      </div>
    </div>
  </div>
);

const ReportsPage = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-semibold text-primary-900 mb-6">Reports</h1>
    <div className="card">
      <div className="card-body text-center py-12">
        <p className="text-primary-600">Reports page coming soon...</p>
      </div>
    </div>
  </div>
);

const SettingsPage = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-semibold text-primary-900 mb-6">Settings</h1>
    <div className="card">
      <div className="card-body text-center py-12">
        <p className="text-primary-600">Settings page coming soon...</p>
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
