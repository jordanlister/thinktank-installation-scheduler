// Think Tank Technologies - Schedule Management Modal

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Zap
} from 'lucide-react';
import { teamService } from '../../services/teamService';
import type { TeamMember } from '../../types';

interface ScheduleManagementModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleUpdated?: () => void;
}

interface AvailabilityEntry {
  id?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isRecurring: boolean;
  recurringDays: string[];
  notes: string;
}

interface ScheduleConflict {
  date: string;
  time: string;
  type: 'assignment' | 'unavailable' | 'overlap';
  message: string;
}

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const DAYS_DISPLAY = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
];

const ScheduleManagementModal: React.FC<ScheduleManagementModalProps> = ({
  member,
  isOpen,
  onClose,
  onScheduleUpdated
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState<'calendar' | 'list' | 'bulk'>('calendar');
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newEntry, setNewEntry] = useState<AvailabilityEntry>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    isAvailable: true,
    isRecurring: false,
    recurringDays: [],
    notes: ''
  });

  useEffect(() => {
    if (isOpen && member) {
      loadScheduleData();
    }
  }, [isOpen, member]);

  const loadScheduleData = async () => {
    if (!member) return;
    
    setLoading(true);
    try {
      // Load existing availability data
      const availabilityData = member.availability || [];
      setAvailability(availabilityData.map(a => ({
        id: a.id,
        startDate: a.startDate,
        endDate: a.endDate,
        startTime: a.startTime || '08:00',
        endTime: a.endTime || '17:00',
        isAvailable: a.isAvailable,
        isRecurring: a.isRecurring || false,
        recurringDays: Array.isArray(a.recurringDays) ? a.recurringDays.filter(d => typeof d === 'string') : [],
        notes: a.notes || ''
      })));
      
      // Detect conflicts (placeholder for future implementation)
      await detectScheduleConflicts();
    } catch (error) {
      console.error('Error loading schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectScheduleConflicts = async () => {
    // Placeholder for conflict detection logic
    // In a full implementation, this would check against:
    // - Existing job assignments
    // - Other team member schedules
    // - Company policies
    setConflicts([]);
  };

  const handleAddAvailability = async () => {
    if (!member || !newEntry.startDate || !newEntry.endDate) return;
    
    setSaving(true);
    try {
      const availData = {
        start_date: newEntry.startDate,
        end_date: newEntry.endDate,
        start_time: newEntry.startTime,
        end_time: newEntry.endTime,
        is_available: newEntry.isAvailable,
        is_recurring: newEntry.isRecurring,
        recurring_days: newEntry.recurringDays,
        notes: newEntry.notes || null
      };
      
      const newAvail = await teamService.addAvailability(member.id, availData);
      
      const newAvailabilityEntry: AvailabilityEntry = {
        id: newAvail.id,
        startDate: newAvail.start_date,
        endDate: newAvail.end_date,
        startTime: newAvail.start_time,
        endTime: newAvail.end_time,
        isAvailable: newAvail.is_available,
        isRecurring: newAvail.is_recurring,
        recurringDays: Array.isArray(newAvail.recurring_days) ? newAvail.recurring_days.filter(d => typeof d === 'string') : [],
        notes: newAvail.notes || ''
      };
      
      setAvailability(prev => [...prev, newAvailabilityEntry]);
      setShowAddForm(false);
      setNewEntry({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '17:00',
        isAvailable: true,
        isRecurring: false,
        recurringDays: [],
        notes: ''
      });
      
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (error) {
      console.error('Error adding availability:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvailability = async (id: string) => {
    try {
      await teamService.removeAvailability(id);
      setAvailability(prev => prev.filter(a => a.id !== id));
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (error) {
      console.error('Error removing availability:', error);
    }
  };

  const handleApplyTemplate = async (templateType: string) => {
    if (!member) return;
    
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 90 days from now
    
    setSaving(true);
    try {
      const newEntry = await teamService.applyScheduleTemplate(member.id, templateType, startDate, endDate);
      
      const newAvailabilityEntry: AvailabilityEntry = {
        id: newEntry.id,
        startDate: newEntry.start_date,
        endDate: newEntry.end_date,
        startTime: newEntry.start_time,
        endTime: newEntry.end_time,
        isAvailable: newEntry.is_available,
        isRecurring: newEntry.is_recurring,
        recurringDays: Array.isArray(newEntry.recurring_days) ? newEntry.recurring_days.filter(d => typeof d === 'string') : [],
        notes: newEntry.notes || ''
      };
      
      setAvailability(prev => [...prev, newAvailabilityEntry]);
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (error) {
      console.error('Error applying template:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!member || !window.confirm('Are you sure you want to clear all schedule entries? This action cannot be undone.')) return;
    
    setSaving(true);
    try {
      await teamService.clearTeamMemberSchedule(member.id);
      setAvailability([]);
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (error) {
      console.error('Error clearing schedule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!member || !window.confirm('Reset schedule to default work preferences? This will replace all current schedule entries.')) return;
    
    setSaving(true);
    try {
      // Clear existing schedule
      await teamService.clearTeamMemberSchedule(member.id);
      
      // Apply standard template
      await handleApplyTemplate('standard');
    } catch (error) {
      console.error('Error resetting to defaults:', error);
    } finally {
      setSaving(false);
    }
  };

  // Generate calendar grid for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const dayAvailability = availability.filter(a => {
        const entryStart = new Date(a.startDate);
        const entryEnd = new Date(a.endDate);
        const currentDay = new Date(current);
        return currentDay >= entryStart && currentDay <= entryEnd;
      });
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        availability: dayAvailability,
        isToday: current.toDateString() === new Date().toDateString()
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate, availability]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const getDayStatusColor = (day: any) => {
    if (!day.isCurrentMonth) return 'text-white/20';
    if (day.availability.length === 0) return 'text-white/60';
    
    const hasAvailable = day.availability.some(a => a.isAvailable);
    const hasUnavailable = day.availability.some(a => !a.isAvailable);
    
    if (hasAvailable && hasUnavailable) return 'text-warning-400';
    if (hasAvailable) return 'text-success-400';
    if (hasUnavailable) return 'text-error-400';
    return 'text-white/60';
  };

  const getDayBackgroundColor = (day: any) => {
    if (!day.isCurrentMonth) return '';
    if (day.isToday) return 'bg-accent-500/20 border border-accent-500/30';
    if (day.availability.length === 0) return 'hover:bg-white/5';
    
    const hasAvailable = day.availability.some(a => a.isAvailable);
    const hasUnavailable = day.availability.some(a => !a.isAvailable);
    
    if (hasAvailable && hasUnavailable) return 'bg-warning-500/10 border border-warning-500/20 hover:bg-warning-500/20';
    if (hasAvailable) return 'bg-success-500/10 border border-success-500/20 hover:bg-success-500/20';
    if (hasUnavailable) return 'bg-error-500/10 border border-error-500/20 hover:bg-error-500/20';
    return 'hover:bg-white/5';
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-glass border border-white/20 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden backdrop-filter backdrop-blur-md">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-500/20 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Schedule Management
                </h2>
                <p className="text-sm text-white/70">
                  {member.firstName} {member.lastName} • {member.role}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {conflicts.length > 0 && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-warning-500/10 border border-warning-500/30 rounded text-warning-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">{conflicts.length} conflicts</span>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="h-5 w-5 text-white/40" />
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 mt-4 bg-white/5 rounded-lg p-1">
            {[
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'list', label: 'List View', icon: Clock },
              { id: 'bulk', label: 'Bulk Edit', icon: Zap }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  activeView === view.id
                    ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                    : 'text-white/70 hover:text-white/90 hover:bg-white/10'
                }`}
              >
                <view.icon className="h-4 w-4" />
                <span>{view.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="glass-subtle rounded-xl p-8 flex items-center space-x-4">
                <RefreshCw className="h-8 w-8 animate-spin text-accent-400" />
                <span className="text-lg text-white/80">Loading schedule data...</span>
              </div>
            </div>
          ) : (
            <>
              {activeView === 'calendar' && (
                <div className="space-y-6">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">
                      {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={prevMonth}
                        className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 text-sm"
                      >
                        Today
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="glass-subtle p-4 rounded-xl">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {DAYS_DISPLAY.map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-white/70">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, index) => (
                        <div
                          key={index}
                          className={`p-2 h-20 rounded-lg cursor-pointer transition-all duration-200 ${getDayBackgroundColor(day)}`}
                        >
                          <div className={`text-sm font-medium ${getDayStatusColor(day)}`}>
                            {day.date.getDate()}
                          </div>
                          {day.availability.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {day.availability.slice(0, 2).map((avail, idx) => (
                                <div
                                  key={idx}
                                  className={`text-xs px-1 py-0.5 rounded ${
                                    avail.isAvailable 
                                      ? 'bg-success-500/20 text-success-300'
                                      : 'bg-error-500/20 text-error-300'
                                  }`}
                                >
                                  {avail.startTime}-{avail.endTime}
                                </div>
                              ))}
                              {day.availability.length > 2 && (
                                <div className="text-xs text-white/50">
                                  +{day.availability.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'list' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">Availability Entries</h3>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Schedule</span>
                    </button>
                  </div>

                  {availability.length > 0 ? (
                    <div className="space-y-3">
                      {availability.map((entry, index) => (
                        <div key={entry.id || index} className="glass-subtle p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  entry.isAvailable 
                                    ? 'bg-success-500/20 text-success-300 border border-success-500/30'
                                    : 'bg-error-500/20 text-error-300 border border-error-500/30'
                                }`}>
                                  {entry.isAvailable ? 'Available' : 'Unavailable'}
                                </span>
                                {entry.isRecurring && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-accent-500/20 text-accent-300 border border-accent-500/30">
                                    Recurring
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-white">
                                {new Date(entry.startDate).toLocaleDateString()} - {new Date(entry.endDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-white/70">
                                {entry.startTime} - {entry.endTime}
                              </p>
                              {entry.recurringDays && entry.recurringDays.length > 0 && (
                                <p className="text-xs text-white/60 mt-1">
                                  Days: {entry.recurringDays.map(d => 
                                    typeof d === 'string' ? d.charAt(0).toUpperCase() + d.slice(1) : String(d)
                                  ).join(', ')}
                                </p>
                              )}
                              {entry.notes && (
                                <p className="text-sm text-white/60 mt-2 italic">{entry.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveAvailability(entry.id!)}
                              className="text-red-400 hover:bg-red-500/10 p-2 rounded border border-red-500/30 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-white/60">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-white/20" />
                      <p className="text-lg mb-2">No schedule entries</p>
                      <p className="text-sm text-white/40">Add availability periods to manage this team member's schedule</p>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'bulk' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white">Bulk Schedule Operations</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-subtle p-6 rounded-xl">
                      <h4 className="text-lg font-medium text-white mb-4">Quick Templates</h4>
                      <div className="space-y-3">
                        <button 
                          onClick={() => handleApplyTemplate('standard')}
                          className="w-full text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200 border border-white/10"
                        >
                          <div className="font-medium text-white">Standard Work Week</div>
                          <div className="text-sm text-white/70">Mon-Fri, 8:00 AM - 5:00 PM</div>
                        </button>
                        <button 
                          onClick={() => handleApplyTemplate('extended')}
                          className="w-full text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200 border border-white/10"
                        >
                          <div className="font-medium text-white">Extended Hours</div>
                          <div className="text-sm text-white/70">Mon-Sat, 7:00 AM - 6:00 PM</div>
                        </button>
                        <button 
                          onClick={() => handleApplyTemplate('parttime')}
                          className="w-full text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200 border border-white/10"
                        >
                          <div className="font-medium text-white">Part Time</div>
                          <div className="text-sm text-white/70">Mon, Wed, Fri, 9:00 AM - 3:00 PM</div>
                        </button>
                      </div>
                    </div>

                    <div className="glass-subtle p-6 rounded-xl">
                      <h4 className="text-lg font-medium text-white mb-4">Bulk Actions</h4>
                      <div className="space-y-3">
                        <button 
                          onClick={handleClearSchedule}
                          disabled={saving}
                          className="w-full flex items-center space-x-2 p-3 bg-error-500/10 border border-error-500/30 rounded-lg hover:bg-error-500/20 transition-all duration-200 text-error-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? (
                            <div className="w-4 h-4 border-2 border-error-300 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span>Clear All Schedules</span>
                        </button>
                        <button 
                          onClick={handleResetToDefaults}
                          disabled={saving}
                          className="w-full flex items-center space-x-2 p-3 bg-accent-500/10 border border-accent-500/30 rounded-lg hover:bg-accent-500/20 transition-all duration-200 text-accent-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? (
                            <div className="w-4 h-4 border-2 border-accent-300 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          <span>Reset to Defaults</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Form Modal */}
              {showAddForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-60 p-4">
                  <div className="bg-glass border border-white/20 rounded-xl shadow-xl max-w-2xl w-full backdrop-filter backdrop-blur-md">
                    <div className="border-b border-white/10 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Add Schedule Entry</h3>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="text-white/40 hover:text-white/80"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/90 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={newEntry.startDate}
                            onChange={(e) => setNewEntry({ ...newEntry, startDate: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/90 mb-2">End Date</label>
                          <input
                            type="date"
                            value={newEntry.endDate}
                            onChange={(e) => setNewEntry({ ...newEntry, endDate: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/90 mb-2">Start Time</label>
                          <input
                            type="time"
                            value={newEntry.startTime}
                            onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/90 mb-2">End Time</label>
                          <input
                            type="time"
                            value={newEntry.endTime}
                            onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                            className="form-input"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newEntry.isAvailable}
                            onChange={(e) => setNewEntry({ ...newEntry, isAvailable: e.target.checked })}
                            className="w-4 h-4 text-accent-500 bg-white/10 border-white/20 rounded focus:ring-accent-500 focus:ring-2"
                          />
                          <span className="text-sm text-white/90">Available (uncheck to mark as unavailable)</span>
                        </label>
                      </div>
                      
                      <div className="mt-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newEntry.isRecurring}
                            onChange={(e) => setNewEntry({ ...newEntry, isRecurring: e.target.checked })}
                            className="w-4 h-4 text-accent-500 bg-white/10 border-white/20 rounded focus:ring-accent-500 focus:ring-2"
                          />
                          <span className="text-sm text-white/90">Recurring schedule</span>
                        </label>
                      </div>
                      
                      {newEntry.isRecurring && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-white/90 mb-2">Recurring Days</label>
                          <div className="grid grid-cols-7 gap-2">
                            {DAYS_OF_WEEK.map((day, index) => (
                              <label key={day} className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={newEntry.recurringDays.includes(day)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewEntry({
                                        ...newEntry,
                                        recurringDays: [...newEntry.recurringDays, day]
                                      });
                                    } else {
                                      setNewEntry({
                                        ...newEntry,
                                        recurringDays: newEntry.recurringDays.filter(d => d !== day)
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-accent-500 bg-white/10 border-white/20 rounded focus:ring-accent-500 focus:ring-2"
                                />
                                <span className="text-xs text-white/90">{DAYS_DISPLAY[index]}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-white/90 mb-2">Notes</label>
                        <textarea
                          value={newEntry.notes}
                          onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                          className="form-input"
                          rows={2}
                          placeholder="Optional notes about this schedule..."
                        />
                      </div>
                      
                      <div className="flex items-center justify-end space-x-3 mt-6">
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/10 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddAvailability}
                          disabled={!newEntry.startDate || !newEntry.endDate || saving}
                          className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving && <div className="w-4 h-4 border-2 border-accent-300 border-t-transparent rounded-full animate-spin" />}
                          <Save className="h-4 w-4" />
                          <span>Add Schedule</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagementModal;