// Think Tank Technologies Installation Scheduler - Organization Theme Provider

import React, { useEffect } from 'react';
import { useOrganization } from '../../contexts/TenantProvider';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const organization = useOrganization();

  useEffect(() => {
    if (!organization) return;

    // Apply organization-specific CSS custom properties
    const root = document.documentElement;
    
    // Default theme values as fallbacks
    const defaultTheme = {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF', 
      accentColor: '#F59E0B',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      fontFamily: 'Inter, system-ui, sans-serif'
    };

    // Use organization theme or fallback to defaults
    const theme = organization.customTheme || {
      primaryColor: organization.primaryColor || defaultTheme.primaryColor,
      secondaryColor: organization.secondaryColor || defaultTheme.secondaryColor,
      accentColor: organization.accentColor || defaultTheme.accentColor,
      backgroundColor: defaultTheme.backgroundColor,
      textColor: defaultTheme.textColor,
      fontFamily: defaultTheme.fontFamily
    };

    // Set CSS custom properties for organization theme
    root.style.setProperty('--org-primary', theme.primaryColor);
    root.style.setProperty('--org-secondary', theme.secondaryColor);
    root.style.setProperty('--org-accent', theme.accentColor);
    root.style.setProperty('--org-background', theme.backgroundColor);
    root.style.setProperty('--org-text', theme.textColor);
    root.style.setProperty('--org-font-family', theme.fontFamily);

    // Generate additional color variations
    const primaryRgb = hexToRgb(theme.primaryColor);
    const secondaryRgb = hexToRgb(theme.secondaryColor);
    const accentRgb = hexToRgb(theme.accentColor);

    if (primaryRgb) {
      root.style.setProperty('--org-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
      root.style.setProperty('--org-primary-10', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`);
      root.style.setProperty('--org-primary-20', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`);
      root.style.setProperty('--org-primary-30', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`);
      root.style.setProperty('--org-primary-50', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.5)`);
    }

    if (secondaryRgb) {
      root.style.setProperty('--org-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
      root.style.setProperty('--org-secondary-10', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.1)`);
      root.style.setProperty('--org-secondary-20', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.2)`);
    }

    if (accentRgb) {
      root.style.setProperty('--org-accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
      root.style.setProperty('--org-accent-10', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.1)`);
      root.style.setProperty('--org-accent-20', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.2)`);
    }

    // Update document title with organization name
    document.title = `${organization.name} - Installation Scheduler`;

    // Update favicon if organization has custom favicon
    if (organization.customTheme?.faviconUrl) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) {
        favicon.href = organization.customTheme.faviconUrl;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = organization.customTheme.faviconUrl;
        document.head.appendChild(newFavicon);
      }
    }

    // Inject custom CSS if provided
    if (organization.customTheme?.customCss) {
      let customStyleSheet = document.getElementById('org-custom-css');
      if (!customStyleSheet) {
        customStyleSheet = document.createElement('style');
        customStyleSheet.id = 'org-custom-css';
        document.head.appendChild(customStyleSheet);
      }
      customStyleSheet.textContent = organization.customTheme.customCss;
    }

  }, [organization]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const root = document.documentElement;
      const customStyleSheet = document.getElementById('org-custom-css');
      
      // Reset to default theme
      root.style.removeProperty('--org-primary');
      root.style.removeProperty('--org-secondary');
      root.style.removeProperty('--org-accent');
      root.style.removeProperty('--org-background');
      root.style.removeProperty('--org-text');
      root.style.removeProperty('--org-font-family');
      root.style.removeProperty('--org-primary-rgb');
      root.style.removeProperty('--org-primary-10');
      root.style.removeProperty('--org-primary-20');
      root.style.removeProperty('--org-primary-30');
      root.style.removeProperty('--org-primary-50');
      root.style.removeProperty('--org-secondary-rgb');
      root.style.removeProperty('--org-secondary-10');
      root.style.removeProperty('--org-secondary-20');
      root.style.removeProperty('--org-accent-rgb');
      root.style.removeProperty('--org-accent-10');
      root.style.removeProperty('--org-accent-20');

      if (customStyleSheet) {
        customStyleSheet.remove();
      }

      // Reset document title
      document.title = 'Installation Scheduler';
    };
  }, []);

  return <>{children}</>;
};

// Utility function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Hook for accessing organization theme values
export const useOrganizationTheme = () => {
  const organization = useOrganization();

  const getThemeValue = (property: string, fallback?: string) => {
    if (typeof window === 'undefined') return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(property) || fallback;
  };

  const theme = {
    primaryColor: getThemeValue('--org-primary', '#3B82F6'),
    secondaryColor: getThemeValue('--org-secondary', '#1E40AF'),
    accentColor: getThemeValue('--org-accent', '#F59E0B'),
    backgroundColor: getThemeValue('--org-background', '#000000'),
    textColor: getThemeValue('--org-text', '#FFFFFF'),
    fontFamily: getThemeValue('--org-font-family', 'Inter, system-ui, sans-serif'),
    organization: organization?.name || 'Installation Scheduler',
    logoUrl: organization?.logoUrl,
    customTheme: organization?.customTheme
  };

  return theme;
};

export default ThemeProvider;