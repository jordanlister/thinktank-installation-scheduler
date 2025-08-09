import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button, Navigation, Container } from '../../ui';

const MarketingHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

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
            className="flex items-center space-x-3 font-bold text-xl text-white hover:text-brand-primary transition-colors"
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
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                  isActiveRoute(item.path)
                    ? 'text-brand-primary bg-brand-primary/10'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                {item.name}
                {isActiveRoute(item.path) && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-brand-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link to="/app">
              <Button variant="ghost" size="sm" className="text-text-secondary hover:text-white hover:bg-white/10 px-4 py-2">
                Sign In
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="primary" size="sm" className="group px-4 py-2 flex items-center">
                <span>Get Started</span>
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
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
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
};

export default MarketingHeader;