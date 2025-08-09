// Think Tank Technologies - API Documentation Service
// Generates and manages comprehensive API documentation with multi-tenant examples

import { MultiTenantService, TenantContext } from './multiTenantService';

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  category: string;
  tags: string[];
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: Record<string, ApiResponse>;
  examples: ApiExample[];
  scopes: string[];
  rateLimit?: {
    requests: number;
    window: string;
  };
  isMultiTenant: boolean;
  requiresProject?: boolean;
  deprecated?: boolean;
  version: string;
}

export interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description: string;
  required: boolean;
  type: string;
  format?: string;
  enum?: string[];
  example: any;
  multiTenantContext?: boolean;
}

export interface ApiRequestBody {
  description: string;
  required: boolean;
  contentType: string;
  schema: any;
  examples: Record<string, any>;
}

export interface ApiResponse {
  description: string;
  schema: any;
  examples: Record<string, any>;
  headers?: Record<string, any>;
}

export interface ApiExample {
  title: string;
  description: string;
  scenario: string;
  request: {
    headers?: Record<string, string>;
    parameters?: Record<string, any>;
    body?: any;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body: any;
  };
  organizationContext?: {
    organizationId: string;
    organizationName: string;
    projectId?: string;
    projectName?: string;
  };
}

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact: {
      name: string;
      url: string;
      email: string;
    };
    license: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
    variables?: Record<string, any>;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
    parameters: Record<string, any>;
    responses: Record<string, any>;
    examples: Record<string, any>;
  };
  security: Array<Record<string, any>>;
}

export class ApiDocumentationService extends MultiTenantService {

