import React, { useState } from 'react';
import { Container, Section, Heading, Text, Button, Grid, Input, Textarea, Select } from '../../components/ui';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
  Send
} from 'lucide-react';
import { ContactSEO } from '../../components/SEO';
import { getContactPageSchemas, buildBreadcrumbListSchema } from '../../lib/seo/jsonld';

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
        <Section spacing="2xl" className="min-h-screen flex items-center">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              
              <Heading variant="h1" className="text-4xl font-bold text-white mb-6">
                Thank you for your interest!
              </Heading>
              
              <Text size="lg" className="text-text-secondary mb-8">
                We've received your {formData.requestType === 'demo' ? 'demo request' : 'message'} and will get back to you within 2 hours.
                In the meantime, feel free to explore our resources or check out our documentation.
              </Text>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => setIsSubmitted(false)}>
                  Submit Another Request
                </Button>
                <Button variant="secondary" onClick={() => window.location.href = '/resources'}>
                  Explore Resources
                </Button>
              </div>
            </div>
          </Container>
        </Section>
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
      <ContactSEO 
        jsonLd={allSchemas}
        ogImage="/images/og/contact-us.jpg"
        ogImageAlt="Contact Lead Route - Field Service Management Experts"
        twitterImage="/images/twitter/contact-us.jpg"
        twitterImageAlt="Get in touch with our field service management experts"
      />
      {/* Contact Hero */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <Heading variant="h1" className="text-5xl font-bold text-white mb-6">
              Get in touch with our team
            </Heading>
            <Text size="xl" className="text-text-secondary">
              Ready to transform your field service operations? We'd love to show you 
              how our platform can help you reduce costs and improve efficiency.
            </Text>
          </div>
        </Container>
      </Section>

      {/* Contact Methods */}
      <Section spacing="xl">
        <Container>
          <Grid cols={{ base: 1, md: 3 }} gap={8} className="mb-16">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <div key={index} className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl p-8 text-center hover:border-brand-primary/30 transition-colors">
                  <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-brand-primary" />
                  </div>
                  <Heading variant="h3" className="text-xl font-semibold text-white mb-3">
                    {method.title}
                  </Heading>
                  <Text className="text-text-secondary mb-4">
                    {method.description}
                  </Text>
                  <div className="text-brand-primary font-semibold mb-2">
                    {method.contact}
                  </div>
                  <div className="flex items-center justify-center text-sm text-text-muted">
                    <Clock className="w-4 h-4 mr-2" />
                    {method.responseTime}
                  </div>
                </div>
              );
            })}
          </Grid>
        </Container>
      </Section>

      {/* Contact Form */}
      <Section spacing="2xl" className="bg-surface/30">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Heading variant="h2" className="text-4xl font-bold text-white mb-6">
                Request a personalized demo
              </Heading>
              <Text size="lg" className="text-text-secondary">
                See how Lead Route can transform your field service operations. 
                Fill out the form below and we'll schedule a custom demo tailored to your needs.
              </Text>
            </div>

            <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl p-8">
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
                    <Text>Schedule a Demo</Text>
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
                    <Text>General Inquiry</Text>
                  </label>
                </div>

                {/* Personal Information */}
                <Grid cols={{ base: 1, md: 2 }} gap={6}>
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
                </Grid>

                <Grid cols={{ base: 1, md: 2 }} gap={6}>
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
                </Grid>

                {/* Company Information */}
                <Grid cols={{ base: 1, md: 2 }} gap={6}>
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
                </Grid>

                <Grid cols={{ base: 1, md: 2 }} gap={6}>
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
                </Grid>

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
                    className="w-full group"
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
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>

                <Text size="sm" className="text-text-muted text-center">
                  We respect your privacy. Your information will only be used to contact you about your inquiry.
                </Text>
              </form>
            </div>
          </div>
        </Container>
      </Section>

      {/* Office Locations */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center mb-16">
            <Heading variant="h2" className="text-3xl font-bold text-white mb-6">
              Our office locations
            </Heading>
            <Text size="lg" className="text-text-secondary">
              Visit us at one of our offices around the country
            </Text>
          </div>
          
          <Grid cols={{ base: 1, md: 3 }} gap={8}>
            {offices.map((office, index) => (
              <div key={index} className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl p-8 text-center hover:border-brand-primary/30 transition-colors">
                <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-brand-primary" />
                </div>
                <div className="mb-2">
                  <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-sm font-medium rounded-full">
                    {office.type}
                  </span>
                </div>
                <Heading variant="h3" className="text-xl font-semibold text-white mb-4">
                  {office.city}
                </Heading>
                <Text className="text-text-secondary mb-4 whitespace-pre-line">
                  {office.address}
                </Text>
                <Text className="text-brand-primary font-semibold">
                  {office.phone}
                </Text>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* FAQ Section */}
      <Section spacing="2xl" className="bg-surface/30">
        <Container>
          <div className="text-center mb-16">
            <Heading variant="h2" className="text-3xl font-bold text-white mb-6">
              Common questions
            </Heading>
            <Text size="lg" className="text-text-secondary">
              Get quick answers to frequently asked questions
            </Text>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl p-6">
              <Heading variant="h4" className="text-lg font-semibold text-white mb-3">
                How long does the demo take?
              </Heading>
              <Text className="text-text-secondary">
                Our personalized demos typically take 30-45 minutes. We'll customize the demo to focus on your specific industry and use cases.
              </Text>
            </div>
            
            <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl p-6">
              <Heading variant="h4" className="text-lg font-semibold text-white mb-3">
                Is the demo really free with no obligation?
              </Heading>
              <Text className="text-text-secondary">
                Yes, absolutely! Our demos are completely free with no strings attached. We're confident that once you see our platform in action, you'll understand the value.
              </Text>
            </div>
            
            <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl p-6">
              <Heading variant="h4" className="text-lg font-semibold text-white mb-3">
                What information do I need to provide for the demo?
              </Heading>
              <Text className="text-text-secondary">
                Just basic information about your company and current challenges. This helps us tailor the demo to show features most relevant to your business.
              </Text>
            </div>
            
            <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl p-6">
              <Heading variant="h4" className="text-lg font-semibold text-white mb-3">
                Can I get pricing information during the demo?
              </Heading>
              <Text className="text-text-secondary">
                Absolutely! We'll discuss pricing that fits your team size and needs. We offer transparent pricing with no hidden fees.
              </Text>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default ContactPage;