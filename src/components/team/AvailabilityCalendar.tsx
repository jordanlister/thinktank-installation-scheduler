// Think Tank Technologies - Team Availability Calendar Component

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  User, 
  Plus,
  X,
  Check,
  AlertTriangle,
  MapPin,
  Filter
} from 'lucide-react';
import { useTeamStore } from '../../stores/useTeamStore';
import type { TeamMember, Availability, TimeOffRequest } from '../../types';

interface AvailabilityCalendarProps {
  selectedRegion?: string;
  selectedTeamMember?: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ 
  selectedRegion, 
  selectedTeamMember 
}) => {
  const { 
    teamMembers, 
    timeOffRequests,
    submitTimeOffRequest,
    approveTimeOffRequest,
    denyTimeOffRequest 
  } = useTeamStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter team members based on props
  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      if (selectedTeamMember && member.id !== selectedTeamMember) return false;
      if (selectedRegion && member.region !== selectedRegion && !member.subRegions.includes(selectedRegion)) return false;
      return member.isActive;
    });
  }, [teamMembers, selectedRegion, selectedTeamMember]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstCalendarDay = new Date(firstDay);
    firstCalendarDay.setDate(firstCalendarDay.getDate() - firstCalendarDay.getDay());
    
    const days = [];
    const currentCalendarDate = new Date(firstCalendarDay);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push({
        date: new Date(currentCalendarDate),
        isCurrentMonth: currentCalendarDate.getMonth() === month,
        isToday: currentCalendarDate.toDateString() === new Date().toDateString()
      });
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // Get availability for a specific date
  const getAvailabilityForDate = (date: Date, memberId: string): 'available' | 'unavailable' | 'time-off' | 'partial' => {
    const dateString = date.toISOString().split('T')[0];
    const member = filteredMembers.find(m => m.id === memberId);
    
    if (!member) return 'unavailable';
    
    // Check for approved time off
    const hasTimeOff = timeOffRequests.some(request => 
      request.teamMemberId === memberId &&
      request.status === 'approved' &&
      dateString >= request.startDate &&
      dateString <= request.endDate
    );
    
    if (hasTimeOff) return 'time-off';
    
    // Check availability rules
    const dayOfWeek = date.getDay();
    const isAvailable = member.availability.some(avail => {
      if (!avail.isAvailable) return false;
      
      if (avail.isRecurring && avail.recurringDays) {
        return avail.recurringDays.includes(dayOfWeek) &&
               dateString >= avail.startDate &&
               dateString <= avail.endDate;
      }
      
      return dateString >= avail.startDate && dateString <= avail.endDate;
    });
    
    return isAvailable ? 'available' : 'unavailable';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date.toISOString().split('T')[0]);
    setShowTimeOffModal(true);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Team Availability</h2>
            
            {/* Month Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Today
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              {['month', 'week', 'day'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-3 py-1 text-sm capitalize ${
                    viewMode === mode 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
                <select className="text-sm border border-gray-300 rounded px-2 py-1">
                  <option value="">All Regions</option>
                  {[...new Set(teamMembers.map(m => m.region))].map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select className="text-sm border border-gray-300 rounded px-2 py-1">
                  <option value="">All Roles</option>
                  <option value="lead">Leads</option>
                  <option value="assistant">Assistants</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <span>Unavailable</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>Time Off</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span>Partial</span>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-4">
        {viewMode === 'month' && (
          <MonthView 
            calendarDays={calendarDays}
            filteredMembers={filteredMembers}
            getAvailabilityForDate={getAvailabilityForDate}
            onDateClick={handleDateClick}
          />
        )}
        
        {viewMode === 'week' && (
          <WeekView 
            currentDate={currentDate}
            filteredMembers={filteredMembers}
            getAvailabilityForDate={getAvailabilityForDate}
          />
        )}
        
        {viewMode === 'day' && (
          <DayView 
            currentDate={currentDate}
            filteredMembers={filteredMembers}
            getAvailabilityForDate={getAvailabilityForDate}
          />
        )}
      </div>

      {/* Time Off Request Modal */}
      {showTimeOffModal && (
        <TimeOffRequestModal 
          isOpen={showTimeOffModal}
          onClose={() => setShowTimeOffModal(false)}
          selectedDate={selectedDate}
          teamMembers={filteredMembers}
          onSubmit={submitTimeOffRequest}
        />
      )}
    </div>
  );
};

