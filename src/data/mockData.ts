/**
 * Mock Data for Think Tank Technologies Marketing Pages
 * This file contains realistic placeholder data for testimonials, case studies, 
 * company information, and other marketing content.
 */

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  title: string;
  company: string;
  avatar?: string;
  companyLogo?: string;
  industry: string;
  results?: string[];
}

export interface CaseStudy {
  id: string;
  title: string;
  company: string;
  industry: string;
  challenge: string;
  solution: string;
  results: Record<string, string>;
  testimonial: Testimonial;
  imageUrl?: string;
  readTime: string;
  publishedDate: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar?: string;
  publishedDate: string;
  readTime: string;
  category: string;
  tags: string[];
  imageUrl?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  linkedin?: string;
  twitter?: string;
  email?: string;
}

export interface CompanyMetric {
  metric: string;
  value: string;
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  logoUrl?: string;
  featured: boolean;
}

// Testimonials Data
export const testimonials: Testimonial[] = [
  {
    id: 'hvac-pro-sarah',
    quote: "TTT's scheduling system reduced our travel costs by 30% in the first quarter. The AI-powered optimization is incredible.",
    author: 'Sarah Johnson',
    title: 'Operations Manager',
    company: 'HVAC Pro Services',
    avatar: '/testimonials/sarah-johnson.jpg',
    companyLogo: '/logos/hvac-pro.svg',
    industry: 'HVAC',
    results: ['30% cost reduction', '40% faster scheduling', '95% customer satisfaction']
  },
  {
    id: 'solar-tech-mike',
    quote: "The AI-powered optimization is like having a logistics expert working 24/7. We've never been more efficient.",
    author: 'Mike Rodriguez',
    title: 'VP of Operations',
    company: 'SolarTech Solutions',
    avatar: '/testimonials/mike-rodriguez.jpg',
    companyLogo: '/logos/solartech.svg',
    industry: 'Solar',
    results: ['35% revenue growth', '22% faster installations', '60% fewer weather delays']
  },
  {
    id: 'telecom-lisa',
    quote: "Setup was incredibly simple. We were optimizing routes within hours, not weeks.",
    author: 'Lisa Chen',
    title: 'Director of Field Operations',
    company: 'TelecomConnect',
    avatar: '/testimonials/lisa-chen.jpg',
    companyLogo: '/logos/telecom.svg',
    industry: 'Telecom',
    results: ['99.7% compliance rate', '32% efficiency improvement', '< 2 hour emergency response']
  },
  {
    id: 'security-david',
    quote: "Customer satisfaction jumped to 96% after implementing TTT. The scheduling intelligence is remarkable.",
    author: 'David Kim',
    title: 'Operations Director',
    company: 'Security Systems Pro',
    avatar: '/testimonials/david-kim.jpg',
    companyLogo: '/logos/security-pro.svg',
    industry: 'Security',
    results: ['96% customer satisfaction', '73% reduction in no-shows', '41% operational efficiency']
  },
  {
    id: 'plumbing-plus-maria',
    quote: "We've scaled from 50 to 200 technicians using TTT. The platform grows with your business perfectly.",
    author: 'Maria Gonzalez',
    title: 'CEO',
    company: 'Plumbing Plus',
    avatar: '/testimonials/maria-gonzalez.jpg',
    companyLogo: '/logos/plumbing-plus.svg',
    industry: 'Plumbing',
    results: ['300% team growth', '45% faster response times', '28% cost savings']
  }
];

