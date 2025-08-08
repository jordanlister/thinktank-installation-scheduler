import React, { useState } from 'react';
import { Container, Section, Heading, Text, Button, Grid } from '../../components/ui';
import { 
  CheckCircle,
  X,
  ArrowRight,
  Star,
  Calculator,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PricingSEO } from '../../components/SEO';
import { getPricingPageSchemas, buildBreadcrumbListSchema, buildFAQPageSchema } from '../../lib/seo/jsonld';

const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const pricingPlans = [
    {
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
      notIncluded: [
        'Advanced AI scheduling',
        'Route optimization',
        'Team performance analytics',
        'Priority support',
        'Custom integrations'
      ],
      cta: 'Start Free Trial',
      popular: false,
      color: 'border-border'
    },
    {
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
        'Advanced reporting',
        'API access'
      ],
      notIncluded: [
        'Multi-region management',
        'Dedicated support manager',
        'SLA guarantees',
        'Custom training'
      ],
      cta: 'Start Free Trial',
      popular: true,
      color: 'border-brand-primary'
    },
    {
      name: 'Enterprise',
      description: 'Full-featured solution for large operations',
      monthlyPrice: null,
      annualPrice: null,
      customPricing: true,
      features: [
        'Unlimited team members',
        'Unlimited installations',
        'Multi-region management',
        'Custom integrations & API',
        '24/7 dedicated support',
        'Advanced security features',
        'Custom training & onboarding',
        'SLA guarantees',
        'White-label options',
        'Advanced compliance tools'
      ],
      notIncluded: [],
      cta: 'Contact Sales',
      popular: false,
      color: 'border-border'
    }
  ];

  const comparisonFeatures = [
    {
      category: 'Core Features',
      features: [
        { name: 'Team Members', starter: '3', professional: '20', enterprise: 'Unlimited' },
        { name: 'Monthly Installations', starter: '100', professional: '1,000', enterprise: 'Unlimited' },
        { name: 'Basic Scheduling', starter: true, professional: true, enterprise: true },
        { name: 'Mobile App', starter: true, professional: true, enterprise: true },
        { name: 'Standard Reporting', starter: true, professional: true, enterprise: true },
      ]
    },
    {
      category: 'Advanced Features',
      features: [
        { name: 'AI-Powered Scheduling', starter: false, professional: true, enterprise: true },
        { name: 'Route Optimization', starter: false, professional: true, enterprise: true },
        { name: 'Performance Analytics', starter: false, professional: true, enterprise: true },
        { name: 'Custom Integrations', starter: false, professional: true, enterprise: true },
        { name: 'API Access', starter: false, professional: true, enterprise: true },
      ]
    },
    {
      category: 'Enterprise Features',
      features: [
        { name: 'Multi-Region Management', starter: false, professional: false, enterprise: true },
        { name: 'Advanced Security', starter: false, professional: false, enterprise: true },
        { name: 'SLA Guarantees', starter: false, professional: false, enterprise: true },
        { name: 'Dedicated Support Manager', starter: false, professional: false, enterprise: true },
        { name: 'Custom Training', starter: false, professional: false, enterprise: true },
      ]
    },
    {
      category: 'Support',
      features: [
        { name: 'Email Support', starter: true, professional: true, enterprise: true },
        { name: 'Priority Support', starter: false, professional: true, enterprise: true },
        { name: '24/7 Support', starter: false, professional: false, enterprise: true },
        { name: 'Phone Support', starter: false, professional: false, enterprise: true },
        { name: 'Dedicated Account Manager', starter: false, professional: false, enterprise: true },
      ]
    }
  ];

  const faqs = [
    {
      question: 'How does the free trial work?',
      answer: 'You get full access to all Professional plan features for 14 days. No credit card required to start. You can upgrade, downgrade, or cancel anytime during or after the trial.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated for the remainder of your billing cycle.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and ACH bank transfers for Enterprise customers. All payments are processed securely through Stripe.'
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No setup fees for Starter and Professional plans. Enterprise customers receive white-glove onboarding included in their custom pricing.'
    },
    {
      question: 'What happens if I exceed my plan limits?',
      answer: 'We\'ll notify you when you\'re approaching your limits. You can upgrade your plan or we\'ll work with you on overage pricing that makes sense for your business.'
    },
    {
      question: 'Do you offer discounts for annual billing?',
      answer: 'Yes! Save 20% when you choose annual billing. Enterprise customers can also explore multi-year agreements for additional savings.'
    }
  ];

  const getPrice = (plan: typeof pricingPlans[0]) => {
    if (plan.customPricing) return 'Custom';
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    return `$${price}`;
  };

  const getPeriod = () => {
    return billingCycle === 'monthly' ? '/month' : '/month billed annually';
  };

  // Generate structured data for pricing page
  const pricingPageSchemas = getPricingPageSchemas();
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Pricing', url: '/pricing' }
  ]);
  
  // Create FAQ schema from the faqs array
  const faqSchema = buildFAQPageSchema(faqs.map(faq => ({
    question: faq.question,
    answer: faq.answer
  })));
  
  const allSchemas = [...pricingPageSchemas, breadcrumbSchema, faqSchema];

  return (
    <div className="pt-16 lg:pt-20">
      <PricingSEO 
        jsonLd={allSchemas}
        ogImage="/images/og/pricing-plans.jpg"
        ogImageAlt="Pricing Plans - Field Service Management Software"
        twitterImage="/images/twitter/pricing-plans.jpg"
        twitterImageAlt="Simple, transparent pricing for field service teams of all sizes"
      />
      {/* Pricing Hero */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Heading variant="h1" className="text-5xl font-bold text-white mb-6">
              Simple, transparent pricing
            </Heading>
            <Text size="xl" className="text-text-secondary mb-8">
              Choose the plan that fits your team size and needs. 
              All plans include our core features with no hidden fees.
            </Text>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={billingCycle === 'monthly' ? 'text-white' : 'text-text-muted'}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  billingCycle === 'annual' ? 'bg-brand-primary' : 'bg-border'
                }`}
              >
                <div
                  className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${
                    billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={billingCycle === 'annual' ? 'text-white' : 'text-text-muted'}>
                Annual
                <span className="ml-2 px-2 py-1 bg-success/20 text-success text-xs rounded-full">
                  Save 20%
                </span>
              </span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Pricing Cards */}
      <Section spacing="xl">
        <Container>
          <Grid cols={{ base: 1, lg: 3 }} gap={8} className="max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-surface-glass backdrop-blur-xl border-2 rounded-2xl p-8 ${
                  plan.popular 
                    ? `${plan.color} shadow-xl shadow-brand-primary/20` 
                    : `${plan.color} hover:border-brand-primary/30`
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-brand-primary text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <Heading variant="h3" className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </Heading>
                  <Text className="text-text-secondary mb-6">
                    {plan.description}
                  </Text>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-white">
                        {getPrice(plan)}
                      </span>
                      {!plan.customPricing && (
                        <span className="text-text-secondary ml-2">
                          {getPeriod()}
                        </span>
                      )}
                    </div>
                    {plan.customPricing && (
                      <Text size="sm" className="text-text-secondary mt-2">
                        Contact for pricing
                      </Text>
                    )}
                  </div>

                  <Button
                    variant={plan.popular ? 'primary' : 'secondary'}
                    size="lg"
                    className="w-full group"
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                      <Text size="sm" className="text-text-secondary">
                        {feature}
                      </Text>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center opacity-50">
                      <X className="w-5 h-5 text-text-muted mr-3 flex-shrink-0" />
                      <Text size="sm" className="text-text-muted">
                        {feature}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Feature Comparison Table */}
      <Section spacing="2xl" className="bg-surface/30">
        <Container>
          <div className="text-center mb-16">
            <Heading variant="h2" className="text-3xl font-bold text-white mb-6">
              Compare all features
            </Heading>
            <Text size="lg" className="text-text-secondary">
              See exactly what's included in each plan
            </Text>
          </div>
          
          <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="text-left p-6 text-white font-semibold">Features</th>
                    <th className="text-center p-6 text-white font-semibold">Starter</th>
                    <th className="text-center p-6 text-white font-semibold relative">
                      Professional
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <div className="bg-brand-primary text-white px-2 py-1 rounded text-xs">
                          Popular
                        </div>
                      </div>
                    </th>
                    <th className="text-center p-6 text-white font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      <tr className="bg-surface-elevated/50">
                        <td colSpan={4} className="p-4 text-brand-primary font-semibold text-sm uppercase tracking-wider">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, featureIndex) => (
                        <tr key={featureIndex} className="border-t border-border">
                          <td className="p-4 text-text-secondary">{feature.name}</td>
                          <td className="p-4 text-center">
                            {typeof feature.starter === 'boolean' ? (
                              feature.starter ? (
                                <CheckCircle className="w-5 h-5 text-success mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-text-muted mx-auto" />
                              )
                            ) : (
                              <span className="text-text-secondary">{feature.starter}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {typeof feature.professional === 'boolean' ? (
                              feature.professional ? (
                                <CheckCircle className="w-5 h-5 text-success mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-text-muted mx-auto" />
                              )
                            ) : (
                              <span className="text-text-secondary">{feature.professional}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {typeof feature.enterprise === 'boolean' ? (
                              feature.enterprise ? (
                                <CheckCircle className="w-5 h-5 text-success mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-text-muted mx-auto" />
                              )
                            ) : (
                              <span className="text-text-secondary">{feature.enterprise}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </Section>

      {/* ROI Calculator */}
      <Section spacing="2xl">
        <Container>
          <div className="text-center mb-16">
            <Heading variant="h2" className="text-4xl font-bold text-white mb-6">
              Calculate your ROI
            </Heading>
            <Text size="lg" className="text-text-secondary max-w-3xl mx-auto">
              See how much you could save with our intelligent scheduling 
              and optimization platform.
            </Text>
          </div>
          
          <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <Calculator className="w-8 h-8 text-brand-primary mr-3" />
              <Heading variant="h3" className="text-2xl font-semibold text-white">
                ROI Calculator
              </Heading>
            </div>
            
            <div className="bg-surface-elevated rounded-xl p-8">
              <div className="text-center">
                <div className="text-6xl font-bold text-brand-primary mb-4">25%</div>
                <Text className="text-xl font-semibold text-white mb-2">
                  Average Cost Reduction
                </Text>
                <Text className="text-text-secondary mb-8">
                  Based on 500+ customer implementations
                </Text>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success mb-2">40%</div>
                    <div className="text-sm text-text-secondary">Travel Time Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success mb-2">35%</div>
                    <div className="text-sm text-text-secondary">Fuel Cost Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success mb-2">25%</div>
                    <div className="text-sm text-text-secondary">Capacity Increase</div>
                  </div>
                </div>

                <Button size="lg" variant="primary">
                  Get Custom ROI Analysis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ Section */}
      <Section spacing="2xl" className="bg-surface/30">
        <Container>
          <div className="text-center mb-16">
            <Heading variant="h2" className="text-3xl font-bold text-white mb-6">
              Frequently asked questions
            </Heading>
            <Text size="lg" className="text-text-secondary">
              Get answers to common questions about our pricing and plans
            </Text>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-surface-glass backdrop-blur-xl border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
                >
                  <Text className="font-semibold text-white">{faq.question}</Text>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-text-secondary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-secondary" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <Text className="text-text-secondary">{faq.answer}</Text>
                  </div>
                )}
              </div>
            ))}
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
            Ready to get started?
          </Heading>
          <Text size="lg" className="text-text-secondary mb-8 max-w-2xl mx-auto">
            Start your free trial today. No credit card required.
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

export default PricingPage;