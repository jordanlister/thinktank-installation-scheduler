// Think Tank Technologies - Team Member Detail Modal

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit, 
  Save, 
  Cancel,
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Tool, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Shield,
  Target
} from 'lucide-react';
import { useTeamStore } from '../../stores/useTeamStore';
import type { 
  TeamMember, 
  Skill, 
  Certification, 
  Equipment, 
  UserRole,
  SkillCategory,
  SkillLevel,
  CertificationStatus,
  EquipmentType,
  EquipmentStatus,
  EmploymentType,
  EmploymentStatus,
  TravelPreference
} from '../../types';

interface TeamMemberModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'edit' | 'create';
}

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ member, isOpen, onClose, mode: initialMode }) => {
  const { updateTeamMember, addTeamMember, removeTeamMember } = useTeamStore();
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(initialMode);
  const [formData, setFormData] = useState<Partial<TeamMember>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'certifications' | 'equipment' | 'availability' | 'performance'>('overview');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (member) {
      setFormData(member);
    } else if (initialMode === 'create') {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'assistant',
        region: '',
        subRegions: [],
        specializations: [],
        skills: [],
        certifications: [],
        equipment: [],
        availability: [],
        capacity: 3,
        travelRadius: 50,
        isActive: true,
        emergencyContact: {
          name: '',
          relationship: '',
          phoneNumber: ''
        },
        workPreferences: {
          preferredStartTime: '08:00',
          preferredEndTime: '17:00',
          maxDailyJobs: 5,
          maxWeeklyHours: 40,
          weekendsAvailable: false,
          overtimeAvailable: false,
          travelPreference: 'regional',
          specialRequests: [],
          unavailableDates: []
        },
        trainingRecord: [],
        employmentInfo: {
          employeeId: '',
          hireDate: new Date().toISOString().split('T')[0],
          department: 'Installation Services',
          jobTitle: '',
          workLocation: '',
          employmentType: 'full_time',
          status: 'active'
        }
      });
    }
    setMode(initialMode);
  }, [member, initialMode]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (mode === 'create') {
        const newMember: TeamMember = {
          ...formData as TeamMember,
          id: `team_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        addTeamMember(newMember);
      } else if (mode === 'edit' && member) {
        updateTeamMember(member.id, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      }
      setMode('view');
    } catch (error) {
      console.error('Error saving team member:', error);
    }
  };

  const handleDelete = () => {
    if (member && window.confirm('Are you sure you want to remove this team member?')) {
      removeTeamMember(member.id);
      onClose();
    }
  };

  const validateForm = (data: Partial<TeamMember>): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};
    
    if (!data.firstName?.trim()) errors.firstName = 'First name is required';
    if (!data.lastName?.trim()) errors.lastName = 'Last name is required';
    if (!data.email?.trim()) errors.email = 'Email is required';
    if (!data.region?.trim()) errors.region = 'Region is required';
    if (!data.role) errors.role = 'Role is required';
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format';
    }
    
    return errors;
  };

  const currentMember = mode === 'create' ? formData as TeamMember : member;
  if (!currentMember) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {mode === 'create' ? 'Add Team Member' : `${currentMember.firstName} ${currentMember.lastName}`}
                </h2>
                <p className="text-sm text-gray-600 capitalize">{currentMember.role}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {mode === 'view' && (
                <>
                  <button
                    onClick={() => setMode('edit')}
                    className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </>
              )}
              
              {(mode === 'edit' || mode === 'create') && (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => mode === 'create' ? onClose() : setMode('view')}
                    className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Cancel className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </>
              )}
              
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-4 mt-3">
            {currentMember.isActive !== undefined && (
              <div className="flex items-center space-x-1">
                {currentMember.isActive ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {currentMember.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
            
            {currentMember.performanceMetrics && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-600">
                  Performance: {(
                    currentMember.performanceMetrics.completionRate * 0.3 +
                    currentMember.performanceMetrics.customerSatisfaction * 0.3 +
                    currentMember.performanceMetrics.qualityScore * 0.4
                  ).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'skills', label: 'Skills', icon: Award },
              { id: 'certifications', label: 'Certifications', icon: Shield },
              { id: 'equipment', label: 'Equipment', icon: Tool },
              { id: 'availability', label: 'Availability', icon: Calendar },
              { id: 'performance', label: 'Performance', icon: Target }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              member={currentMember}
              mode={mode}
              formData={formData}
              setFormData={setFormData}
              errors={errors}
            />
          )}
          
          {activeTab === 'skills' && (
            <SkillsTab
              member={currentMember}
              mode={mode}
              formData={formData}
              setFormData={setFormData}
            />
          )}
          
          {activeTab === 'certifications' && (
            <CertificationsTab
              member={currentMember}
              mode={mode}
              formData={formData}
              setFormData={setFormData}
            />
          )}
          
          {activeTab === 'equipment' && (
            <EquipmentTab
              member={currentMember}
              mode={mode}
              formData={formData}
              setFormData={setFormData}
            />
          )}
          
          {activeTab === 'availability' && (
            <AvailabilityTab
              member={currentMember}
              mode={mode}
              formData={formData}
              setFormData={setFormData}
            />
          )}
          
          {activeTab === 'performance' && (
            <PerformanceTab
              member={currentMember}
              mode={mode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  member: TeamMember;
  mode: 'view' | 'edit' | 'create';
  formData: Partial<TeamMember>;
  setFormData: (data: Partial<TeamMember>) => void;
  errors: { [key: string]: string };
}> = ({ member, mode, formData, setFormData, errors }) => {
  const isEditing = mode === 'edit' || mode === 'create';

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${errors.firstName ? 'border-red-300' : 'border-gray-300'}`}
              />
            ) : (
              <p className="text-gray-900">{member.firstName}</p>
            )}
            {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${errors.lastName ? 'border-red-300' : 'border-gray-300'}`}
              />
            ) : (
              <p className="text-gray-900">{member.lastName}</p>
            )}
            {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
              />
            ) : (
              <p className="text-gray-900">{member.email}</p>
            )}
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            {isEditing ? (
              <select
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="lead">Lead</option>
                <option value="assistant">Assistant</option>
                <option value="admin">Admin</option>
                <option value="scheduler">Scheduler</option>
              </select>
            ) : (
              <p className="text-gray-900 capitalize">{member.role}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Region</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.region || ''}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${errors.region ? 'border-red-300' : 'border-gray-300'}`}
              />
            ) : (
              <p className="text-gray-900">{member.region}</p>
            )}
            {errors.region && <p className="text-red-600 text-xs mt-1">{errors.region}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            {isEditing ? (
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            ) : (
              <p className={`text-sm font-medium ${member.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {member.isActive ? 'Active' : 'Inactive'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Work Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Work Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Capacity</label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="10"
                value={formData.capacity || 3}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{member.capacity} jobs/day</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Travel Radius</label>
            {isEditing ? (
              <input
                type="number"
                min="10"
                max="500"
                value={formData.travelRadius || 50}
                onChange={(e) => setFormData({ ...formData, travelRadius: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{member.travelRadius} miles</p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      {member.emergencyContact && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact?.name || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact!, name: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              ) : (
                <p className="text-gray-900">{member.emergencyContact.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact?.relationship || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact!, relationship: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              ) : (
                <p className="text-gray-900">{member.emergencyContact.relationship}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.emergencyContact?.phoneNumber || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact!, phoneNumber: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              ) : (
                <p className="text-gray-900">{member.emergencyContact.phoneNumber}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Skills Tab Component (simplified for space)
const SkillsTab: React.FC<{
  member: TeamMember;
  mode: 'view' | 'edit' | 'create';
  formData: Partial<TeamMember>;
  setFormData: (data: Partial<TeamMember>) => void;
}> = ({ member, mode, formData, setFormData }) => {
  const [showAddSkill, setShowAddSkill] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Skills & Specializations</h3>
        {(mode === 'edit' || mode === 'create') && (
          <button
            onClick={() => setShowAddSkill(true)}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Skill</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(formData.skills || member.skills || []).map((skill, index) => (
          <div key={skill.id || index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{skill.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{skill.category}</p>
                <p className="text-sm text-gray-600">Level: {skill.level}</p>
                {skill.lastAssessed && (
                  <p className="text-xs text-gray-500">
                    Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}
                  </p>
                )}
              </div>
              {(mode === 'edit' || mode === 'create') && (
                <button className="text-red-600 hover:bg-red-50 p-1 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {((formData.skills || member.skills || []).length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <Award className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No skills recorded</p>
        </div>
      )}
    </div>
  );
};

// Simplified placeholder components for other tabs
const CertificationsTab: React.FC<any> = () => (
  <div className="text-center py-8 text-gray-500">
    <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400" />
    <p>Certifications management interface would be here</p>
  </div>
);

const EquipmentTab: React.FC<any> = () => (
  <div className="text-center py-8 text-gray-500">
    <Tool className="h-8 w-8 mx-auto mb-2 text-gray-400" />
    <p>Equipment management interface would be here</p>
  </div>
);

const AvailabilityTab: React.FC<any> = () => (
  <div className="text-center py-8 text-gray-500">
    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
    <p>Availability calendar interface would be here</p>
  </div>
);

const PerformanceTab: React.FC<any> = () => (
  <div className="text-center py-8 text-gray-500">
    <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
    <p>Performance metrics and analytics would be here</p>
  </div>
);

export default TeamMemberModal;