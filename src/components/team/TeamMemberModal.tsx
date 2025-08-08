// Think Tank Technologies - Team Member Detail Modal

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit, 
  Save, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Wrench, 
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
import { teamService } from '../../services/teamService';
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
        // Use real Supabase service to create team member
        const createData = {
          firstName: formData.firstName!,
          lastName: formData.lastName!,
          email: formData.email!,
          role: formData.role!,
          region: formData.region!,
          capacity: formData.capacity || 3,
          travelRadius: formData.travelRadius || 50,
          specializations: formData.specializations || [],
          homeAddress: formData.homeBase ? `${formData.homeBase.street}, ${formData.homeBase.city}, ${formData.homeBase.state} ${formData.homeBase.zipCode}` : undefined,
          emergencyContactName: formData.emergencyContact?.name,
          emergencyContactPhone: formData.emergencyContact?.phoneNumber,
          emergencyContactRelationship: formData.emergencyContact?.relationship,
          preferredStartTime: formData.workPreferences?.preferredStartTime,
          preferredEndTime: formData.workPreferences?.preferredEndTime,
          maxDailyJobs: formData.workPreferences?.maxDailyJobs,
          maxWeeklyHours: formData.workPreferences?.maxWeeklyHours,
          weekendsAvailable: formData.workPreferences?.weekendsAvailable,
          overtimeAvailable: formData.workPreferences?.overtimeAvailable,
          travelPreference: formData.workPreferences?.travelPreference
        };
        
        const newMember = await teamService.createTeamMember(createData);
        addTeamMember(newMember);
        onClose(); // Close modal after successful creation
      } else if (mode === 'edit' && member) {
        // Use real Supabase service to update team member
        const updateData = {
          id: member.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          region: formData.region,
          capacity: formData.capacity,
          travelRadius: formData.travelRadius,
          specializations: formData.specializations,
          homeAddress: formData.homeBase ? `${formData.homeBase.street}, ${formData.homeBase.city}, ${formData.homeBase.state} ${formData.homeBase.zipCode}` : undefined,
          emergencyContactName: formData.emergencyContact?.name,
          emergencyContactPhone: formData.emergencyContact?.phoneNumber,
          emergencyContactRelationship: formData.emergencyContact?.relationship,
          preferredStartTime: formData.workPreferences?.preferredStartTime,
          preferredEndTime: formData.workPreferences?.preferredEndTime,
          maxDailyJobs: formData.workPreferences?.maxDailyJobs,
          maxWeeklyHours: formData.workPreferences?.maxWeeklyHours,
          weekendsAvailable: formData.workPreferences?.weekendsAvailable,
          overtimeAvailable: formData.workPreferences?.overtimeAvailable,
          travelPreference: formData.workPreferences?.travelPreference,
          employmentStatus: formData.isActive ? 'active' : 'inactive'
        };
        
        const updatedMember = await teamService.updateTeamMember(member.id, updateData);
        updateTeamMember(member.id, updatedMember);
        setMode('view');
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      setErrors({ general: 'Failed to save team member. Please try again.' });
    }
  };

  const handleDelete = async () => {
    if (member && window.confirm('Are you sure you want to remove this team member? This will deactivate them rather than permanently delete their record.')) {
      try {
        await teamService.deleteTeamMember(member.id);
        removeTeamMember(member.id);
        onClose();
      } catch (error) {
        console.error('Error deleting team member:', error);
        setErrors({ general: 'Failed to remove team member. Please try again.' });
      }
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
    <div className="fixed inset-0 bg-black/50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-glass border border-white/20 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden backdrop-filter backdrop-blur-md">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-500/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {mode === 'create' ? 'Add Team Member' : `${currentMember.firstName} ${currentMember.lastName}`}
                </h2>
                <p className="text-sm text-white/70 capitalize">{currentMember.role}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {mode === 'view' && (
                <>
                  <button
                    onClick={() => setMode('edit')}
                    className="flex items-center space-x-1 px-3 py-1 text-accent-300 hover:bg-white/10 rounded border border-white/20 backdrop-filter backdrop-blur-md"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-1 px-3 py-1 text-red-400 hover:bg-red-500/10 rounded border border-red-500/30"
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
                    className="flex items-center space-x-1 px-3 py-1 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded hover:bg-accent-500/30 backdrop-filter backdrop-blur-md"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => mode === 'create' ? onClose() : setMode('view')}
                    className="flex items-center space-x-1 px-3 py-1 border border-white/20 text-white/70 rounded hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </>
              )}
              
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="h-5 w-5 text-white/40" />
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
                <span className="text-sm text-white/70">
                  {currentMember.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
            
            {currentMember.performanceMetrics && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-white/70">
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
        <div className="border-b border-white/10">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'skills', label: 'Skills', icon: Award },
              { id: 'certifications', label: 'Certifications', icon: Shield },
              { id: 'equipment', label: 'Equipment', icon: Wrench },
              { id: 'availability', label: 'Availability', icon: Calendar },
              { id: 'performance', label: 'Performance', icon: Target }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-accent-500 text-accent-400'
                    : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/30'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Error Display */}
        {errors.general && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-300">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
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
        <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`form-input ${errors.firstName ? 'border-red-500/50' : ''}`}
              />
            ) : (
              <p className="text-white">{member.firstName}</p>
            )}
            {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Last Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`form-input ${errors.lastName ? 'border-red-500/50' : ''}`}
              />
            ) : (
              <p className="text-white">{member.lastName}</p>
            )}
            {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`form-input ${errors.email ? 'border-red-500/50' : ''}`}
              />
            ) : (
              <p className="text-white">{member.email}</p>
            )}
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Role</label>
            {isEditing ? (
              <select
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="form-input"
              >
                <option value="lead">Lead</option>
                <option value="assistant">Assistant</option>
                <option value="admin">Admin</option>
                <option value="scheduler">Scheduler</option>
              </select>
            ) : (
              <p className="text-white capitalize">{member.role}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Primary Region</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.region || ''}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className={`form-input ${errors.region ? 'border-red-500/50' : ''}`}
              />
            ) : (
              <p className="text-white">{member.region}</p>
            )}
            {errors.region && <p className="text-red-400 text-xs mt-1">{errors.region}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Status</label>
            {isEditing ? (
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                className="form-input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            ) : (
              <p className={`text-sm font-medium ${member.isActive ? 'text-success-400' : 'text-error-400'}`}>
                {member.isActive ? 'Active' : 'Inactive'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Work Information */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Work Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Daily Capacity</label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="10"
                value={formData.capacity || 3}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="form-input"
              />
            ) : (
              <p className="text-white">{member.capacity} jobs/day</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Travel Radius</label>
            {isEditing ? (
              <input
                type="number"
                min="10"
                max="500"
                value={formData.travelRadius || 50}
                onChange={(e) => setFormData({ ...formData, travelRadius: parseInt(e.target.value) })}
                className="form-input"
              />
            ) : (
              <p className="text-white">{member.travelRadius} miles</p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      {member.emergencyContact && (
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact?.name || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact!, name: e.target.value }
                  })}
                  className="form-input"
                />
              ) : (
                <p className="text-white">{member.emergencyContact.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Relationship</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact?.relationship || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact!, relationship: e.target.value }
                  })}
                  className="form-input"
                />
              ) : (
                <p className="text-white">{member.emergencyContact.relationship}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.emergencyContact?.phoneNumber || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact!, phoneNumber: e.target.value }
                  })}
                  className="form-input"
                />
              ) : (
                <p className="text-white">{member.emergencyContact.phoneNumber}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Skills Tab Component
const SkillsTab: React.FC<{
  member: TeamMember;
  mode: 'view' | 'edit' | 'create';
  formData: Partial<TeamMember>;
  setFormData: (data: Partial<TeamMember>) => void;
}> = ({ member, mode, formData, setFormData }) => {
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState({
    skillId: '',
    level: 'beginner' as const,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const isEditing = mode === 'edit' || mode === 'create';
  const currentSkills = formData.skills || member.skills || [];

  // Load available skills
  useEffect(() => {
    if (showAddSkill) {
      loadAvailableSkills();
    }
  }, [showAddSkill]);

  const loadAvailableSkills = async () => {
    try {
      const skills = await teamService.getAllSkills();
      setAvailableSkills(skills);
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.skillId || !member.id) return;
    
    setLoading(true);
    try {
      await teamService.addTeamMemberSkill(member.id, newSkill.skillId, newSkill.level, newSkill.notes);
      
      // Refresh the member data or update locally
      const skill = availableSkills.find(s => s.id === newSkill.skillId);
      const updatedSkills = [...currentSkills, {
        id: skill.id,
        name: skill.name,
        category: skill.category,
        level: newSkill.level,
        notes: newSkill.notes,
        acquiredDate: new Date().toISOString().split('T')[0]
      }];
      
      setFormData({ ...formData, skills: updatedSkills });
      setShowAddSkill(false);
      setNewSkill({ skillId: '', level: 'beginner', notes: '' });
    } catch (error) {
      console.error('Error adding skill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (!member.id) return;
    
    try {
      await teamService.removeTeamMemberSkill(member.id, skillId);
      const updatedSkills = currentSkills.filter(s => s.id !== skillId);
      setFormData({ ...formData, skills: updatedSkills });
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Skills & Specializations</h3>
        {isEditing && (
          <button
            onClick={() => setShowAddSkill(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
          >
            <Plus className="h-4 w-4" />
            <span>Add Skill</span>
          </button>
        )}
      </div>

      {/* Add Skill Modal */}
      {showAddSkill && (
        <div className="glass-subtle p-6 rounded-xl border border-accent-500/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">Add New Skill</h4>
            <button
              onClick={() => setShowAddSkill(false)}
              className="text-white/40 hover:text-white/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Skill</label>
              <select
                value={newSkill.skillId}
                onChange={(e) => setNewSkill({ ...newSkill, skillId: e.target.value })}
                className="form-input"
              >
                <option value="">Select a skill...</option>
                {availableSkills.map(skill => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Level</label>
              <select
                value={newSkill.level}
                onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as any })}
                className="form-input"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-white/90 mb-2">Notes (Optional)</label>
            <textarea
              value={newSkill.notes}
              onChange={(e) => setNewSkill({ ...newSkill, notes: e.target.value })}
              className="form-input"
              rows={3}
              placeholder="Additional notes about this skill..."
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddSkill(false)}
              className="px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSkill}
              disabled={!newSkill.skillId || loading}
              className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <div className="w-4 h-4 border-2 border-accent-300 border-t-transparent rounded-full animate-spin" />}
              <span>Add Skill</span>
            </button>
          </div>
        </div>
      )}

      {/* Skills Grid */}
      {currentSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSkills.map((skill, index) => (
            <div key={skill.id || index} className="glass-subtle p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-white">{skill.name}</h4>
                    <span className="px-2 py-1 rounded-full text-xs bg-accent-500/20 text-accent-300 border border-accent-500/30">
                      {skill.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-white/70 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      skill.level === 'expert' ? 'bg-success-500/20 text-success-300 border border-success-500/30' :
                      skill.level === 'advanced' ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' :
                      skill.level === 'intermediate' ? 'bg-warning-500/20 text-warning-300 border border-warning-500/30' :
                      'bg-white/10 text-white/70 border border-white/20'
                    }`}>
                      {skill.level}
                    </span>
                  </div>
                  
                  {skill.acquiredDate && (
                    <p className="text-xs text-white/60">
                      Added: {new Date(skill.acquiredDate).toLocaleDateString()}
                    </p>
                  )}
                  
                  {skill.lastAssessed && (
                    <p className="text-xs text-white/60">
                      Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}
                    </p>
                  )}
                  
                  {skill.notes && (
                    <p className="text-sm text-white/60 mt-2 italic">{skill.notes}</p>
                  )}
                </div>
                
                {isEditing && (
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="text-red-400 hover:bg-red-500/10 p-1 rounded border border-red-500/30 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-white/60">
          <Award className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <p className="text-lg mb-2">No skills recorded</p>
          <p className="text-sm text-white/40">Add skills to track expertise and capabilities</p>
          {isEditing && (
            <button
              onClick={() => setShowAddSkill(true)}
              className="mt-4 flex items-center space-x-2 mx-auto px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Skill</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Certifications Tab Component
const CertificationsTab: React.FC<{
  member: TeamMember;
  mode: 'view' | 'edit' | 'create';
  formData: Partial<TeamMember>;
  setFormData: (data: Partial<TeamMember>) => void;
}> = ({ member, mode, formData, setFormData }) => {
  const [showAddCertification, setShowAddCertification] = useState(false);
  const [newCertification, setNewCertification] = useState({
    name: '',
    issuer: '',
    certificationNumber: '',
    issueDate: '',
    expirationDate: '',
    documentUrl: '',
    cost: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const isEditing = mode === 'edit' || mode === 'create';
  const currentCertifications = formData.certifications || member.certifications || [];

  const handleAddCertification = async () => {
    if (!newCertification.name || !newCertification.issuer || !member.id) return;
    
    setLoading(true);
    try {
      const certData = {
        name: newCertification.name,
        issuer: newCertification.issuer,
        certification_number: newCertification.certificationNumber,
        issue_date: newCertification.issueDate || null,
        expiration_date: newCertification.expirationDate || null,
        document_url: newCertification.documentUrl || null,
        cost: newCertification.cost ? parseFloat(newCertification.cost) : null,
        notes: newCertification.notes || null,
        status: 'active'
      };
      
      const newCert = await teamService.addCertification(member.id, certData);
      
      const updatedCertifications = [...currentCertifications, {
        id: newCert.id,
        name: newCert.name,
        issuer: newCert.issuer,
        certificationNumber: newCert.certification_number,
        issueDate: newCert.issue_date,
        expirationDate: newCert.expiration_date,
        status: newCert.status,
        renewalRequired: newCert.renewal_required,
        documentUrl: newCert.document_url,
        cost: newCert.cost,
        notes: newCert.notes
      }];
      
      setFormData({ ...formData, certifications: updatedCertifications });
      setShowAddCertification(false);
      setNewCertification({
        name: '',
        issuer: '',
        certificationNumber: '',
        issueDate: '',
        expirationDate: '',
        documentUrl: '',
        cost: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding certification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCertification = async (certificationId: string) => {
    try {
      await teamService.removeCertification(certificationId);
      const updatedCertifications = currentCertifications.filter(c => c.id !== certificationId);
      setFormData({ ...formData, certifications: updatedCertifications });
    } catch (error) {
      console.error('Error removing certification:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Certifications</h3>
        {isEditing && (
          <button
            onClick={() => setShowAddCertification(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
          >
            <Plus className="h-4 w-4" />
            <span>Add Certification</span>
          </button>
        )}
      </div>

      {/* Add Certification Form */}
      {showAddCertification && (
        <div className="glass-subtle p-6 rounded-xl border border-accent-500/30">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-medium text-white">Add New Certification</h4>
            <button
              onClick={() => setShowAddCertification(false)}
              className="text-white/40 hover:text-white/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Certification Name *</label>
              <input
                type="text"
                value={newCertification.name}
                onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                className="form-input"
                placeholder="e.g., CompTIA Network+"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Issuer *</label>
              <input
                type="text"
                value={newCertification.issuer}
                onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                className="form-input"
                placeholder="e.g., CompTIA"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Certificate Number</label>
              <input
                type="text"
                value={newCertification.certificationNumber}
                onChange={(e) => setNewCertification({ ...newCertification, certificationNumber: e.target.value })}
                className="form-input"
                placeholder="Certificate number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Issue Date</label>
              <input
                type="date"
                value={newCertification.issueDate}
                onChange={(e) => setNewCertification({ ...newCertification, issueDate: e.target.value })}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Expiration Date</label>
              <input
                type="date"
                value={newCertification.expirationDate}
                onChange={(e) => setNewCertification({ ...newCertification, expirationDate: e.target.value })}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newCertification.cost}
                onChange={(e) => setNewCertification({ ...newCertification, cost: e.target.value })}
                className="form-input"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-white/90 mb-2">Document URL</label>
            <input
              type="url"
              value={newCertification.documentUrl}
              onChange={(e) => setNewCertification({ ...newCertification, documentUrl: e.target.value })}
              className="form-input"
              placeholder="https://..."
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-white/90 mb-2">Notes</label>
            <textarea
              value={newCertification.notes}
              onChange={(e) => setNewCertification({ ...newCertification, notes: e.target.value })}
              className="form-input"
              rows={3}
              placeholder="Additional notes about this certification..."
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddCertification(false)}
              className="px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCertification}
              disabled={!newCertification.name || !newCertification.issuer || loading}
              className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <div className="w-4 h-4 border-2 border-accent-300 border-t-transparent rounded-full animate-spin" />}
              <span>Add Certification</span>
            </button>
          </div>
        </div>
      )}

      {/* Certifications Grid */}
      {currentCertifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentCertifications.map((cert, index) => (
            <div key={cert.id || index} className="glass-subtle p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-white">{cert.name}</h4>
                      <p className="text-sm text-white/70">{cert.issuer}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cert.status === 'active' 
                        ? 'bg-success-500/20 text-success-300 border border-success-500/30'
                        : cert.status === 'expired'
                        ? 'bg-error-500/20 text-error-300 border border-error-500/30'
                        : 'bg-warning-500/20 text-warning-300 border border-warning-500/30'
                    }`}>
                      {cert.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-white/60">
                    {cert.certificationNumber && (
                      <p>Certificate #: {cert.certificationNumber}</p>
                    )}
                    {cert.issueDate && (
                      <p>Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                    )}
                    {cert.expirationDate && (
                      <p className={new Date(cert.expirationDate) < new Date() ? 'text-red-400' : 'text-white/60'}>
                        Expires: {new Date(cert.expirationDate).toLocaleDateString()}
                      </p>
                    )}
                    {cert.cost && (
                      <p>Cost: ${cert.cost.toLocaleString()}</p>
                    )}
                  </div>
                  
                  {cert.documentUrl && (
                    <a
                      href={cert.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 mt-2 text-xs text-accent-400 hover:text-accent-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>View Document</span>
                    </a>
                  )}
                  
                  {cert.notes && (
                    <p className="text-sm text-white/60 mt-2 italic">{cert.notes}</p>
                  )}
                </div>
                
                {isEditing && (
                  <button
                    onClick={() => handleRemoveCertification(cert.id)}
                    className="text-red-400 hover:bg-red-500/10 p-1 rounded border border-red-500/30 transition-all duration-200 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-white/60">
          <Shield className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <p className="text-lg mb-2">No certifications recorded</p>
          <p className="text-sm text-white/40">Add certifications to track qualifications and credentials</p>
          {isEditing && (
            <button
              onClick={() => setShowAddCertification(true)}
              className="mt-4 flex items-center space-x-2 mx-auto px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Certification</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Equipment Tab Component
const EquipmentTab: React.FC<{
  member: TeamMember;
  mode: 'view' | 'edit' | 'create';
  formData: Partial<TeamMember>;
  setFormData: (data: Partial<TeamMember>) => void;
}> = ({ member, mode, formData, setFormData }) => {
  const [showAssignEquipment, setShowAssignEquipment] = useState(false);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = mode === 'edit' || mode === 'create';
  const currentEquipment = formData.equipment || member.equipment || [];

  // Load available equipment
  useEffect(() => {
    if (showAssignEquipment) {
      loadAvailableEquipment();
    }
  }, [showAssignEquipment]);

  const loadAvailableEquipment = async () => {
    try {
      const equipment = await teamService.getAvailableEquipment();
      setAvailableEquipment(equipment);
    } catch (error) {
      console.error('Error loading available equipment:', error);
    }
  };

  const handleAssignEquipment = async () => {
    if (!selectedEquipmentId || !member.id) return;
    
    setLoading(true);
    try {
      const assignedEquipment = await teamService.assignEquipment(selectedEquipmentId, member.id);
      
      // Update local state
      const updatedEquipment = [...currentEquipment, {
        id: assignedEquipment.id,
        name: assignedEquipment.name,
        type: assignedEquipment.type,
        serialNumber: assignedEquipment.serial_number,
        assignedDate: assignedEquipment.assigned_date,
        status: assignedEquipment.status,
        condition: assignedEquipment.condition,
        lastInspected: assignedEquipment.last_inspected,
        nextInspectionDue: assignedEquipment.next_inspection_due,
        purchaseDate: assignedEquipment.purchase_date,
        warranty: assignedEquipment.warranty_expiration ? {
          expirationDate: assignedEquipment.warranty_expiration,
          provider: assignedEquipment.warranty_provider || ''
        } : undefined,
        specifications: assignedEquipment.specifications || {},
        notes: assignedEquipment.notes
      }];
      
      setFormData({ ...formData, equipment: updatedEquipment });
      setShowAssignEquipment(false);
      setSelectedEquipmentId('');
    } catch (error) {
      console.error('Error assigning equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignEquipment = async (equipmentId: string) => {
    try {
      await teamService.unassignEquipment(equipmentId);
      const updatedEquipment = currentEquipment.filter(e => e.id !== equipmentId);
      setFormData({ ...formData, equipment: updatedEquipment });
    } catch (error) {
      console.error('Error unassigning equipment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Equipment</h3>
        {isEditing && (
          <button
            onClick={() => setShowAssignEquipment(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
          >
            <Plus className="h-4 w-4" />
            <span>Assign Equipment</span>
          </button>
        )}
      </div>

      {/* Assign Equipment Modal */}
      {showAssignEquipment && (
        <div className="glass-subtle p-6 rounded-xl border border-accent-500/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">Assign Equipment</h4>
            <button
              onClick={() => setShowAssignEquipment(false)}
              className="text-white/40 hover:text-white/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Available Equipment</label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="form-input"
            >
              <option value="">Select equipment to assign...</option>
              {availableEquipment.map(equipment => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.name} - {equipment.type} {equipment.serial_number ? `(S/N: ${equipment.serial_number})` : ''}
                </option>
              ))}
            </select>
            
            {availableEquipment.length === 0 && (
              <p className="text-sm text-white/60 mt-2">No equipment available for assignment</p>
            )}
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAssignEquipment(false)}
              className="px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignEquipment}
              disabled={!selectedEquipmentId || loading}
              className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <div className="w-4 h-4 border-2 border-accent-300 border-t-transparent rounded-full animate-spin" />}
              <span>Assign</span>
            </button>
          </div>
        </div>
      )}

      {/* Equipment Grid */}
      {currentEquipment.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentEquipment.map((eq, index) => (
            <div key={eq.id || index} className="glass-subtle p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-white">{eq.name}</h4>
                    <span className="px-2 py-1 rounded-full text-xs bg-accent-500/20 text-accent-300 border border-accent-500/30">
                      {eq.type}
                    </span>
                  </div>
                  
                  {eq.serialNumber && (
                    <p className="text-xs text-white/60 mb-2">S/N: {eq.serialNumber}</p>
                  )}
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      eq.status === 'available' 
                        ? 'bg-success-500/20 text-success-300 border border-success-500/30'
                        : eq.status === 'assigned'
                        ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                        : eq.status === 'maintenance'
                        ? 'bg-warning-500/20 text-warning-300 border border-warning-500/30'
                        : 'bg-error-500/20 text-error-300 border border-error-500/30'
                    }`}>
                      {eq.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      eq.condition === 'excellent' || eq.condition === 'good'
                        ? 'bg-success-500/20 text-success-300 border border-success-500/30'
                        : eq.condition === 'fair'
                        ? 'bg-warning-500/20 text-warning-300 border border-warning-500/30'
                        : 'bg-error-500/20 text-error-300 border border-error-500/30'
                    }`}>
                      {eq.condition}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-white/60">
                    {eq.assignedDate && (
                      <p>Assigned: {new Date(eq.assignedDate).toLocaleDateString()}</p>
                    )}
                    {eq.lastInspected && (
                      <p>Last Inspected: {new Date(eq.lastInspected).toLocaleDateString()}</p>
                    )}
                    {eq.nextInspectionDue && (
                      <p className={new Date(eq.nextInspectionDue) < new Date() ? 'text-warning-400' : 'text-white/60'}>
                        Next Inspection: {new Date(eq.nextInspectionDue).toLocaleDateString()}
                      </p>
                    )}
                    {eq.warranty?.expirationDate && (
                      <p className={new Date(eq.warranty.expirationDate) < new Date() ? 'text-red-400' : 'text-white/60'}>
                        Warranty Expires: {new Date(eq.warranty.expirationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  {eq.notes && (
                    <p className="text-sm text-white/60 mt-2 italic">{eq.notes}</p>
                  )}
                  
                  {eq.specifications && Object.keys(eq.specifications).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-white/40 mb-1">Specifications:</p>
                      {Object.entries(eq.specifications).slice(0, 3).map(([key, value]) => (
                        <p key={key} className="text-xs text-white/60">
                          {key}: {String(value)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <button
                    onClick={() => handleUnassignEquipment(eq.id)}
                    className="text-red-400 hover:bg-red-500/10 p-1 rounded border border-red-500/30 transition-all duration-200"
                    title="Unassign Equipment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-white/60">
          <Wrench className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <p className="text-lg mb-2">No equipment assigned</p>
          <p className="text-sm text-white/40">Assign equipment to track tools and resources</p>
          {isEditing && (
            <button
              onClick={() => setShowAssignEquipment(true)}
              className="mt-4 flex items-center space-x-2 mx-auto px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
            >
              <Plus className="h-4 w-4" />
              <span>Assign First Equipment</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Availability Tab Component
const AvailabilityTab: React.FC<{
  member: TeamMember;
  mode: 'view' | 'edit' | 'create';
  formData: Partial<TeamMember>;
  setFormData: (data: Partial<TeamMember>) => void;
}> = ({ member, mode, formData, setFormData }) => {
  const [showAddAvailability, setShowAddAvailability] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '17:00',
    isAvailable: true,
    isRecurring: false,
    recurringDays: [] as string[],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const availability = formData.availability || member.availability || [];
  const workPrefs = formData.workPreferences || member.workPreferences;
  const isEditing = mode === 'edit' || mode === 'create';

  const handleAddAvailability = async () => {
    if (!newAvailability.startDate || !newAvailability.endDate || !member.id) return;
    
    setLoading(true);
    try {
      const availData = {
        start_date: newAvailability.startDate,
        end_date: newAvailability.endDate,
        start_time: newAvailability.startTime,
        end_time: newAvailability.endTime,
        is_available: newAvailability.isAvailable,
        is_recurring: newAvailability.isRecurring,
        recurring_days: newAvailability.recurringDays,
        notes: newAvailability.notes || null
      };
      
      const newAvail = await teamService.addAvailability(member.id, availData);
      
      const updatedAvailability = [...availability, {
        id: newAvail.id,
        teamMemberId: newAvail.team_member_id,
        startDate: newAvail.start_date,
        endDate: newAvail.end_date,
        startTime: newAvail.start_time,
        endTime: newAvail.end_time,
        isAvailable: newAvail.is_available,
        isRecurring: newAvail.is_recurring,
        recurringDays: newAvail.recurring_days,
        notes: newAvail.notes
      }];
      
      setFormData({ ...formData, availability: updatedAvailability });
      setShowAddAvailability(false);
      setNewAvailability({
        startDate: '',
        endDate: '',
        startTime: '08:00',
        endTime: '17:00',
        isAvailable: true,
        isRecurring: false,
        recurringDays: [],
        notes: ''
      });
    } catch (error) {
      console.error('Error adding availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvailability = async (availabilityId: string) => {
    try {
      await teamService.removeAvailability(availabilityId);
      const updatedAvailability = availability.filter(a => a.id !== availabilityId);
      setFormData({ ...formData, availability: updatedAvailability });
    } catch (error) {
      console.error('Error removing availability:', error);
    }
  };

  const handleUpdateWorkPreferences = async () => {
    if (!member.id || !workPrefs) return;
    
    try {
      await teamService.updateWorkPreferences(member.id, {
        preferred_start_time: workPrefs.preferredStartTime,
        preferred_end_time: workPrefs.preferredEndTime,
        max_daily_jobs: workPrefs.maxDailyJobs,
        max_weekly_hours: workPrefs.maxWeeklyHours,
        weekends_available: workPrefs.weekendsAvailable,
        overtime_available: workPrefs.overtimeAvailable,
        travel_preference: workPrefs.travelPreference
      });
    } catch (error) {
      console.error('Error updating work preferences:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Work Preferences */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Work Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Preferred Start Time</label>
            {isEditing ? (
              <input
                type="time"
                value={workPrefs?.preferredStartTime || '08:00'}
                onChange={(e) => setFormData({
                  ...formData,
                  workPreferences: { ...workPrefs!, preferredStartTime: e.target.value }
                })}
                className="form-input"
              />
            ) : (
              <p className="text-white">{workPrefs?.preferredStartTime || '08:00'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Preferred End Time</label>
            {isEditing ? (
              <input
                type="time"
                value={workPrefs?.preferredEndTime || '17:00'}
                onChange={(e) => setFormData({
                  ...formData,
                  workPreferences: { ...workPrefs!, preferredEndTime: e.target.value }
                })}
                className="form-input"
              />
            ) : (
              <p className="text-white">{workPrefs?.preferredEndTime || '17:00'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Max Daily Jobs</label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="20"
                value={workPrefs?.maxDailyJobs || 5}
                onChange={(e) => setFormData({
                  ...formData,
                  workPreferences: { ...workPrefs!, maxDailyJobs: parseInt(e.target.value) }
                })}
                className="form-input"
              />
            ) : (
              <p className="text-white">{workPrefs?.maxDailyJobs || 5} jobs</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Max Weekly Hours</label>
            {isEditing ? (
              <input
                type="number"
                min="10"
                max="80"
                value={workPrefs?.maxWeeklyHours || 40}
                onChange={(e) => setFormData({
                  ...formData,
                  workPreferences: { ...workPrefs!, maxWeeklyHours: parseInt(e.target.value) }
                })}
                className="form-input"
              />
            ) : (
              <p className="text-white">{workPrefs?.maxWeeklyHours || 40} hours</p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-subtle p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/90">Weekend Availability</span>
              {isEditing ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workPrefs?.weekendsAvailable || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      workPreferences: { ...workPrefs!, weekendsAvailable: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
                </label>
              ) : (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  workPrefs?.weekendsAvailable 
                    ? 'bg-success-500/20 text-success-300 border border-success-500/30'
                    : 'bg-white/10 text-white/70 border border-white/20'
                }`}>
                  {workPrefs?.weekendsAvailable ? 'Available' : 'Not Available'}
                </span>
              )}
            </div>
          </div>
          <div className="glass-subtle p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/90">Overtime Availability</span>
              {isEditing ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workPrefs?.overtimeAvailable || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      workPreferences: { ...workPrefs!, overtimeAvailable: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
                </label>
              ) : (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  workPrefs?.overtimeAvailable 
                    ? 'bg-success-500/20 text-success-300 border border-success-500/30'
                    : 'bg-white/10 text-white/70 border border-white/20'
                }`}>
                  {workPrefs?.overtimeAvailable ? 'Available' : 'Not Available'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Availability Schedule */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Availability Schedule</h3>
          {isEditing && (
            <button
              onClick={() => setShowAddAvailability(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
            >
              <Plus className="h-4 w-4" />
              <span>Add Schedule</span>
            </button>
          )}
        </div>

        {/* Add Availability Form */}
        {showAddAvailability && (
          <div className="glass-subtle p-6 rounded-xl border border-accent-500/30 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-white">Add Availability</h4>
              <button
                onClick={() => setShowAddAvailability(false)}
                className="text-white/40 hover:text-white/80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Start Date</label>
                <input
                  type="date"
                  value={newAvailability.startDate}
                  onChange={(e) => setNewAvailability({ ...newAvailability, startDate: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">End Date</label>
                <input
                  type="date"
                  value={newAvailability.endDate}
                  onChange={(e) => setNewAvailability({ ...newAvailability, endDate: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Start Time</label>
                <input
                  type="time"
                  value={newAvailability.startTime}
                  onChange={(e) => setNewAvailability({ ...newAvailability, startTime: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">End Time</label>
                <input
                  type="time"
                  value={newAvailability.endTime}
                  onChange={(e) => setNewAvailability({ ...newAvailability, endTime: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newAvailability.isAvailable}
                  onChange={(e) => setNewAvailability({ ...newAvailability, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-accent-500 bg-white/10 border-white/20 rounded focus:ring-accent-500 focus:ring-2"
                />
                <span className="text-sm text-white/90">Available (uncheck to mark as unavailable)</span>
              </label>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-white/90 mb-2">Notes</label>
              <textarea
                value={newAvailability.notes}
                onChange={(e) => setNewAvailability({ ...newAvailability, notes: e.target.value })}
                className="form-input"
                rows={2}
                placeholder="Optional notes about this availability..."
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddAvailability(false)}
                className="px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAvailability}
                disabled={!newAvailability.startDate || !newAvailability.endDate || loading}
                className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <div className="w-4 h-4 border-2 border-accent-300 border-t-transparent rounded-full animate-spin" />}
                <span>Add Schedule</span>
              </button>
            </div>
          </div>
        )}

        {availability.length > 0 ? (
          <div className="space-y-3">
            {availability.map((avail, index) => (
              <div key={avail.id || index} className="glass-subtle p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-white">
                        {new Date(avail.startDate).toLocaleDateString()} - {new Date(avail.endDate).toLocaleDateString()}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        avail.isAvailable 
                          ? 'bg-success-500/20 text-success-300 border border-success-500/30'
                          : 'bg-error-500/20 text-error-300 border border-error-500/30'
                      }`}>
                        {avail.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="text-sm text-white/70">
                      {avail.startTime} - {avail.endTime}
                    </p>
                    {avail.notes && (
                      <p className="text-xs text-white/60 mt-1 italic">{avail.notes}</p>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveAvailability(avail.id)}
                      className="text-red-400 hover:bg-red-500/10 p-1 rounded border border-red-500/30 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/60">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-white/20" />
            <p className="text-lg mb-2">No specific availability schedule set</p>
            <p className="text-sm text-white/40">Add specific availability periods or use default work preferences</p>
            {isEditing && (
              <button
                onClick={() => setShowAddAvailability(true)}
                className="mt-4 flex items-center space-x-2 mx-auto px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
              >
                <Plus className="h-4 w-4" />
                <span>Add Availability</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab: React.FC<{
  member: TeamMember;
  mode: 'view' | 'edit' | 'create';
}> = ({ member, mode }) => {
  const performance = member.performanceMetrics;

  if (!performance) {
    return (
      <div className="text-center py-12 text-white/60">
        <Target className="h-12 w-12 mx-auto mb-4 text-white/20" />
        <p className="text-lg mb-2">No performance data available</p>
        <p className="text-sm text-white/40">Performance metrics will appear after completing installations</p>
        <div className="mt-6 glass-subtle p-4 rounded-lg">
          <p className="text-sm text-white/60 mb-2">Performance tracking includes:</p>
          <ul className="text-xs text-white/50 space-y-1">
            <li>• Completion rates and timing</li>
            <li>• Customer satisfaction scores</li>
            <li>• Quality and safety metrics</li>
            <li>• Revenue and job statistics</li>
          </ul>
        </div>
      </div>
    );
  }

  const performanceScore = (
    performance.completionRate * 0.3 +
    (performance.customerSatisfaction / 10) * 0.3 +
    (performance.qualityScore / 10) * 0.4
  );

  const getScoreColor = (score: number, max: number = 1) => {
    const percentage = score / max;
    if (percentage >= 0.8) return 'text-success-400';
    if (percentage >= 0.6) return 'text-warning-400';
    return 'text-error-400';
  };

  const getProgressColor = (score: number, max: number = 10) => {
    const percentage = score / max;
    if (percentage >= 0.8) return 'bg-success-500';
    if (percentage >= 0.6) return 'bg-warning-500';
    return 'bg-error-500';
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: 'Completion Rate', 
              value: `${Math.round(performance.completionRate * 100)}%`, 
              score: performance.completionRate,
              icon: CheckCircle
            },
            { 
              label: 'Customer Satisfaction', 
              value: `${performance.customerSatisfaction.toFixed(1)}/10`, 
              score: performance.customerSatisfaction / 10,
              icon: Star
            },
            { 
              label: 'Quality Score', 
              value: `${performance.qualityScore.toFixed(1)}/10`, 
              score: performance.qualityScore / 10,
              icon: Award
            },
            { 
              label: 'Overall Performance', 
              value: `${(performanceScore * 100).toFixed(1)}%`, 
              score: performanceScore,
              icon: Target
            }
          ].map((metric) => (
            <div key={metric.label} className="glass-subtle p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <metric.icon className="h-5 w-5 text-white/60" />
                <span className={`text-xs px-2 py-1 rounded-full ${
                  metric.score >= 0.8 
                    ? 'bg-success-500/20 text-success-300 border border-success-500/30'
                    : metric.score >= 0.6 
                    ? 'bg-warning-500/20 text-warning-300 border border-warning-500/30'
                    : 'bg-error-500/20 text-error-300 border border-error-500/30'
                }`}>
                  {metric.score >= 0.8 ? 'Excellent' : metric.score >= 0.6 ? 'Good' : 'Needs Work'}
                </span>
              </div>
              <p className="text-sm text-white/70 mb-1">{metric.label}</p>
              <p className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Job Statistics */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Job Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-subtle p-4 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-4 w-4 text-white/60" />
              <p className="text-sm font-medium text-white/90">Total Jobs</p>
            </div>
            <p className="text-2xl font-bold text-white">{performance.totalJobs}</p>
            {performance.averageTime && (
              <p className="text-xs text-white/60 mt-1">
                Avg: {Math.round(performance.averageTime)} min/job
              </p>
            )}
          </div>
          
          <div className="glass-subtle p-4 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-white/60" />
              <p className="text-sm font-medium text-white/90">Total Distance</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {performance.totalDistance ? `${performance.totalDistance.toFixed(0)} mi` : 'N/A'}
            </p>
            {performance.totalJobs > 0 && performance.totalDistance && (
              <p className="text-xs text-white/60 mt-1">
                Avg: {(performance.totalDistance / performance.totalJobs).toFixed(1)} mi/job
              </p>
            )}
          </div>
          
          <div className="glass-subtle p-4 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-4 w-4 bg-success-500/30 rounded flex items-center justify-center">
                <span className="text-xs text-success-300">$</span>
              </div>
              <p className="text-sm font-medium text-white/90">Revenue Generated</p>
            </div>
            <p className="text-2xl font-bold text-white">
              ${performance.revenueGenerated ? performance.revenueGenerated.toLocaleString() : '0'}
            </p>
            {performance.totalJobs > 0 && performance.revenueGenerated && (
              <p className="text-xs text-white/60 mt-1">
                Avg: ${(performance.revenueGenerated / performance.totalJobs).toFixed(0)}/job
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Scores */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Detailed Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Travel Efficiency', value: performance.travelEfficiency, max: 10, description: 'Route optimization and time management' },
            { label: 'Safety Score', value: performance.safetyScore, max: 10, description: 'Safety protocol adherence' },
            { label: 'Punctuality Score', value: performance.punctualityScore, max: 10, description: 'On-time arrival and completion' },
            { label: 'Communication Score', value: performance.communicationScore, max: 10, description: 'Customer and team communication' }
          ].map((score) => (
            <div key={score.label} className="glass-subtle p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-white/90">{score.label}</span>
                  <p className="text-xs text-white/60">{score.description}</p>
                </div>
                <span className={`text-sm font-bold ${getScoreColor(score.value, score.max)}`}>
                  {score.value?.toFixed(1)}/{score.max}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(score.value, score.max)}`}
                  style={{ width: `${((score.value || 0) / score.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Period Info */}
      <div className="glass-subtle p-4 rounded-lg border border-white/10">
        <h4 className="text-sm font-medium text-white/90 mb-2">Performance Period</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70">
          <div>
            <span className="text-white/50">Period Start:</span> {' '}
            <span className="text-white">{new Date(performance.periodStart).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-white/50">Period End:</span> {' '}
            <span className="text-white">{new Date(performance.periodEnd).toLocaleDateString()}</span>
          </div>
          {performance.overtimeHours && performance.overtimeHours > 0 && (
            <div>
              <span className="text-white/50">Overtime Hours:</span> {' '}
              <span className="text-warning-400">{performance.overtimeHours} hrs</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMemberModal;