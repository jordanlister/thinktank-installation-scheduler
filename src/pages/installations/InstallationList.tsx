// Think Tank Technologies - Installation List Component

import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import type { Installation, InstallationStatus, Priority } from '../../types';

interface InstallationListProps {
  installations: Installation[];
  isLoading: boolean;
  error: string | null;
  onViewInstallation: (installation: Installation) => void;
  onEditInstallation: (installation: Installation) => void;
  selectedInstallations: string[];
  onToggleSelection: (id: string) => void;
  onClearSelection: () => void;
}

type SortKey = keyof Installation | 'address' | 'customerName' | 'scheduledDate';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const InstallationList: React.FC<InstallationListProps> = ({
  installations,
  isLoading,
  error,
  onViewInstallation,
  onEditInstallation,
  selectedInstallations,
  onToggleSelection,
  onClearSelection
}) => {
  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('scheduledDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Handle sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Sort installations
  const sortedInstallations = useMemo(() => {
    return [...installations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortKey) {
        case 'address':
          aValue = `${a.address.street} ${a.address.city}`;
          bValue = `${b.address.street} ${b.address.city}`;
          break;
        case 'customerName':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        case 'scheduledDate':
          aValue = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
          bValue = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
          break;
        default:
          aValue = a[sortKey as keyof Installation];
          bValue = b[sortKey as keyof Installation];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [installations, sortKey, sortDirection]);

  // Paginate installations
  const paginatedInstallations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedInstallations.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedInstallations, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil(sortedInstallations.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, sortedInstallations.length);

  // Handle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      paginatedInstallations.forEach(installation => {
        if (!selectedInstallations.includes(installation.id)) {
          onToggleSelection(installation.id);
        }
      });
    } else {
      paginatedInstallations.forEach(installation => {
        if (selectedInstallations.includes(installation.id)) {
          onToggleSelection(installation.id);
        }
      });
    }
  };

  const isAllSelected = paginatedInstallations.length > 0 && 
    paginatedInstallations.every(installation => selectedInstallations.includes(installation.id));
  const isPartiallySelected = paginatedInstallations.some(installation => 
    selectedInstallations.includes(installation.id)
  ) && !isAllSelected;

  // Get status styling
  const getStatusStyle = (status: InstallationStatus) => {
    const styles = {
      pending: 'bg-warning-500/20 text-warning-300 border-warning-500/30',
      scheduled: 'bg-accent-500/20 text-accent-300 border-accent-500/30',
      in_progress: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      completed: 'bg-success-500/20 text-success-300 border-success-500/30',
      cancelled: 'bg-error-500/20 text-error-300 border-error-500/30',
      rescheduled: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    };
    return styles[status] || styles.pending;
  };

  // Get priority styling
  const getPriorityStyle = (priority: Priority) => {
    const styles = {
      low: 'bg-white/10 text-white/70 border-white/20',
      medium: 'bg-accent-500/20 text-accent-300 border-accent-500/30',
      high: 'bg-warning-500/20 text-warning-300 border-warning-500/30',
      urgent: 'bg-error-500/20 text-error-300 border-error-500/30'
    };
    return styles[priority] || styles.medium;
  };

  // Check if installation is overdue
  const isOverdue = (installation: Installation) => {
    if (installation.status === 'completed' || installation.status === 'cancelled') return false;
    const installationDate = new Date(`${installation.scheduledDate}T${installation.scheduledTime}`);
    return installationDate < new Date();
  };

  // Format date and time
  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return {
      date: dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: dateObj.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const SortableHeader: React.FC<{ 
    sortKey: SortKey; 
    children: React.ReactNode; 
    className?: string;
  }> = ({ sortKey: headerSortKey, children, className = "" }) => (
    <th className={`px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-all duration-200 ${className}`}
        onClick={() => handleSort(headerSortKey)}>
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortKey === headerSortKey && (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-3 w-3 text-accent-400" /> : 
            <ChevronDown className="h-3 w-3 text-accent-400" />
        )}
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="glass-subtle border border-white/20 rounded-xl p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-400 mx-auto"></div>
          <p className="mt-2 text-white/80">Loading installations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-subtle border border-error-500/30 rounded-xl p-8">
        <div className="text-center text-error-300">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (installations.length === 0) {
    return (
      <div className="glass-subtle border border-white/20 rounded-xl p-8">
        <div className="text-center text-white/70">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-white/40" />
          <h3 className="text-lg font-medium mb-2 text-white">No installations found</h3>
          <p>Get started by creating your first installation or importing data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-subtle border border-white/20 rounded-xl overflow-hidden backdrop-filter backdrop-blur-md">
      {/* Table Header Controls */}
      <div className="px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white/80">
              Showing {startItem} to {endItem} of {sortedInstallations.length} installations
            </span>
            {selectedInstallations.length > 0 && (
              <span className="text-sm text-accent-300">
                {selectedInstallations.length} selected
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-white/80">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white/90 focus:border-accent-500/50 focus:ring-accent-500/20"
            >
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/10 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-accent-500 bg-white/10 border-white/20 rounded focus:ring-accent-500 focus:ring-2"
                />
              </th>
              <SortableHeader sortKey="id" className="w-20">ID</SortableHeader>
              <SortableHeader sortKey="customerName">Customer</SortableHeader>
              <SortableHeader sortKey="address">Address</SortableHeader>
              <SortableHeader sortKey="scheduledDate">Scheduled</SortableHeader>
              <SortableHeader sortKey="status">Status</SortableHeader>
              <SortableHeader sortKey="priority">Priority</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Team
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paginatedInstallations.map((installation) => {
              const isSelected = selectedInstallations.includes(installation.id);
              const overdue = isOverdue(installation);
              const datetime = formatDateTime(installation.scheduledDate, installation.scheduledTime);
              
              return (
                <tr 
                  key={installation.id}
                  className={`hover:bg-white/10 transition-all duration-200 ${isSelected ? 'bg-accent-500/10' : ''} ${overdue ? 'border-l-4 border-error-500' : ''}`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelection(installation.id)}
                      className="w-4 h-4 text-accent-500 bg-white/10 border-white/20 rounded focus:ring-accent-500 focus:ring-2"
                    />
                  </td>
                  
                  <td className="px-4 py-4 text-sm text-white/90 font-mono">
                    {installation.id.slice(-8)}
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">
                        {installation.customerName}
                      </span>
                      <div className="flex items-center space-x-2 text-xs text-white/60">
                        {installation.customerPhone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{installation.customerPhone}</span>
                          </div>
                        )}
                        {installation.customerEmail && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{installation.customerEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-start space-x-1 text-sm">
                      <MapPin className="h-4 w-4 text-white/40 mt-0.5" />
                      <div>
                        <div className="text-white">{installation.address.street}</div>
                        <div className="text-white/60 text-xs">
                          {installation.address.city}, {installation.address.state} {installation.address.zipCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-start space-x-1 text-sm">
                      <Calendar className="h-4 w-4 text-white/40 mt-0.5" />
                      <div>
                        <div className={`font-medium ${overdue ? 'text-error-400' : 'text-white'}`}>
                          {datetime.date}
                        </div>
                        <div className="text-white/60 text-xs flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{datetime.time}</span>
                          <span>({installation.duration}min)</span>
                          {overdue && <AlertTriangle className="h-3 w-3 text-error-400" />}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(installation.status)}`}>
                      {installation.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {installation.status === 'in_progress' && <div className="h-2 w-2 bg-current rounded-full mr-1 animate-pulse" />}
                      {installation.status.replace('_', ' ')}
                    </span>
                  </td>
                  
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle(installation.priority)}`}>
                      {installation.priority}
                    </span>
                  </td>
                  
                  <td className="px-4 py-4 text-sm text-white/60">
                    <div className="flex flex-col space-y-1">
                      {installation.leadId ? (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs">Lead: {installation.leadId.slice(-4)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-white/40">No lead</span>
                      )}
                      {installation.assistantId ? (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs">Asst: {installation.assistantId.slice(-4)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-white/40">No assistant</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onViewInstallation(installation)}
                        className="p-1 text-white/40 hover:text-accent-300 hover:bg-accent-500/10 rounded transition-all duration-200"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditInstallation(installation)}
                        className="p-1 text-white/40 hover:text-success-300 hover:bg-success-500/10 rounded transition-all duration-200"
                        title="Edit installation"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-white/40 hover:text-white/70 hover:bg-white/10 rounded transition-all duration-200"
                        title="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-white/5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/80">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 7) {
                  pageNumber = i + 1;
                } else if (currentPage <= 4) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNumber = totalPages - 6 + i;
                } else {
                  pageNumber = currentPage - 3 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      currentPage === pageNumber
                        ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                        : 'bg-white/10 border border-white/20 text-white/70 hover:text-white/90 hover:bg-white/15'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationList;