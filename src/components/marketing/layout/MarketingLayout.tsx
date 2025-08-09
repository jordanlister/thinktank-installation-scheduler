import React from 'react';
import { Outlet } from 'react-router-dom';
import MarketingHeader from './MarketingHeader';
import MarketingFooter from './MarketingFooter';
import { useAppStore } from '../../../stores/useAppStore';
import { auth } from '../../../services/supabase';

interface MarketingLayoutProps {
  children?: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  const { setUser, setAuthenticated } = useAppStore();

  React.useEffect(() => {
    // Initialize authentication state by checking current session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
            created_at: session.user.created_at || new Date().toISOString(),
            updated_at: session.user.updated_at || new Date().toISOString(),
          });
          setAuthenticated(true);
        } else {
          setUser(null);
          setAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        setUser(null);
        setAuthenticated(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
          created_at: session.user.created_at || new Date().toISOString(),
          updated_at: session.user.updated_at || new Date().toISOString(),
        });
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    });

    // Add hide-scrollbar class to html and body for marketing pages
    document.documentElement.classList.add('hide-scrollbar');
    document.body.classList.add('hide-scrollbar');
    
    return () => {
      document.documentElement.classList.remove('hide-scrollbar');
      document.body.classList.remove('hide-scrollbar');
      subscription.unsubscribe();
    };
  }, [setUser, setAuthenticated]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <MarketingHeader />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <MarketingFooter />
    </div>
  );
};

export default MarketingLayout;