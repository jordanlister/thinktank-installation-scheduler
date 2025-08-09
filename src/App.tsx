// Think Tank Technologies Installation Scheduler - Main Application

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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

// Marketing Components
import MarketingLayout from './components/marketing/layout/MarketingLayout';
import HomePage from './pages/marketing/HomePage';
import FeaturesPage from './pages/marketing/FeaturesPage';
import SolutionsPage from './pages/marketing/SolutionsPage';
import PricingPage from './pages/marketing/PricingPage';
import ResourcesPage from './pages/marketing/ResourcesPage';
import CompanyPage from './pages/marketing/CompanyPage';
import ContactPage from './pages/marketing/ContactPage';



// Authentication wrapper component
const LoginPage = () => {
  return <AuthForm />;
};

// Route checker to determine if path is a marketing route
const isMarketingRoute = (pathname: string) => {
  const marketingPaths = [
    '/',
    '/features',
    '/solutions',
    '/pricing', 
    '/resources',
    '/company',
    '/contact',
    '/demo'
  ];
  
  return marketingPaths.includes(pathname) || 
         pathname.startsWith('/features/') ||
         pathname.startsWith('/solutions/') ||
         pathname.startsWith('/resources/') ||
         pathname.startsWith('/company/') ||
         pathname.startsWith('/legal/');
};

// App Router Component
const AppRouter = () => {
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsLoading();

  // Handle 404 redirect from sessionStorage (for SPA routing fallback)
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath && redirectPath !== location.pathname) {
      sessionStorage.removeItem('redirectPath');
      window.location.replace(redirectPath);
    }
  }, [location]);

  // If it's a marketing route, always show marketing content
  if (isMarketingRoute(location.pathname)) {
    return (
      <MarketingLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MarketingLayout>
    );
  }

  // For app routes, require authentication
  if (isLoading) {
    return <PageLoading message="Loading Think Tank Technologies..." />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated app routes
  return (
    <RealtimeProvider>
      <Routes>
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="schedules" element={<SchedulingDashboard />} />
          <Route path="installations" element={<InstallationsPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="team" element={<TeamManagement />} />
          <Route path="data-processing" element={<DataProcessing />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </RealtimeProvider>
  );
};

function App() {
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

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router>
          <AppRouter />
        </Router>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