// Case Studies Data
export const caseStudies: CaseStudy[] = [
  {
    id: 'hvac-pro-cost-reduction',
    title: 'How HVAC Pro Reduced Operational Costs by 28%',
    company: 'HVAC Pro Services',
    industry: 'HVAC Installation & Service',
    challenge: 'HVAC Pro was struggling with inefficient routing, leading to high fuel costs and technician overtime. Manual scheduling was taking 3+ hours daily.',
    solution: 'Implemented TTT\'s AI-powered scheduling and route optimization, integrated with their existing CRM, and trained dispatchers on the new system.',
    results: {
      'Cost Reduction': '28%',
      'Travel Time Saved': '40%',
      'Scheduling Time': '90% faster',
      'Customer Satisfaction': '94%',
      'Daily Capacity': '+25%'
    },
    testimonial: testimonials[0],
    readTime: '8 min read',
    publishedDate: '2024-03-15',
    imageUrl: '/case-studies/hvac-pro-hero.jpg'
  },
  {
    id: 'solartech-revenue-growth',
    title: 'SolarTech Solutions: 35% Revenue Growth in 6 Months',
    company: 'SolarTech Solutions',
    industry: 'Solar Panel Installation',
    challenge: 'Weather delays and permit coordination were causing project delays. Installation teams were often idle due to poor scheduling.',
    solution: 'Deployed weather-aware scheduling, permit timeline integration, and multi-phase project management capabilities.',
    results: {
      'Revenue Growth': '35%',
      'Installation Time': '22% reduction',
      'Weather Delays': '60% fewer',
      'On-time Completion': '95%',
      'Team Utilization': '87%'
    },
    testimonial: testimonials[1],
    readTime: '10 min read',
    publishedDate: '2024-02-28',
    imageUrl: '/case-studies/solartech-hero.jpg'
  },
  {
    id: 'telecom-compliance-excellence',
    title: 'TelecomConnect Achieves 99.7% Regulatory Compliance',
    company: 'TelecomConnect',
    industry: 'Telecommunications Infrastructure',
    challenge: 'Complex regulatory requirements and multi-stakeholder coordination were causing compliance issues and project delays.',
    solution: 'Implemented regulatory compliance management, automated stakeholder notifications, and equipment allocation tracking.',
    results: {
      'Compliance Rate': '99.7%',
      'Project Efficiency': '32% improvement',
      'Emergency Response': '< 2 hours',
      'Resource Utilization': '91%',
      'Setup Time': '< 5 minutes'
    },
    testimonial: testimonials[2],
    readTime: '12 min read',
    publishedDate: '2024-01-20',
    imageUrl: '/case-studies/telecom-hero.jpg'
  }
];

// Blog Posts Data
export const blogPosts: BlogPost[] = [
  {
    id: 'field-service-trends-2025',
    title: 'Field Service Trends 2025: What to Expect',
    excerpt: 'Explore the key trends shaping the field service industry in 2025, from AI automation to customer experience innovations.',
    content: 'Full blog post content would go here...',
    author: 'Emily Rodriguez',
    authorAvatar: '/team/emily-rodriguez.jpg',
    publishedDate: '2025-01-15',
    readTime: '6 min read',
    category: 'Industry Insights',
    tags: ['Trends', 'AI', 'Customer Experience', '2025'],
    imageUrl: '/blog/trends-2025.jpg'
  },
  {
    id: 'reducing-no-show-rates',
    title: 'Reducing No-Show Rates: A Data-Driven Approach',
    excerpt: 'Learn how to minimize customer no-shows and cancellations using intelligent scheduling and customer communication strategies.',
    content: 'Full blog post content would go here...',
    author: 'Mike Rodriguez',
    authorAvatar: '/testimonials/mike-rodriguez.jpg',
    publishedDate: '2025-01-08',
    readTime: '8 min read',
    category: 'Best Practices',
    tags: ['Customer Success', 'Scheduling', 'Data Analytics'],
    imageUrl: '/blog/no-show-rates.jpg'
  },
  {
    id: 'roi-route-optimization',
    title: 'The ROI of Route Optimization: Beyond Fuel Savings',
    excerpt: 'Discover the hidden benefits of route optimization that go far beyond just saving on fuel costs.',
    content: 'Full blog post content would go here...',
    author: 'David Park',
    authorAvatar: '/team/david-park.jpg',
    publishedDate: '2024-12-20',
    readTime: '7 min read',
    category: 'ROI & Analytics',
    tags: ['ROI', 'Route Optimization', 'Cost Savings'],
    imageUrl: '/blog/route-optimization-roi.jpg'
  }
];

// Team Members Data
export const teamMembers: TeamMember[] = [
  {
    id: 'sarah-johnson',
    name: 'Sarah Johnson',
    role: 'CEO & Co-Founder',
    bio: 'Former VP of Operations at TechField Solutions with 15+ years in field service management. Led digital transformation initiatives for Fortune 500 companies.',
    avatar: '/team/sarah-johnson.jpg',
    linkedin: 'https://linkedin.com/in/sarah-johnson-ttt',
    twitter: 'https://twitter.com/sarahj_ttt',
    email: 'sarah@thinktanktech.com'
  },
  {
    id: 'michael-chen',
    name: 'Michael Chen',
    role: 'CTO & Co-Founder',
    bio: 'Ex-Google engineer specializing in AI and machine learning for operational optimization. PhD in Computer Science from Stanford.',
    avatar: '/team/michael-chen.jpg',
    linkedin: 'https://linkedin.com/in/michael-chen-ttt',
    twitter: 'https://twitter.com/mikec_ai'
  },
  {
    id: 'emily-rodriguez',
    name: 'Emily Rodriguez',
    role: 'VP of Product',
    bio: 'Product leader from Salesforce with expertise in enterprise SaaS and user experience. MBA from Wharton.',
    avatar: '/team/emily-rodriguez.jpg',
    linkedin: 'https://linkedin.com/in/emily-rodriguez-product'
  }
];

