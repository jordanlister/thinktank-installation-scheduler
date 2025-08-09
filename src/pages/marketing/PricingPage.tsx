import React, { useState } from 'react';
import { Container, Section, Heading, Text, Button, Grid } from '../../components/ui';
import { 
  CheckCircle,
  X,
  Star,
  Calculator,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PricingSEO } from '../../components/SEO';
import { getPricingPageSchemas, buildBreadcrumbListSchema, buildFAQPageSchema } from '../../lib/seo/jsonld';
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
    if (plan.customPricing) return 'Contact Us';
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
      <ScrollProgressIndicator />
      <PricingSEO 
        jsonLd={allSchemas}
        ogImage="/images/og/pricing-plans.jpg"
        ogImageAlt="Pricing Plans - Field Service Management Software"
        twitterImage="/images/twitter/pricing-plans.jpg"
        twitterImageAlt="Simple, transparent pricing for field service teams of all sizes"
      />
      {/* Pricing Hero */}
      <section className="marketing-hero">
        <div className="marketing-container">
          <HeroReveal className="marketing-text-container text-center mb-12">
            <h1 className="ttt-hero-heading font-bold text-white mb-4">
              Simple, transparent pricing
            </h1>
            <p className="ttt-text-lead text-text-secondary mb-6">
              Choose the plan that fits your team size and needs. 
              All plans include our core features with no hidden fees.
            </p>
            
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
          </HeroReveal>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="marketing-section">
        <div className="marketing-container">
          <StaggerGroup className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <StaggerItem key={index}>
                <AnimatedCard
                  className={`relative marketing-feature-card h-full flex flex-col ${
                  plan.popular 
                    ? `border-brand-primary shadow-xl shadow-brand-primary/20` 
                    : `hover:border-brand-primary/30`
                } transition-all duration-300`}
                >
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-brand-primary text-white p-2 rounded-full">
                      <InteractiveIcon>
                        <Star className="w-4 h-4 fill-current" />
                      </InteractiveIcon>
                    </div>
                  </div>
                )}

                {/* Header Section */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-text-secondary mb-6">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center min-h-[4rem] items-center">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-white">
                          {getPrice(plan)}
                        </span>
                        {!plan.customPricing && (
                          <span className="text-text-secondary ml-2 text-sm">
                            {getPeriod()}
                          </span>
                        )}
                        {plan.customPricing && (
                          <p className="text-sm text-text-secondary mt-1">
                            Contact for pricing
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <CTAButton
                    variant={plan.popular ? 'primary' : 'secondary'}
                    className="w-full"
                  >
                    {plan.cta}
                  </CTAButton>
                </div>

                {/* Features Section - Fixed height to align buttons */}
                <div className="flex-1 space-y-1.5 min-h-[320px]">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <InteractiveIcon>
                        <CheckCircle className="w-3.5 h-3.5 text-success mr-2.5 flex-shrink-0 mt-0.5" />
                      </InteractiveIcon>
                      <span className="text-xs text-text-secondary leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start opacity-40">
                      <InteractiveIcon>
                        <X className="w-3.5 h-3.5 text-text-muted mr-2.5 flex-shrink-0 mt-0.5" />
                      </InteractiveIcon>
                      <span className="text-xs text-text-muted leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="marketing-section bg-surface/30">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Compare all features
            </h2>
            <p className="ttt-text-lead text-text-secondary">
              See exactly what's included in each plan
            </p>
          </ScrollReveal>
          
          <AnimatedCard className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-2/5" />
                  <col className="w-1/5" />
                  <col className="w-1/5" />
                  <col className="w-1/5" />
                </colgroup>
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="text-left p-6 text-white font-semibold">Features</th>
                    <th className="text-center p-6 text-white font-semibold">Starter</th>
                    <th className="text-center p-6 text-brand-primary font-semibold">
                      Professional
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
                          <td className="p-4 text-text-secondary font-medium">{feature.name}</td>
                          <td className="p-4 text-center align-middle">
                            <div className="flex items-center justify-center min-h-[24px]">
                              {typeof feature.starter === 'boolean' ? (
                                feature.starter ? (
                                  <InteractiveIcon>
                                    <CheckCircle className="w-5 h-5 text-success" />
                                  </InteractiveIcon>
                                ) : (
                                  <InteractiveIcon>
                                    <X className="w-5 h-5 text-text-muted" />
                                  </InteractiveIcon>
                                )
                              ) : (
                                <span className="text-text-secondary font-medium">{feature.starter}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center align-middle">
                            <div className="flex items-center justify-center min-h-[24px]">
                              {typeof feature.professional === 'boolean' ? (
                                feature.professional ? (
                                  <InteractiveIcon>
                                    <CheckCircle className="w-5 h-5 text-success" />
                                  </InteractiveIcon>
                                ) : (
                                  <InteractiveIcon>
                                    <X className="w-5 h-5 text-text-muted" />
                                  </InteractiveIcon>
                                )
                              ) : (
                                <span className="text-text-secondary font-medium">{feature.professional}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center align-middle">
                            <div className="flex items-center justify-center min-h-[24px]">
                              {typeof feature.enterprise === 'boolean' ? (
                                feature.enterprise ? (
                                  <InteractiveIcon>
                                    <CheckCircle className="w-5 h-5 text-success" />
                                  </InteractiveIcon>
                                ) : (
                                  <InteractiveIcon>
                                    <X className="w-5 h-5 text-text-muted" />
                                  </InteractiveIcon>
                                )
                              ) : (
                                <span className="text-text-secondary font-medium">{feature.enterprise}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="marketing-section">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Calculate your ROI
            </h2>
            <p className="ttt-text-lead text-text-secondary marketing-text-container mx-auto">
              See how much you could save with our intelligent scheduling 
              and optimization platform.
            </p>
          </ScrollReveal>
          
          <AnimatedCard className="marketing-feature-card max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="marketing-feature-icon bg-brand-primary/10 border border-brand-primary/20 mr-4">
                  <InteractiveIcon>
                    <Calculator className="w-6 h-6 text-brand-primary" />
                  </InteractiveIcon>
                </div>
                <h3 className="ttt-feature-title text-white">
                  ROI Calculator
                </h3>
              </div>
              
              <div className="mb-8">
                <div className="text-6xl font-bold text-brand-primary mb-4 tabular-nums">
                  <AnimatedCounter value={25} suffix="%" duration={2.5} delay={0.5} />
                </div>
                <p className="ttt-text-lead text-white font-semibold mb-2">
                  Average Cost Reduction
                </p>
                <p className="ttt-text-small text-text-secondary mb-8">
                  Based on <AnimatedCounter value={500} suffix="+" duration={2} delay={0.8} /> customer implementations
                </p>
              </div>
              
              <StaggerGroup className="grid md:grid-cols-3 gap-8 mb-8">
                <StaggerItem>
                  <div className="text-center p-4 bg-surface-elevated/30 rounded-xl border border-border/40">
                    <div className="text-3xl font-bold text-success mb-3 tabular-nums">
                      <AnimatedCounter value={40} suffix="%" duration={2.2} delay={1.0} />
                    </div>
                    <div className="ttt-text-small text-text-secondary font-medium">Travel Time Reduction</div>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="text-center p-4 bg-surface-elevated/30 rounded-xl border border-border/40">
                    <div className="text-3xl font-bold text-success mb-3 tabular-nums">
                      <AnimatedCounter value={35} suffix="%" duration={2.2} delay={1.2} />
                    </div>
                    <div className="ttt-text-small text-text-secondary font-medium">Fuel Cost Savings</div>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="text-center p-4 bg-surface-elevated/30 rounded-xl border border-border/40">
                    <div className="text-3xl font-bold text-success mb-3 tabular-nums">
                      <AnimatedCounter value={25} suffix="%" duration={2.2} delay={1.4} />
                    </div>
                    <div className="ttt-text-small text-text-secondary font-medium">Capacity Increase</div>
                  </div>
                </StaggerItem>
              </StaggerGroup>

              <CTAButton size="lg" variant="primary">
                Get Custom ROI Analysis
              </CTAButton>
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="marketing-section bg-surface/30">
        <div className="marketing-container">
          <ScrollReveal className="text-center mb-12">
            <h2 className="ttt-section-header text-white mb-4">
              Frequently asked questions
            </h2>
            <p className="ttt-text-lead text-text-secondary">
              Get answers to common questions about our pricing and plans
            </p>
          </ScrollReveal>
          
          <StaggerGroup className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <StaggerItem key={index}>
                <AnimatedCard className="marketing-feature-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
                >
                  <span className="ttt-feature-title text-white">{faq.question}</span>
                  <InteractiveIcon>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-text-secondary" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-secondary" />
                    )}
                  </InteractiveIcon>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="ttt-feature-description">{faq.answer}</p>
                  </div>
                )}
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
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
              Ready to get started?
            </h2>
            <p className="ttt-text-lead text-text-secondary mb-8 marketing-text-container mx-auto">
              Start your free trial today. No credit card required.
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

export default PricingPage;