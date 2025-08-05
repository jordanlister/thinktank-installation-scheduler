// Think Tank Technologies Report Management Interface
// Template editing, preview, and management for email and PDF reports

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Mail, 
  Eye, 
  Edit3, 
  Save, 
  Copy, 
  Trash2, 
  Plus, 
  Settings,
  Send,
  Download,
  Calendar,
  Users,
  BarChart3,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { 
  EmailTemplate, 
  PDFTemplate, 
  EmailTemplateType, 
  PDFTemplateType,
  ReportSchedule,
  TemplateEditor,
  User,
  UserRole
} from '../../types';
import { emailGenerator } from '../../services/emailGenerator';
import { pdfGenerator } from '../../services/pdfGenerator';

interface ReportManagementProps {
  currentUser: User;
  onTemplateUpdate?: (template: EmailTemplate | PDFTemplate) => void;
  onScheduleCreate?: (schedule: ReportSchedule) => void;
}

type TemplateType = 'email' | 'pdf';
type ViewMode = 'list' | 'edit' | 'preview' | 'schedule';

const ReportManagement: React.FC<ReportManagementProps> = ({
  currentUser,
  onTemplateUpdate,
  onScheduleCreate
}) => {
  const [templateType, setTemplateType] = useState<TemplateType>('email');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | PDFTemplate | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [pdfTemplates, setPdfTemplates] = useState<PDFTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [previewData, setPreviewData] = useState<any>({});
  const [editor, setEditor] = useState<TemplateEditor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // Load email templates
      const emailTemps = emailGenerator.getTemplates();
      setEmailTemplates(emailTemps);

      // Load PDF templates (this would come from a service in real implementation)
      const pdfTemps: PDFTemplate[] = [
        {
          id: 'pdf_1',
          name: 'Installation Schedule Report',
          type: 'installation_schedule',
          description: 'Daily/weekly installation schedule with team assignments',
          layout: {
            pageSize: 'Letter',
            orientation: 'portrait',
            margins: { top: 72, right: 72, bottom: 72, left: 72 }
          },
          components: [],
          variables: [
            { name: 'region', type: 'string', description: 'Region name', required: true },
            { name: 'dateRange', type: 'string', description: 'Date range', required: true },
            { name: 'installations', type: 'array', description: 'Installation list', required: true }
          ],
          styling: {
            fontFamily: 'Helvetica',
            fontSize: 12,
            primaryColor: '#1a365d',
            secondaryColor: '#2d3748',
            accentColor: '#3182ce',
            backgroundColor: '#ffffff',
            textColor: '#2d3748',
            brandColors: {
              primary: '#1a365d',
              secondary: '#2d3748',
              accent: '#3182ce',
              neutral: '#718096',
              success: '#38a169',
              warning: '#d69e2e',
              error: '#e53e3e',
              background: '#ffffff',
              surface: '#f7fafc',
              text: '#2d3748'
            }
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          version: 1,
          metadata: {
            tags: ['schedule', 'installation'],
            category: 'Operations',
            description: 'Standard installation schedule report',
            generationCount: 0
          }
        },
        {
          id: 'pdf_2',
          name: 'Team Performance Report',
          type: 'team_performance',
          description: 'Comprehensive team performance analytics',
          layout: {
            pageSize: 'Letter',
            orientation: 'portrait',
            margins: { top: 72, right: 72, bottom: 72, left: 72 }
          },
          components: [],
          variables: [
            { name: 'period', type: 'string', description: 'Report period', required: true },
            { name: 'teamMetrics', type: 'object', description: 'Team metrics data', required: true },
            { name: 'performanceData', type: 'array', description: 'Performance data', required: true }
          ],
          styling: {
            fontFamily: 'Helvetica',
            fontSize: 12,
            primaryColor: '#1a365d',
            secondaryColor: '#2d3748',
            accentColor: '#3182ce',
            backgroundColor: '#ffffff',
            textColor: '#2d3748',
            brandColors: {
              primary: '#1a365d',
              secondary: '#2d3748',
              accent: '#3182ce',
              neutral: '#718096',
              success: '#38a169',
              warning: '#d69e2e',
              error: '#e53e3e',
              background: '#ffffff',
              surface: '#f7fafc',
              text: '#2d3748'
            }
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          version: 1,
          metadata: {
            tags: ['performance', 'analytics'],
            category: 'Analytics',
            description: 'Team performance analysis report',
            generationCount: 0
          }
        }
      ];
      setPdfTemplates(pdfTemps);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    }
  };

  const getCurrentTemplates = () => {
    return templateType === 'email' ? emailTemplates : pdfTemplates;
  };

  const filteredTemplates = getCurrentTemplates().filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === null || template.isActive === filterActive;
    return matchesSearch && matchesFilter;
  });

  const handleCreateTemplate = () => {
    const newTemplate = templateType === 'email' ? createNewEmailTemplate() : createNewPDFTemplate();
    setSelectedTemplate(newTemplate);
    setViewMode('edit');
    setEditor({
      templateId: newTemplate.id,
      templateType,
      currentVersion: 1,
      isEditing: true,
      collaborators: []
    });
  };

  const handleEditTemplate = (template: EmailTemplate | PDFTemplate) => {
    setSelectedTemplate(template);
    setViewMode('edit');
    setEditor({
      templateId: template.id,
      templateType,
      currentVersion: template.version,
      isEditing: true,
      collaborators: []
    });
  };

  const handlePreviewTemplate = (template: EmailTemplate | PDFTemplate) => {
    setSelectedTemplate(template);
    setViewMode('preview');
    loadSampleData(template);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate || !editor) return;

    setIsSaving(true);
    try {
      const updatedTemplate = {
        ...selectedTemplate,
        updatedAt: new Date().toISOString(),
        version: selectedTemplate.version + 1
      };

      if (templateType === 'email') {
        emailGenerator.setTemplate(updatedTemplate as EmailTemplate);
        setEmailTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate as EmailTemplate : t));
      } else {
        // In real implementation, this would call a PDF template service
        setPdfTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate as PDFTemplate : t));
      }

      onTemplateUpdate?.(updatedTemplate);
      setViewMode('list');
      setSelectedTemplate(null);
      setEditor(null);
    } catch (err) {
      setError('Failed to save template');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleReport = (template: EmailTemplate | PDFTemplate) => {
    setSelectedTemplate(template);
    setViewMode('schedule');
  };

  const createNewEmailTemplate = (): EmailTemplate => ({
    id: `email_${Date.now()}`,
    name: 'New Email Template',
    type: 'team_communication',
    subject: 'Subject Line',
    bodyHtml: '<p>HTML content here</p>',
    bodyPlain: 'Plain text content here',
    variables: [],
    targetAudience: ['lead'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: currentUser.id,
    version: 1,
    metadata: {
      tags: [],
      category: 'Communication',
      description: '',
      usageCount: 0
    }
  });

  const createNewPDFTemplate = (): PDFTemplate => ({
    id: `pdf_${Date.now()}`,
    name: 'New PDF Template',
    type: 'customer_report',
    description: 'New PDF report template',
    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 72, left: 72 }
    },
    components: [],
    variables: [],
    styling: {
      fontFamily: 'Helvetica',
      fontSize: 12,
      primaryColor: '#1a365d',
      secondaryColor: '#2d3748',
      accentColor: '#3182ce',
      backgroundColor: '#ffffff',
      textColor: '#2d3748',
      brandColors: {
        primary: '#1a365d',
        secondary: '#2d3748',
        accent: '#3182ce',
        neutral: '#718096',
        success: '#38a169',
        warning: '#d69e2e',
        error: '#e53e3e',
        background: '#ffffff',
        surface: '#f7fafc',
        text: '#2d3748'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: currentUser.id,
    version: 1,
    metadata: {
      tags: [],
      category: 'Reports',
      description: '',
      generationCount: 0
    }
  });

  const loadSampleData = (template: EmailTemplate | PDFTemplate) => {
    // Load sample data based on template type
    const sampleData: any = {
      teamMemberName: 'John Smith',
      customerName: 'ABC Corporation',
      installDate: '2024-01-15',
      installTime: '9:00 AM',
      address: '123 Main St, City, ST 12345',
      customerPhone: '(555) 123-4567',
      region: 'Northwest',
      completedJobs: 42,
      utilizationRate: 87,
      weekOf: '2024-01-15'
    };
    
    setPreviewData(sampleData);
  };

  const renderTemplateList = () => (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {templateType === 'email' ? 'Email Templates' : 'PDF Templates'}
          </h2>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTemplateType('email')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                templateType === 'email'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail size={16} />
              Email
            </button>
            <button
              onClick={() => setTemplateType('pdf')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                templateType === 'pdf'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText size={16} />
              PDF
            </button>
          </div>
        </div>

        <button
          onClick={handleCreateTemplate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'active')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Templates</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            templateType={templateType}
            onEdit={handleEditTemplate}
            onPreview={handlePreviewTemplate}
            onSchedule={handleScheduleReport}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {templateType === 'email' ? <Mail size={48} /> : <FileText size={48} />}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No templates match your search criteria.' : 'Get started by creating your first template.'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateTemplate}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Create Template
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderEditor = () => (
    selectedTemplate && (
      <TemplateEditor
        template={selectedTemplate}
        templateType={templateType}
        editor={editor}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setViewMode('list');
          setSelectedTemplate(null);
          setEditor(null);
        }}
        isSaving={isSaving}
      />
    )
  );

  const renderPreview = () => (
    selectedTemplate && (
      <TemplatePreview
        template={selectedTemplate}
        templateType={templateType}
        sampleData={previewData}
        onBack={() => setViewMode('list')}
        onEdit={() => handleEditTemplate(selectedTemplate)}
      />
    )
  );

  const renderScheduler = () => (
    selectedTemplate && (
      <ReportScheduler
        template={selectedTemplate}
        templateType={templateType}
        onSave={(schedule) => {
          onScheduleCreate?.(schedule);
          setViewMode('list');
        }}
        onCancel={() => setViewMode('list')}
      />
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {viewMode === 'list' && renderTemplateList()}
      {viewMode === 'edit' && renderEditor()}
      {viewMode === 'preview' && renderPreview()}
      {viewMode === 'schedule' && renderScheduler()}
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: EmailTemplate | PDFTemplate;
  templateType: TemplateType;
  onEdit: (template: EmailTemplate | PDFTemplate) => void;
  onPreview: (template: EmailTemplate | PDFTemplate) => void;
  onSchedule: (template: EmailTemplate | PDFTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  templateType,
  onEdit,
  onPreview,
  onSchedule
}) => {
  const getTypeIcon = () => {
    if (templateType === 'email') {
      const emailTemplate = template as EmailTemplate;
      switch (emailTemplate.type) {
        case 'assignment_notification': return <Users size={16} />;
        case 'customer_confirmation': return <Mail size={16} />;
        case 'performance_report': return <BarChart3 size={16} />;
        default: return <Mail size={16} />;
      }
    } else {
      const pdfTemplate = template as PDFTemplate;
      switch (pdfTemplate.type) {
        case 'installation_schedule': return <Calendar size={16} />;
        case 'team_performance': return <BarChart3 size={16} />;
        case 'customer_report': return <FileText size={16} />;
        default: return <FileText size={16} />;
      }
    }
  };

  const getTypeColor = () => {
    if (templateType === 'email') {
      const emailTemplate = template as EmailTemplate;
      switch (emailTemplate.type) {
        case 'assignment_notification': return 'bg-blue-100 text-blue-800';
        case 'customer_confirmation': return 'bg-green-100 text-green-800';
        case 'performance_report': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else {
      const pdfTemplate = template as PDFTemplate;
      switch (pdfTemplate.type) {
        case 'installation_schedule': return 'bg-indigo-100 text-indigo-800';
        case 'team_performance': return 'bg-orange-100 text-orange-800';
        case 'customer_report': return 'bg-teal-100 text-teal-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getTypeColor()}`}>
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-600 capitalize">
              {template.type?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {template.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {template.description || 'No description available'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>Version {template.version}</span>
        <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPreview(template)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Eye size={14} />
          Preview
        </button>
        <button
          onClick={() => onEdit(template)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Edit3 size={14} />
          Edit
        </button>
        <button
          onClick={() => onSchedule(template)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
        >
          <Calendar size={14} />
          Schedule
        </button>
      </div>
    </div>
  );
};

// Placeholder components (would be implemented separately)
const TemplateEditor: React.FC<any> = ({ template, onSave, onCancel, isSaving }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold">Edit Template: {template.name}</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
    <div className="text-gray-600">
      Template editor would be implemented here with rich text editing, variable insertion, and live preview.
    </div>
  </div>
);

const TemplatePreview: React.FC<any> = ({ template, onBack, onEdit }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold">Preview: {template.name}</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit3 size={16} />
          Edit
        </button>
      </div>
    </div>
    <div className="text-gray-600">
      Template preview would be rendered here with sample data.
    </div>
  </div>
);

const ReportScheduler: React.FC<any> = ({ template, onSave, onCancel }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold">Schedule: {template.name}</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({})}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Calendar size={16} />
          Schedule
        </button>
      </div>
    </div>
    <div className="text-gray-600">
      Report scheduling interface would be implemented here with cron scheduling, recipient management, and automation settings.
    </div>
  </div>
);

export default ReportManagement;