// Company Metrics
export const companyMetrics: CompanyMetric[] = [
  { metric: '500+', value: 'Enterprise Customers', description: 'Trust our platform daily', trend: 'up' },
  { metric: '2M+', value: 'Installations Optimized', description: 'Scheduled efficiently', trend: 'up' },
  { metric: '99.9%', value: 'Platform Uptime', description: 'Enterprise-grade reliability', trend: 'stable' },
  { metric: '150+', value: 'Team Members', description: 'Across 5 global offices', trend: 'up' },
  { metric: '25%', value: 'Average Cost Reduction', description: 'Achieved by customers', trend: 'up' },
  { metric: '40%', value: 'Travel Time Savings', description: 'Through route optimization', trend: 'up' }
];

// Integrations Data
export const integrations: Integration[] = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    description: 'Sync customer data and service requests automatically',
    logoUrl: '/integrations/salesforce.svg',
    featured: true
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'Accounting',
    description: 'Automated invoicing and financial tracking',
    logoUrl: '/integrations/quickbooks.svg',
    featured: true
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    description: 'Real-time team notifications and updates',
    logoUrl: '/integrations/slack.svg',
    featured: true
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'Communication',
    description: 'Schedule meetings and share updates seamlessly',
    logoUrl: '/integrations/teams.svg',
    featured: false
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'Scheduling',
    description: 'Two-way calendar sync for all team members',
    logoUrl: '/integrations/google-calendar.svg',
    featured: false
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automation',
    description: 'Connect with 5,000+ apps through Zapier',
    logoUrl: '/integrations/zapier.svg',
    featured: true
  }
];

// Company Information
export const companyInfo = {
  founded: '2018',
  headquarters: 'San Francisco, CA',
  employees: '150+',
  offices: [
    { city: 'San Francisco', type: 'Headquarters', address: '123 Market Street, Suite 500' },
    { city: 'New York', type: 'Sales Office', address: '456 Fifth Avenue, Floor 20' },
    { city: 'Austin', type: 'Customer Success', address: '789 Congress Avenue, Suite 300' }
  ],
  funding: {
    total: '$50M',
    series: 'Series B',
    investors: ['Andreessen Horowitz', 'Sequoia Capital', 'GV (Google Ventures)']
  }
};

// Pricing Plans (for consistency across pages)
export const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    monthlyPrice: 99,
    annualPrice: 79,
    features: [
      'Up to 3 team members',
      'Up to 100 installations/month',
      'Basic scheduling & optimization',
      'Email support',
      'Mobile app access',
      'Standard reporting'
    ],
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced features for growing companies',
    monthlyPrice: 299,
    annualPrice: 239,
    features: [
      'Up to 20 team members',
      'Up to 1,000 installations/month',
      'Advanced AI scheduling',
      'Route optimization',
      'Team performance analytics',
      'Priority support',
      'Custom integrations',
      'Advanced reporting'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full-featured solution for large operations',
    customPricing: true,
    features: [
      'Unlimited team members',
      'Unlimited installations',
      'Multi-region management',
      'Custom integrations & API',
      '24/7 dedicated support',
      'Advanced security features',
      'Custom training & onboarding',
      'SLA guarantees'
    ],
    popular: false
  }
];

// Feature Categories for Features Page
export const featureCategories = [
  {
    id: 'scheduling-optimization',
    title: 'Intelligent Scheduling & Optimization',
    description: 'AI-powered algorithms that learn from your data to create optimal schedules',
    features: [
      {
        id: 'ai-scheduling',
        name: 'AI-Powered Scheduling',
        description: 'Machine learning algorithms optimize assignments based on skills, location, and availability',
        benefits: ['40% reduction in travel time', '25% increase in daily capacity', '90% fewer conflicts']
      },
      {
        id: 'conflict-resolution',
        name: 'Real-time Conflict Resolution',
        description: 'Automatic detection and intelligent resolution of scheduling conflicts',
        benefits: ['Instant conflict detection', 'Multiple resolution options', 'Zero-disruption updates']
      }
    ]
  }
];

// Export all data
export const mockData = {
  testimonials,
  caseStudies,
  blogPosts,
  teamMembers,
  companyMetrics,
  integrations,
  companyInfo,
  pricingPlans,
  featureCategories
};

export default mockData;