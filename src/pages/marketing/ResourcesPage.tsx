import React from 'react';
import { Container, Section, Heading, Text, Button, Grid } from '../../components/ui';
import { 
  FileText, 
  Video, 
  BookOpen, 
  Users, 
  TrendingUp,
  Clock,
  Download,
  Play,
  Calendar,
  Star,
  CheckCircle
} from 'lucide-react';
import { ResourcesSEO } from '../../components/SEO';
import { buildWebPageSchema, buildArticleSchema, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';
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
  ScrollProgressIndicator,
  AnimatedCounter
} from '../../components/marketing/animations';

const ResourcesPage: React.FC = () => {
  // Helper function to render title with animated counter for statistics
  const renderAnimatedTitle = (title: string, delay = 0) => {
    // Pattern to match numbers followed by % in the title
    const numberPattern = /(\d+)(%)/g;
    const matches = [...title.matchAll(numberPattern)];
    
    if (matches.length === 0) {
      return title;
    }

    // Split the title and replace numeric values with AnimatedCounter components
    let result = title;
    let offset = 0;

    return (
      <>
        {title.split(numberPattern).map((part, index) => {
          // Check if this part is a number that was matched
          const matchIndex = Math.floor(index / 3);
          const partIndex = index % 3;
          
          if (partIndex === 1 && matches[matchIndex]) {
            // This is the number part
            const number = parseInt(part);
            return (
              <AnimatedCounter
                key={index}
                value={number}
                duration={2}
                delay={delay}
                className="inline tabular-nums"
              />
            );
          } else if (partIndex === 2 && matches[matchIndex]) {
            // This is the % part
            return <span key={index}>{part}</span>;
          }
          
          // Regular text part
          return part;
        })}
      </>
    );
  };

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
      <ScrollProgressIndicator />
      <ResourcesSEO 
        jsonLd={allSchemas}
        ogImage="/images/og/resources-hub.jpg"
        ogImageAlt="Resources Hub - Field Service Management Guides & Case Studies"
        twitterImage="/images/twitter/resources-hub.jpg"
        twitterImageAlt="Educational resources for field service professionals and teams"
      />
      {/* Resources Hero */}
      <section className="marketing-hero relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-subtle-dots opacity-20"></div>
        </div>
        
        <div className="marketing-container relative z-10">
          <HeroReveal className="marketing-text-container text-center">
            <h1 className="ttt-hero-heading font-bold text-white mb-6 leading-tight">
              Resources to help you
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-success-light block mt-1">
                succeed
              </span>
            </h1>
            
            <p className="ttt-text-lead text-text-secondary mb-8 leading-relaxed">
              Guides, case studies, and insights to help you optimize your 
              field service operations and get the most from our platform.
            </p>
          </HeroReveal>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="marketing-section bg-surface/50">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Featured Resources
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container leading-relaxed">
              Hand-picked content to help you get started and succeed
            </p>
          </ScrollReveal>
          
          <StaggerGroup className="marketing-feature-grid">
            {featuredResources.map((resource, index) => (
              <StaggerItem key={index}>
                <AnimatedCard className="marketing-feature-card group">
                  <div className="marketing-feature-icon bg-brand-primary/10">
                    <InteractiveIcon>
                      <FileText className="w-6 h-6 text-brand-primary" />
                    </InteractiveIcon>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-xs font-medium rounded-full">
                      {resource.type}
                    </span>
                    <div className="flex items-center text-text-muted text-sm">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {resource.readTime}
                    </div>
                  </div>
                  
                  <h3 className="ttt-feature-title group-hover:text-brand-primary transition-colors">
                    {renderAnimatedTitle(resource.title, index * 0.2)}
                  </h3>
                  
                  <p className="ttt-feature-description mb-4">
                    {resource.description}
                  </p>
                  
                  <div className="ttt-text-small text-brand-primary font-medium">
                    {resource.category}
                  </div>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="marketing-section">
        <div className="marketing-container">
          <StaggerGroup className="space-y-12">
            {resourceCategories.map((category, categoryIndex) => {
              const Icon = category.icon;
              
              return (
                <StaggerItem key={categoryIndex}>
                  <div>
                    <ScrollReveal className="flex items-center justify-between mb-8">
                      <div className="flex items-center">
                        <div className="marketing-feature-icon bg-brand-primary/10 mr-4">
                          <InteractiveIcon>
                            <Icon className="w-5 h-5 text-brand-primary" />
                          </InteractiveIcon>
                        </div>
                        <div>
                          <h2 className="ttt-section-header text-white mb-1">
                            {category.title}
                          </h2>
                          <p className="ttt-text-small text-text-secondary">
                            {category.description} • {category.count} resources available
                          </p>
                        </div>
                      </div>
                      <CTAButton>
                        <Button variant="secondary" size="sm">
                          View All
                        </Button>
                      </CTAButton>
                    </ScrollReveal>

                    <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {category.resources.map((resource, resourceIndex) => (
                        <StaggerItem key={resourceIndex}>
                          <AnimatedCard className={`marketing-feature-card group ${resource.featured ? 'border-brand-primary/20' : ''}`}>
                            {resource.featured && (
                              <div className="flex items-center mb-2">
                                <Star className="w-3.5 h-3.5 text-warning mr-1.5" />
                                <span className="text-warning ttt-text-small font-medium">Featured</span>
                              </div>
                            )}
                            
                            <div className="mb-3">
                              <span className="px-2 py-1 bg-surface-elevated text-text-secondary ttt-text-small font-medium rounded">
                                {resource.type}
                              </span>
                            </div>
                            
                            <h4 className="ttt-feature-title mb-2">
                              {renderAnimatedTitle(resource.title, (categoryIndex * 4 + resourceIndex) * 0.1)}
                            </h4>
                            
                            <p className="ttt-feature-description mb-4">
                              {resource.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-text-muted ttt-text-small">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                {resource.readTime}
                              </div>
                              <div className="ttt-text-small text-brand-primary font-medium">
                                Read More
                              </div>
                            </div>
                          </AnimatedCard>
                        </StaggerItem>
                      ))}
                    </StaggerGroup>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* Upcoming Webinars */}
      <section className="marketing-section bg-surface/50">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Upcoming Webinars
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container leading-relaxed">
              Join our live sessions and learn from industry experts
            </p>
          </ScrollReveal>
          
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {upcomingWebinars.map((webinar, index) => (
              <StaggerItem key={index}>
                <AnimatedCard className="marketing-feature-card group">
                  <div className="flex items-center mb-4">
                    <div className="marketing-feature-icon bg-brand-primary/10 mr-3">
                      <InteractiveIcon>
                        <Video className="w-5 h-5 text-brand-primary" />
                      </InteractiveIcon>
                    </div>
                    <div>
                      <div className="text-brand-primary font-semibold ttt-text-small">UPCOMING WEBINAR</div>
                      <div className="text-text-muted ttt-text-small">{webinar.date} • {webinar.time}</div>
                    </div>
                  </div>
                  
                  <h3 className="ttt-feature-title mb-3">
                    {webinar.title}
                  </h3>
                  
                  <p className="ttt-feature-description mb-4">
                    {webinar.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="ttt-text-small text-text-muted">
                      Presented by {webinar.presenter}
                    </div>
                    <CTAButton>
                      <Button variant="primary" size="sm">
                        <Calendar className="mr-1.5 w-3.5 h-3.5" />
                        Register
                      </Button>
                    </CTAButton>
                  </div>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="marketing-section relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/30">
          <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        </div>
        
        <div className="marketing-container text-center relative z-10">
          <CTAReveal className="marketing-cta-section">
            <h2 className="ttt-section-header text-white mb-6">
              Stay updated with the latest insights
            </h2>
            <p className="ttt-text-lead text-text-secondary mb-8 marketing-text-container mx-auto leading-relaxed">
              Subscribe to our newsletter for the latest field service trends, 
              tips, and platform updates delivered to your inbox.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto mb-8">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-surface-glass backdrop-blur-xl border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-primary transition-colors"
              />
              <CTAButton>
                <Button size="lg">
                  Subscribe
                </Button>
              </CTAButton>
            </div>
            
            <div className="marketing-trust-indicators ttt-text-small text-text-muted">
              <span className="flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
                No spam, ever
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
                Unsubscribe anytime
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
                Privacy protected
              </span>
            </div>
          </CTAReveal>
        </div>
      </section>
    </div>
  );
};

export default ResourcesPage;