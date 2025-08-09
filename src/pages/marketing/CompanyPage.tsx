import React from 'react';
import { Container, Section, Heading, Text, Button, Grid } from '../../components/ui';
import { 
  Users, 
  Target, 
  Award, 
  MapPin,
  Calendar,
  ArrowRight,
  Linkedin,
  Twitter,
  Building,
  TrendingUp,
  Heart,
  Globe
} from 'lucide-react';
import { CompanySEO } from '../../components/SEO';
import { buildOrganizationSchema, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';

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
      <CompanySEO 
        jsonLd={allSchemas}
        ogImage="/images/og/company-team.jpg"
        ogImageAlt="About Lead Route - Field Service Management Leaders"
        twitterImage="/images/twitter/company-team.jpg"
        twitterImageAlt="Meet the team behind the leading AI-powered field service platform"
      />
      {/* Company Hero */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <Heading variant="h1" className="text-5xl font-bold text-white mb-6">
              Transforming field service through innovation
            </Heading>
            <Text size="xl" className="text-text-secondary mb-8">
              We're on a mission to revolutionize how field service companies operate, 
              making their teams more efficient and their customers happier.
            </Text>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                Join Our Team
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="secondary">
                Learn About Our Culture
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Company Stats */}
      <Section spacing="xl">
        <Container>
          <Grid cols={{ base: 2, md: 4 }} gap={8}>
            {companyStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">{stat.metric}</div>
                <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
                <div className="text-sm text-text-secondary">{stat.description}</div>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Our Story */}
      <Section spacing="2xl" className="bg-surface/30">
        <Container>
          <Grid cols={{ base: 1, lg: 2 }} gap={12} className="items-center">
            <div>
              <Heading variant="h2" className="text-4xl font-bold text-white mb-6">
                Our story
              </Heading>
              <div className="space-y-6 text-text-secondary">
                <Text>
                  Lead Route was born from the frustration of watching talented field service 
                  teams struggle with inefficient scheduling and routing. Our founders, with decades of 
                  combined experience in operations and technology, knew there had to be a better way.
                </Text>
                <Text>
                  What started as a simple scheduling tool has evolved into a comprehensive platform that 
                  uses artificial intelligence to optimize every aspect of field service operations. Today, 
                  we help over 500 companies reduce costs, improve efficiency, and deliver better customer experiences.
                </Text>
                <Text>
                  We're proud to be at the forefront of the field service revolution, but we're just getting 
                  started. Our vision is a world where every field service operation runs with perfect efficiency, 
                  and every technician has the tools they need to succeed.
                </Text>
              </div>
            </div>
            <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl p-8">
              <Heading variant="h3" className="text-2xl font-semibold text-white mb-6">
                Company Timeline
              </Heading>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-16 text-brand-primary font-semibold text-sm mr-4 flex-shrink-0">
                      {milestone.year}
                    </div>
                    <div className="text-text-secondary text-sm">{milestone.event}</div>
                  </div>
                ))}
              </div>
            </div>
          </Grid>
        </Container>
      </Section>

      {/* Core Values */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center mb-16">
            <Heading variant="h2" className="text-4xl font-bold text-white mb-6">
              Our core values
            </Heading>
            <Text size="lg" className="text-text-secondary max-w-3xl mx-auto">
              These values guide everything we do, from how we build our product 
              to how we interact with customers and each other.
            </Text>
          </div>
          
          <Grid cols={{ base: 1, md: 2, lg: 4 }} gap={8}>
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl p-8 text-center hover:border-brand-primary/30 transition-colors">
                  <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-brand-primary" />
                  </div>
                  <Heading variant="h3" className="text-xl font-semibold text-white mb-4">
                    {value.title}
                  </Heading>
                  <Text className="text-text-secondary">
                    {value.description}
                  </Text>
                </div>
              );
            })}
          </Grid>
        </Container>
      </Section>

      {/* Leadership Team */}
      <Section spacing="2xl" className="bg-surface/30">
        <Container>
          <div className="text-center mb-16">
            <Heading variant="h2" className="text-4xl font-bold text-white mb-6">
              Meet our leadership team
            </Heading>
            <Text size="lg" className="text-text-secondary max-w-3xl mx-auto">
              Experienced leaders from top technology and field service companies, 
              united by a shared vision to transform operations.
            </Text>
          </div>
          
          <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={8}>
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl overflow-hidden hover:border-brand-primary/30 transition-colors group">
                <div className="aspect-square bg-gradient-to-br from-surface to-surface-elevated flex items-center justify-center">
                  <Users className="w-20 h-20 text-brand-primary" />
                </div>
                
                <div className="p-6">
                  <Heading variant="h3" className="text-xl font-semibold text-white mb-2">
                    {member.name}
                  </Heading>
                  <Text className="text-brand-primary font-medium mb-4">
                    {member.role}
                  </Text>
                  <Text className="text-text-secondary mb-6">
                    {member.bio}
                  </Text>
                  
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
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Careers Section */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center mb-16">
            <Heading variant="h2" className="text-4xl font-bold text-white mb-6">
              Join our growing team
            </Heading>
            <Text size="lg" className="text-text-secondary max-w-3xl mx-auto">
              We're looking for talented individuals who share our passion for innovation 
              and want to help transform the field service industry.
            </Text>
          </div>

          <div className="space-y-4 mb-12">
            {openPositions.map((position, index) => (
              <div key={index} className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl p-6 hover:border-brand-primary/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <Heading variant="h3" className="text-xl font-semibold text-white">
                        {position.title}
                      </Heading>
                      <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-sm font-medium rounded-full">
                        {position.department}
                      </span>
                      <span className="px-3 py-1 bg-surface-elevated text-text-secondary text-sm rounded-full">
                        {position.type}
                      </span>
                    </div>
                    <div className="flex items-center text-text-muted mb-3">
                      <MapPin className="w-4 h-4 mr-2" />
                      {position.location}
                    </div>
                    <Text className="text-text-secondary">
                      {position.description}
                    </Text>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="primary">
                      Apply Now
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Text className="text-text-secondary mb-6">
              Don't see a role that fits? We're always looking for exceptional talent.
            </Text>
            <Button variant="secondary" size="lg">
              <Building className="mr-2 w-5 h-5" />
              View All Open Positions
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
            Ready to transform your field operations?
          </Heading>
          <Text size="lg" className="text-text-secondary mb-8 max-w-2xl mx-auto">
            Join hundreds of companies who trust Lead Route 
            to optimize their field service operations.
          </Text>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="group">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="secondary">
              Contact Sales
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default CompanyPage;