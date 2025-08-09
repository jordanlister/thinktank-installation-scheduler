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
      <FeaturesSEO 
        jsonLd={allSchemas}
        ogImage="/images/og/features-overview.jpg"
        ogImageAlt="Advanced Features - Field Service Management Software"
        twitterImage="/images/twitter/features-overview.jpg"
        twitterImageAlt="AI scheduling, route optimization, and team management features"
      />
      {/* Features Hero */}
      <section className="marketing-hero">
        <div className="marketing-container">
          <div className="marketing-text-container text-center">
            <h1 className="ttt-hero-heading font-bold text-white mb-4 leading-tight">
              Powerful features for modern field service
            </h1>
            <p className="ttt-text-lead text-text-secondary leading-relaxed">
              Every feature is designed to solve real-world challenges faced by 
              field service companies. From AI-powered scheduling to real-time 
              optimization, we've got you covered.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      {featureCategories.map((category, categoryIndex) => (
        <section key={categoryIndex} className={`marketing-section ${categoryIndex % 2 === 1 ? 'bg-surface/30' : ''}`}>
          <div className="marketing-container">
            <div className="text-center mb-12">
              <h2 className="ttt-section-header text-white mb-4">
                {category.title}
              </h2>
              <p className="ttt-text-lead text-text-secondary marketing-text-container mx-auto leading-relaxed">
                {category.description}
              </p>
            </div>

            <div className="space-y-12">
              {category.features.map((feature, featureIndex) => {
                const Icon = feature.icon;
                const isReverse = featureIndex % 2 === 1;
                
                return (
                  <div key={featureIndex} className={`grid lg:grid-cols-2 gap-8 items-center ${isReverse ? 'lg:grid-flow-col-dense' : ''}`}>
                    {/* Feature Content */}
                    <div className={isReverse ? 'lg:col-start-2' : ''}>
                      <div className="flex items-start mb-4">
                        <div className="marketing-feature-icon bg-brand-primary/10 border border-brand-primary/20 mr-4 flex-shrink-0">
                          <Icon className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div>
                          <h3 className="ttt-feature-title text-white">
                            {feature.name}
                          </h3>
                        </div>
                      </div>
                      
                      <p className="ttt-feature-description mb-4 leading-relaxed">
                        {feature.description}
                      </p>

                      <div className="mb-6">
                        <p className="ttt-text-small text-white font-semibold mb-3">Key Benefits:</p>
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, benefitIndex) => (
                            <li key={benefitIndex} className="flex items-start text-text-secondary ttt-text-small">
                              <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button variant="primary">
                        Try This Feature
                      </Button>
                    </div>

                    {/* Feature Demo/Visual */}
                    <div className={isReverse ? 'lg:col-start-1' : ''}>
                      <div className="marketing-feature-card group">
                        <div className="aspect-video bg-gradient-to-br from-surface to-surface-elevated rounded-xl border border-border flex items-center justify-center overflow-hidden">
                          <div className="text-center group-hover:scale-105 transition-transform duration-300">
                            <div className="w-16 h-16 bg-brand-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <Icon className="w-8 h-8 text-brand-primary" />
                            </div>
                            <p className="ttt-text-small text-text-muted font-medium">Interactive demo coming soon</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Integration Ecosystem */}
      <section className="marketing-section bg-surface/20">
        <div className="marketing-container">
          <div className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Seamless integrations with your existing tools
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container mx-auto leading-relaxed">
              Connect with the tools you already use. Our robust API and 
              pre-built integrations make setup effortless.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {integrations.map((integration, index) => (
              <div key={index} className="marketing-feature-card text-center group p-4">
                <div className="w-12 h-12 bg-white/90 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm">
                  <div className="text-gray-600 text-xs font-bold">{integration.name.slice(0, 2)}</div>
                </div>
                <p className="ttt-text-small font-medium text-white mb-1">{integration.name}</p>
                <p className="ttt-text-small text-text-muted">{integration.category}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="secondary" size="lg">
              <Zap className="mr-2 w-5 h-5" />
              View All 50+ Integrations
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="marketing-section relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        </div>
        
        <div className="marketing-container text-center relative z-10">
          <div className="marketing-cta-section">
            <h2 className="ttt-section-header text-white mb-4">
              Ready to experience these features?
            </h2>
            <p className="ttt-text-lead text-text-secondary mb-8 marketing-text-container mx-auto leading-relaxed">
              Start your free trial today and see how our features can transform 
              your field service operations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl">
                Start Free Trial
              </Button>
              <Button size="xl" variant="secondary">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;