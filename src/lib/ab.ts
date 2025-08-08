/**
 * A/B Testing Framework
 * 
 * Lightweight experimentation system with:
 * - SSR-safe variant assignment
 * - Zero layout shift implementation
 * - SEO compliance (no cloaking)
 * - Cookie-based persistence
 * - URL parameter overrides
 * - Statistical significance tracking
 */

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABVariant[];
  trafficAllocation: number; // 0-100 percentage
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  targeting: ABTestTargeting;
  metrics: ABTestMetric[];
}

export interface ABVariant {
  id: string;
  name: string;
  weight: number; // 0-100 percentage within allocated traffic
  changes: ABTestChange[];
}

export interface ABTestChange {
  type: 'text' | 'style' | 'component' | 'redirect';
  selector?: string;
  content?: string;
  styles?: Record<string, string>;
  component?: string;
  url?: string;
}

export interface ABTestTargeting {
  pages?: string[]; // Page paths to include
  excludePages?: string[]; // Page paths to exclude
  userAgent?: RegExp;
  geo?: string[]; // Country codes
  newVisitors?: boolean;
  returningVisitors?: boolean;
  minScreenWidth?: number;
  maxScreenWidth?: number;
}

export interface ABTestMetric {
  name: string;
  type: 'conversion' | 'engagement' | 'revenue';
  goal: 'increase' | 'decrease';
  baseline?: number;
  targetImprovement?: number;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  assigned: boolean;
  reason: string;
}

export interface ABTestStats {
  testId: string;
  variantStats: VariantStats[];
  winner?: string;
  confidence?: number;
  completed: boolean;
}

export interface VariantStats {
  variantId: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  significance?: number;
}

// Cookie and storage utilities
class ABTestStorage {
  private static readonly COOKIE_PREFIX = 'ab_test_';
  private static readonly COOKIE_EXPIRY_DAYS = 30;
  
  public static getVariant(testId: string): string | null {
    // Check URL parameter first (for testing/debugging)
    const urlParams = new URLSearchParams(window.location.search);
    const urlVariant = urlParams.get(`ab_${testId}`);
    if (urlVariant) {
      return urlVariant;
    }
    
    // Check cookie
    return this.getCookie(`${this.COOKIE_PREFIX}${testId}`);
  }
  
  public static setVariant(testId: string, variantId: string): void {
    this.setCookie(
      `${this.COOKIE_PREFIX}${testId}`,
      variantId,
      this.COOKIE_EXPIRY_DAYS
    );
  }
  
  private static getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }
  
  private static setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }
}

// Variant assignment logic
export class ABTestEngine {
  private tests = new Map<string, ABTest>();
  private assignments = new Map<string, string>();
  
  public registerTest(test: ABTest): void {
    this.tests.set(test.id, test);
  }
  
  public getVariant(testId: string): ABTestResult {
    const test = this.tests.get(testId);
    
    if (!test) {
      return {
        testId,
        variantId: 'control',
        assigned: false,
        reason: 'test_not_found'
      };
    }
    
    // Check if test is active
    if (test.status !== 'active') {
      return {
        testId,
        variantId: 'control',
        assigned: false,
        reason: `test_${test.status}`
      };
    }
    
    // Check if test has started
    if (new Date() < test.startDate) {
      return {
        testId,
        variantId: 'control',
        assigned: false,
        reason: 'test_not_started'
      };
    }
    
    // Check if test has ended
    if (test.endDate && new Date() > test.endDate) {
      return {
        testId,
        variantId: 'control',
        assigned: false,
        reason: 'test_ended'
      };
    }
    
    // Check targeting criteria
    if (!this.matchesTargeting(test.targeting)) {
      return {
        testId,
        variantId: 'control',
        assigned: false,
        reason: 'targeting_mismatch'
      };
    }
    
    // Check for existing assignment
    const existingVariant = ABTestStorage.getVariant(testId);
    if (existingVariant) {
      return {
        testId,
        variantId: existingVariant,
        assigned: true,
        reason: 'existing_assignment'
      };
    }
    
    // Determine if user should be in test
    const userHash = this.getUserHash();
    const trafficThreshold = test.trafficAllocation / 100;
    
    if (userHash > trafficThreshold) {
      return {
        testId,
        variantId: 'control',
        assigned: false,
        reason: 'traffic_allocation'
      };
    }
    
    // Assign variant based on weights
    const variantId = this.assignVariant(test.variants, userHash);
    
    // Store assignment
    ABTestStorage.setVariant(testId, variantId);
    this.assignments.set(testId, variantId);
    
    // Track assignment event
    this.trackAssignment(testId, variantId);
    
    return {
      testId,
      variantId,
      assigned: true,
      reason: 'new_assignment'
    };
  }
  
