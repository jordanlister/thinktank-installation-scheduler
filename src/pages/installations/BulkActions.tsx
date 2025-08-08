// Think Tank Technologies - Bulk Actions Component

import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Calendar, 
  Trash2, 
  Download, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import type { Installation, InstallationStatus, Priority } from '../../types';

interface BulkActionsProps {
  selectedInstallations: string[];
  installations: Installation[];
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, installationIds: string[], data?: any) => void;
}

type BulkActionType = 
  | 'assign_team' 
  | 'reschedule' 
  | 'update_status' 
  | 'update_priority'
  | 'cancel' 
  | 'delete'
  | 'export_csv' 
  | 'export_pdf'
  | 'send_notifications';

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedInstallations,
  installations,
  isOpen,
  onClose,
  onAction
}) => {
  const { teams, bulkUpdateInstallations } = useAppStore();
  const [activeAction, setActiveAction] = useState<BulkActionType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form state for different actions
  const [assignmentData, setAssignmentData] = useState({
    leadId: '',
    assistantId: ''
  });
  
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    time: '',
    duration: 240
  });
  
  const [statusUpdate, setStatusUpdate] = useState<InstallationStatus>('scheduled');
  const [priorityUpdate, setPriorityUpdate] = useState<Priority>('medium');

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setActiveAction(null);
      setAssignmentData({ leadId: '', assistantId: '' });
      setRescheduleData({ 
        date: new Date().toISOString().split('T')[0], 
        time: '09:00', 
        duration: 240 
      });
      setStatusUpdate('scheduled');
      setPriorityUpdate('medium');
    }
  }, [isOpen]);

  // Handle action execution
  const executeAction = async () => {
    if (!activeAction) return;
    
    setIsProcessing(true);
    
    try {
      switch (activeAction) {
        case 'assign_team':
          await bulkUpdateInstallations(selectedInstallations, {
            leadId: assignmentData.leadId || undefined,
            assistantId: assignmentData.assistantId || undefined
          });
          break;
          
        case 'reschedule':
          await bulkUpdateInstallations(selectedInstallations, {
            scheduledDate: rescheduleData.date,
            scheduledTime: rescheduleData.time,
            duration: rescheduleData.duration,
            status: 'rescheduled'
          });
          break;
          
        case 'update_status':
          await bulkUpdateInstallations(selectedInstallations, {
            status: statusUpdate
          });
          break;
          
        case 'update_priority':
          await bulkUpdateInstallations(selectedInstallations, {
            priority: priorityUpdate
          });
          break;
          
        case 'cancel':
          await bulkUpdateInstallations(selectedInstallations, {
            status: 'cancelled'
          });
          break;
          
        case 'export_csv':
          exportToCSV();
          break;
          
        case 'export_pdf':
          exportToPDF();
          break;
          
        case 'send_notifications':
          sendBulkNotifications();
          break;
          
        default:
          console.warn('Unknown action:', activeAction);
      }
      
      onAction(activeAction, selectedInstallations);
      onClose();
    } catch (error) {
      console.error('Error executing bulk action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export functions
  const exportToCSV = () => {
    const csvData = installations.map(installation => ({
      ID: installation.id,
      'Customer Name': installation.customerName,
      'Phone': installation.customerPhone,
      'Email': installation.customerEmail,
      'Address': `${installation.address.street}, ${installation.address.city}, ${installation.address.state} ${installation.address.zipCode}`,
      'Scheduled Date': installation.scheduledDate,
      'Scheduled Time': installation.scheduledTime,
      'Duration': installation.duration,
      'Status': installation.status,
      'Priority': installation.priority,
      'Lead ID': installation.leadId || '',
      'Assistant ID': installation.assistantId || '',
      'Notes': installation.notes || '',
      'Created': installation.createdAt,
      'Updated': installation.updatedAt
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_installations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // This would integrate with a PDF generation service
    console.log('PDF export for installations:', selectedInstallations);
  };

  const sendBulkNotifications = () => {
    // This would integrate with the notification system
    console.log('Sending notifications for installations:', selectedInstallations);
  };

  if (!isOpen) return null;

  const actionContent = () => {
    switch (activeAction) {
      case 'assign_team':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Assign Team Members</h4>
            <p className="text-sm text-gray-600">
              Assign team members to {selectedInstallations.length} selected installations.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Technician
                </label>
                <select
                  value={assignmentData.leadId}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, leadId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep Current / Unassigned</option>
                  {teams.filter(t => t.role === 'lead').map(team => (
                    <option key={team.id} value={team.id}>
                      {team.firstName} {team.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assistant
                </label>
                <select
                  value={assignmentData.assistantId}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, assistantId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep Current / Unassigned</option>
                  {teams.filter(t => t.role === 'assistant').map(team => (
                    <option key={team.id} value={team.id}>
                      {team.firstName} {team.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'reschedule':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Reschedule Installations</h4>
            <p className="text-sm text-gray-600">
              Reschedule {selectedInstallations.length} selected installations to a new date and time.
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Time
                </label>
                <input
                  type="time"
                  value={rescheduleData.time}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (min)
                </label>
                <input
                  type="number"
                  min="30"
                  max="960"
                  step="30"
                  value={rescheduleData.duration}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, duration: parseInt(e.target.value) || 240 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 'update_status':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Update Status</h4>
            <p className="text-sm text-gray-600">
              Update the status of {selectedInstallations.length} selected installations.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value as InstallationStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
        );

      case 'update_priority':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Update Priority</h4>
            <p className="text-sm text-gray-600">
              Update the priority level of {selectedInstallations.length} selected installations.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Priority
              </label>
              <select
                value={priorityUpdate}
                onChange={(e) => setPriorityUpdate(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        );

      case 'cancel':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-red-600">Cancel Installations</h4>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm text-red-800">
                    You are about to cancel {selectedInstallations.length} installations. 
                    This action will change their status to "cancelled".
                  </p>
                  <p className="text-xs text-red-700 mt-2">
                    Consider notifying customers before proceeding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Select Action</h4>
            <p className="text-sm text-gray-600">
              Choose an action to perform on {selectedInstallations.length} selected installations.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Bulk Actions</h3>
              <p className="text-sm text-gray-500">{selectedInstallations.length} installations selected</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 py-4">
            {!activeAction ? (
              /* Action Selection */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveAction('assign_team')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <Users className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium">Assign Team</div>
                      <div className="text-sm text-gray-500">Assign leads and assistants</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveAction('reschedule')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <Calendar className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium">Reschedule</div>
                      <div className="text-sm text-gray-500">Change date and time</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveAction('update_status')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <div className="font-medium">Update Status</div>
                      <div className="text-sm text-gray-500">Change installation status</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveAction('update_priority')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <div className="font-medium">Update Priority</div>
                      <div className="text-sm text-gray-500">Change priority level</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveAction('export_csv')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <Download className="h-8 w-8 text-indigo-600 mr-3" />
                    <div>
                      <div className="font-medium">Export CSV</div>
                      <div className="text-sm text-gray-500">Download as spreadsheet</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveAction('send_notifications')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <Mail className="h-8 w-8 text-cyan-600 mr-3" />
                    <div>
                      <div className="font-medium">Send Notifications</div>
                      <div className="text-sm text-gray-500">Notify customers</div>
                    </div>
                  </button>
                </div>

                {/* Destructive Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Destructive Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveAction('cancel')}
                      className="flex items-center p-4 border border-red-200 rounded-lg hover:bg-red-50 text-left"
                    >
                      <XCircle className="h-8 w-8 text-red-600 mr-3" />
                      <div>
                        <div className="font-medium text-red-700">Cancel Installations</div>
                        <div className="text-sm text-red-500">Mark as cancelled</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Action Form */
              <div className="space-y-6">
                {actionContent()}
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setActiveAction(null)}
                    disabled={isProcessing}
                    className="btn-ghost"
                  >
                    Back
                  </button>
                  
                  <button
                    onClick={executeAction}
                    disabled={isProcessing}
                    className={`flex items-center space-x-2 ${
                      activeAction === 'cancel' 
                        ? 'btn-danger' 
                        : 'btn-primary'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Execute Action</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;