import React, { useState } from 'react';
import { Container, Section, Heading, Text, Button, Grid, Input, Textarea, Select } from '../../components/ui';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
  Send
} from 'lucide-react';
import { ContactSEO } from '../../components/SEO';
import { getContactPageSchemas, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';
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
  AnimatedInput,
  ScrollProgressIndicator
} from '../../components/marketing/animations';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    employees: '',
    industry: '',
    message: '',
    requestType: 'demo'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactMethods = [
    {
      title: 'General Inquiries',
      description: 'Get in touch with our team for general questions',
      icon: Mail,
      contact: 'hello@leadroute.com',
      responseTime: 'Within 4 hours'
    },
    {
      title: 'Sales',
      description: 'Speak with our sales team about pricing and plans',
      icon: Phone,
      contact: '(555) 123-SALES',
      responseTime: 'Within 1 hour'
    },
    {
      title: 'Support',
      description: 'Get help from our technical support team',
      icon: MessageSquare,
      contact: 'support@leadroute.com',
      responseTime: 'Within 2 hours'
    }
  ];

  const offices = [
    {
      city: 'San Francisco',
      address: '123 Market Street, Suite 500\nSan Francisco, CA 94105',
      phone: '(555) 123-4567',
      type: 'Headquarters'
    },
    {
      city: 'New York',
      address: '456 Fifth Avenue, Floor 20\nNew York, NY 10018',
      phone: '(555) 234-5678',
      type: 'Sales Office'
    },
    {
      city: 'Austin',
      address: '789 Congress Avenue, Suite 300\nAustin, TX 78701',
      phone: '(555) 345-6789',
      type: 'Customer Success'
    }
  ];

  const industryOptions = [
    { value: 'hvac', label: 'HVAC Services' },
    { value: 'solar', label: 'Solar Installation' },
    { value: 'telecom', label: 'Telecommunications' },
    { value: 'security', label: 'Security Systems' },
    { value: 'plumbing', label: 'Plumbing Services' },
    { value: 'electrical', label: 'Electrical Services' },
    { value: 'other', label: 'Other' }
  ];

  const employeeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' }
  ];

  const roleOptions = [
    { value: 'ceo', label: 'CEO/Owner' },
    { value: 'operations', label: 'Operations Manager' },
    { value: 'it', label: 'IT Manager' },
    { value: 'scheduler', label: 'Scheduler/Dispatcher' },
    { value: 'other', label: 'Other' }
  ];

  if (isSubmitted) {
    return (
      <div className="pt-16 lg:pt-20">
        <section className="marketing-hero min-h-screen flex items-center">
          <div className="marketing-container">
            <HeroReveal className="marketing-text-container text-center">
              <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              
              <h1 className="ttt-hero-heading font-bold text-white mb-4">
                Thank you for your interest!
              </h1>
              
              <p className="ttt-text-lead text-text-secondary mb-8">
                We've received your {formData.requestType === 'demo' ? 'demo request' : 'message'} and will get back to you within 2 hours.
                In the meantime, feel free to explore our resources or check out our documentation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CTAButton onClick={() => setIsSubmitted(false)}>
                  Submit Another Request
                </CTAButton>
                <CTAButton variant="secondary" onClick={() => window.location.href = '/resources'}>
                  Explore Resources
                </CTAButton>
              </div>
            </HeroReveal>
          </div>
        </section>
      </div>
    );
  }

  // Generate structured data for contact page
  const contactPageSchemas = getContactPageSchemas();
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' }
  ]);
  
  const allSchemas = [...contactPageSchemas, breadcrumbSchema];

  return (
    <div className="pt-16 lg:pt-20">
      <ScrollProgressIndicator />
      <ContactSEO 
        jsonLd={allSchemas}
        ogImage="/images/og/contact-us.jpg"
        ogImageAlt="Contact Lead Route - Field Service Management Experts"
        twitterImage="/images/twitter/contact-us.jpg"
        twitterImageAlt="Get in touch with our field service management experts"
      />
      {/* Contact Hero */}
      <section className="marketing-hero">
        <div className="marketing-container">
          <HeroReveal className="marketing-text-container text-center">
            <h1 className="ttt-hero-heading font-bold text-white mb-4">
              Get in touch with our team
            </h1>
            <p className="ttt-text-lead text-text-secondary">
              Ready to transform your field service operations? We'd love to show you 
              how our platform can help you reduce costs and improve efficiency.
            </p>
          </HeroReveal>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="marketing-section-tight">
        <div className="marketing-container">
          <StaggerGroup className="marketing-feature-grid">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <StaggerItem key={index}>
                  <AnimatedCard className="marketing-feature-card text-center">
                    <div className="marketing-feature-icon bg-brand-primary/10 mx-auto">
                      <InteractiveIcon>
                        <Icon className="w-6 h-6 text-brand-primary" />
                      </InteractiveIcon>
                    </div>
                    <h3 className="ttt-feature-title text-white">
                      {method.title}
                    </h3>
                    <p className="ttt-feature-description mb-3">
                      {method.description}
                    </p>
                    <div className="text-brand-primary font-semibold mb-2 ttt-text-small">
                      {method.contact}
                    </div>
                    <div className="flex items-center justify-center ttt-text-small text-text-muted">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      {method.responseTime}
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* Contact Form */}
      <section className="marketing-section bg-surface/30">
        <div className="marketing-container">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal className="text-center mb-10">
              <h2 className="ttt-section-header text-white mb-4">
                Request a personalized demo
              </h2>
              <p className="ttt-text-lead text-text-secondary">
                See how Lead Route can transform your field service operations. 
                Fill out the form below and we'll schedule a custom demo tailored to your needs.
              </p>
            </ScrollReveal>

            <CTAReveal>
              <div className="marketing-feature-card">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Request Type */}
                <div className="flex flex-wrap gap-4 p-4 bg-surface-elevated rounded-xl">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      value="demo"
                      checked={formData.requestType === 'demo'}
                      onChange={(e) => handleInputChange('requestType', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded-full mr-3 ${formData.requestType === 'demo' ? 'border-brand-primary bg-brand-primary' : 'border-border'}`}>
                      {formData.requestType === 'demo' && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                    </div>
                    <span className="ttt-text-body">Schedule a Demo</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      value="contact"
                      checked={formData.requestType === 'contact'}
                      onChange={(e) => handleInputChange('requestType', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded-full mr-3 ${formData.requestType === 'contact' ? 'border-brand-primary bg-brand-primary' : 'border-border'}`}>
                      {formData.requestType === 'contact' && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                    </div>
                    <span className="ttt-text-body">General Inquiry</span>
                  </label>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    required
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="email"
                    label="Business Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                  <Input
                    type="tel"
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                {/* Company Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Company Name"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Enter your company name"
                    required
                  />
                  <Select
                    label="Your Role"
                    value={formData.role}
                    onChange={(value) => handleInputChange('role', value)}
                    options={roleOptions}
                    placeholder="Select your role"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Company Size"
                    value={formData.employees}
                    onChange={(value) => handleInputChange('employees', value)}
                    options={employeeOptions}
                    placeholder="Select company size"
                    required
                  />
                  <Select
                    label="Industry"
                    value={formData.industry}
                    onChange={(value) => handleInputChange('industry', value)}
                    options={industryOptions}
                    placeholder="Select your industry"
                    required
                  />
                </div>

                {/* Message */}
                <Textarea
                  label={formData.requestType === 'demo' ? 'Tell us about your current challenges' : 'Message'}
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder={formData.requestType === 'demo' 
                    ? 'What specific challenges are you facing with your current field service operations?'
                    : 'How can we help you?'
                  }
                  rows={4}
                />

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        {formData.requestType === 'demo' ? (
                          <>
                            <Calendar className="mr-2 w-5 h-5" />
                            Schedule My Demo
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 w-5 h-5" />
                            Send Message
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>

                <p className="ttt-text-small text-text-muted text-center">
                  We respect your privacy. Your information will only be used to contact you about your inquiry.
                </p>
              </form>
              </div>
            </CTAReveal>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="marketing-section">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Our office locations
            </h2>
            <p className="ttt-text-lead text-text-secondary">
              Visit us at one of our offices around the country
            </p>
          </ScrollReveal>
          
          <StaggerGroup className="marketing-feature-grid">
            {offices.map((office, index) => (
              <StaggerItem key={index}>
                <AnimatedCard className="marketing-feature-card text-center">
                  <div className="marketing-feature-icon bg-brand-primary/10 mx-auto">
                    <InteractiveIcon>
                      <MapPin className="w-6 h-6 text-brand-primary" />
                    </InteractiveIcon>
                  </div>
                  <div className="mb-3">
                    <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary ttt-text-small font-medium rounded-full">
                      {office.type}
                    </span>
                  </div>
                  <h3 className="ttt-feature-title text-white">
                    {office.city}
                  </h3>
                  <p className="ttt-feature-description whitespace-pre-line">
                    {office.address}
                  </p>
                  <p className="text-brand-primary font-semibold ttt-text-small">
                    {office.phone}
                  </p>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="marketing-section bg-surface/30">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Common questions
            </h2>
            <p className="ttt-text-lead text-text-secondary">
              Get quick answers to frequently asked questions
            </p>
          </ScrollReveal>
          
          <StaggerGroup className="max-w-3xl mx-auto space-y-4">
            <StaggerItem>
              <AnimatedCard className="marketing-feature-card">
                <h4 className="ttt-feature-title text-white mb-2">
                  How long does the demo take?
                </h4>
                <p className="ttt-feature-description">
                  Our personalized demos typically take 30-45 minutes. We'll customize the demo to focus on your specific industry and use cases.
                </p>
              </AnimatedCard>
            </StaggerItem>
            
            <StaggerItem>
              <AnimatedCard className="marketing-feature-card">
                <h4 className="ttt-feature-title text-white mb-2">
                  Is the demo really free with no obligation?
                </h4>
                <p className="ttt-feature-description">
                  Yes, absolutely! Our demos are completely free with no strings attached. We're confident that once you see our platform in action, you'll understand the value.
                </p>
              </AnimatedCard>
            </StaggerItem>
            
            <StaggerItem>
              <AnimatedCard className="marketing-feature-card">
                <h4 className="ttt-feature-title text-white mb-2">
                  What information do I need to provide for the demo?
                </h4>
                <p className="ttt-feature-description">
                  Just basic information about your company and current challenges. This helps us tailor the demo to show features most relevant to your business.
                </p>
              </AnimatedCard>
            </StaggerItem>
            
            <StaggerItem>
              <AnimatedCard className="marketing-feature-card">
                <h4 className="ttt-feature-title text-white mb-2">
                  Can I get pricing information during the demo?
                </h4>
                <p className="ttt-feature-description">
                  Absolutely! We'll discuss pricing that fits your team size and needs. We offer transparent pricing with no hidden fees.
                </p>
              </AnimatedCard>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;