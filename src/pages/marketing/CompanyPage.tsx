import React from 'react';
import { Container, Section, Heading, Text, Button, Grid } from '../../components/ui';
import { 
  Users, 
  Target, 
  Award, 
  MapPin,
  Calendar,
  Linkedin,
  Twitter,
  Building,
  TrendingUp,
  Heart,
  Globe
} from 'lucide-react';
import { CompanySEO } from '../../components/SEO';
import { buildOrganizationSchema, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';
import {
  ScrollProgressIndicator,
  HeroReveal,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  CTAReveal,
  AnimatedCard,
  InteractiveIcon,
  CTAButton,
  AnimatedCounter
} from '../../components/marketing/animations';

const CompanyPage: React.FC = () => {
  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Co-Founder',
      bio: 'Former VP of Operations at TechField Solutions with 15+ years in field service management.',
      image: '/team/sarah-johnson.jpg',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'Michael Chen',
      role: 'CTO & Co-Founder',
      bio: 'Ex-Google engineer specializing in AI and machine learning for operational optimization.',
      image: '/team/michael-chen.jpg',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'Emily Rodriguez',
      role: 'VP of Product',
      bio: 'Product leader from Salesforce with expertise in enterprise SaaS and user experience.',
      image: '/team/emily-rodriguez.jpg',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'David Park',
      role: 'VP of Engineering',
      bio: 'Engineering leader from Microsoft with 12+ years building scalable cloud platforms.',
      image: '/team/david-park.jpg',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'Lisa Thompson',
      role: 'VP of Customer Success',
      bio: 'Customer success expert from ServiceNow, passionate about driving customer outcomes.',
      image: '/team/lisa-thompson.jpg',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'James Wilson',
      role: 'VP of Sales',
      bio: 'Sales leader with deep field service industry knowledge and proven track record.',
      image: '/team/james-wilson.jpg',
      linkedin: '#',
      twitter: '#'
    }
  ];

  const companyStats = [
    { metric: '500+', label: 'Enterprise Customers', description: 'Trust our platform daily' },
    { metric: '2M+', label: 'Installations Optimized', description: 'Scheduled efficiently' },
    { metric: '99.9%', label: 'Platform Uptime', description: 'Enterprise-grade reliability' },
    { metric: '150+', label: 'Team Members', description: 'Across 5 global offices' }
  ];

  const coreValues = [
    {
      title: 'Customer First',
      description: 'Every decision we make starts with our customers. Their success drives our innovation.',
      icon: Heart
    },
    {
      title: 'Innovation',
      description: 'We push the boundaries of what\'s possible in field service management technology.',
      icon: TrendingUp
    },
    {
      title: 'Excellence',
      description: 'We set high standards for ourselves and deliver exceptional quality in everything we do.',
      icon: Award
    },
    {
      title: 'Global Impact',
      description: 'We\'re building solutions that transform operations for companies around the world.',
      icon: Globe
    }
  ];

  const openPositions = [
    {
      title: 'Senior Software Engineer - AI/ML',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      description: 'Join our AI team to build next-generation scheduling algorithms and optimization engines.'
    },
    {
      title: 'Product Manager - Platform',
      department: 'Product',
      location: 'San Francisco, CA',
      type: 'Full-time',
      description: 'Lead product strategy and roadmap for our core platform and API infrastructure.'
    },
    {
      title: 'Enterprise Sales Manager',
      department: 'Sales',
      location: 'New York, NY',
      type: 'Full-time',
      description: 'Drive enterprise sales growth and build relationships with large field service organizations.'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Austin, TX',
      type: 'Full-time',
      description: 'Ensure customer success and drive adoption of our platform with enterprise clients.'
    },
    {
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build and maintain our cloud infrastructure and deployment pipelines.'
    },
    {
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'San Francisco, CA',
      type: 'Full-time',
      description: 'Design intuitive user experiences for complex field service management workflows.'
    }
  ];

  const milestones = [
    { year: '2018', event: 'Company founded by field service veterans' },
    { year: '2019', event: 'Launched MVP with 5 pilot customers' },
    { year: '2020', event: 'Raised Series A, expanded to 50+ customers' },
    { year: '2021', event: 'Launched AI-powered scheduling engine' },
    { year: '2022', event: 'Reached 200+ customers, opened European office' },
    { year: '2023', event: 'Raised Series B, launched mobile app' },
    { year: '2024', event: 'Reached 500+ customers, expanded to Asia-Pacific' },
    { year: '2025', event: 'Launching next-generation platform with advanced AI' }
  ];

  // Generate structured data for company page
  const organizationSchema = buildOrganizationSchema({
    founder: [
      {
        '@type': 'Person',
        name: 'Sarah Johnson'
      },
      {
        '@type': 'Person', 
        name: 'Michael Chen'
      }
    ],
    employee: teamMembers.map(member => ({
      '@type': 'Person',
      name: member.name,
      jobTitle: member.role,
      description: member.bio,
      sameAs: member.linkedin !== '#' ? [member.linkedin] : undefined
    })),
    numberOfEmployees: teamMembers.length.toString()
  });

  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Company', url: '/company' }
  ]);

  const allSchemas = [organizationSchema, breadcrumbSchema];

  return (
    <div className="pt-16 lg:pt-20">
      <ScrollProgressIndicator />
      <CompanySEO 
        jsonLd={allSchemas}
        ogImage="/images/og/company-team.jpg"
        ogImageAlt="About Lead Route - Field Service Management Leaders"
        twitterImage="/images/twitter/company-team.jpg"
        twitterImageAlt="Meet the team behind the leading AI-powered field service platform"
      />
      {/* Company Hero */}
      <section className="marketing-hero">
        <div className="marketing-container">
          <HeroReveal className="marketing-text-container text-center">
            <h1 className="ttt-hero-heading font-bold text-white mb-4">
              Transforming field service through innovation
            </h1>
            <p className="ttt-text-lead text-text-secondary mb-6">
              We're on a mission to revolutionize how field service companies operate, 
              making their teams more efficient and their customers happier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CTAButton size="lg">
                Join Our Team
              </CTAButton>
              <CTAButton size="lg" variant="secondary">
                Learn About Our Culture
              </CTAButton>
            </div>
          </HeroReveal>
        </div>
      </section>

      {/* Company Stats */}
      <section className="marketing-section-tight">
        <div className="marketing-container">
          <StaggerGroup className="marketing-stats-grid">
            {companyStats.map((stat, index) => {
              // Extract numeric value and suffix from metric string
              const getCounterProps = (metric: string) => {
                if (metric === '500+') {
                  return { value: 500, suffix: '+' };
                } else if (metric === '2M+') {
                  return { 
                    value: 2000000, 
                    formatNumber: (value: number) => {
                      if (value >= 1000000) {
                        return `${(value / 1000000).toFixed(0)}M+`;
                      }
                      return value.toLocaleString();
                    }
                  };
                } else if (metric === '99.9%') {
                  return { value: 99.9, suffix: '%', decimals: 1 };
                } else if (metric === '150+') {
                  return { value: 150, suffix: '+' };
                }
                // Fallback for other metrics
                const numericValue = parseFloat(metric.replace(/[^0-9.]/g, ''));
                const suffix = metric.replace(/[0-9.]/g, '');
                return { value: numericValue, suffix };
              };
              
              const counterProps = getCounterProps(stat.metric);
              
              return (
                <StaggerItem key={index}>
                  <div className="marketing-stats-card">
                    <div className="text-2xl md:text-3xl font-bold text-brand-primary mb-1 tabular-nums">
                      <AnimatedCounter
                        {...counterProps}
                        duration={2.0 + (index * 0.2)}
                        delay={0.2 + (index * 0.2)}
                      />
                    </div>
                    <div className="ttt-text-small font-medium text-white mb-0.5">{stat.label}</div>
                    <div className="ttt-text-small text-text-muted">{stat.description}</div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* Our Story */}
      <section className="marketing-section bg-surface/30">
        <div className="marketing-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <ScrollReveal>
                <h2 className="ttt-section-header text-left text-white mb-6">
                  Our story
                </h2>
              </ScrollReveal>
              <div className="space-y-6 text-text-secondary">
                <p className="ttt-feature-description">
                  Lead Route was born from the frustration of watching talented field service 
                  teams struggle with inefficient scheduling and routing. Our founders, with decades of 
                  combined experience in operations and technology, knew there had to be a better way.
                </p>
                <p className="ttt-feature-description">
                  What started as a simple scheduling tool has evolved into a comprehensive platform that 
                  uses artificial intelligence to optimize every aspect of field service operations. Today, 
                  we help over 500 companies reduce costs, improve efficiency, and deliver better customer experiences.
                </p>
                <p className="ttt-feature-description">
                  We're proud to be at the forefront of the field service revolution, but we're just getting 
                  started. Our vision is a world where every field service operation runs with perfect efficiency, 
                  and every technician has the tools they need to succeed.
                </p>
              </div>
            </div>
            <ScrollReveal>
              <div className="marketing-feature-card">
                <h3 className="ttt-feature-title text-white mb-6">
                  Company Timeline
                </h3>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-16 text-brand-primary font-semibold ttt-text-small mr-4 flex-shrink-0">
                        {milestone.year}
                      </div>
                      <div className="text-text-secondary ttt-text-small">{milestone.event}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="marketing-section">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Our core values
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container mx-auto">
              These values guide everything we do, from how we build our product 
              to how we interact with customers and each other.
            </p>
          </ScrollReveal>
          
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <StaggerItem key={index}>
                  <AnimatedCard className="marketing-feature-card text-center hover:border-brand-primary/30 transition-colors">
                    <InteractiveIcon className="marketing-feature-icon bg-brand-primary/10 mx-auto mb-4">
                      <Icon className="w-6 h-6 text-brand-primary" />
                    </InteractiveIcon>
                    <h3 className="ttt-feature-title text-white mb-4">
                      {value.title}
                    </h3>
                    <p className="ttt-feature-description">
                      {value.description}
                    </p>
                  </AnimatedCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="marketing-section bg-surface/30">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Meet our leadership team
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container mx-auto">
              Experienced leaders from top technology and field service companies, 
              united by a shared vision to transform operations.
            </p>
          </ScrollReveal>
          
          <StaggerGroup className="marketing-feature-grid">
            {teamMembers.map((member, index) => (
              <StaggerItem key={index}>
                <AnimatedCard className="marketing-feature-card overflow-hidden hover:border-brand-primary/30 transition-colors group">
                  <div className="aspect-square bg-gradient-to-br from-surface to-surface-elevated flex items-center justify-center">
                    <InteractiveIcon>
                      <Users className="w-16 h-16 text-brand-primary" />
                    </InteractiveIcon>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="ttt-feature-title text-white mb-2">
                      {member.name}
                    </h3>
                    <p className="text-brand-primary font-medium mb-4 ttt-text-small">
                      {member.role}
                    </p>
                    <p className="ttt-feature-description mb-6">
                      {member.bio}
                    </p>
                    
                    <div className="flex space-x-3">
                      <a
                        href={member.linkedin}
                        className="w-10 h-10 bg-surface-elevated hover:bg-brand-primary/10 border border-border hover:border-brand-primary/30 rounded-lg flex items-center justify-center text-text-secondary hover:text-brand-primary transition-all"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                      <a
                        href={member.twitter}
                        className="w-10 h-10 bg-surface-elevated hover:bg-brand-primary/10 border border-border hover:border-brand-primary/30 rounded-lg flex items-center justify-center text-text-secondary hover:text-brand-primary transition-all"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Careers Section */}
      <section className="marketing-section">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Join our growing team
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container mx-auto">
              We're looking for talented individuals who share our passion for innovation 
              and want to help transform the field service industry.
            </p>
          </ScrollReveal>

          <StaggerGroup className="space-y-4 mb-12">
            {openPositions.map((position, index) => (
              <StaggerItem key={index}>
                <AnimatedCard className="marketing-feature-card hover:border-brand-primary/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="ttt-feature-title text-white">
                          {position.title}
                        </h3>
                        <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary ttt-text-small font-medium rounded-full">
                          {position.department}
                        </span>
                        <span className="px-3 py-1 bg-surface-elevated text-text-secondary ttt-text-small rounded-full">
                          {position.type}
                        </span>
                      </div>
                      <div className="flex items-center text-text-muted mb-3">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="ttt-text-small">{position.location}</span>
                      </div>
                      <p className="ttt-feature-description">
                        {position.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <CTAButton variant="primary">
                        Apply Now
                      </CTAButton>
                    </div>
                  </div>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <CTAReveal className="text-center">
            <p className="ttt-feature-description mb-6">
              Don't see a role that fits? We're always looking for exceptional talent.
            </p>
            <CTAButton variant="secondary" size="lg">
              <Building className="mr-2 w-5 h-5" />
              View All Open Positions
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
            <h2 className="ttt-section-header text-white mb-6">
              Ready to transform your field operations?
            </h2>
            <p className="ttt-text-lead text-text-secondary mb-8 marketing-text-container mx-auto">
              Join hundreds of companies who trust Lead Route 
              to optimize their field service operations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CTAButton size="lg">
                Start Free Trial
              </CTAButton>
              <CTAButton size="lg" variant="secondary">
                Contact Sales
              </CTAButton>
            </div>
          </CTAReveal>
        </div>
      </section>
    </div>
  );
};

export default CompanyPage;