  private matchesTargeting(targeting: ABTestTargeting): boolean {
    const currentPath = window.location.pathname;
    
    // Check page inclusion/exclusion
    if (targeting.pages && !targeting.pages.some(page => currentPath.startsWith(page))) {
      return false;
    }
    
    if (targeting.excludePages && targeting.excludePages.some(page => currentPath.startsWith(page))) {
      return false;
    }
    
    // Check user agent
    if (targeting.userAgent && !targeting.userAgent.test(navigator.userAgent)) {
      return false;
    }
    
    // Check screen width
    if (targeting.minScreenWidth && window.innerWidth < targeting.minScreenWidth) {
      return false;
    }
    
    if (targeting.maxScreenWidth && window.innerWidth > targeting.maxScreenWidth) {
      return false;
    }
    
    // Check new vs returning visitors
    const isNewVisitor = !this.hasVisitedBefore();
    if (targeting.newVisitors === true && !isNewVisitor) {
      return false;
    }
    
    if (targeting.returningVisitors === true && isNewVisitor) {
      return false;
    }
    
    return true;
  }
  
  private getUserHash(): number {
    // Generate consistent hash for user (using client fingerprinting)
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().toDateString() // Daily hash to ensure randomization
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Normalize to 0-1 range
    return Math.abs(hash) / Math.pow(2, 31);
  }
  
  private assignVariant(variants: ABVariant[], userHash: number): string {
    // Sort variants by weight for consistent assignment
    const sortedVariants = [...variants].sort((a, b) => a.weight - b.weight);
    
    let cumulativeWeight = 0;
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const normalizedHash = userHash * (totalWeight / 100);
    
    for (const variant of sortedVariants) {
      cumulativeWeight += variant.weight;
      if (normalizedHash <= cumulativeWeight) {
        return variant.id;
      }
    }
    
    // Fallback to control
    return sortedVariants[0]?.id || 'control';
  }
  
  private hasVisitedBefore(): boolean {
    return document.cookie.includes('ttt_returning_visitor=true');
  }
  
  private trackAssignment(testId: string, variantId: string): void {
    // Track assignment in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ab_test_assignment', {
        event_category: 'AB Testing',
        custom_parameter_1: testId,
        custom_parameter_2: variantId
      });
    }
  }
  
  public getActiveTests(): ABTest[] {
    return Array.from(this.tests.values()).filter(test => test.status === 'active');
  }
  
  public getAllAssignments(): Record<string, string> {
    const assignments: Record<string, string> = {};
    
    this.tests.forEach((test, testId) => {
      const result = this.getVariant(testId);
      if (result.assigned) {
        assignments[testId] = result.variantId;
      }
    });
    
    return assignments;
  }
}

// React hook for A/B testing
export function useABTest(testId: string): ABTestResult {
  const [result, setResult] = React.useState<ABTestResult>({
    testId,
    variantId: 'control',
    assigned: false,
    reason: 'loading'
  });
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const engine = getABTestEngine();
    const testResult = engine.getVariant(testId);
    setResult(testResult);
  }, [testId]);
  
  return result;
}

// React component for A/B test variants
export interface ABTestProviderProps {
  testId: string;
  children: React.ReactNode;
}

export function ABTestProvider({ testId, children }: ABTestProviderProps) {
  const result = useABTest(testId);
  
  return (
    <ABTestContext.Provider value={{ testId, result }}>
      {children}
    </ABTestContext.Provider>
  );
}