// Month View Component
const MonthView: React.FC<{
  calendarDays: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }>;
  filteredMembers: TeamMember[];
  getAvailabilityForDate: (date: Date, memberId: string) => string;
  onDateClick: (date: Date) => void;
}> = ({ calendarDays, filteredMembers, getAvailabilityForDate, onDateClick }) => {
  return (
    <div>
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            onClick={() => onDateClick(day.date)}
            className={`min-h-[100px] border border-gray-100 rounded p-1 cursor-pointer hover:bg-gray-50 ${
              !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
            } ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}`}
          >
            <div className="text-xs font-medium mb-1">
              {day.date.getDate()}
            </div>
            
            {/* Team Member Availability Indicators */}
            <div className="space-y-1">
              {filteredMembers.slice(0, 3).map(member => {
                const availability = getAvailabilityForDate(day.date, member.id);
                return (
                  <div
                    key={member.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${
                      availability === 'available' ? 'bg-green-100 text-green-800' :
                      availability === 'time-off' ? 'bg-yellow-100 text-yellow-800' :
                      availability === 'partial' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}
                    title={`${member.firstName} ${member.lastName} - ${availability}`}
                  >
                    {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                  </div>
                );
              })}
              
              {filteredMembers.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{filteredMembers.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Week View Component (simplified)
const WeekView: React.FC<{
  currentDate: Date;
  filteredMembers: TeamMember[];
  getAvailabilityForDate: (date: Date, memberId: string) => string;
}> = ({ currentDate, filteredMembers, getAvailabilityForDate }) => {
  // Get week dates
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  return (
    <div>
      <div className="grid grid-cols-8 gap-2">
        {/* Header */}
        <div className="font-medium text-gray-900 p-2">Team Member</div>
        {weekDays.map(date => (
          <div key={date.toString()} className="text-center p-2">
            <div className="text-xs text-gray-500">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="font-medium">{date.getDate()}</div>
          </div>
        ))}

        {/* Team Member Rows */}
        {filteredMembers.map(member => (
          <React.Fragment key={member.id}>
            <div className="font-medium text-gray-900 p-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="truncate">{member.firstName} {member.lastName}</span>
              </div>
              <div className="text-xs text-gray-500">{member.role}</div>
            </div>
            
            {weekDays.map(date => {
              const availability = getAvailabilityForDate(date, member.id);
              return (
                <div key={date.toString()} className="p-2 border-t border-gray-100">
                  <div className={`w-full h-8 rounded text-xs flex items-center justify-center ${
                    availability === 'available' ? 'bg-green-100 text-green-800' :
                    availability === 'time-off' ? 'bg-yellow-100 text-yellow-800' :
                    availability === 'partial' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {availability === 'available' ? 'Available' :
                     availability === 'time-off' ? 'Time Off' :
                     availability === 'partial' ? 'Partial' :
                     'Unavailable'}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Day View Component (simplified)
const DayView: React.FC<{
  currentDate: Date;
  filteredMembers: TeamMember[];
  getAvailabilityForDate: (date: Date, memberId: string) => string;
}> = ({ currentDate, filteredMembers, getAvailabilityForDate }) => {
  const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredMembers.map(member => {
          const availability = getAvailabilityForDate(currentDate, member.id);
          return (
            <div key={member.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{member.firstName} {member.lastName}</span>
                  <span className="text-sm text-gray-500 capitalize">({member.role})</span>
                </div>
                
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  availability === 'available' ? 'bg-green-100 text-green-800' :
                  availability === 'time-off' ? 'bg-yellow-100 text-yellow-800' :
                  availability === 'partial' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {availability === 'available' ? 'Available' :
                   availability === 'time-off' ? 'Time Off' :
                   availability === 'partial' ? 'Partial' :
                   'Unavailable'}
                </div>
              </div>

              {/* Work preferences */}
              {member.workPreferences && (
                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>Preferred hours: {member.workPreferences.preferredStartTime} - {member.workPreferences.preferredEndTime}</span>
                    <span>Max daily jobs: {member.workPreferences.maxDailyJobs}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Time Off Request Modal Component
const TimeOffRequestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  teamMembers: TeamMember[];
  onSubmit: (request: TimeOffRequest) => void;
}> = ({ isOpen, onClose, selectedDate, teamMembers, onSubmit }) => {
  const [formData, setFormData] = useState({
    teamMemberId: '',
    startDate: selectedDate,
    endDate: selectedDate,
    type: 'vacation' as const,
    reason: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const request: TimeOffRequest = {
      id: `timeoff_${Date.now()}`,
      ...formData,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    
    onSubmit(request);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Request Time Off</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
            <select
              value={formData.teamMemberId}
              onChange={(e) => setFormData({ ...formData, teamMemberId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Select team member</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="vacation">Vacation</option>
              <option value="sick_leave">Sick Leave</option>
              <option value="personal">Personal</option>
              <option value="family_leave">Family Leave</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
              placeholder="Additional details..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;