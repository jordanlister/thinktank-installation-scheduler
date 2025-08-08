import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Github, Mail, MapPin, Phone } from 'lucide-react';
import { Container, Grid, Heading, Text } from '../../ui';

const MarketingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Solutions', href: '/solutions' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Integrations', href: '/features#integrations' },
  ];

  const resourceLinks = [
    { name: 'Documentation', href: '/resources/documentation' },
    { name: 'Case Studies', href: '/resources/case-studies' },
    { name: 'Blog', href: '/resources/blog' },
    { name: 'Webinars', href: '/resources/webinars' },
  ];

  const companyLinks = [
    { name: 'About Us', href: '/company' },
    { name: 'Careers', href: '/company/careers' },
    { name: 'Contact', href: '/contact' },
    { name: 'Partners', href: '/company/partners' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/legal/privacy' },
    { name: 'Terms of Service', href: '/legal/terms' },
    { name: 'Cookie Policy', href: '/legal/cookies' },
    { name: 'Security', href: '/legal/security' },
  ];

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
    { name: 'GitHub', href: '#', icon: Github },
    { name: 'Email', href: 'mailto:hello@thinktanktech.com', icon: Mail },
  ];

  return (
    <footer className="bg-surface border-t border-border">
      <Container>
        {/* Main Footer Content */}
        <div className="py-16">
          <Grid cols={{ base: 1, md: 2, lg: 5 }} gap={8}>
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">TTT</span>
                </div>
                <span className="text-xl font-bold text-white">Think Tank Technologies</span>
              </div>
              <Text className="mb-6 max-w-sm">
                Transforming field service operations through intelligent scheduling, 
                route optimization, and team management solutions.
              </Text>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-text-secondary">
                  <MapPin className="w-4 h-4 mr-2" />
                  San Francisco, CA
                </div>
                <div className="flex items-center text-sm text-text-secondary">
                  <Phone className="w-4 h-4 mr-2" />
                  (555) 123-4567
                </div>
                <div className="flex items-center text-sm text-text-secondary">
                  <Mail className="w-4 h-4 mr-2" />
                  hello@thinktanktech.com
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="w-10 h-10 bg-surface-elevated hover:bg-brand-primary/10 border border-border hover:border-brand-primary/30 rounded-lg flex items-center justify-center text-text-secondary hover:text-brand-primary transition-all duration-200"
                      aria-label={social.name}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <Heading variant="h4" className="text-white mb-4">Product</Heading>
              <nav className="space-y-3">
                {productLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block text-sm text-text-secondary hover:text-brand-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Resources Links */}
            <div>
              <Heading variant="h4" className="text-white mb-4">Resources</Heading>
              <nav className="space-y-3">
                {resourceLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block text-sm text-text-secondary hover:text-brand-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Company Links */}
            <div>
              <Heading variant="h4" className="text-white mb-4">Company</Heading>
              <nav className="space-y-3">
                {companyLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block text-sm text-text-secondary hover:text-brand-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>
          </Grid>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <Text size="sm" className="text-text-muted">
              © {currentYear} Think Tank Technologies. All rights reserved.
            </Text>
            
            <nav className="flex flex-wrap justify-center gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm text-text-muted hover:text-brand-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default MarketingFooter;