const ABTestContext = React.createContext<{
  testId: string;
  result: ABTestResult;
} | null>(null);

export function useABTestContext() {
  const context = React.useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTestContext must be used within ABTestProvider');
  }
  return context;
}

// Variant component
export interface VariantProps {
  name: string;
  children: React.ReactNode;
}

export function Variant({ name, children }: VariantProps) {
  const { result } = useABTestContext();
  
  if (result.variantId !== name && name !== 'control') {
    return null;
  }
  
  return <>{children}</>;
}

// Global A/B test engine
let globalABTestEngine: ABTestEngine | null = null;

export function initABTesting(): ABTestEngine {
  if (!globalABTestEngine) {
    globalABTestEngine = new ABTestEngine();
    
    // Register default tests
    registerDefaultTests();
  }
  
  return globalABTestEngine;
}

export function getABTestEngine(): ABTestEngine {
  if (!globalABTestEngine) {
    return initABTesting();
  }
  return globalABTestEngine;
}

// Default test configurations
function registerDefaultTests(): void {
  const engine = globalABTestEngine!;
  
  // Hero CTA button test
  engine.registerTest({
    id: 'hero_cta_text',
    name: 'Hero CTA Button Text',
    description: 'Testing different CTA button texts on homepage hero section',
    variants: [
      {
        id: 'control',
        name: 'Start Free Trial',
        weight: 34,
        changes: [
          {
            type: 'text',
            selector: '[data-testid="hero-cta-primary"]',
            content: 'Start Free Trial'
          }
        ]
      },
      {
        id: 'variant_a',
        name: 'Get Started Free',
        weight: 33,
        changes: [
          {
            type: 'text',
            selector: '[data-testid="hero-cta-primary"]',
            content: 'Get Started Free'
          }
        ]
      },
      {
        id: 'variant_b',
        name: 'Try It Now',
        weight: 33,
        changes: [
          {
            type: 'text',
            selector: '[data-testid="hero-cta-primary"]',
            content: 'Try It Now'
          }
        ]
      }
    ],
    trafficAllocation: 50, // 50% of users
    status: 'active',
    startDate: new Date('2024-01-01'),
    targeting: {
      pages: ['/'],
      newVisitors: true
    },
    metrics: [
      {
        name: 'trial_signup',
        type: 'conversion',
        goal: 'increase',
        baseline: 3.2,
        targetImprovement: 15
      }
    ]
  });
  
  // Pricing page layout test
  engine.registerTest({
    id: 'pricing_layout',
    name: 'Pricing Page Layout',
    description: 'Testing 2-column vs 3-column pricing layout',
    variants: [
      {
        id: 'control',
        name: '3-Column Layout',
        weight: 50,
        changes: []
      },
      {
        id: 'two_column',
        name: '2-Column + Enterprise',
        weight: 50,
        changes: [
          {
            type: 'style',
            selector: '[data-testid="pricing-grid"]',
            styles: {
              'grid-template-columns': 'repeat(2, 1fr)',
              'max-width': '800px'
            }
          }
        ]
      }
    ],
    trafficAllocation: 30,
    status: 'active',
    startDate: new Date('2024-01-15'),
    targeting: {
      pages: ['/pricing']
    },
    metrics: [
      {
        name: 'pricing_conversion',
        type: 'conversion',
        goal: 'increase'
      }
    ]
  });
}

// Statistical significance calculator
export class ABTestAnalyzer {
  public static calculateSignificance(
    controlConversions: number,
    controlVisitors: number,
    variantConversions: number,
    variantVisitors: number
  ): { pValue: number; significant: boolean; confidence: number } {
    const p1 = controlConversions / controlVisitors;
    const p2 = variantConversions / variantVisitors;
    const pPool = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
    
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlVisitors + 1 / variantVisitors));
    const zScore = Math.abs(p2 - p1) / se;
    
    // Approximate p-value calculation (using normal distribution)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    const significant = pValue < 0.05;
    const confidence = (1 - pValue) * 100;
    
    return { pValue, significant, confidence };
  }
  
  private static normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }
  
  private static erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }
}

// React import (would be available in actual React project)
declare const React: any;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}