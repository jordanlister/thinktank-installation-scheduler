// Think Tank Technologies - OAuth Integration Service
// Manages OAuth integrations with third-party services

import { MultiTenantService, TenantContext } from './multiTenantService';
import { supabase } from './supabase';

export interface OAuthProvider {
  id: string;
  name: string;
  displayName: string;
  description: string;
  iconUrl?: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret?: string;
  isActive: boolean;
  configuration: {
    authParams?: Record<string, string>;
    tokenParams?: Record<string, string>;
    userInfoUrl?: string;
    customFields?: Record<string, string>;
  };
}

export interface OAuthIntegration {
  id: string;
  organizationId: string;
  providerId: string;
  providerName: string;
  name: string;
  description?: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scopes: string[];
  userInfo?: {
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  lastSync?: string;
  syncStatus?: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
}

export interface OAuthAuthUrl {
  url: string;
  state: string;
  codeVerifier?: string;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType: string;
  scope?: string;
}

export class OAuthIntegrationService extends MultiTenantService {

  /**
   * Get available OAuth providers
   */
  async getAvailableProviders(): Promise<OAuthProvider[]> {
    try {
      const { data, error } = await supabase
        .from('oauth_providers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Remove client secrets from response
      return data.map(provider => ({
        ...provider,
        clientSecret: undefined
      }));
    } catch (error) {
      console.error('Error fetching OAuth providers:', error);
      throw error;
    }
  }

  /**
   * Get organization's OAuth integrations
   */
  async getIntegrations(): Promise<OAuthIntegration[]> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to view integrations');
    }

    try {
      const { data, error } = await this.getBaseQuery('oauth_integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Remove sensitive token information from response
      return data.map(integration => this.transformIntegrationData(integration, false));
    } catch (error) {
      console.error('Error fetching OAuth integrations:', error);
      throw error;
    }
  }

  /**
   * Start OAuth authorization flow
   */
  async startOAuthFlow(
    providerId: string,
    integrationName: string,
    redirectUri: string,
    scopes?: string[]
  ): Promise<OAuthAuthUrl> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to create integrations');
    }

