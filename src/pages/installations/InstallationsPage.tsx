// Lead Route - Routes Page

import React, { useState, useMemo } from 'react';
import { MapPin, Plus, Filter, Search, AlertTriangle, RefreshCw, MoreHorizontal, Download, Edit } from 'lucide-react';
import { useInstallations } from '../../hooks/useInstallations';
import InstallationList from './InstallationList';
import InstallationModal from './InstallationModal';
import BulkActions from './BulkActions';
import type { Installation } from '../../types';

const InstallationsPage: React.FC = () => {
  const { installations, isLoading, error, refetch } = useInstallations();
  const [showNewInstallationModal, setShowNewInstallationModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstallations, setSelectedInstallations] = useState<string[]>([]);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Filter installations based on search and filters
  const filteredInstallations = useMemo(() => {
    return installations.filter(installation => {
      const matchesSearch = searchTerm === '' || 
        installation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        installation.address.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
        installation.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        installation.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || installation.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || installation.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [installations, searchTerm, filterStatus, filterPriority]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    return {
      total: installations.length,
      pending: installations.filter(i => i.status === 'pending').length,
      inProgress: installations.filter(i => i.status === 'in_progress').length,
      completed: installations.filter(i => i.status === 'completed').length,
      scheduled: installations.filter(i => i.status === 'scheduled').length
    };
  }, [installations]);

  const handleNewInstallation = () => {
    setSelectedInstallation(null);
    setShowNewInstallationModal(true);
  };

  const handleViewInstallation = (installation: Installation) => {
    setSelectedInstallation(installation);
    setShowInstallationModal(true);
  };

  const handleEditInstallation = (installation: Installation) => {
    setSelectedInstallation(installation);
    setShowNewInstallationModal(true);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedInstallations(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedInstallations([]);
  };

  const handleFilter = () => {
    setShowFilterModal(true);
  };

  const handleExportData = () => {
    const csvData = filteredInstallations.map(installation => ({
      ID: installation.id,
      Customer: installation.customerName,
      Phone: installation.customerPhone,
      Email: installation.customerEmail,
      Address: `${installation.address.street}, ${installation.address.city}, ${installation.address.state} ${installation.address.zipCode}`,
      ScheduledDate: installation.scheduledDate,
      ScheduledTime: installation.scheduledTime,
      Duration: installation.duration,
      Status: installation.status,
      Priority: installation.priority,
      Notes: installation.notes
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `installations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Installation Management</h1>
        <p className="text-xl text-white/80">Manage and track all installation requests and schedules</p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          {selectedInstallations.length > 0 && (
            <BulkActions
              selectedCount={selectedInstallations.length}
              onClearSelection={handleClearSelection}
              selectedInstallations={selectedInstallations}
            />
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={refetch}
            disabled={isLoading}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </button>
          <button 
            onClick={handleExportData}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Export
          </button>
          <button 
            onClick={handleNewInstallation}
            className="px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-lg text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            New Installation
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="metric-card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-glass-muted">Total Installations</p>
              <p className="text-2xl font-bold mt-1 text-glass-primary">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-300">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="metric-card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-glass-muted">Pending</p>
              <p className="text-2xl font-bold mt-1 text-glass-primary">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-300">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="metric-card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-glass-muted">Scheduled</p>
              <p className="text-2xl font-bold mt-1 text-glass-primary">{stats.scheduled}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-300">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="metric-card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-glass-muted">In Progress</p>
              <p className="text-2xl font-bold mt-1 text-glass-primary">{stats.inProgress}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/20 text-orange-300">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="metric-card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-glass-muted">Completed</p>
              <p className="text-2xl font-bold mt-1 text-glass-primary">{stats.completed}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20 text-green-300">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-glass-muted" />
                <input
                  type="text"
                  placeholder="Search installations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleFilter}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md"
              >
                <Filter className="h-4 w-4 mr-2 inline" />
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <InstallationList
        installations={filteredInstallations}
        isLoading={isLoading}
        error={error}
        onViewInstallation={handleViewInstallation}
        onEditInstallation={handleEditInstallation}
        selectedInstallations={selectedInstallations}
        onToggleSelection={handleToggleSelection}
        onClearSelection={handleClearSelection}
      />

      {/* Installation Creation/Edit Modal */}
      {showNewInstallationModal && (
        <InstallationModal
          installation={selectedInstallation}
          onClose={() => {
            setShowNewInstallationModal(false);
            setSelectedInstallation(null);
          }}
          onSave={() => {
            setShowNewInstallationModal(false);
            setSelectedInstallation(null);
            refetch();
          }}
        />
      )}

      {/* Installation View Modal */}
      {showInstallationModal && selectedInstallation && (
        <InstallationModal
          installation={selectedInstallation}
          onClose={() => {
            setShowInstallationModal(false);
            setSelectedInstallation(null);
          }}
          onSave={() => {
            setShowInstallationModal(false);
            setSelectedInstallation(null);
            refetch();
          }}
          viewMode
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowFilterModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-glass rounded-xl shadow-xl border border-white/20 p-6 w-full max-w-md mx-4 custom-scrollbar">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Filter Installations</h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-accent-500/50 focus:ring-accent-500/20"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-accent-500/50 focus:ring-accent-500/20"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div className="flex justify-between space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setFilterPriority('all');
                    }}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-lg text-accent-300 hover:bg-accent-500/30 transition-all duration-200"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InstallationsPage;