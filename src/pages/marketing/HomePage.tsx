import React from 'react';
import { Container, Section, Heading, Text, Button, Grid } from '../../components/ui';
import { CheckCircle, Calendar, MapPin, Users, BarChart3, Database, Zap } from 'lucide-react';
import { HomeSEO } from '../../components/SEO';
import { getHomePageSchemas, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';
import { 
  HeroReveal,
  ScrollReveal,
  FeatureGrid,
  AnimatedStats,
  CTAReveal,
  SectionTransition,
  ScrollProgressIndicator,
  CTAButton,
  FeatureCard,
  InteractiveIcon,
  AnimatedCounter
} from '../../components/marketing/animations';

const HomePage: React.FC = () => {
  // Generate structured data for homepage
  const homePageSchemas = getHomePageSchemas();
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', url: '/' }
  ]);
  const allSchemas = [...homePageSchemas, breadcrumbSchema];

  return (
    <div className="pt-16 lg:pt-20">
      <ScrollProgressIndicator />
      <HomeSEO 
        jsonLd={allSchemas}
        ogImage="/images/og/homepage-hero.jpg"
        ogImageAlt="Lead Route - AI-Powered Field Service Management Software"
        twitterImage="/images/twitter/homepage-hero.jpg"
        twitterImageAlt="Transform your field service operations with intelligent scheduling"
      />
      {/* Hero Section */}
      <section className="marketing-hero relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-subtle-dots opacity-20"></div>
        </div>
        
        <div className="marketing-container relative z-10">
          <HeroReveal className="marketing-text-container text-center">
            
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-success/10 border border-success/30 text-success mb-6 text-sm">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Trusted by 500+ field service companies
            </div>
            
            {/* Main Headline */}
            <h1 className="ttt-hero-heading font-bold text-white mb-4 leading-tight">
              Transform Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-success-light block mt-1">
                Field Service
              </span>
              Operations
            </h1>
            
            {/* Subheading */}
            <p className="ttt-text-lead text-text-secondary mb-8 leading-relaxed">
              Intelligent scheduling, route optimization, and team management 
              that reduces costs by 25% while improving customer satisfaction.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <CTAButton size="lg">
                Start Free Trial
              </CTAButton>
              <Button size="lg" variant="secondary">
                Watch Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="marketing-trust-indicators ttt-text-small text-text-muted">
              <span className="flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
                No credit card required
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
                14-day free trial
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
                Setup in under 5 minutes
              </span>
            </div>
          </HeroReveal>
        </div>
      </section>

      {/* Features Preview Section */}
      <section className="marketing-section bg-surface/50">
        <div className="marketing-container">
          {/* Section Header */}
          <ScrollReveal direction="up" className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Everything you need to scale field operations
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container leading-relaxed">
              From AI-powered scheduling to real-time optimization, 
              our platform handles the complexity so you can focus on growth.
            </p>
          </ScrollReveal>
          
          {/* Features Grid */}
          <FeatureGrid className="marketing-feature-grid">
            <FeatureCard 
              className="marketing-feature-card"
              icon={
                <div className="marketing-feature-icon bg-brand-primary/10">
                  <InteractiveIcon rotateOnHover>
                    <Calendar className="w-6 h-6 text-brand-primary" />
                  </InteractiveIcon>
                </div>
              }
              title="AI-Powered Scheduling"
              description="Smart algorithms optimize schedules based on location, skills, and availability"
            >
              <div className="ttt-text-small text-brand-primary font-medium">
                40% reduction in travel time
              </div>
            </FeatureCard>

            <FeatureCard 
              className="marketing-feature-card"
              icon={
                <div className="marketing-feature-icon bg-success/10">
                  <InteractiveIcon rotateOnHover>
                    <MapPin className="w-6 h-6 text-success" />
                  </InteractiveIcon>
                </div>
              }
              title="Route Optimization"
              description="Reduce travel time by 40% with intelligent geographic clustering"
            >
              <div className="ttt-text-small text-success font-medium">
                35% fuel cost savings
              </div>
            </FeatureCard>

            <FeatureCard 
              className="marketing-feature-card"
              icon={
                <div className="marketing-feature-icon bg-brand-accent/10">
                  <InteractiveIcon pulseOnHover>
                    <Users className="w-6 h-6 text-brand-accent" />
                  </InteractiveIcon>
                </div>
              }
              title="Team Management"
              description="Comprehensive profiles, skills tracking, and performance analytics"
            >
              <div className="ttt-text-small text-brand-accent font-medium">
                25% increase in capacity
              </div>
            </FeatureCard>

            <FeatureCard 
              className="marketing-feature-card"
              icon={
                <div className="marketing-feature-icon bg-warning/10">
                  <InteractiveIcon rotateOnHover>
                    <BarChart3 className="w-6 h-6 text-warning" />
                  </InteractiveIcon>
                </div>
              }
              title="Real-time Analytics"
              description="Live dashboards and automated reports for data-driven decisions"
            >
              <div className="ttt-text-small text-warning font-medium">
                <AnimatedCounter
                  value={90}
                  suffix="% faster reporting"
                  duration={2.5}
                  delay={0.5}
                  className="tabular-nums"
                />
              </div>
            </FeatureCard>

            <FeatureCard 
              className="marketing-feature-card"
              icon={
                <div className="marketing-feature-icon bg-info/10">
                  <InteractiveIcon pulseOnHover>
                    <Database className="w-6 h-6 text-info" />
                  </InteractiveIcon>
                </div>
              }
              title="Smart Data Processing"
              description="Automatic CSV processing with intelligent column mapping"
            >
              <div className="ttt-text-small text-info font-medium">
                Zero manual mapping
              </div>
            </FeatureCard>

            <FeatureCard 
              className="marketing-feature-card"
              icon={
                <div className="marketing-feature-icon bg-brand-primary/10">
                  <InteractiveIcon rotateOnHover>
                    <Zap className="w-6 h-6 text-brand-primary" />
                  </InteractiveIcon>
                </div>
              }
              title="Seamless Integrations"
              description="Connect with your existing CRM, accounting, and communication tools"
            >
              <div className="ttt-text-small text-brand-primary font-medium">
                50+ integrations
              </div>
            </FeatureCard>
          </FeatureGrid>
        </div>
      </section>

      {/* Stats Section */}
      <section className="marketing-section-tight">
        <div className="marketing-container">
          <ScrollReveal direction="up" className="text-center mb-10">
            <p className="ttt-text-lead text-text-secondary">
              Trusted by leading field service companies
            </p>
          </ScrollReveal>
          
          <AnimatedStats className="marketing-stats-grid">
            <div className="marketing-stats-card">
              <div className="text-2xl md:text-3xl font-bold text-brand-primary mb-1 tabular-nums">
                <AnimatedCounter
                  value={500}
                  suffix="+"
                  duration={2.0}
                  delay={0.2}
                />
              </div>
              <div className="ttt-text-small font-medium text-white mb-0.5">Companies</div>
              <div className="ttt-text-small text-text-muted">Trust our platform daily</div>
            </div>
            <div className="marketing-stats-card">
              <div className="text-2xl md:text-3xl font-bold text-brand-primary mb-1 tabular-nums">
                <AnimatedCounter
                  value={2000000}
                  duration={2.5}
                  delay={0.4}
                  formatNumber={(value) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(0)}M+`;
                    }
                    return value.toLocaleString();
                  }}
                />
              </div>
              <div className="ttt-text-small font-medium text-white mb-0.5">Installations</div>
              <div className="ttt-text-small text-text-muted">Scheduled and optimized</div>
            </div>
            <div className="marketing-stats-card">
              <div className="text-2xl md:text-3xl font-bold text-brand-primary mb-1 tabular-nums">
                <AnimatedCounter
                  value={25}
                  suffix="%"
                  duration={2.0}
                  delay={0.6}
                />
              </div>
              <div className="ttt-text-small font-medium text-white mb-0.5">Cost Reduction</div>
              <div className="ttt-text-small text-text-muted">Average savings achieved</div>
            </div>
            <div className="marketing-stats-card">
              <div className="text-2xl md:text-3xl font-bold text-brand-primary mb-1 tabular-nums">
                <AnimatedCounter
                  value={99.9}
                  suffix="%"
                  duration={2.5}
                  delay={0.8}
                  decimals={1}
                />
              </div>
              <div className="ttt-text-small font-medium text-white mb-0.5">Uptime</div>
              <div className="ttt-text-small text-text-muted">Enterprise-grade reliability</div>
            </div>
          </AnimatedStats>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="marketing-section relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        </div>
        
        <div className="marketing-container text-center relative z-10">
          <CTAReveal className="marketing-cta-section">
            <h2 className="ttt-section-header text-white mb-6">
              Ready to transform your operations?
            </h2>
            <p className="ttt-text-lead text-text-secondary mb-8 marketing-text-container mx-auto leading-relaxed">
              Join 500+ companies using Lead Route to optimize 
              their field service operations. Start your free trial today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <CTAButton size="xl">
                Start Free Trial
              </CTAButton>
              <Button size="xl" variant="secondary">
                Schedule Demo
              </Button>
            </div>
            
            <div className="marketing-trust-indicators ttt-text-small text-text-muted">
              <span className="flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
                Free 14-day trial
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
                No setup fees
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
                Cancel anytime
              </span>
            </div>
          </CTAReveal>
        </div>
      </section>
    </div>
  );
};

export default HomePage;