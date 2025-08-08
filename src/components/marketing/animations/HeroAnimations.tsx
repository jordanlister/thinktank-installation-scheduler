/**
 * Hero Section Animations
 * Sophisticated background animations for the landing page hero section
 * Includes animated grid, floating elements, and particle effects
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// ANIMATED BACKGROUND GRID
// ============================================================================

interface AnimatedGridProps {
  className?: string;
  intensity?: 'subtle' | 'normal' | 'dramatic';
  color?: string;
}

export const AnimatedGrid: React.FC<AnimatedGridProps> = ({
  className,
  intensity = 'normal',
  color = 'rgba(16, 185, 129, 0.1)',
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Add performance optimization
    grid.style.willChange = 'transform, opacity';

    return () => {
      grid.style.willChange = 'auto';
    };
  }, []);

  const gridOpacity = {
    subtle: 0.05,
    normal: 0.1,
    dramatic: 0.2,
  }[intensity];

  const gridSize = {
    subtle: 60,
    normal: 50,
    dramatic: 40,
  }[intensity];

  return (
    <div
      ref={gridRef}
      className={cn(
        'absolute inset-0 bg-grid-animate pointer-events-none',
        className
      )}
      style={{
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        opacity: gridOpacity,
      }}
      aria-hidden="true"
    />
  );
};

// ============================================================================
// FLOATING GEOMETRIC ELEMENTS
// ============================================================================

interface FloatingElementProps {
  shape?: 'circle' | 'square' | 'triangle' | 'hexagon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  className?: string;
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  shape = 'circle',
  size = 'md',
  color = 'var(--brand-primary)',
  animationSpeed = 'medium',
  className,
}) => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-6 h-6',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  const animations = {
    slow: 'bg-float-slow',
    medium: 'bg-float-medium',
    fast: 'bg-float-fast',
  };

  const shapes = {
    circle: 'rounded-full',
    square: 'rounded-lg',
    triangle: 'clip-triangle',
    hexagon: 'clip-hexagon',
  };

  return (
    <div
      className={cn(
        'absolute hero-bg-element gpu-accelerated',
        sizes[size],
        shapes[shape],
        animations[animationSpeed],
        className
      )}
      style={{
        background: color,
        opacity: 0.1,
      }}
      aria-hidden="true"
    />
  );
};

// ============================================================================
// FLOATING ELEMENTS CONTAINER
// ============================================================================

interface FloatingElementsProps {
  count?: number;
  className?: string;
}

export const FloatingElements: React.FC<FloatingElementsProps> = ({
  count = 8,
  className,
}) => {
  const elements = Array.from({ length: count }, (_, i) => {
    const shapes: Array<FloatingElementProps['shape']> = ['circle', 'square', 'triangle'];
    const sizes: Array<FloatingElementProps['size']> = ['sm', 'md', 'lg'];
    const speeds: Array<FloatingElementProps['animationSpeed']> = ['slow', 'medium', 'fast'];
    
    const shape = shapes[i % shapes.length];
    const size = sizes[i % sizes.length];
    const speed = speeds[i % speeds.length];

    // Generate random positions
    const top = Math.random() * 80 + 10; // 10% to 90%
    const left = Math.random() * 80 + 10; // 10% to 90%

    return {
      id: i,
      shape,
      size,
      speed,
      style: {
        top: `${top}%`,
        left: `${left}%`,
      },
    };
  });

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {elements.map((element) => (
        <FloatingElement
          key={element.id}
          shape={element.shape}
          size={element.size}
          animationSpeed={element.speed}
          style={element.style}
        />
      ))}
    </div>
  );
};

// ============================================================================
// HERO TEXT REVEAL ANIMATION
// ============================================================================

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className,
  delay = 0,
  staggerDelay = 0.1,
}) => {
  const words = text.split(' ');
  
  return (
    <div className={cn('overflow-hidden', className)}>
      {words.map((word, index) => (
        <span
          key={index}
          className={cn(
            'inline-block animate-fade-in-up opacity-0',
            `stagger-${Math.min(index + 1, 8)}`
          )}
          style={{
            animationDelay: `${delay + index * staggerDelay}s`,
            animationFillMode: 'forwards',
          }}
        >
          {word}
          {index < words.length - 1 && ' '}
        </span>
      ))}
    </div>
  );
};

// ============================================================================
// HERO BACKGROUND GRADIENT
// ============================================================================

interface HeroGradientProps {
  className?: string;
  animated?: boolean;
}

export const HeroGradient: React.FC<HeroGradientProps> = ({
  className,
  animated = true,
}) => {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-gradient-hero',
        animated && 'bg-float-slow',
        className
      )}
      style={{
        background: `
          radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(26, 54, 93, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(66, 153, 225, 0.1) 0%, transparent 70%)
        `,
      }}
      aria-hidden="true"
    />
  );
};

// ============================================================================
// PRODUCT MOCKUP FLOAT
// ============================================================================

interface ProductMockupProps {
  className?: string;
  children: React.ReactNode;
}

export const ProductMockup: React.FC<ProductMockupProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'relative bg-float-slow gpu-accelerated',
        'hover:scale-105 transition-transform duration-500 ease-out',
        className
      )}
    >
      {children}
    </div>
  );
};

// ============================================================================
// HERO PARTICLES EFFECT
// ============================================================================

interface ParticlesProps {
  count?: number;
  color?: string;
  className?: string;
}

export const Particles: React.FC<ParticlesProps> = ({
  count = 20,
  color = 'rgba(16, 185, 129, 0.3)',
  className,
}) => {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    // Create particles dynamically for better performance
    const particles: HTMLDivElement[] = [];
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 rounded-full pointer-events-none';
      particle.style.background = color;
      particle.style.opacity = (Math.random() * 0.5 + 0.1).toString();
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      particle.style.animationDuration = `${10 + Math.random() * 20}s`;
      particle.classList.add('bg-float-slow');
      
      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(particle => {
        if (container.contains(particle)) {
          container.removeChild(particle);
        }
      });
    };
  }, [count, color]);

  return (
    <div
      ref={particlesRef}
      className={cn('absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
    />
  );
};

// ============================================================================
// HERO STATS COUNTER ANIMATION
// ============================================================================

interface AnimatedCounterProps {
  endValue: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  endValue,
  duration = 2000,
  suffix = '',
  prefix = '',
  className,
}) => {
  const [currentValue, setCurrentValue] = React.useState(0);
  const counterRef = useRef<HTMLSpanElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const element = counterRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startAnimation();
          observerRef.current?.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(element);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      observerRef.current?.disconnect();
    };
  }, []);

  const startAnimation = () => {
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
      
      setCurrentValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  return (
    <span ref={counterRef} className={className}>
      {prefix}{currentValue.toLocaleString()}{suffix}
    </span>
  );
};

// ============================================================================
// MAIN HERO ANIMATIONS COMPONENT
// ============================================================================

interface HeroAnimationsProps {
  className?: string;
  showGrid?: boolean;
  showFloatingElements?: boolean;
  showParticles?: boolean;
  showGradient?: boolean;
}

export const HeroAnimations: React.FC<HeroAnimationsProps> = ({
  className,
  showGrid = true,
  showFloatingElements = true,
  showParticles = true,
  showGradient = true,
}) => {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {showGradient && <HeroGradient />}
      {showGrid && <AnimatedGrid />}
      {showFloatingElements && <FloatingElements />}
      {showParticles && <Particles />}
    </div>
  );
};

// Export all components
export default {
  AnimatedGrid,
  FloatingElements,
  AnimatedText,
  HeroGradient,
  ProductMockup,
  Particles,
  AnimatedCounter,
  HeroAnimations,
};