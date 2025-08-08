import React from 'react';
import { Container, Section, Heading, Text, Button, Grid } from '../../components/ui';
import { 
  Thermometer, 
  Sun, 
  Radio, 
  Shield, 
  Globe, 
  Code, 
  Headphones,
  ArrowRight,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { SolutionsSEO } from '../../components/SEO';
import { buildWebPageSchema, buildServiceSchema, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';
import { INDUSTRY_KEYWORDS } from '../../lib/seo/constants';

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
        'No-Show Rate': '73% reduction',
        'Installation Quality': '99% first-time success',
        'Operational Efficiency': '41% improvement'
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
      <SolutionsSEO 
        keywords={industryKeywords}
        jsonLd={allSchemas}
        ogImage="/images/og/solutions-industries.jpg"
        ogImageAlt="Industry-Specific Field Service Solutions - HVAC, Solar, Telecom & Security"
        twitterImage="/images/twitter/solutions-industries.jpg"
        twitterImageAlt="Tailored solutions for HVAC, solar, telecommunications, and security companies"
      />
      {/* Solutions Hero */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <Heading variant="h1" className="text-5xl font-bold text-white mb-6">
              Tailored solutions for every industry
            </Heading>
            <Text size="xl" className="text-text-secondary">
              We understand that every industry has unique challenges. 
              Our platform adapts to your specific needs and workflows.
            </Text>
          </div>
        </Container>
      </Section>

      {/* Industry Solutions Grid */}
      <Section spacing="2xl">
        <Container>
          <div className="space-y-16">
            {industrySolutions.map((solution, index) => {
              const Icon = solution.icon;
              const isReverse = index % 2 === 1;
              
              return (
                <div key={index} className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
                  <div className={`grid lg:grid-cols-2 ${isReverse ? 'lg:grid-flow-col-dense' : ''}`}>
                    {/* Content Side */}
                    <div className={`p-8 lg:p-12 ${isReverse ? 'lg:col-start-2' : ''}`}>
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-surface-elevated border border-border rounded-2xl flex items-center justify-center mr-4">
                          <Icon className={`w-8 h-8 ${solution.iconColor}`} />
                        </div>
                        <Heading variant="h2" className="text-2xl font-bold text-white">
                          {solution.industry}
                        </Heading>
                      </div>
                      
                      <Text className="text-text-secondary mb-8 text-lg leading-relaxed">
                        {solution.description}
                      </Text>

                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        {/* Challenges */}
                        <div>
                          <Heading variant="h4" className="text-lg font-semibold text-white mb-4">
                            Common Challenges
                          </Heading>
                          <ul className="space-y-3">
                            {solution.challenges.map((challenge, idx) => (
                              <li key={idx} className="flex items-start text-text-secondary">
                                <div className="w-2 h-2 bg-error rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Solutions */}
                        <div>
                          <Heading variant="h4" className="text-lg font-semibold text-white mb-4">
                            Our Solutions
                          </Heading>
                          <ul className="space-y-3">
                            {solution.solutions.map((solutionItem, idx) => (
                              <li key={idx} className="flex items-start text-text-secondary">
                                <CheckCircle className="w-5 h-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                {solutionItem}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Button variant="primary" className="group">
                        {solution.ctaText}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>

                    {/* Results Side */}
                    <div className={`bg-surface-elevated p-8 lg:p-12 ${isReverse ? 'lg:col-start-1' : ''}`}>
                      <div className="mb-8">
                        <Heading variant="h4" className="text-lg font-semibold text-white mb-6 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-success" />
                          Proven Results
                        </Heading>
                        <Grid cols={2} gap={6}>
                          {Object.entries(solution.results).map(([metric, value]) => (
                            <div key={metric} className="text-center">
                              <div className="text-2xl font-bold text-brand-primary mb-2">{value}</div>
                              <div className="text-sm text-text-secondary">{metric}</div>
                            </div>
                          ))}
                        </Grid>
                      </div>

                      <div className="bg-surface-glass rounded-xl p-6 border border-border">
                        <Text className="font-medium text-white mb-3">Case Study Available</Text>
                        <Text size="sm" className="text-text-secondary mb-4">
                          Learn how companies in this industry achieved these results with our platform.
                        </Text>
                        <Button variant="ghost" size="sm">
                          Read Case Study
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Enterprise Solutions */}
      <Section spacing="2xl" className="bg-surface/30">
        <Container>
          <div className="text-center mb-16">
            <Heading variant="h2" className="text-4xl font-bold text-white mb-6">
              Enterprise-grade solutions for large operations
            </Heading>
            <Text size="lg" className="text-text-secondary max-w-3xl mx-auto">
              Scaling to thousands of daily installations across multiple regions? 
              Our enterprise platform is built for your needs.
            </Text>
          </div>
          
          <Grid cols={{ base: 1, md: 3 }} gap={8} className="mb-12">
            {enterpriseFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl p-8 text-center hover:border-brand-primary/30 transition-colors">
                  <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-brand-primary" />
                  </div>
                  <Heading variant="h3" className="text-xl font-semibold text-white mb-4">
                    {feature.title}
                  </Heading>
                  <Text className="text-text-secondary">
                    {feature.description}
                  </Text>
                </div>
              );
            })}
          </Grid>

          <div className="text-center">
            <Button size="lg" variant="primary">
              Contact Enterprise Sales
              <ArrowRight className="ml-2 w-5 h-5" />
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
          <Heading variant="h2" className="text-4xl font-bold text-white mb-6">
            Find the perfect solution for your industry
          </Heading>
          <Text size="lg" className="text-text-secondary mb-8 max-w-2xl mx-auto">
            Don't see your industry listed? Our platform is flexible enough to adapt 
            to any field service business model.
          </Text>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="group">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="secondary">
              Schedule Consultation
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default SolutionsPage;