  /**
   * Generate complete OpenAPI specification
   */
  async generateOpenApiSpec(): Promise<OpenApiSpec> {
    const endpoints = await this.getAllApiEndpoints();
    
    const spec: OpenApiSpec = {
      openapi: '3.0.3',
      info: {
        title: 'Think Tank Installation Scheduler API',
        description: `
# Think Tank Installation Scheduler API

A comprehensive multi-tenant API for managing installation scheduling, team management, and project coordination.

## Multi-Tenant Architecture

This API is designed with multi-tenancy in mind. All requests must include organization context, and optionally project context for project-scoped resources.

### Authentication

The API supports two authentication methods:

1. **JWT Bearer Tokens** - For user authentication with full organization context
2. **API Keys** - For service-to-service authentication with limited scopes

### Organization Context

Every request must include organization context either through:
- JWT token claims
- API key association
- Explicit organization ID parameter (where applicable)

### Project Context

For project-scoped resources, you must specify the project ID either through:
- Path parameters
- Query parameters
- JWT token claims (when user has switched to a specific project)

## Rate Limiting

Rate limits are applied at the organization level and API key level:

- **Free Tier**: 1,000 requests/hour, burst limit 100
- **Professional**: 10,000 requests/hour, burst limit 500
- **Enterprise**: 100,000 requests/hour, burst limit 2,000
- **API Keys**: 100 requests/minute, burst limit 20

## Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
\`\`\`

## Webhooks

The API supports webhooks for real-time event notifications. See the Webhooks section for available events and configuration.
        `,
        version: '2.0.0',
        contact: {
          name: 'Think Tank Technologies API Support',
          url: 'https://docs.thinktank-scheduler.com',
          email: 'api-support@thinktank-scheduler.com'
        },
        license: {
          name: 'Proprietary',
          url: 'https://thinktank-scheduler.com/license'
        }
      },
      servers: [
        {
          url: 'https://api.thinktank-scheduler.com/v2',
          description: 'Production server'
        },
        {
          url: 'https://api-staging.thinktank-scheduler.com/v2',
          description: 'Staging server'
        },
        {
          url: 'https://api-dev.thinktank-scheduler.com/v2',
          description: 'Development server'
        }
      ],
      tags: [
        { name: 'Authentication', description: 'Authentication and authorization' },
        { name: 'Organizations', description: 'Organization management' },
        { name: 'Projects', description: 'Project management within organizations' },
        { name: 'Installations', description: 'Installation job management' },
        { name: 'Team Members', description: 'Team member management' },
        { name: 'Assignments', description: 'Assignment and scheduling' },
        { name: 'Webhooks', description: 'Webhook management' },
        { name: 'Integrations', description: 'External service integrations' },
        { name: 'Reports', description: 'Analytics and reporting' },
        { name: 'API Keys', description: 'API key management' }
      ],
      paths: {},
      components: {
        schemas: this.generateSchemas(),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token for user authentication'
          },
          apiKeyAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'API-Key',
            description: 'API key for service authentication (format: ApiKey your-api-key)'
          }
        },
        parameters: this.generateCommonParameters(),
        responses: this.generateCommonResponses(),
        examples: this.generateExamples()
      },
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ]
    };

    // Generate paths from endpoints
    spec.paths = this.generatePaths(endpoints);

    return spec;
  }

  /**
   * Generate API documentation for specific endpoint
   */
  async generateEndpointDocumentation(endpointId: string): Promise<{
    endpoint: ApiEndpoint;
    documentation: string;
    examples: ApiExample[];
    schema: any;
  }> {
    const endpoint = await this.getEndpointById(endpointId);
    if (!endpoint) {
      throw new Error('Endpoint not found');
    }

    const documentation = this.generateMarkdownDocumentation(endpoint);
    const examples = await this.generateEndpointExamples(endpoint);
    const schema = this.generateEndpointSchema(endpoint);

    return {
      endpoint,
      documentation,
      examples,
      schema
    };
  }

  /**
   * Generate SDK examples for multiple languages
   */
  generateSdkExamples(endpoint: ApiEndpoint, example: ApiExample): {
    javascript: string;
    python: string;
    curl: string;
    php: string;
  } {
    const { organizationContext } = example;
    const baseUrl = 'https://api.thinktank-scheduler.com/v2';

    return {
      javascript: this.generateJavaScriptExample(endpoint, example, baseUrl),
      python: this.generatePythonExample(endpoint, example, baseUrl),
      curl: this.generateCurlExample(endpoint, example, baseUrl),
      php: this.generatePhpExample(endpoint, example, baseUrl)
    };
  }

  /**
   * Get all API endpoints with documentation
   */
  private async getAllApiEndpoints(): Promise<ApiEndpoint[]> {
    // This would typically come from a database or configuration
    return [
      // Organizations endpoints
      {
        id: 'get-organizations',
        method: 'GET',
        path: '/organizations',
        summary: 'List organizations',
        description: 'Get all organizations accessible to the current user',
        category: 'Organizations',
        tags: ['Organizations'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of organizations to return',
            required: false,
            type: 'integer',
            example: 20
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of organizations to skip',
            required: false,
            type: 'integer',
            example: 0
          }
        ],
        responses: {
          '200': {
            description: 'List of organizations',
            schema: { $ref: '#/components/schemas/OrganizationList' },
            examples: {
              'success': {
                summary: 'Successful response',
                value: {
                  data: [
                    {
                      id: 'org_123',
                      name: 'Acme Installations',
                      slug: 'acme-installations',
                      subscription_plan: 'professional',
                      created_at: '2024-01-01T00:00:00Z'
                    }
                  ],
                  pagination: {
                    limit: 20,
                    offset: 0,
                    total: 1
                  }
                }
              }
            }
          }
        },
        examples: [],
        scopes: ['organizations:read'],
        isMultiTenant: true,
        version: '2.0.0'
      },
      // Projects endpoints
      {
        id: 'get-projects',
        method: 'GET',
        path: '/organizations/{organizationId}/projects',
        summary: 'List projects',
        description: 'Get all projects within an organization',
        category: 'Projects',
        tags: ['Projects'],
        parameters: [
          {
            name: 'organizationId',
            in: 'path',
            description: 'Organization ID',
            required: true,
            type: 'string',
            example: 'org_123',
            multiTenantContext: true
          }
        ],
        responses: {
          '200': {
            description: 'List of projects',
            schema: { $ref: '#/components/schemas/ProjectList' },
            examples: {}
          }
        },
        examples: [],
        scopes: ['projects:read'],
        isMultiTenant: true,
        version: '2.0.0'
      },
      // Installations endpoints
      {
        id: 'create-installation',
        method: 'POST',
        path: '/organizations/{organizationId}/projects/{projectId}/installations',
        summary: 'Create installation',
        description: 'Create a new installation job within a project',
        category: 'Installations',
        tags: ['Installations'],
        parameters: [
          {
            name: 'organizationId',
            in: 'path',
            description: 'Organization ID',
            required: true,
            type: 'string',
            example: 'org_123',
            multiTenantContext: true
          },
          {
            name: 'projectId',
            in: 'path',
            description: 'Project ID',
            required: true,
            type: 'string',
            example: 'proj_456',
            multiTenantContext: true
          }
        ],
        requestBody: {
          description: 'Installation data',
          required: true,
          contentType: 'application/json',
          schema: { $ref: '#/components/schemas/CreateInstallationRequest' },
          examples: {
            'basic': {
              summary: 'Basic installation',
              value: {
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                address: {
                  street: '123 Main St',
                  city: 'Anytown',
                  state: 'CA',
                  zipCode: '12345'
                },
                scheduledDate: '2024-02-15',
                scheduledTime: '09:00:00',
                priority: 'medium'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Installation created',
            schema: { $ref: '#/components/schemas/Installation' },
            examples: {}
          }
        },
        examples: [],
        scopes: ['installations:write'],
        isMultiTenant: true,
        requiresProject: true,
        version: '2.0.0'
      }
    ];
  }

  /**
   * Generate OpenAPI schemas
   */
  private generateSchemas(): Record<string, any> {
    return {
      Organization: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'org_123' },
          name: { type: 'string', example: 'Acme Installations' },
          slug: { type: 'string', example: 'acme-installations' },
          domain: { type: 'string', nullable: true, example: 'acme.com' },
          subscription_plan: { type: 'string', enum: ['free', 'professional', 'enterprise'] },
          settings: { type: 'object', additionalProperties: true },
          branding: { type: 'object', additionalProperties: true },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'name', 'slug', 'subscription_plan', 'is_active', 'created_at']
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'proj_456' },
          organization_id: { type: 'string', example: 'org_123' },
          name: { type: 'string', example: 'Q1 Installations' },
          description: { type: 'string', nullable: true },
          settings: { type: 'object', additionalProperties: true },
          is_active: { type: 'boolean' },
          created_by: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'organization_id', 'name', 'is_active', 'created_at']
      },
      Installation: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'inst_789' },
          organization_id: { type: 'string', example: 'org_123' },
          project_id: { type: 'string', example: 'proj_456' },
          customer_name: { type: 'string', example: 'John Doe' },
          customer_email: { type: 'string', format: 'email', nullable: true },
          customer_phone: { type: 'string', nullable: true },
          address: { $ref: '#/components/schemas/Address' },
          scheduled_date: { type: 'string', format: 'date' },
          scheduled_time: { type: 'string', format: 'time' },
          duration: { type: 'integer', description: 'Duration in minutes' },
          status: { 
            type: 'string', 
            enum: ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'] 
          },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          notes: { type: 'string', nullable: true },
          created_by: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'organization_id', 'project_id', 'customer_name', 'address', 'scheduled_date', 'status']
      },
      Address: {
        type: 'object',
        properties: {
          street: { type: 'string', example: '123 Main St' },
          city: { type: 'string', example: 'Anytown' },
          state: { type: 'string', example: 'CA' },
          zipCode: { type: 'string', example: '12345' },
          coordinates: {
            type: 'object',
            nullable: true,
            properties: {
              lat: { type: 'number', format: 'double' },
              lng: { type: 'number', format: 'double' }
            }
          }
        },
        required: ['street', 'city', 'state', 'zipCode']
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid input data' },
              details: { type: 'object', additionalProperties: true }
            },
            required: ['code', 'message']
          }
        },
        required: ['error']
      }
    };
  }

  /**
   * Generate common parameters
   */
  private generateCommonParameters(): Record<string, any> {
    return {
      OrganizationId: {
        name: 'organizationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'The organization identifier',
        example: 'org_123'
      },
      ProjectId: {
        name: 'projectId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'The project identifier',
        example: 'proj_456'
      },
      Limit: {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Number of items to return'
      },
      Offset: {
        name: 'offset',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 0, default: 0 },
        description: 'Number of items to skip'
      }
    };
  }

  /**
   * Generate common responses
   */
  private generateCommonResponses(): Record<string, any> {
    return {
      BadRequest: {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: {
                  field: 'customer_name is required'
                }
              }
            }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid or missing authentication credentials'
              }
            }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'You do not have permission to perform this action'
              }
            }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 'NOT_FOUND',
                message: 'The requested resource was not found'
              }
            }
          }
        }
      },
      RateLimited: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Rate limit exceeded. Try again later.'
              }
            }
          }
        },
        headers: {
          'X-RateLimit-Remaining': {
            schema: { type: 'integer' },
            description: 'Remaining requests in current window'
          },
          'X-RateLimit-Reset': {
            schema: { type: 'integer' },
            description: 'Unix timestamp when rate limit resets'
          },
          'Retry-After': {
            schema: { type: 'integer' },
            description: 'Seconds to wait before next request'
          }
        }
      }
    };
  }

  /**
   * Generate common examples
   */
  private generateExamples(): Record<string, any> {
    return {
      OrganizationExample: {
        summary: 'Example organization',
        value: {
          id: 'org_123',
          name: 'Acme Installations',
          slug: 'acme-installations',
          subscription_plan: 'professional',
          created_at: '2024-01-01T00:00:00Z'
        }
      },
      ProjectExample: {
        summary: 'Example project',
        value: {
          id: 'proj_456',
          organization_id: 'org_123',
          name: 'Q1 Installations',
          description: 'First quarter installation projects',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      }
    };
  }

  /**
   * Generate paths from endpoints
   */
  private generatePaths(endpoints: ApiEndpoint[]): Record<string, any> {
    const paths: Record<string, any> = {};

    endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters?.map(param => ({
          name: param.name,
          in: param.in,
          description: param.description,
          required: param.required,
          schema: {
            type: param.type,
            format: param.format,
            enum: param.enum
          },
          example: param.example
        })),
        ...(endpoint.requestBody && {
          requestBody: {
            description: endpoint.requestBody.description,
            required: endpoint.requestBody.required,
            content: {
              [endpoint.requestBody.contentType]: {
                schema: endpoint.requestBody.schema,
                examples: endpoint.requestBody.examples
              }
            }
          }
        }),
        responses: endpoint.responses,
        security: endpoint.scopes.length > 0 ? [
          { bearerAuth: endpoint.scopes },
          { apiKeyAuth: endpoint.scopes }
        ] : []
      };
    });

    return paths;
  }

  /**
   * Generate JavaScript SDK example
   */
  private generateJavaScriptExample(endpoint: ApiEndpoint, example: ApiExample, baseUrl: string): string {
    const url = `${baseUrl}${endpoint.path}`;
    const method = endpoint.method.toLowerCase();
    
    return `
// Using fetch API
const response = await fetch('${url}', {
  method: '${endpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
    ${Object.entries(example.request.headers || {}).map(([k, v]) => `'${k}': '${v}'`).join(',\n    ')}
  },
  ${example.request.body ? `body: JSON.stringify(${JSON.stringify(example.request.body, null, 2)})` : ''}
});

const data = await response.json();
console.log(data);

// Using axios
import axios from 'axios';

const data = await axios({
  method: '${method}',
  url: '${url}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    ${Object.entries(example.request.headers || {}).map(([k, v]) => `'${k}': '${v}'`).join(',\n    ')}
  },
  ${example.request.body ? `data: ${JSON.stringify(example.request.body, null, 2)}` : ''}
});

console.log(data.data);
    `.trim();
  }

  /**
   * Generate Python SDK example
   */
  private generatePythonExample(endpoint: ApiEndpoint, example: ApiExample, baseUrl: string): string {
    const url = `${baseUrl}${endpoint.path}`;
    
    return `
import requests
import json

url = "${url}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
    ${Object.entries(example.request.headers || {}).map(([k, v]) => `"${k}": "${v}"`).join(',\n    ')}
}

${example.request.body ? `
data = ${JSON.stringify(example.request.body, null, 2)}

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=data)
` : `
response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)
`}

if response.status_code == ${example.response.status}:
    result = response.json()
    print(result)
else:
    print(f"Error: {response.status_code} - {response.text}")
    `.trim();
  }

  /**
   * Generate cURL example
   */
  private generateCurlExample(endpoint: ApiEndpoint, example: ApiExample, baseUrl: string): string {
    const url = `${baseUrl}${endpoint.path}`;
    let curlCmd = `curl -X ${endpoint.method} "${url}"`;
    
    curlCmd += ` \\\n  -H "Authorization: Bearer YOUR_API_KEY"`;
    curlCmd += ` \\\n  -H "Content-Type: application/json"`;
    
    Object.entries(example.request.headers || {}).forEach(([key, value]) => {
      curlCmd += ` \\\n  -H "${key}: ${value}"`;
    });
    
    if (example.request.body) {
      curlCmd += ` \\\n  -d '${JSON.stringify(example.request.body)}'`;
    }
    
    return curlCmd;
  }

  /**
   * Generate PHP SDK example
   */
  private generatePhpExample(endpoint: ApiEndpoint, example: ApiExample, baseUrl: string): string {
    const url = `${baseUrl}${endpoint.path}`;
    
    return `
<?php

$url = "${url}";
$headers = [
    "Authorization: Bearer YOUR_API_KEY",
    "Content-Type: application/json",
    ${Object.entries(example.request.headers || {}).map(([k, v]) => `"${k}: ${v}"`).join(',\n    ')}
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${endpoint.method}");
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
${example.request.body ? `curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${JSON.stringify(example.request.body, null, 2)}));` : ''}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === ${example.response.status}) {
    $data = json_decode($response, true);
    print_r($data);
} else {
    echo "Error: $httpCode - $response";
}

?>
    `.trim();
  }

  /**
   * Generate markdown documentation for endpoint
   */
  private generateMarkdownDocumentation(endpoint: ApiEndpoint): string {
    return `
# ${endpoint.method} ${endpoint.path}

${endpoint.description}

## Parameters

${endpoint.parameters.map(param => `
### ${param.name} (${param.in})
- **Type**: ${param.type}${param.format ? ` (${param.format})` : ''}
- **Required**: ${param.required ? 'Yes' : 'No'}
- **Description**: ${param.description}
- **Example**: \`${param.example}\`
${param.enum ? `- **Allowed values**: ${param.enum.join(', ')}` : ''}
${param.multiTenantContext ? '- **Multi-tenant context**: This parameter provides organization/project isolation' : ''}
`).join('\n')}

