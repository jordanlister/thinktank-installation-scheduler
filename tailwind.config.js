/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* =============================================================================
         * DESIGN TOKEN COLORS - CSS Variable Based
         * ============================================================================= */
        
        // Background Colors
        background: 'var(--background)',
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          glass: 'var(--surface-glass)',
          overlay: 'var(--surface-overlay)',
        },
        
        // Brand Colors - Think Tank Technologies
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)', 
          accent: 'var(--brand-accent)',
        },
        
        // Semantic Colors
        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
          dark: 'var(--success-dark)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light: 'var(--warning-light)',
          dark: 'var(--warning-dark)',
        },
        error: {
          DEFAULT: 'var(--error)',
          light: 'var(--error-light)',
          dark: 'var(--error-dark)',
        },
        info: {
          DEFAULT: 'var(--info)',
          light: 'var(--info-light)',
          dark: 'var(--info-dark)',
        },
        
        // Text Colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-disabled)',
        },
        
        // Border Colors
        border: {
          DEFAULT: 'var(--border)',
          light: 'var(--border-light)',
          focus: 'var(--border-focus)',
          error: 'var(--border-error)',
        },
      },
      
      /* =============================================================================
       * TYPOGRAPHY TOKENS
       * ============================================================================= */
      
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)', 
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        '6xl': 'var(--text-6xl)',
        '7xl': 'var(--text-7xl)',
      },
      
      lineHeight: {
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
        loose: 'var(--leading-loose)',
      },
      
      fontWeight: {
        light: 'var(--font-light)',
        normal: 'var(--font-normal)',
        medium: 'var(--font-medium)',
        semibold: 'var(--font-semibold)',
        bold: 'var(--font-bold)',
        extrabold: 'var(--font-extrabold)',
        black: 'var(--font-black)',
      },
      
      /* =============================================================================
       * SPACING TOKENS
       * ============================================================================= */
      
      spacing: {
        px: 'var(--space-px)',
        0: 'var(--space-0)',
        0.5: 'var(--space-0-5)',
        1: 'var(--space-1)',
        1.5: 'var(--space-1-5)',
        2: 'var(--space-2)',
        2.5: 'var(--space-2-5)',
        3: 'var(--space-3)',
        3.5: 'var(--space-3-5)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        7: 'var(--space-7)',
        8: 'var(--space-8)',
        9: 'var(--space-9)',
        10: 'var(--space-10)',
        11: 'var(--space-11)',
        12: 'var(--space-12)',
        14: 'var(--space-14)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
        28: 'var(--space-28)',
        32: 'var(--space-32)',
        36: 'var(--space-36)',
        40: 'var(--space-40)',
        44: 'var(--space-44)',
        48: 'var(--space-48)',
        52: 'var(--space-52)',
        56: 'var(--space-56)',
        60: 'var(--space-60)',
        64: 'var(--space-64)',
        72: 'var(--space-72)',
        80: 'var(--space-80)',
        96: 'var(--space-96)',
      },
      
      /* =============================================================================
       * BORDER RADIUS TOKENS
       * ============================================================================= */
      
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      
      /* =============================================================================
       * SHADOW TOKENS
       * ============================================================================= */
      
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        none: 'none',
        
        // Glass shadows
        glass: 'var(--shadow-glass)',
        'glass-lg': 'var(--shadow-glass-lg)',
        'glass-xl': 'var(--shadow-glass-xl)',
        
        // Glow effects
        'glow-sm': 'var(--shadow-glow-sm)',
        glow: 'var(--shadow-glow)',
        'glow-lg': 'var(--shadow-glow-lg)',
        'glow-xl': 'var(--shadow-glow-xl)',
        
        // Focus shadows
        focus: 'var(--shadow-focus)',
        'focus-error': 'var(--shadow-focus-error)',
      },
      
      /* =============================================================================
       * BACKDROP BLUR TOKENS
       * ============================================================================= */
      
      backdropBlur: {
        none: 'var(--blur-none)',
        sm: 'var(--blur-sm)',
        DEFAULT: 'var(--blur)',
        md: 'var(--blur-md)',
        lg: 'var(--blur-lg)',
        xl: 'var(--blur-xl)',
        '2xl': 'var(--blur-2xl)',
        '3xl': 'var(--blur-3xl)',
      },
      
      /* =============================================================================
       * Z-INDEX TOKENS
       * ============================================================================= */
      
      zIndex: {
        auto: 'var(--z-auto)',
        0: 'var(--z-0)',
        10: 'var(--z-10)',
        20: 'var(--z-20)',
        30: 'var(--z-30)',
        40: 'var(--z-40)',
        50: 'var(--z-50)',
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        fixed: 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        tooltip: 'var(--z-tooltip)',
        toast: 'var(--z-toast)',
      },
      
      /* =============================================================================
       * ANIMATION & MOTION TOKENS
       * ============================================================================= */
      
      transitionDuration: {
        75: 'var(--duration-75)',
        100: 'var(--duration-100)',
        150: 'var(--duration-150)',
        200: 'var(--duration-200)',
        300: 'var(--duration-300)',
        500: 'var(--duration-500)',
        700: 'var(--duration-700)',
        1000: 'var(--duration-1000)',
      },
      
      transitionTimingFunction: {
        linear: 'var(--ease-linear)',
        in: 'var(--ease-in)',
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        back: 'var(--ease-back)',
      },
      
      /* =============================================================================
       * GRADIENTS
       * ============================================================================= */
      
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-glass': 'var(--gradient-glass)',
        'gradient-surface': 'var(--gradient-surface)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-danger': 'var(--gradient-danger)',
      },
      
      /* =============================================================================
       * ANIMATION KEYFRAMES
       * ============================================================================= */
      
      animation: {
        'fade-in': 'fadeIn var(--duration-500) var(--ease-out)',
        'slide-up': 'slideUp var(--duration-300) var(--ease-out)',
        'slide-down': 'slideDown var(--duration-300) var(--ease-out)',
        'scale-in': 'scaleIn var(--duration-200) var(--ease-out)',
        'glass-shine': 'glassShine 2s var(--ease-in-out) infinite',
        'glass-float': 'glassFloat 6s var(--ease-in-out) infinite',
        'glow-pulse': 'glowPulse 2s var(--ease-in-out) infinite alternate',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glassShine: {
          '0%': { transform: 'translateX(-100%) rotate(35deg)' },
          '100%': { transform: 'translateX(100%) rotate(35deg)' },
        },
        glassFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        glowPulse: {
          '0%': { boxShadow: 'var(--shadow-glow)' },
          '100%': { boxShadow: 'var(--shadow-glow-lg)' },
        },
      },
    },
  },
  plugins: [],
}