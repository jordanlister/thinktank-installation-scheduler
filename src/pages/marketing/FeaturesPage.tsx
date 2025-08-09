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
  ArrowRight,
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
      <Section spacing="2xl" className="py-20">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <Heading variant="h1" className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Powerful features for modern field service
            </Heading>
            <Text size="xl" className="text-text-secondary leading-relaxed max-w-3xl mx-auto">
              Every feature is designed to solve real-world challenges faced by 
              field service companies. From AI-powered scheduling to real-time 
              optimization, we've got you covered.
            </Text>
          </div>
        </Container>
      </Section>

      {/* Feature Categories */}
      {featureCategories.map((category, categoryIndex) => (
        <Section key={categoryIndex} spacing="2xl" className={categoryIndex % 2 === 1 ? 'bg-surface/30' : ''}>
          <Container>
            <div className="text-center mb-20">
              <Heading variant="h2" className="text-3xl md:text-4xl font-bold text-white mb-6">
                {category.title}
              </Heading>
              <Text size="lg" className="text-text-secondary max-w-3xl mx-auto leading-relaxed">
                {category.description}
              </Text>
            </div>

            <div className="space-y-24">
              {category.features.map((feature, featureIndex) => {
                const Icon = feature.icon;
                const isReverse = featureIndex % 2 === 1;
                
                return (
                  <div key={featureIndex} className={`grid lg:grid-cols-2 gap-16 items-center ${isReverse ? 'lg:grid-flow-col-dense' : ''}`}>
                    {/* Feature Content */}
                    <div className={isReverse ? 'lg:col-start-2' : ''}>
                      <div className="flex items-start mb-6">
                        <div className="w-14 h-14 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                          <Icon className="w-7 h-7 text-brand-primary" />
                        </div>
                        <div>
                          <Heading variant="h3" className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {feature.name}
                          </Heading>
                        </div>
                      </div>
                      
                      <Text className="text-text-secondary mb-8 text-lg leading-relaxed">
                        {feature.description}
                      </Text>

                      <div className="mb-8">
                        <Text className="text-white font-semibold mb-6 text-lg">Key Benefits:</Text>
                        <ul className="space-y-4">
                          {feature.benefits.map((benefit, benefitIndex) => (
                            <li key={benefitIndex} className="flex items-start text-text-secondary">
                              <CheckCircle className="w-5 h-5 text-success mr-3 flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button variant="primary" size="lg" className="group">
                        Try This Feature
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>

                    {/* Feature Demo/Visual */}
                    <div className={isReverse ? 'lg:col-start-1' : ''}>
                      <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl p-8 hover:border-brand-primary/30 transition-all duration-300 group">
                        <div className="aspect-video bg-gradient-to-br from-surface to-surface-elevated rounded-xl border border-border flex items-center justify-center overflow-hidden">
                          <div className="text-center group-hover:scale-105 transition-transform duration-300">
                            <div className="w-20 h-20 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Icon className="w-10 h-10 text-brand-primary" />
                            </div>
                            <Text className="text-text-muted font-medium">Interactive demo coming soon</Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </Section>
      ))}

      {/* Integration Ecosystem */}
      <Section spacing="2xl" className="bg-surface/20">
        <Container>
          <div className="text-center mb-16">
            <Heading variant="h2" className="text-3xl md:text-4xl font-bold text-white mb-6">
              Seamless integrations with your existing tools
            </Heading>
            <Text size="lg" className="text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Connect with the tools you already use. Our robust API and 
              pre-built integrations make setup effortless.
            </Text>
          </div>
          
          <Grid cols={{ base: 2, md: 3, lg: 6 }} gap={6} className="mb-16">
            {integrations.map((integration, index) => (
              <div key={index} className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl p-6 hover:border-brand-primary/30 hover:bg-surface-glass/80 transition-all duration-300 text-center group">
                <div className="w-14 h-14 bg-white/90 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm">
                  <div className="text-gray-600 text-sm font-bold">{integration.name.slice(0, 2)}</div>
                </div>
                <Text className="font-medium text-white mb-1 text-sm">{integration.name}</Text>
                <Text size="xs" className="text-text-muted">{integration.category}</Text>
              </div>
            ))}
          </Grid>

          <div className="text-center">
            <Button variant="secondary" size="lg">
              <Zap className="mr-2 w-5 h-5" />
              View All 50+ Integrations
            </Button>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section spacing="2xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        </div>
        
        <Container className="text-center relative z-10">
          <Heading variant="h2" className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to experience these features?
          </Heading>
          <Text size="lg" className="text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
            Start your free trial today and see how our features can transform 
            your field service operations.
          </Text>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="xl" className="group">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="xl" variant="secondary">
              Schedule Demo
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default FeaturesPage;