${endpoint.requestBody ? `
## Request Body

${endpoint.requestBody.description}

**Content Type**: \`${endpoint.requestBody.contentType}\`
**Required**: ${endpoint.requestBody.required ? 'Yes' : 'No'}

### Schema
\`\`\`json
${JSON.stringify(endpoint.requestBody.schema, null, 2)}
\`\`\`
` : ''}

## Responses

${Object.entries(endpoint.responses).map(([status, response]) => `
### ${status}
${response.description}

\`\`\`json
${JSON.stringify(response.examples, null, 2)}
\`\`\`
`).join('\n')}

## Required Scopes

${endpoint.scopes.map(scope => `- \`${scope}\``).join('\n')}

${endpoint.rateLimit ? `
## Rate Limiting

- **Limit**: ${endpoint.rateLimit.requests} requests per ${endpoint.rateLimit.window}
` : ''}

## Multi-Tenant Context

${endpoint.isMultiTenant ? `
This endpoint requires organization context and ${endpoint.requiresProject ? 'project context' : 'operates at the organization level'}.

All data returned will be filtered to the current organization${endpoint.requiresProject ? ' and project' : ''}.
` : 'This endpoint does not require multi-tenant context.'}
    `.trim();
  }

  /**
   * Generate examples for endpoint
   */
  private async generateEndpointExamples(endpoint: ApiEndpoint): Promise<ApiExample[]> {
    // This would generate realistic examples based on the endpoint
    return [];
  }

  /**
   * Generate schema for endpoint
   */
  private generateEndpointSchema(endpoint: ApiEndpoint): any {
    // This would generate the JSON schema for the endpoint
    return {};
  }

  /**
   * Get endpoint by ID
   */
  private async getEndpointById(endpointId: string): Promise<ApiEndpoint | null> {
    const endpoints = await this.getAllApiEndpoints();
    return endpoints.find(e => e.id === endpointId) || null;
  }
}

export default ApiDocumentationService;