// Think Tank Technologies - External Integration Service
// Manages all external service integrations and data synchronization

import { MultiTenantService, TenantContext } from './multiTenantService';
import WebhookService from './webhookService';
import OAuthIntegrationService from './oauthIntegrationService';
import { supabase } from './supabase';

export interface ExternalService {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'crm' | 'calendar' | 'communication' | 'analytics' | 'storage' | 'other';
  iconUrl?: string;
  websiteUrl?: string;
  documentationUrl?: string;
  supportedFeatures: string[];
  requiresOAuth: boolean;
  supportsWebhooks: boolean;
  isActive: boolean;
}

export interface IntegrationConfig {
  id: string;
  organizationId: string;
  serviceId: string;
  serviceName: string;
  name: string;
  description?: string;
  isActive: boolean;
  configuration: Record<string, any>;
  oauthIntegrationId?: string;
  webhookSubscriptions: string[];
  syncSettings: {
    enabled: boolean;
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    syncDirection: 'import' | 'export' | 'bidirectional';
    dataTypes: string[];
    lastSync?: string;
    nextSync?: string;
  };
  fieldMappings: Array<{
    sourceField: string;
    targetField: string;
    transformation?: string;
    required: boolean;
  }>;
  createdBy: string;
  createdAt: string;
}

export interface SyncResult {
  integrationId: string;
  startTime: string;
  endTime: string;
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  errors: Array<{
    recordId?: string;
    error: string;
    details?: any;
  }>;
  summary: {
    imported: number;
    exported: number;
    updated: number;
    skipped: number;
  };
}

export class ExternalIntegrationService extends MultiTenantService {
  private webhookService: WebhookService;
  private oauthService: OAuthIntegrationService;

  constructor(context: TenantContext) {
    super(context);
    this.webhookService = new WebhookService(context);
    this.oauthService = new OAuthIntegrationService(context);
  }

  /**
   * Get available external services
   */
  async getAvailableServices(): Promise<ExternalService[]> {
    try {
      const { data, error } = await supabase
        .from('external_services')
        .select('*')
        .eq('is_active', true)
        .order('category, name');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching external services:', error);
      throw error;
    }
  }

