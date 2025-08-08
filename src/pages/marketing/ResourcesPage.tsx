import React from 'react';
import { Container, Section, Heading, Text, Button, Grid } from '../../components/ui';
import { 
  FileText, 
  Video, 
  BookOpen, 
  Users, 
  TrendingUp,
  Clock,
  ArrowRight,
  Download,
  Play,
  Calendar,
  Star
} from 'lucide-react';
import { ResourcesSEO } from '../../components/SEO';
import { buildWebPageSchema, buildArticleSchema, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';

const ResourcesPage: React.FC = () => {
  const featuredResources = [
    {
      type: 'Case Study',
      title: 'How HVAC Pro Reduced Costs by 28%',
      description: 'Learn how HVAC Pro used our platform to optimize routes and reduce operational costs',
      image: '/resources/case-study-hvac.jpg',
      readTime: '8 min read',
      link: '/resources/case-studies/hvac-pro-cost-reduction',
      category: 'Customer Success'
    },
    {
      type: 'Whitepaper',
      title: 'The Future of Field Service Management',
      description: 'Industry trends and technologies shaping the future of field service operations',
      image: '/resources/whitepaper-future.jpg',
      readTime: '15 min read',
      link: '/resources/whitepapers/future-field-service',
      category: 'Industry Insights'
    },
    {
      type: 'Guide',
      title: 'Route Optimization Best Practices',
      description: 'Step-by-step guide to implementing effective route optimization strategies',
      image: '/resources/guide-optimization.jpg',
      readTime: '12 min read',
      link: '/resources/guides/route-optimization-best-practices',
      category: 'Implementation'
    }
  ];

  const resourceCategories = [
    {
      title: 'Customer Success Stories',
      description: 'Real results from companies using our platform',
      icon: TrendingUp,
      count: 15,
      resources: [
        {
          title: 'SolarTech Solutions: 35% Revenue Growth',
          description: 'How intelligent scheduling helped scale solar installations',
          type: 'Case Study',
          readTime: '6 min read',
          featured: true
        },
        {
          title: 'TelecomConnect: 99.7% Compliance Rate',
          description: 'Achieving regulatory compliance in telecom infrastructure',
          type: 'Case Study',
          readTime: '9 min read',
          featured: false
        },
        {
          title: 'HVAC Pro: 28% Cost Reduction',
          description: 'Optimizing HVAC service operations with AI scheduling',
          type: 'Case Study',
          readTime: '8 min read',
          featured: true
        },
        {
          title: 'Security Systems Pro: 96% Customer Satisfaction',
          description: 'Improving customer experience in security installations',
          type: 'Case Study',
          readTime: '7 min read',
          featured: false
        }
      ]
    },
    {
      title: 'Documentation & Guides',
      description: 'Complete guides to help you get the most from our platform',
      icon: BookOpen,
      count: 25,
      resources: [
        {
          title: 'Getting Started Guide',
          description: 'Complete setup and configuration guide for new users',
          type: 'Guide',
          readTime: '20 min read',
          featured: true
        },
        {
          title: 'API Documentation',
          description: 'Comprehensive API reference and integration examples',
          type: 'Documentation',
          readTime: '45 min read',
          featured: true
        },
        {
          title: 'Advanced Scheduling Strategies',
          description: 'Optimize your scheduling with advanced techniques and tips',
          type: 'Guide',
          readTime: '15 min read',
          featured: false
        },
        {
          title: 'Mobile App User Manual',
          description: 'Complete guide to using our mobile app for field teams',
          type: 'Documentation',
          readTime: '12 min read',
          featured: false
        }
      ]
    },
    {
      title: 'Webinars & Events',
      description: 'Educational content and industry insights',
      icon: Video,
      count: 8,
      resources: [
        {
          title: 'AI in Field Service: What\'s Next?',
          description: 'Exploring the future of AI-powered field service management',
          type: 'Webinar',
          readTime: '45 min watch',
          featured: true
        },
        {
          title: 'Route Optimization Masterclass',
          description: 'Advanced techniques for maximizing route efficiency',
          type: 'Webinar',
          readTime: '60 min watch',
          featured: true
        },
        {
          title: 'Customer Success Panel: Best Practices',
          description: 'Panel discussion with successful platform implementations',
          type: 'Event',
          readTime: '90 min watch',
          featured: false
        },
        {
          title: 'Platform Update: Q1 2025 Features',
          description: 'Overview of new features and improvements',
          type: 'Webinar',
          readTime: '30 min watch',
          featured: false
        }
      ]
    },
    {
      title: 'Industry Insights',
      description: 'Latest trends, tips, and insights for field service professionals',
      icon: FileText,
      count: 32,
      resources: [
        {
          title: 'Field Service Trends 2025',
          description: 'Key trends shaping the field service industry this year',
          type: 'Blog Post',
          readTime: '5 min read',
          featured: true
        },
        {
          title: 'Reducing No-Show Rates: A Data-Driven Approach',
          description: 'Strategies to minimize customer no-shows and cancellations',
          type: 'Blog Post',
          readTime: '7 min read',
          featured: true
        },
        {
          title: 'The ROI of Route Optimization',
          description: 'Calculating the business impact of optimized routing',
          type: 'Blog Post',
          readTime: '6 min read',
          featured: false
        },
        {
          title: 'Building High-Performance Field Teams',
          description: 'Best practices for recruiting and managing field technicians',
          type: 'Blog Post',
          readTime: '8 min read',
          featured: false
        }
      ]
    }
  ];

  const upcomingWebinars = [
    {
      title: 'Maximizing ROI with Smart Scheduling',
      date: 'February 15, 2025',
      time: '2:00 PM EST',
      presenter: 'Sarah Johnson, VP of Operations',
      description: 'Learn proven strategies to maximize ROI through intelligent scheduling'
    },
    {
      title: 'Advanced Route Optimization Techniques',
      date: 'February 28, 2025',
      time: '1:00 PM EST',
      presenter: 'Mike Rodriguez, Solutions Engineer',
      description: 'Deep dive into advanced routing algorithms and optimization strategies'
    }
  ];

  // Generate structured data for resources page
  const resourcesPageSchema = buildWebPageSchema({
    name: 'Resources - Field Service Management Guides & Case Studies',
    url: '/resources',
    description: 'Comprehensive resources including customer success stories, implementation guides, and industry insights for field service optimization.',
    about: {
      name: 'Field Service Management Resources',
      description: 'Educational content and best practices for field service operations'
    }
  });

  // Create article schemas for featured resources
  const featuredArticleSchemas = featuredResources.map(resource => buildArticleSchema({
    headline: resource.title,
    description: resource.description,
    image: resource.image ? [resource.image] : undefined,
    datePublished: '2024-01-01',
    url: resource.link
  }));

  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Resources', url: '/resources' }
  ]);

  const allSchemas = [resourcesPageSchema, ...featuredArticleSchemas, breadcrumbSchema];

  return (
    <div className="pt-16 lg:pt-20">
      <ResourcesSEO 
        jsonLd={allSchemas}
        ogImage="/images/og/resources-hub.jpg"
        ogImageAlt="Resources Hub - Field Service Management Guides & Case Studies"
        twitterImage="/images/twitter/resources-hub.jpg"
        twitterImageAlt="Educational resources for field service professionals and teams"
      />
      {/* Resources Hero */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <Heading variant="h1" className="text-5xl font-bold text-white mb-6">
              Resources to help you succeed
            </Heading>
            <Text size="xl" className="text-text-secondary">
              Guides, case studies, and insights to help you optimize your 
              field service operations and get the most from our platform.
            </Text>
          </div>
        </Container>
      </Section>

      {/* Featured Resources */}
      <Section spacing="xl">
        <Container>
          <div className="mb-12">
            <Heading variant="h2" className="text-3xl font-bold text-white mb-4">
              Featured Resources
            </Heading>
            <Text className="text-text-secondary">
              Hand-picked content to help you get started and succeed
            </Text>
          </div>
          
          <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={8}>
            {featuredResources.map((resource, index) => (
              <div key={index} className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl overflow-hidden hover:border-brand-primary/30 transition-colors group">
                <div className="aspect-video bg-gradient-to-br from-surface to-surface-elevated flex items-center justify-center">
                  <FileText className="w-16 h-16 text-brand-primary" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-sm font-medium rounded-full">
                      {resource.type}
                    </span>
                    <div className="flex items-center text-text-muted text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {resource.readTime}
                    </div>
                  </div>
                  
                  <Heading variant="h3" className="text-xl font-semibold text-white mb-3 group-hover:text-brand-primary transition-colors">
                    {resource.title}
                  </Heading>
                  
                  <Text className="text-text-secondary mb-4">
                    {resource.description}
                  </Text>
                  
                  <Button variant="ghost" size="sm" className="p-0 h-auto font-medium">
                    Read More
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Resource Categories */}
      <Section spacing="2xl" className="bg-surface/30">
        <Container>
          <div className="space-y-16">
            {resourceCategories.map((category, categoryIndex) => {
              const Icon = category.icon;
              
              return (
                <div key={categoryIndex}>
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-center mr-4">
                      <Icon className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div className="flex-1">
                      <Heading variant="h2" className="text-2xl font-bold text-white mb-2">
                        {category.title}
                      </Heading>
                      <Text className="text-text-secondary">
                        {category.description} • {category.count} resources available
                      </Text>
                    </div>
                    <Button variant="secondary">
                      View All
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>

                  <Grid cols={{ base: 1, md: 2, lg: 4 }} gap={6}>
                    {category.resources.map((resource, resourceIndex) => (
                      <div key={resourceIndex} className={`bg-surface-glass backdrop-blur-xl border rounded-xl p-6 hover:border-brand-primary/30 transition-colors ${resource.featured ? 'border-brand-primary/20' : 'border-border'}`}>
                        {resource.featured && (
                          <div className="flex items-center mb-3">
                            <Star className="w-4 h-4 text-warning mr-2" />
                            <span className="text-warning text-sm font-medium">Featured</span>
                          </div>
                        )}
                        
                        <div className="mb-3">
                          <span className="px-2 py-1 bg-surface-elevated text-text-secondary text-xs font-medium rounded">
                            {resource.type}
                          </span>
                        </div>
                        
                        <Heading variant="h4" className="text-lg font-semibold text-white mb-2">
                          {resource.title}
                        </Heading>
                        
                        <Text size="sm" className="text-text-secondary mb-4">
                          {resource.description}
                        </Text>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-text-muted text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {resource.readTime}
                          </div>
                          <Button variant="ghost" size="sm" className="p-0 h-auto">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </Grid>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Upcoming Webinars */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center mb-12">
            <Heading variant="h2" className="text-3xl font-bold text-white mb-4">
              Upcoming Webinars
            </Heading>
            <Text className="text-text-secondary">
              Join our live sessions and learn from industry experts
            </Text>
          </div>
          
          <Grid cols={{ base: 1, md: 2 }} gap={8} className="max-w-4xl mx-auto">
            {upcomingWebinars.map((webinar, index) => (
              <div key={index} className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl p-8 hover:border-brand-primary/30 transition-colors">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-center mr-4">
                    <Video className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <div className="text-brand-primary font-semibold text-sm">UPCOMING WEBINAR</div>
                    <div className="text-text-muted text-sm">{webinar.date} • {webinar.time}</div>
                  </div>
                </div>
                
                <Heading variant="h3" className="text-xl font-semibold text-white mb-3">
                  {webinar.title}
                </Heading>
                
                <Text className="text-text-secondary mb-4">
                  {webinar.description}
                </Text>
                
                <div className="flex items-center justify-between">
                  <Text size="sm" className="text-text-muted">
                    Presented by {webinar.presenter}
                  </Text>
                  <Button variant="primary" size="sm">
                    <Calendar className="mr-2 w-4 h-4" />
                    Register
                  </Button>
                </div>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Newsletter Signup */}
      <Section spacing="2xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        </div>
        
        <Container className="text-center relative z-10">
          <Heading variant="h2" className="text-4xl font-bold text-white mb-6">
            Stay updated with the latest insights
          </Heading>
          <Text size="lg" className="text-text-secondary mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest field service trends, 
            tips, and platform updates delivered to your inbox.
          </Text>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto mb-8">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-surface-glass backdrop-blur-xl border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-primary"
            />
            <Button className="group">
              Subscribe
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <Text size="sm" className="text-text-muted">
            No spam, unsubscribe at any time. Privacy policy applies.
          </Text>
        </Container>
      </Section>
    </div>
  );
};

export default ResourcesPage;