import React from 'react';
import { Container, Section, Heading, Text, Button, Grid } from '../../components/ui';
import { 
  Brain, 
  AlertTriangle, 
  Route, 
  Award, 
  TrendingUp, 
  Users, 
  FileSpreadsheet, 
  BarChart3, 
  FileText,
  CheckCircle,
  Zap
} from 'lucide-react';
import { FeaturesSEO } from '../../components/SEO';
import { getFeaturesPageSchemas, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';
import {
  MarketingPageWrapper,
  HeroReveal,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  CTAReveal,
  AnimatedCard,
  InteractiveIcon,
  CTAButton,
  FeatureGrid,
  ScrollProgressIndicator
} from '../../components/marketing/animations';

const FeaturesPage: React.FC = () => {
  const featureCategories = [
    {
      title: 'Intelligent Scheduling & Optimization',
      description: 'AI-powered algorithms that learn from your data to create optimal schedules',
      features: [
        {
          name: 'AI-Powered Scheduling',
          description: 'Machine learning algorithms optimize assignments based on skills, location, and availability',
          icon: Brain,
          benefits: ['40% reduction in travel time', '25% increase in daily capacity', '90% fewer conflicts'],
          demoType: 'scheduling'
        },
        {
          name: 'Real-time Conflict Resolution',
          description: 'Automatic detection and intelligent resolution of scheduling conflicts',
          icon: AlertTriangle,
          benefits: ['Instant conflict detection', 'Multiple resolution options', 'Zero-disruption updates'],
          demoType: 'conflict'
        },
        {
          name: 'Dynamic Route Optimization',
          description: 'Continuously optimized routes that adapt to real-time conditions',
          icon: Route,
          benefits: ['35% fuel cost savings', 'Reduced vehicle wear', 'Improved punctuality'],
          demoType: 'routes'
        }
      ]
    },
    {
      title: 'Comprehensive Team Management',
      description: 'Everything you need to manage, develop, and optimize your field teams',
      features: [
        {
          name: 'Skills & Certifications Tracking',
          description: 'Comprehensive profiles with skills, certifications, and training records',
          icon: Award,
          benefits: ['Automatic skill matching', 'Certification expiry alerts', 'Training gap analysis'],
          demoType: 'skills'
        },
        {
          name: 'Performance Analytics',
          description: 'Detailed performance metrics and analytics for continuous improvement',
          icon: TrendingUp,
          benefits: ['Individual performance tracking', 'Team benchmarking', 'Improvement recommendations'],
          demoType: 'performance'
        },
        {
          name: 'Capacity Planning',
          description: 'Intelligent capacity planning based on historical data and growth projections',
          icon: Users,
          benefits: ['Optimal team sizing', 'Seasonal demand planning', 'Skills gap identification'],
          demoType: 'capacity'
        }
      ]
    },
    {
      title: 'Advanced Data & Analytics',
      description: 'Transform raw data into actionable insights for better decision making',
      features: [
        {
          name: 'Smart Data Processing',
          description: 'Intelligent CSV/Excel processing with automatic column mapping',
          icon: FileSpreadsheet,
          benefits: ['Zero manual mapping', 'Error detection & correction', 'Bulk data validation'],
          demoType: 'data'
        },
        {
          name: 'Real-time Dashboards',
          description: 'Live operational dashboards with customizable KPIs and metrics',
          icon: BarChart3,
          benefits: ['Live operational metrics', 'Custom KPI tracking', 'Mobile-responsive design'],
          demoType: 'dashboard'
        },
        {
          name: 'Automated Reporting',
          description: 'Scheduled reports with custom templates and automated distribution',
          icon: FileText,
          benefits: ['Automated report generation', 'Custom PDF templates', 'Scheduled distribution'],
          demoType: 'reporting'
        }
      ]
    }
  ];

  const integrations = [
    { name: 'Salesforce', logo: '/integrations/salesforce.svg', category: 'CRM' },
    { name: 'QuickBooks', logo: '/integrations/quickbooks.svg', category: 'Accounting' },
    { name: 'Slack', logo: '/integrations/slack.svg', category: 'Communication' },
    { name: 'Microsoft Teams', logo: '/integrations/teams.svg', category: 'Communication' },
    { name: 'Google Calendar', logo: '/integrations/google-calendar.svg', category: 'Scheduling' },
    { name: 'Zapier', logo: '/integrations/zapier.svg', category: 'Automation' },
  ];

  // Generate structured data for features page
  const featuresPageSchemas = getFeaturesPageSchemas();
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Features', url: '/features' }
  ]);
  const allSchemas = [...featuresPageSchemas, breadcrumbSchema];

  return (
    <div className="pt-16 lg:pt-20">
      <ScrollProgressIndicator />
      <FeaturesSEO 
        jsonLd={allSchemas}
        ogImage="/images/og/features-overview.jpg"
        ogImageAlt="Advanced Features - Field Service Management Software"
        twitterImage="/images/twitter/features-overview.jpg"
        twitterImageAlt="AI scheduling, route optimization, and team management features"
      />
      {/* Features Hero */}
      <section className="marketing-hero relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-subtle-dots opacity-20"></div>
        </div>
        
        <div className="marketing-container relative z-10">
          <HeroReveal className="marketing-text-container text-center">
            <h1 className="ttt-hero-heading font-bold text-white mb-6 leading-tight">
              Powerful features for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-success-light block mt-1">
                modern field service
              </span>
            </h1>
            
            <p className="ttt-text-lead text-text-secondary mb-8 leading-relaxed">
              Every feature is designed to solve real-world challenges faced by 
              field service companies. From AI-powered scheduling to real-time 
              optimization, we've got you covered.
            </p>
          </HeroReveal>
        </div>
      </section>

      {/* Feature Categories */}
      {featureCategories.map((category, categoryIndex) => (
        <section key={categoryIndex} className={`marketing-section ${categoryIndex % 2 === 1 ? 'bg-surface/30' : ''}`}>
          <div className="marketing-container">
            <ScrollReveal className="text-center mb-12">
              <h2 className="ttt-section-header text-white mb-4">
                {category.title}
              </h2>
              <p className="ttt-text-lead text-text-secondary marketing-text-container leading-relaxed">
                {category.description}
              </p>
            </ScrollReveal>

            <StaggerGroup className="space-y-12">
              {category.features.map((feature, featureIndex) => {
                const Icon = feature.icon;
                const isReverse = featureIndex % 2 === 1;
                
                return (
                  <StaggerItem key={featureIndex}>
                    <div className="marketing-feature-card group overflow-hidden">
                    <div className={`grid lg:grid-cols-2 ${isReverse ? 'lg:grid-flow-col-dense' : ''}`}>
                    {/* Feature Content */}
                    <div className={`p-6 lg:p-10 ${isReverse ? 'lg:col-start-2' : ''}`}>
                      <div className="flex items-center mb-6">
                        <div className="marketing-feature-icon mr-4">
                          <InteractiveIcon rotateOnHover>
                            <Icon className="w-6 h-6 text-brand-primary" />
                          </InteractiveIcon>
                        </div>
                        <h3 className="ttt-section-header text-white">
                          {feature.name}
                        </h3>
                      </div>
                      
                      <p className="ttt-text-lead text-text-secondary mb-6 leading-relaxed">
                        {feature.description}
                      </p>

                      <div className="mb-8">
                        <h4 className="ttt-feature-title text-white mb-4">
                          Key Benefits
                        </h4>
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, benefitIndex) => (
                            <li key={benefitIndex} className="flex items-start ttt-feature-description">
                              <CheckCircle className="w-4 h-4 text-success mt-0.5 mr-3 flex-shrink-0" />
                              <span className="leading-relaxed">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <CTAButton variant="primary">
                        Try This Feature
                      </CTAButton>
                    </div>

                    {/* Feature Demo/Visual */}
                    <div className={`bg-surface-elevated p-6 lg:p-10 ${isReverse ? 'lg:col-start-1' : ''}`}>
                      <AnimatedCard className="aspect-video bg-gradient-to-br from-surface to-surface-elevated rounded-xl border border-border flex items-center justify-center overflow-hidden" hoverLift>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-brand-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <InteractiveIcon pulseOnHover size="lg">
                              <Icon className="w-8 h-8 text-brand-primary" />
                            </InteractiveIcon>
                          </div>
                          <p className="ttt-text-small text-text-muted font-medium">Interactive demo coming soon</p>
                        </div>
                      </AnimatedCard>
                    </div>
                    </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </div>
        </section>
      ))}

      {/* Integration Ecosystem */}
      <section className="marketing-section bg-surface/20">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Seamless integrations with your existing tools
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container leading-relaxed">
              Connect with the tools you already use. Our robust API and 
              pre-built integrations make setup effortless.
            </p>
          </ScrollReveal>
          
          <StaggerGroup className="marketing-feature-grid mb-10">
            {integrations.map((integration, index) => (
              <StaggerItem key={index}>
                <AnimatedCard className="marketing-feature-card group text-center" hoverLift>
                  <InteractiveIcon className="mx-auto mb-4" size="lg">
                    <div className="w-12 h-12 bg-white/90 rounded-lg flex items-center justify-center shadow-sm">
                      <div className="text-gray-600 text-xs font-bold">{integration.name.slice(0, 2)}</div>
                    </div>
                  </InteractiveIcon>
                  <h3 className="ttt-feature-title mb-3">
                    {integration.name}
                  </h3>
                  <p className="ttt-feature-description">
                    {integration.category}
                  </p>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <CTAReveal className="text-center">
            <CTAButton variant="secondary" size="lg">
              <Zap className="mr-2 w-5 h-5" />
              View All 50+ Integrations
            </CTAButton>
          </CTAReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="marketing-section relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        </div>
        
        <div className="marketing-container text-center relative z-10">
          <CTAReveal className="marketing-cta-section">
            <h2 className="ttt-section-header text-white mb-4">
              Ready to experience these features?
            </h2>
            <p className="ttt-text-lead text-text-secondary mb-8 marketing-text-container mx-auto leading-relaxed">
              Start your free trial today and see how our features can transform 
              your field service operations.
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
                Full feature access
              </span>
            </div>
          </CTAReveal>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;