  /**
   * Get organization's integration configurations
   */
  async getIntegrationConfigs(): Promise<IntegrationConfig[]> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to view integrations');
    }

    try {
      const { data, error } = await this.getBaseQuery('integration_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching integration configs:', error);
      throw error;
    }
  }

  /**
   * Create new integration configuration
   */
  async createIntegrationConfig(configData: {
    serviceId: string;
    name: string;
    description?: string;
    configuration: Record<string, any>;
    syncSettings: IntegrationConfig['syncSettings'];
    fieldMappings: IntegrationConfig['fieldMappings'];
    oauthIntegrationId?: string;
  }): Promise<IntegrationConfig> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to create integrations');
    }

    try {
      // Get service details
      const { data: service, error: serviceError } = await supabase
        .from('external_services')
        .select('*')
        .eq('id', configData.serviceId)
        .single();

      if (serviceError || !service) {
        throw new Error('External service not found');
      }

      // Create integration config
      const integrationData = this.addOrganizationContext({
        service_id: configData.serviceId,
        service_name: service.name,
        name: configData.name,
        description: configData.description,
        is_active: true,
        configuration: configData.configuration,
        oauth_integration_id: configData.oauthIntegrationId,
        webhook_subscriptions: [],
        sync_settings: configData.syncSettings,
        field_mappings: configData.fieldMappings
      });

      const { data: integration, error } = await this.getBaseQuery('integration_configs')
        .insert(integrationData)
        .select()
        .single();

      if (error) throw error;

      // Set up webhooks if supported
      if (service.supports_webhooks && configData.syncSettings.enabled) {
        await this.setupWebhooksForIntegration(integration.id, service);
      }

      // Log activity
      await this.logActivity(
        'integration_created',
        `Created ${service.display_name} integration: ${configData.name}`,
        'integration',
        integration.id,
        { serviceId: configData.serviceId, syncEnabled: configData.syncSettings.enabled }
      );

      return integration;
    } catch (error) {
      console.error('Error creating integration config:', error);
      throw error;
    }
  }

  /**
   * Update integration configuration
   */
  async updateIntegrationConfig(
    integrationId: string,
    updates: Partial<{
      name: string;
      description: string;
      isActive: boolean;
      configuration: Record<string, any>;
      syncSettings: IntegrationConfig['syncSettings'];
      fieldMappings: IntegrationConfig['fieldMappings'];
    }>
  ): Promise<IntegrationConfig> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to update integrations');
    }

    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.configuration) updateData.configuration = updates.configuration;
      if (updates.syncSettings) updateData.sync_settings = updates.syncSettings;
      if (updates.fieldMappings) updateData.field_mappings = updates.fieldMappings;

      const { data: integration, error } = await this.getBaseQuery('integration_configs')
        .update(updateData)
        .eq('id', integrationId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(
        'integration_updated',
        `Updated integration: ${integration.name}`,
        'integration',
        integrationId,
        { updates: Object.keys(updateData) }
      );

      return integration;
    } catch (error) {
      console.error('Error updating integration config:', error);
      throw error;
    }
  }

  /**
   * Test integration connection
   */
  async testIntegration(integrationId: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to test integrations');
    }

    try {
      // Get integration config
      const { data: integration, error } = await this.getBaseQuery('integration_configs')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error || !integration) {
        throw new Error('Integration not found');
      }

      // Get service details
      const { data: service, error: serviceError } = await supabase
        .from('external_services')
        .select('*')
        .eq('id', integration.service_id)
        .single();

      if (serviceError || !service) {
        throw new Error('Service configuration not found');
      }

      let testResult = { success: false, message: 'Unknown error', details: {} };

      // Test based on service type
      if (service.requires_oauth && integration.oauth_integration_id) {
        // Test OAuth connection
        const oauthResult = await this.oauthService.testIntegration(integration.oauth_integration_id);
        testResult = {
          success: oauthResult.success,
          message: oauthResult.success ? 'OAuth connection successful' : oauthResult.error || 'OAuth connection failed',
          details: oauthResult.userInfo
        };
      } else {
        // Test API connection directly
        testResult = await this.testApiConnection(integration, service);
      }

      // Update integration status
      await this.getBaseQuery('integration_configs')
        .update({
          last_test: new Date().toISOString(),
          test_status: testResult.success ? 'success' : 'failed',
          test_message: testResult.message
        })
        .eq('id', integrationId);

      return testResult;
    } catch (error) {
      console.error('Error testing integration:', error);
      throw error;
    }
  }

  /**
   * Sync data with external service
   */
  async syncIntegration(integrationId: string, dataTypes?: string[]): Promise<SyncResult> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to sync integrations');
    }

    const startTime = new Date().toISOString();

    try {
      // Get integration config
      const { data: integration, error } = await this.getBaseQuery('integration_configs')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error || !integration) {
        throw new Error('Integration not found');
      }

      if (!integration.is_active || !integration.sync_settings.enabled) {
        throw new Error('Integration is not active or sync is disabled');
      }

      // Get service details
      const { data: service, error: serviceError } = await supabase
        .from('external_services')
        .select('*')
        .eq('id', integration.service_id)
        .single();

      if (serviceError || !service) {
        throw new Error('Service configuration not found');
      }

      // Update sync status
      await this.getBaseQuery('integration_configs')
        .update({
          sync_status: 'syncing',
          sync_settings: {
            ...integration.sync_settings,
            lastSync: startTime
          }
        })
        .eq('id', integrationId);

      // Perform sync based on service
      const syncResult = await this.performDataSync(integration, service, dataTypes);

      // Update integration with sync results
      const nextSync = this.calculateNextSyncTime(integration.sync_settings.frequency);
      await this.getBaseQuery('integration_configs')
        .update({
          sync_status: syncResult.status === 'success' ? 'idle' : 'error',
          sync_settings: {
            ...integration.sync_settings,
            lastSync: syncResult.endTime,
            nextSync
          },
          last_sync_result: syncResult
        })
        .eq('id', integrationId);

      // Log activity
      await this.logActivity(
        'integration_sync',
        `Sync ${syncResult.status}: ${integration.name} (${syncResult.recordsProcessed} records)`,
        'integration',
        integrationId,
        syncResult
      );

      return syncResult;
    } catch (error) {
      console.error('Error syncing integration:', error);

      const endTime = new Date().toISOString();
      const failedResult: SyncResult = {
        integrationId,
        startTime,
        endTime,
        status: 'failed',
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsError: 0,
        errors: [{
          error: error instanceof Error ? error.message : 'Sync failed'
        }],
        summary: {
          imported: 0,
          exported: 0,
          updated: 0,
          skipped: 0
        }
      };

      // Update integration with error status
      await this.getBaseQuery('integration_configs')
        .update({
          sync_status: 'error',
          last_sync_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', integrationId);

      return failedResult;
    }
  }

  /**
   * Delete integration configuration
   */
  async deleteIntegrationConfig(integrationId: string): Promise<void> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to delete integrations');
    }

    try {
      // Get integration details for cleanup
      const { data: integration, error } = await this.getBaseQuery('integration_configs')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error || !integration) {
        throw new Error('Integration not found');
      }

      // Clean up webhooks
      if (integration.webhook_subscriptions && integration.webhook_subscriptions.length > 0) {
        await Promise.all(
          integration.webhook_subscriptions.map((webhookId: string) =>
            this.webhookService.deleteWebhook(webhookId).catch(console.error)
          )
        );
      }

      // Delete integration config
      const { error: deleteError } = await this.getBaseQuery('integration_configs')
        .delete()
        .eq('id', integrationId);

      if (deleteError) throw deleteError;

      // Log activity
      await this.logActivity(
        'integration_deleted',
        `Deleted ${integration.service_name} integration: ${integration.name}`,
        'integration',
        integrationId
      );
    } catch (error) {
      console.error('Error deleting integration config:', error);
      throw error;
    }
  }

  /**
   * Set up webhooks for integration
   */
  private async setupWebhooksForIntegration(
    integrationId: string,
    service: ExternalService
  ): Promise<void> {
    if (!service.supportsWebhooks) return;

    try {
      // Create webhooks for relevant events
      const webhookEvents = this.getRelevantEventsForService(service);
      const webhookSubscriptions = [];

      for (const eventType of webhookEvents) {
        const webhook = await this.webhookService.createWebhook({
          name: `${service.displayName} - ${eventType}`,
          url: `${service.webhookUrl}/${eventType}`,
          events: [eventType],
          headers: {
            'X-Integration-ID': integrationId,
            'X-Service': service.name
          }
        });
        webhookSubscriptions.push(webhook.id);
      }

      // Update integration with webhook IDs
      await this.getBaseQuery('integration_configs')
        .update({
          webhook_subscriptions: webhookSubscriptions
        })
        .eq('id', integrationId);

    } catch (error) {
      console.error('Error setting up webhooks for integration:', error);
      // Don't throw - webhook setup failure shouldn't block integration creation
    }
  }

  /**
   * Test API connection directly
   */
  private async testApiConnection(
    integration: IntegrationConfig,
    service: ExternalService
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const testEndpoint = integration.configuration.testEndpoint || service.testUrl;
      if (!testEndpoint) {
        return { success: false, message: 'No test endpoint configured' };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'ThinkTank-Integration/1.0'
      };

      // Add authentication headers
      if (integration.configuration.apiKey) {
        headers['Authorization'] = `Bearer ${integration.configuration.apiKey}`;
      }

      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        return {
          success: true,
          message: 'API connection successful',
          details: data
        };
      } else {
        return {
          success: false,
          message: `API error: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Perform actual data synchronization
   */
  private async performDataSync(
    integration: IntegrationConfig,
    service: ExternalService,
    dataTypes?: string[]
  ): Promise<SyncResult> {
    const startTime = new Date().toISOString();
    const result: SyncResult = {
      integrationId: integration.id,
      startTime,
      endTime: '',
      status: 'success',
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsError: 0,
      errors: [],
      summary: {
        imported: 0,
        exported: 0,
        updated: 0,
        skipped: 0
      }
    };

    try {
      const typesToSync = dataTypes || integration.syncSettings.dataTypes;

      for (const dataType of typesToSync) {
        try {
          const typeResult = await this.syncDataType(integration, service, dataType);
          
          result.recordsProcessed += typeResult.processed;
          result.recordsSuccess += typeResult.success;
          result.recordsError += typeResult.errors;
          result.summary.imported += typeResult.imported;
          result.summary.exported += typeResult.exported;
          result.summary.updated += typeResult.updated;
          result.summary.skipped += typeResult.skipped;

        } catch (error) {
          result.errors.push({
            error: `Failed to sync ${dataType}: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
          result.recordsError++;
        }
      }

      result.endTime = new Date().toISOString();
      result.status = result.errors.length === 0 ? 'success' : 
                     result.recordsSuccess > 0 ? 'partial' : 'failed';

      return result;
    } catch (error) {
      result.endTime = new Date().toISOString();
      result.status = 'failed';
      result.errors.push({
        error: error instanceof Error ? error.message : 'Sync failed'
      });
      return result;
    }
  }

  /**
   * Sync specific data type
   */
  private async syncDataType(
    integration: IntegrationConfig,
    service: ExternalService,
    dataType: string
  ): Promise<{
    processed: number;
    success: number;
    errors: number;
    imported: number;
    exported: number;
    updated: number;
    skipped: number;
  }> {
    // This is a simplified implementation
    // In a real-world scenario, this would contain service-specific sync logic
    
    const result = {
      processed: 0,
      success: 0,
      errors: 0,
      imported: 0,
      exported: 0,
      updated: 0,
      skipped: 0
    };

    // Implementation would depend on the service and data type
    // For example:
    // - CRM: sync contacts, leads, opportunities
    // - Calendar: sync appointments, availability
    // - Communication: sync messages, notifications
    
    return result;
  }

  /**
   * Get relevant webhook events for a service
   */
  private getRelevantEventsForService(service: ExternalService): string[] {
    const eventMap: Record<string, string[]> = {
      'crm': ['installation.created', 'installation.completed', 'team_member.created'],
      'calendar': ['installation.scheduled', 'assignment.created', 'assignment.updated'],
      'communication': ['assignment.created', 'assignment.completed', 'schedule.conflict_detected'],
      'analytics': ['installation.completed', 'assignment.completed', 'organization.updated'],
      'storage': ['installation.completed', 'team_member.updated']
    };

    return eventMap[service.category] || [];
  }

  /**
   * Calculate next sync time based on frequency
   */
  private calculateNextSyncTime(frequency: string): string {
    const now = new Date();
    
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    }
  }
}

export default ExternalIntegrationService;