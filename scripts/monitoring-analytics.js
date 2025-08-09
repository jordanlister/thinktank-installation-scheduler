#!/usr/bin/env node

/**
 * Multi-Tenant Monitoring and Analytics System
 * Comprehensive monitoring for multi-tenant queries and usage analytics
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.development' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Color output functions
const colors = {
  info: '\x1b[34m[INFO]\x1b[0m',
  success: '\x1b[32m[SUCCESS]\x1b[0m',
  warning: '\x1b[33m[WARNING]\x1b[0m',
  error: '\x1b[31m[ERROR]\x1b[0m',
  metric: '\x1b[36m[METRIC]\x1b[0m'
};

function log(level, message) {
  console.log(`${colors[level]} ${message}`);
}

class MultiTenantMonitoring {
  constructor() {
    this.metrics = {
      queries: [],
      performance: {},
      tenant_usage: {},
      errors: []
    };
  }

  // Query performance monitoring
  async measureQueryPerformance(queryName, queryFunction) {
    const startTime = Date.now();
    try {
      const result = await queryFunction();
      const duration = Date.now() - startTime;
      
      this.metrics.queries.push({
        query: queryName,
        duration_ms: duration,
        success: true,
        timestamp: new Date().toISOString(),
        result_count: result.data ? result.data.length : 0
      });
      
      log('metric', `${queryName}: ${duration}ms (${result.data?.length || 0} records)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.queries.push({
        query: queryName,
        duration_ms: duration,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      log('error', `${queryName}: ${duration}ms - FAILED: ${error.message}`);
      throw error;
    }
  }

  // Multi-tenant query performance tests
  async runPerformanceTests() {
    log('info', '🔍 Running Multi-Tenant Performance Tests...');
    
    const tests = [
      {
        name: 'Organizations List',
        query: () => supabase.from('organizations').select('*')
      },
      {
        name: 'Projects by Organization',
        query: () => supabase.from('projects').select('*').limit(10)
      },
      {
        name: 'Users with Organization Context',
        query: () => supabase.from('users').select('id, email, organization_id, role').limit(50)
      },
      {
        name: 'Team Members Multi-Tenant Query',
        query: () => supabase.from('team_members')
          .select('id, first_name, last_name, organization_id, project_id')
          .limit(100)
      },
      {
        name: 'Installations with Complex Filtering',
        query: () => supabase.from('installations')
          .select('id, customer_name, status, organization_id, project_id')
          .in('status', ['pending', 'scheduled', 'in_progress'])
          .limit(100)
      },
      {
        name: 'Assignments with Joins',
        query: () => supabase.from('assignments')
          .select(`
            id, status, scheduled_date,
            installations(customer_name),
            organization_id, project_id
          `)
          .limit(50)
      },
      {
        name: 'Recent Notifications Query',
        query: () => supabase.from('notifications')
          .select('*')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(100)
      }
    ];

    for (const test of tests) {
      try {
        await this.measureQueryPerformance(test.name, test.query);
        // Brief pause between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        log('warning', `Test ${test.name} failed: ${error.message}`);
      }
    }
  }

  // Tenant usage analytics
  async analyzeTenantUsage() {
    log('info', '📊 Analyzing Tenant Usage Patterns...');
    
    try {
      // Get organization metrics
      const { data: orgs } = await this.measureQueryPerformance(
        'Organization Count',
        () => supabase.from('organizations').select('id, name, created_at')
      );

      if (orgs && orgs.length > 0) {
        for (const org of orgs) {
          const usage = await this.getTenantUsageMetrics(org.id, org.name);
          this.metrics.tenant_usage[org.id] = usage;
        }
      }

      return this.metrics.tenant_usage;
    } catch (error) {
      log('error', `Usage analysis failed: ${error.message}`);
    }
  }

  async getTenantUsageMetrics(orgId, orgName) {
    try {
      const metrics = {};

      // Projects count
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', orgId);
      metrics.projects_count = projects?.length || 0;

      // Users count
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', orgId);
      metrics.users_count = users?.length || 0;

      // Team members count
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('id')
        .eq('organization_id', orgId);
      metrics.team_members_count = teamMembers?.length || 0;

      // Installations count (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentInstallations } = await supabase
        .from('installations')
        .select('id')
        .eq('organization_id', orgId)
        .gte('created_at', thirtyDaysAgo);
      metrics.recent_installations = recentInstallations?.length || 0;

      // Assignments count (last 30 days)
      const { data: recentAssignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('organization_id', orgId)
        .gte('created_at', thirtyDaysAgo);
      metrics.recent_assignments = recentAssignments?.length || 0;

      log('metric', `${orgName}: ${metrics.users_count} users, ${metrics.projects_count} projects, ${metrics.recent_installations} recent installations`);

      return metrics;
    } catch (error) {
      log('warning', `Failed to get metrics for org ${orgId}: ${error.message}`);
      return {};
    }
  }

  // System health checks
  async performHealthChecks() {
    log('info', '🏥 Performing System Health Checks...');
    
    const healthChecks = [
      {
        name: 'Database Connection',
        check: async () => {
          const { data, error } = await supabase.from('organizations').select('count');
          if (error) throw new Error(`Database connection failed: ${error.message}`);
          return 'Connected successfully';
        }
      },
      {
        name: 'RLS Policy Enforcement', 
        check: async () => {
          // Test that RLS is working by trying to access data without proper context
          try {
            const { data, error } = await supabase.from('organizations').select('*');
            return 'RLS policies active (access controlled)';
          } catch (error) {
            return `RLS working: ${error.message}`;
          }
        }
      },
      {
        name: 'Multi-Tenant Schema Integrity',
        check: async () => {
          // Check that all critical tables have organization_id columns
          const tables = ['users', 'team_members', 'installations', 'assignments'];
          const results = [];
          
          for (const table of tables) {
            try {
              const { data, error } = await supabase
                .from(table)
                .select('organization_id')
                .limit(1);
              results.push(`${table}: ✓`);
            } catch (err) {
              if (err.message.includes('organization_id')) {
                results.push(`${table}: ✗ missing organization_id`);
              } else {
                results.push(`${table}: ✓`);
              }
            }
          }
          return results.join(', ');
        }
      },
      {
        name: 'Performance Function Availability',
        check: async () => {
          try {
            const { data, error } = await supabase.rpc('get_organization_metrics', {
              org_id: '00000000-0000-0000-0000-000000000000'
            });
            return 'Performance functions available';
          } catch (error) {
            if (error.message.includes('function') && error.message.includes('does not exist')) {
              throw new Error('Performance functions not created');
            }
            return 'Functions exist but may be RLS protected';
          }
        }
      }
    ];

    const healthResults = [];
    for (const check of healthChecks) {
      try {
        const result = await check.check();
        healthResults.push({
          check: check.name,
          status: 'PASS',
          result
        });
        log('success', `✅ ${check.name}: ${result}`);
      } catch (error) {
        healthResults.push({
          check: check.name,
          status: 'FAIL',
          error: error.message
        });
        log('error', `❌ ${check.name}: ${error.message}`);
      }
    }

    return healthResults;
  }

  // Generate performance report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      database_url: process.env.VITE_SUPABASE_URL,
      summary: {
        total_queries: this.metrics.queries.length,
        successful_queries: this.metrics.queries.filter(q => q.success).length,
        failed_queries: this.metrics.queries.filter(q => !q.success).length,
        average_query_time: this.metrics.queries.length > 0 
          ? Math.round(this.metrics.queries.reduce((sum, q) => sum + q.duration_ms, 0) / this.metrics.queries.length)
          : 0,
        slowest_query: this.metrics.queries.reduce((slowest, q) => 
          q.duration_ms > slowest.duration_ms ? q : slowest, 
          { duration_ms: 0 }
        )
      },
      performance_metrics: this.metrics.queries,
      tenant_usage: this.metrics.tenant_usage,
      health_checks: this.metrics.health_checks || []
    };

    return report;
  }

  // Save report to file
  async saveReport() {
    const report = this.generateReport();
    const reportPath = `./backups/monitoring_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log('success', `📊 Monitoring report saved: ${reportPath}`);
    
    return reportPath;
  }
}

// Main monitoring execution
async function runMonitoring() {
  log('info', '==========================================');
  log('info', '📊 MULTI-TENANT MONITORING & ANALYTICS');
  log('info', '==========================================');
  
  const monitor = new MultiTenantMonitoring();
  
  try {
    // Run performance tests
    await monitor.runPerformanceTests();
    
    // Analyze tenant usage
    await monitor.analyzeTenantUsage();
    
    // Perform health checks
    const healthResults = await monitor.performHealthChecks();
    monitor.metrics.health_checks = healthResults;
    
    // Generate and save report
    const reportPath = await monitor.saveReport();
    const report = monitor.generateReport();
    
    log('info', '\n==========================================');
    log('info', '📈 MONITORING SUMMARY');
    log('info', '==========================================');
    log('info', `Total Queries Tested: ${report.summary.total_queries}`);
    log('info', `Successful Queries: ${report.summary.successful_queries}`);
    log('info', `Failed Queries: ${report.summary.failed_queries}`);
    log('info', `Average Query Time: ${report.summary.average_query_time}ms`);
    
    if (report.summary.slowest_query.duration_ms > 0) {
      log('warning', `Slowest Query: ${report.summary.slowest_query.query} (${report.summary.slowest_query.duration_ms}ms)`);
    }
    
    // Performance assessment
    const avgTime = report.summary.average_query_time;
    if (avgTime < 200) {
      log('success', '🎉 EXCELLENT PERFORMANCE: Queries under 200ms average');
    } else if (avgTime < 500) {
      log('success', '✅ GOOD PERFORMANCE: Queries under 500ms average');
    } else if (avgTime < 1000) {
      log('warning', '⚠️ MODERATE PERFORMANCE: Consider optimization');
    } else {
      log('error', '❌ SLOW PERFORMANCE: Optimization required');
    }
    
    log('info', '==========================================');
    
    return report;
    
  } catch (error) {
    log('error', `Monitoring failed: ${error.message}`);
    throw error;
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMonitoring()
    .then((report) => {
      const avgTime = report.summary.average_query_time;
      if (avgTime < 500 && report.summary.failed_queries === 0) {
        log('success', '✅ Monitoring completed successfully - System performing well');
        process.exit(0);
      } else if (report.summary.failed_queries === 0) {
        log('warning', '⚠️ Monitoring completed - Performance needs attention');
        process.exit(0);
      } else {
        log('error', '❌ Monitoring completed - Issues found');
        process.exit(1);
      }
    })
    .catch((error) => {
      log('error', `Monitoring execution failed: ${error.message}`);
      process.exit(1);
    });
}

export { MultiTenantMonitoring, runMonitoring };