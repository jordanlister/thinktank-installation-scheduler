import React from 'react';
import { Button } from '../../components/ui';
import { 
  Thermometer, 
  Sun, 
  Radio, 
  Shield, 
  Globe, 
  Code, 
  Headphones,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { SolutionsSEO } from '../../components/SEO';
import { buildWebPageSchema, buildServiceSchema, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';
import { INDUSTRY_KEYWORDS } from '../../lib/seo/constants';
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
  AnimatedStats,
  ScrollProgressIndicator,
  AnimatedCounter,
  PercentageCounter
} from '../../components/marketing/animations';

const SolutionsPage: React.FC = () => {
  const industrySolutions = [
    {
      industry: 'HVAC Installation & Service',
      icon: Thermometer,
      iconColor: 'text-brand-primary',
      description: 'Optimize HVAC installations, maintenance schedules, and emergency repairs',
      challenges: [
        'Seasonal demand fluctuations',
        'Emergency service prioritization',
        'Complex equipment requirements',
        'Certification compliance'
      ],
      solutions: [
        'Seasonal capacity planning',
        'Priority-based emergency scheduling',
        'Equipment-skill matching',
        'Automatic certification tracking'
      ],
      results: {
        'Cost Reduction': '28%',
        'Response Time': '45% faster',
        'Customer Satisfaction': '94%',
        'Technician Utilization': '87%'
      },
      caseStudy: '/case-studies/hvac-pro-services',
      ctaText: 'Explore HVAC Solutions'
    },
    {
      industry: 'Solar Panel Installation',
      icon: Sun,
      iconColor: 'text-warning',
      description: 'Streamline solar installations from site survey to system activation',
      challenges: [
        'Weather dependency',
        'Permit coordination',
        'Multi-day installations',
        'Site accessibility issues'
      ],
      solutions: [
        'Weather-aware scheduling',
        'Permit timeline integration',
        'Multi-phase project management',
        'Site assessment integration'
      ],
      results: {
        'Installation Time': '22% reduction',
        'Weather Delays': '60% fewer',
        'Project Completion': '95% on-time',
        'Revenue Growth': '35%'
      },
      caseStudy: '/case-studies/solartech-solutions',
      ctaText: 'Explore Solar Solutions'
    },
    {
      industry: 'Telecommunications Infrastructure',
      icon: Radio,
      iconColor: 'text-brand-accent',
      description: 'Manage complex telecom installations and network maintenance efficiently',
      challenges: [
        'Site access coordination',
        'Specialized equipment needs',
        'Compliance requirements',
        '24/7 service demands'
      ],
      solutions: [
        'Multi-stakeholder scheduling',
        'Equipment allocation tracking',
        'Regulatory compliance management',
        'Emergency response optimization'
      ],
      results: {
        'Project Efficiency': '32% improvement',
        'Compliance Rate': '99.7%',
        'Emergency Response': '< 2 hours',
        'Resource Utilization': '91%'
      },
      caseStudy: '/case-studies/telecom-connect',
      ctaText: 'Explore Telecom Solutions'
    },
    {
      industry: 'Home Security Systems',
      icon: Shield,
      iconColor: 'text-success',
      description: 'Coordinate security system installations and maintenance across territories',
      challenges: [
        'Customer availability windows',
        'Territory-based scheduling',
        'Installation complexity varies',
        'Follow-up service coordination'
      ],
      solutions: [
        'Customer preference matching',
        'Geographic territory optimization',
        'Complexity-based time allocation',
        'Automated follow-up scheduling'
      ],
      results: {
        'Customer Satisfaction': '96%',
        'No-Show Rate': '73%',
        'Installation Quality': '99%', 
        'Operational Efficiency': '41%'
      },
      caseStudy: '/case-studies/security-systems-pro',
      ctaText: 'Explore Security Solutions'
    }
  ];

  const enterpriseFeatures = [
    {
      title: 'Multi-Region Management',
      description: 'Centralized control with regional autonomy and reporting',
      icon: Globe
    },
    {
      title: 'Advanced API & Integrations',
      description: 'Custom integrations with enterprise systems and workflows',
      icon: Code
    },
    {
      title: 'Dedicated Support & Training',
      description: '24/7 enterprise support with dedicated account management',
      icon: Headphones
    }
  ];

  // Generate structured data for solutions page
  const solutionsPageSchema = buildWebPageSchema({
    name: 'Industry Solutions - Field Service Management',
    url: '/solutions',
    description: 'Tailored field service solutions for HVAC, solar, telecommunications, and security system companies.',
    about: {
      name: 'Industry-Specific Field Service Solutions',
      description: 'Specialized features and optimizations for different field service industries'
    }
  });

  const serviceSchema = buildServiceSchema({
    name: 'Industry-Specific Field Service Solutions',
    description: 'Customized field service management solutions for HVAC, solar, telecom, and security industries',
    category: 'Business Software Solutions',
    areaServed: ['United States', 'Canada'],
    services: [
      { name: 'HVAC Service Management', description: 'Specialized scheduling and optimization for HVAC companies' },
      { name: 'Solar Installation Management', description: 'Project management and scheduling for solar installations' },
      { name: 'Telecom Infrastructure Services', description: 'Complex scheduling for telecommunications infrastructure projects' },
      { name: 'Security System Installation', description: 'Coordinated scheduling for security system deployments' }
    ]
  });

  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Solutions', url: '/solutions' }
  ]);

  const allSchemas = [solutionsPageSchema, serviceSchema, breadcrumbSchema];

  // Combine industry-specific keywords
  const industryKeywords = [
    ...INDUSTRY_KEYWORDS.hvac.slice(0, 2),
    ...INDUSTRY_KEYWORDS.solar.slice(0, 2),
    ...INDUSTRY_KEYWORDS.telecom.slice(0, 2),
    ...INDUSTRY_KEYWORDS.security.slice(0, 2),
    'industry-specific field service',
    'specialized installation management'
  ];

  return (
    <div className="pt-16 lg:pt-20">
      <ScrollProgressIndicator />
      <SolutionsSEO 
        keywords={industryKeywords}
        jsonLd={allSchemas}
        ogImage="/images/og/solutions-industries.jpg"
        ogImageAlt="Industry-Specific Field Service Solutions - HVAC, Solar, Telecom & Security"
        twitterImage="/images/twitter/solutions-industries.jpg"
        twitterImageAlt="Tailored solutions for HVAC, solar, telecommunications, and security companies"
      />
      {/* Solutions Hero */}
      <section className="marketing-hero relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-subtle-dots opacity-20"></div>
        </div>
        
        <div className="marketing-container relative z-10">
          <HeroReveal className="marketing-text-container text-center">
            <h1 className="ttt-hero-heading font-bold text-white mb-6 leading-tight">
              Tailored solutions for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-success-light block mt-1">
                every industry
              </span>
            </h1>
            
            <p className="ttt-text-lead text-text-secondary mb-8 leading-relaxed">
              We understand that every industry has unique challenges. 
              Our platform adapts to your specific needs and workflows.
            </p>
          </HeroReveal>
        </div>
      </section>

      {/* Industry Solutions Grid */}
      <section className="marketing-section bg-surface/50">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Solutions by industry
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container leading-relaxed">
              Specialized features and workflows designed for your industry's unique needs
            </p>
          </ScrollReveal>
          
          <StaggerGroup className="space-y-12">
            {industrySolutions.map((solution, index) => {
              const Icon = solution.icon;
              const isReverse = index % 2 === 1;
              
              return (
                <StaggerItem key={index}>
                  <div className="marketing-feature-card group overflow-hidden">
                  <div className={`grid lg:grid-cols-2 ${isReverse ? 'lg:grid-flow-col-dense' : ''}`}>
                    {/* Content Side */}
                    <div className={`p-6 lg:p-10 ${isReverse ? 'lg:col-start-2' : ''}`}>
                      <div className="flex items-center mb-6">
                        <div className="marketing-feature-icon mr-4">
                          <Icon className={`w-6 h-6 ${solution.iconColor}`} />
                        </div>
                        <h3 className="ttt-section-header text-white">
                          {solution.industry}
                        </h3>
                      </div>
                      
                      <p className="ttt-text-lead text-text-secondary mb-6 leading-relaxed">
                        {solution.description}
                      </p>

                      <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Challenges */}
                        <div>
                          <h4 className="ttt-feature-title text-white mb-4">
                            Common Challenges
                          </h4>
                          <ul className="space-y-2">
                            {solution.challenges.map((challenge, idx) => (
                              <li key={idx} className="flex items-start ttt-feature-description">
                                <div className="w-1.5 h-1.5 bg-error rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Solutions */}
                        <div>
                          <h4 className="ttt-feature-title text-white mb-4">
                            Our Solutions
                          </h4>
                          <ul className="space-y-2">
                            {solution.solutions.map((solutionItem, idx) => (
                              <li key={idx} className="flex items-start ttt-feature-description">
                                <CheckCircle className="w-4 h-4 text-success mt-0.5 mr-3 flex-shrink-0" />
                                {solutionItem}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Button variant="primary">
                        {solution.ctaText}
                      </Button>
                    </div>

                    {/* Results Side */}
                    <div className={`bg-surface-elevated p-6 lg:p-10 ${isReverse ? 'lg:col-start-1' : ''}`}>
                      <div className="mb-6">
                        <h4 className="ttt-feature-title text-white mb-4 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-success" />
                          Proven Results
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(solution.results).map(([metric, value], idx) => {
                            // Parse numeric value and suffix from the result string
                            const numericMatch = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
                            const numericValue = numericMatch ? parseFloat(numericMatch[1]) : 0;
                            const suffix = numericMatch ? numericMatch[2] : value;
                            const hasNumericValue = numericMatch && numericValue > 0;

                            return (
                              <div key={metric} className="text-center p-5 bg-surface/40 rounded-xl border border-border/60 hover:border-brand-primary/30 transition-colors">
                                <div className="text-3xl font-bold text-brand-primary mb-3">
                                  {hasNumericValue ? (
                                    <AnimatedCounter
                                      value={numericValue}
                                      suffix={suffix}
                                      duration={2.2}
                                      delay={idx * 0.2}
                                      className="tabular-nums"
                                    />
                                  ) : (
                                    value
                                  )}
                                </div>
                                <div className="text-sm font-medium text-white leading-tight">{metric}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-surface-glass rounded-lg p-6 border border-border mt-6">
                        <h5 className="text-lg font-semibold text-white mb-3">Case Study Available</h5>
                        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                          Learn how companies in this industry achieved these results with our platform.
                        </p>
                        <Button variant="primary" size="sm">
                          Read Case Study
                        </Button>
                      </div>
                    </div>
                  </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* Enterprise Solutions */}
      <section className="marketing-section">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Enterprise-grade solutions for large operations
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container leading-relaxed">
              Scaling to thousands of daily installations across multiple regions? 
              Our enterprise platform is built for your needs.
            </p>
          </ScrollReveal>
          
          <StaggerGroup className="marketing-feature-grid mb-10">
            {enterpriseFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={index}>
                  <div className="marketing-feature-card group text-center">
                  <div className="marketing-feature-icon mx-auto mb-4">
                    <Icon className="w-6 h-6 text-brand-primary" />
                  </div>
                  <h3 className="ttt-feature-title mb-3">
                    {feature.title}
                  </h3>
                  <p className="ttt-feature-description">
                    {feature.description}
                  </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>

          <CTAReveal className="text-center">
            <Button size="lg" variant="primary">
              Contact Enterprise Sales
            </Button>
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
            <h2 className="ttt-section-header text-white mb-6">
              Find the perfect solution for your industry
            </h2>
            <p className="ttt-text-lead text-text-secondary mb-8 marketing-text-container mx-auto leading-relaxed">
              Don't see your industry listed? Our platform is flexible enough to adapt 
              to any field service business model.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="xl">
                Start Free Trial
              </Button>
              <Button size="xl" variant="secondary">
                Schedule Consultation
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
                Custom industry setup
              </span>
            </div>
          </CTAReveal>
        </div>
      </section>
    </div>
  );
};

export default SolutionsPage;