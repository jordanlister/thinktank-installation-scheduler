import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button, Navigation, Container } from '../../ui';
import { useAppStore, useIsAuthenticated } from '../../../stores/useAppStore';
import { auth } from '../../../services/supabase';
import UserProfileDropdown from './UserProfileDropdown';

const MarketingHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const { user, setUser, setAuthenticated } = useAppStore();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { name: 'Features', path: '/features', hasDropdown: false },
    { name: 'Solutions', path: '/solutions', hasDropdown: false },
    { name: 'Pricing', path: '/pricing', hasDropdown: false },
    { name: 'Resources', path: '/resources', hasDropdown: false },
    { name: 'Company', path: '/company', hasDropdown: false },
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-surface-glass backdrop-blur-xl border-b border-border shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between h-16 lg:h-20 px-2">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 font-bold text-xl text-white hover:text-brand-primary transition-colors border-0 outline-none focus:outline-none shadow-none"
            style={{ boxShadow: 'none', border: 'none', outline: 'none' }}
          >
            <img 
              src="/thinktanklogo.png" 
              alt="Lead Route Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="hidden sm:block">Lead Route</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 border-0 outline-none focus:outline-none shadow-none ${
                  isActiveRoute(item.path)
                    ? 'text-brand-primary'
                    : 'text-text-secondary hover:text-white'
                }`}
                style={{ boxShadow: 'none', border: 'none', outline: 'none' }}
              >
                {item.name}
                {isActiveRoute(item.path) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons / Profile */}
          <div className="hidden lg:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <UserProfileDropdown user={user} onSignOut={handleSignOut} />
            ) : (
              <>
                <Link to="/app">
                  <Button variant="ghost" size="sm" className="text-text-secondary hover:text-white hover:bg-white/10 px-4 py-2">
                    Sign In
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="primary" size="sm" className="px-4 py-2">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-text-secondary hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden bg-surface-glass backdrop-blur-xl border-t border-border shadow-xl">
            <nav className="py-4 space-y-1 px-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium transition-colors duration-200 rounded-lg ${
                    isActiveRoute(item.path)
                      ? 'text-brand-primary bg-brand-primary/10'
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-border space-y-3">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-4 py-3 bg-white/5 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-medium text-sm">
                        {user.full_name ? user.full_name[0].toUpperCase() : user.email?.[0].toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Link to="/app" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                    <Link to="/app/settings" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Settings
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleSignOut();
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link to="/app" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="primary" size="sm" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
};

export default MarketingHeader;