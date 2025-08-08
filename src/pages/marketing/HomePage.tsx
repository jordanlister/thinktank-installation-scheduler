import React from 'react';
import { Container, Section, Heading, Text, Button, Grid } from '../../components/ui';
import { ArrowRight, Play, CheckCircle, Calendar, MapPin, Users, BarChart3, Database, Zap } from 'lucide-react';
import { HomeSEO } from '../../components/SEO';
import { getHomePageSchemas, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';

const HomePage: React.FC = () => {
  // Generate structured data for homepage
  const homePageSchemas = getHomePageSchemas();
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', url: '/' }
  ]);
  const allSchemas = [...homePageSchemas, breadcrumbSchema];

  return (
    <div className="pt-16 lg:pt-20">
      <HomeSEO 
        jsonLd={allSchemas}
        ogImage="/images/og/homepage-hero.jpg"
        ogImageAlt="Think Tank Technologies - AI-Powered Field Service Management Software"
        twitterImage="/images/twitter/homepage-hero.jpg"
        twitterImageAlt="Transform your field service operations with intelligent scheduling"
      />
      {/* Hero Section */}
      <Section spacing="xl" className="relative overflow-hidden min-h-screen flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-subtle-dots opacity-20"></div>
        </div>
        
        <Container className="relative z-10">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-success/10 border border-success/30 text-success mb-8">
              <CheckCircle className="w-4 h-4 mr-2" />
              Trusted by 500+ field service companies
            </div>
            
            {/* Main Headline */}
            <Heading variant="h1" className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Transform Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-success-light block">
                Field Service
              </span>
              Operations
            </Heading>
            
            {/* Subheading */}
            <Text size="xl" className="text-text-secondary mb-12 max-w-2xl leading-relaxed">
              Intelligent scheduling, route optimization, and team management 
              that reduces costs by 25% while improving customer satisfaction.
            </Text>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button size="lg" className="group">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="secondary" className="group">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-8 text-sm text-text-muted">
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-success" />
                No credit card required
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-success" />
                14-day free trial
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-success" />
                Setup in under 5 minutes
              </span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Features Preview Section */}
      <Section spacing="2xl" className="bg-surface/50">
        <Container>
          {/* Section Header */}
          <div className="text-center mb-20">
            <Heading variant="h2" className="text-4xl font-bold text-white mb-6">
              Everything you need to scale field operations
            </Heading>
            <Text size="lg" className="text-text-secondary max-w-3xl mx-auto">
              From AI-powered scheduling to real-time optimization, 
              our platform handles the complexity so you can focus on growth.
            </Text>
          </div>
          
          {/* Features Grid */}
          <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={8}>
            <div className="p-8 bg-surface-glass backdrop-blur-xl border border-border rounded-xl hover:border-brand-primary/30 hover:bg-surface-glass/80 transition-all duration-300 group">
              <Calendar className="w-8 h-8 text-brand-primary mb-4" />
              <Heading variant="h3" className="text-xl font-semibold text-white mb-3">
                AI-Powered Scheduling
              </Heading>
              <Text className="text-text-secondary mb-4">
                Smart algorithms optimize schedules based on location, skills, and availability
              </Text>
              <div className="text-sm text-brand-primary font-medium">
                40% reduction in travel time →
              </div>
            </div>

            <div className="p-8 bg-surface-glass backdrop-blur-xl border border-border rounded-xl hover:border-brand-primary/30 hover:bg-surface-glass/80 transition-all duration-300 group">
              <MapPin className="w-8 h-8 text-success mb-4" />
              <Heading variant="h3" className="text-xl font-semibold text-white mb-3">
                Route Optimization
              </Heading>
              <Text className="text-text-secondary mb-4">
                Reduce travel time by 40% with intelligent geographic clustering
              </Text>
              <div className="text-sm text-success font-medium">
                35% fuel cost savings →
              </div>
            </div>

            <div className="p-8 bg-surface-glass backdrop-blur-xl border border-border rounded-xl hover:border-brand-primary/30 hover:bg-surface-glass/80 transition-all duration-300 group">
              <Users className="w-8 h-8 text-brand-accent mb-4" />
              <Heading variant="h3" className="text-xl font-semibold text-white mb-3">
                Team Management
              </Heading>
              <Text className="text-text-secondary mb-4">
                Comprehensive profiles, skills tracking, and performance analytics
              </Text>
              <div className="text-sm text-brand-accent font-medium">
                25% increase in capacity →
              </div>
            </div>

            <div className="p-8 bg-surface-glass backdrop-blur-xl border border-border rounded-xl hover:border-brand-primary/30 hover:bg-surface-glass/80 transition-all duration-300 group">
              <BarChart3 className="w-8 h-8 text-warning mb-4" />
              <Heading variant="h3" className="text-xl font-semibold text-white mb-3">
                Real-time Analytics
              </Heading>
              <Text className="text-text-secondary mb-4">
                Live dashboards and automated reports for data-driven decisions
              </Text>
              <div className="text-sm text-warning font-medium">
                90% faster reporting →
              </div>
            </div>

            <div className="p-8 bg-surface-glass backdrop-blur-xl border border-border rounded-xl hover:border-brand-primary/30 hover:bg-surface-glass/80 transition-all duration-300 group">
              <Database className="w-8 h-8 text-info mb-4" />
              <Heading variant="h3" className="text-xl font-semibold text-white mb-3">
                Smart Data Processing
              </Heading>
              <Text className="text-text-secondary mb-4">
                Automatic CSV processing with intelligent column mapping
              </Text>
              <div className="text-sm text-info font-medium">
                Zero manual mapping →
              </div>
            </div>

            <div className="p-8 bg-surface-glass backdrop-blur-xl border border-border rounded-xl hover:border-brand-primary/30 hover:bg-surface-glass/80 transition-all duration-300 group">
              <Zap className="w-8 h-8 text-brand-primary mb-4" />
              <Heading variant="h3" className="text-xl font-semibold text-white mb-3">
                Seamless Integrations
              </Heading>
              <Text className="text-text-secondary mb-4">
                Connect with your existing CRM, accounting, and communication tools
              </Text>
              <div className="text-sm text-brand-primary font-medium">
                50+ integrations →
              </div>
            </div>
          </Grid>
        </Container>
      </Section>

      {/* Stats Section */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center mb-16">
            <Text className="text-text-muted mb-8">
              Trusted by leading field service companies
            </Text>
          </div>
          
          <Grid cols={{ base: 2, md: 4 }} gap={8} className="mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-primary mb-2">500+</div>
              <div className="text-lg font-medium text-white mb-1">Companies</div>
              <div className="text-sm text-text-muted">Trust our platform daily</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-primary mb-2">2M+</div>
              <div className="text-lg font-medium text-white mb-1">Installations</div>
              <div className="text-sm text-text-muted">Scheduled and optimized</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-primary mb-2">25%</div>
              <div className="text-lg font-medium text-white mb-1">Cost Reduction</div>
              <div className="text-sm text-text-muted">Average savings achieved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-primary mb-2">99.9%</div>
              <div className="text-lg font-medium text-white mb-1">Uptime</div>
              <div className="text-sm text-text-muted">Enterprise-grade reliability</div>
            </div>
          </Grid>
        </Container>
      </Section>

      {/* Final CTA Section */}
      <Section spacing="2xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        </div>
        
        <Container className="text-center relative z-10">
          <Heading variant="h2" className="text-5xl font-bold text-white mb-8">
            Ready to transform your operations?
          </Heading>
          <Text size="xl" className="text-text-secondary mb-12 max-w-3xl mx-auto">
            Join 500+ companies using Think Tank Technologies to optimize 
            their field service operations. Start your free trial today.
          </Text>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button size="xl" className="group">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="xl" variant="secondary">
              Schedule Demo
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-text-muted">
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-success" />
              Free 14-day trial
            </span>
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-success" />
              No setup fees
            </span>
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-success" />
              Cancel anytime
            </span>
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default HomePage;