    try {
      // Get provider configuration
      const { data: provider, error } = await supabase
        .from('oauth_providers')
        .select('*')
        .eq('id', providerId)
        .eq('is_active', true)
        .single();

      if (error || !provider) {
        throw new Error('OAuth provider not found or inactive');
      }

      // Generate state parameter for CSRF protection
      const state = this.generateRandomString(32);
      const codeVerifier = this.generateRandomString(128);
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      // Store OAuth session
      await this.getBaseQuery('oauth_sessions')
        .insert({
          organization_id: this.organizationId,
          provider_id: providerId,
          state,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
          integration_name: integrationName,
          requested_scopes: scopes || provider.scopes,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          created_by: this.userId
        });

      // Build authorization URL
      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: provider.client_id,
        redirect_uri: redirectUri,
        scope: (scopes || provider.scopes).join(' '),
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        ...provider.configuration.authParams
      });

      const authUrl = `${provider.auth_url}?${authParams.toString()}`;

      return {
        url: authUrl,
        state,
        codeVerifier
      };
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      throw error;
    }
  }

  /**
   * Complete OAuth authorization flow
   */
  async completeOAuthFlow(
    code: string,
    state: string,
    error?: string
  ): Promise<OAuthIntegration> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to complete OAuth flow');
    }

    try {
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      // Get OAuth session
      const { data: session, error: sessionError } = await this.getBaseQuery('oauth_sessions')
        .select('*')
        .eq('state', state)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session) {
        throw new Error('Invalid or expired OAuth session');
      }

      // Get provider configuration
      const { data: provider, error: providerError } = await supabase
        .from('oauth_providers')
        .select('*')
        .eq('id', session.provider_id)
        .single();

      if (providerError || !provider) {
        throw new Error('OAuth provider not found');
      }

      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(
        provider,
        code,
        session.redirect_uri,
        session.code_verifier
      );

      // Get user info from provider
      const userInfo = await this.getUserInfo(provider, tokenResponse.accessToken);

      // Create integration record
      const integrationData = this.addOrganizationContext({
        provider_id: session.provider_id,
        provider_name: provider.name,
        name: session.integration_name,
        status: 'connected',
        access_token: tokenResponse.accessToken,
        refresh_token: tokenResponse.refreshToken,
        token_expires_at: tokenResponse.expiresIn ? 
          new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString() : null,
        scopes: session.requested_scopes,
        user_info: userInfo,
        is_active: true,
        last_sync: new Date().toISOString()
      });

      const { data: integration, error: integrationError } = await this.getBaseQuery('oauth_integrations')
        .insert(integrationData)
        .select()
        .single();

      if (integrationError) throw integrationError;

      // Clean up OAuth session
      await this.getBaseQuery('oauth_sessions')
        .delete()
        .eq('id', session.id);

      // Log activity
      await this.logActivity(
        'oauth_integration_created',
        `Connected ${provider.display_name} integration: ${session.integration_name}`,
        'oauth_integration',
        integration.id,
        { providerId: provider.id, userEmail: userInfo?.email }
      );

      return this.transformIntegrationData(integration);
    } catch (error) {
      console.error('Error completing OAuth flow:', error);
      throw error;
    }
  }

  /**
   * Refresh OAuth access token
   */
  async refreshAccessToken(integrationId: string): Promise<OAuthIntegration> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to refresh tokens');
    }

    try {
      // Get integration with tokens
      const { data: integration, error } = await this.getBaseQuery('oauth_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error || !integration) {
        throw new Error('Integration not found');
      }

      if (!integration.refresh_token) {
        throw new Error('No refresh token available');
      }

      // Get provider configuration
      const { data: provider, error: providerError } = await supabase
        .from('oauth_providers')
        .select('*')
        .eq('id', integration.provider_id)
        .single();

      if (providerError || !provider) {
        throw new Error('OAuth provider not found');
      }

      // Refresh token
      const tokenResponse = await this.refreshTokens(provider, integration.refresh_token);

      // Update integration
      const updateData = {
        access_token: tokenResponse.accessToken,
        refresh_token: tokenResponse.refreshToken || integration.refresh_token,
        token_expires_at: tokenResponse.expiresIn ? 
          new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString() : null,
        status: 'connected',
        error_message: null,
        updated_at: new Date().toISOString()
      };

      const { data: updatedIntegration, error: updateError } = await this.getBaseQuery('oauth_integrations')
        .update(updateData)
        .eq('id', integrationId)
        .select()
        .single();

      if (updateError) throw updateError;

      return this.transformIntegrationData(updatedIntegration);
    } catch (error) {
      console.error('Error refreshing access token:', error);
      
      // Mark integration as error state
      await this.getBaseQuery('oauth_integrations')
        .update({
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Token refresh failed'
        })
        .eq('id', integrationId);

      throw error;
    }
  }

  /**
   * Test OAuth integration connection
   */
  async testIntegration(integrationId: string): Promise<{
    success: boolean;
    userInfo?: any;
    error?: string;
  }> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to test integrations');
    }

    try {
      // Get integration with current access token
      const { data: integration, error } = await this.getBaseQuery('oauth_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error || !integration) {
        throw new Error('Integration not found');
      }

      // Get provider configuration
      const { data: provider, error: providerError } = await supabase
        .from('oauth_providers')
        .select('*')
        .eq('id', integration.provider_id)
        .single();

      if (providerError || !provider) {
        throw new Error('OAuth provider not found');
      }

      // Test connection by fetching user info
      const userInfo = await this.getUserInfo(provider, integration.access_token);

      // Update integration status
      await this.getBaseQuery('oauth_integrations')
        .update({
          status: 'connected',
          error_message: null,
          user_info: userInfo,
          last_sync: new Date().toISOString()
        })
        .eq('id', integrationId);

      return { success: true, userInfo };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      
      // Update integration status
      await this.getBaseQuery('oauth_integrations')
        .update({
          status: 'error',
          error_message: errorMessage
        })
        .eq('id', integrationId);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Disconnect OAuth integration
   */
  async disconnectIntegration(integrationId: string): Promise<void> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to disconnect integrations');
    }

    try {
      // Get integration details for logging
      const { data: integration, error } = await this.getBaseQuery('oauth_integrations')
        .select('name, provider_name')
        .eq('id', integrationId)
        .single();

      if (error || !integration) {
        throw new Error('Integration not found');
      }

      // Update integration status
      const { error: updateError } = await this.getBaseQuery('oauth_integrations')
        .update({
          status: 'disconnected',
          is_active: false,
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          user_info: null,
          error_message: null
        })
        .eq('id', integrationId);

      if (updateError) throw updateError;

      // Log activity
      await this.logActivity(
        'oauth_integration_disconnected',
        `Disconnected ${integration.provider_name} integration: ${integration.name}`,
        'oauth_integration',
        integrationId
      );
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      throw error;
    }
  }

  /**
   * Delete OAuth integration
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to delete integrations');
    }

    try {
      // Get integration details for logging
      const { data: integration, error } = await this.getBaseQuery('oauth_integrations')
        .select('name, provider_name')
        .eq('id', integrationId)
        .single();

      if (error || !integration) {
        throw new Error('Integration not found');
      }

      // Delete integration
      const { error: deleteError } = await this.getBaseQuery('oauth_integrations')
        .delete()
        .eq('id', integrationId);

      if (deleteError) throw deleteError;

      // Log activity
      await this.logActivity(
        'oauth_integration_deleted',
        `Deleted ${integration.provider_name} integration: ${integration.name}`,
        'oauth_integration',
        integrationId
      );
    } catch (error) {
      console.error('Error deleting integration:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForTokens(
    provider: OAuthProvider,
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthTokenResponse> {
    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: provider.clientId,
      client_secret: provider.clientSecret || '',
      code,
      redirect_uri: redirectUri,
      ...(codeVerifier && { code_verifier: codeVerifier }),
      ...provider.configuration.tokenParams
    });

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenResponse = await response.json();
    
    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in,
      tokenType: tokenResponse.token_type,
      scope: tokenResponse.scope
    };
  }

  /**
   * Refresh access tokens
   */
  private async refreshTokens(
    provider: OAuthProvider,
    refreshToken: string
  ): Promise<OAuthTokenResponse> {
    const tokenData = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: provider.clientId,
      client_secret: provider.clientSecret || '',
      refresh_token: refreshToken
    });

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    const tokenResponse = await response.json();
    
    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in,
      tokenType: tokenResponse.token_type,
      scope: tokenResponse.scope
    };
  }

  /**
   * Get user information from OAuth provider
   */
  private async getUserInfo(provider: OAuthProvider, accessToken: string): Promise<any> {
    if (!provider.configuration.userInfoUrl) {
      return null;
    }

    const response = await fetch(provider.configuration.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generate random string for OAuth state/PKCE
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate PKCE code challenge
   */
  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    
    // Base64URL encode
    return hashBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Transform integration data for API response
   */
  private transformIntegrationData(data: any, includeTokens = false): OAuthIntegration {
    return {
      id: data.id,
      organizationId: data.organization_id,
      providerId: data.provider_id,
      providerName: data.provider_name,
      name: data.name,
      description: data.description,
      status: data.status,
      accessToken: includeTokens ? data.access_token : undefined,
      refreshToken: includeTokens ? data.refresh_token : undefined,
      tokenExpiresAt: data.token_expires_at,
      scopes: data.scopes || [],
      userInfo: data.user_info,
      metadata: data.metadata || {},
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      lastSync: data.last_sync,
      syncStatus: data.sync_status,
      errorMessage: data.error_message
    };
  }
}

export default OAuthIntegrationService;