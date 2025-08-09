import React from 'react';
import { Outlet } from 'react-router-dom';
import MarketingHeader from './MarketingHeader';
import MarketingFooter from './MarketingFooter';

interface MarketingLayoutProps {
  children?: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  // Add hide-scrollbar class to html and body for marketing pages
  React.useEffect(() => {
    document.documentElement.classList.add('hide-scrollbar');
    document.body.classList.add('hide-scrollbar');
    return () => {
      document.documentElement.classList.remove('hide-scrollbar');
      document.body.classList.remove('hide-scrollbar');
    };
  }, []);

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