// Think Tank Technologies - Reports & Analytics Page

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  AlertCircle, 
  Calendar,
  TrendingUp,
  BarChart3,
  Mail,
  Clock,
  RefreshCw,
  Plus,
  Eye,
  X
} from 'lucide-react';
import { 
  useRecentReports,
  useScheduledReports,
  useReportGeneration
} from '../../hooks/useReports';

const ReportsPage: React.FC = () => {
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showScheduleReportModal, setShowScheduleReportModal] = useState(false);

  const { reports: recentReports, isLoading: reportsLoading, refetch: refetchReports } = useRecentReports();
  const { scheduledReports, isLoading: scheduledLoading } = useScheduledReports();
  const {
    generatingReports,
    reportStatuses,
    generateScheduleReport,
    generatePerformanceReport,
    generateAnalyticsReport
  } = useReportGeneration();

  const handleGenerateScheduleReport = async () => {
    try {
      const reportId = await generateScheduleReport(selectedDateRange);
      console.log('Schedule report generation started:', reportId);
      refetchReports(); // Refresh the reports list
    } catch (error) {
      console.error('Error generating schedule report:', error);
    }
  };

  const handleGeneratePerformanceReport = async (period: 'week' | 'month' | 'quarter') => {
    try {
      const reportId = await generatePerformanceReport(period);
      console.log('Performance report generation started:', reportId);
      refetchReports(); // Refresh the reports list
    } catch (error) {
      console.error('Error generating performance report:', error);
    }
  };

  const handleGenerateAnalyticsReport = async () => {
    try {
      const reportId = await generateAnalyticsReport();
      console.log('Analytics report generation started:', reportId);
      refetchReports(); // Refresh the reports list
    } catch (error) {
      console.error('Error generating analytics report:', error);
    }
  };

  const handleViewScheduledReport = (scheduleId: string) => {
    // Find the scheduled report
    const report = scheduledReports.find(sr => sr.id === scheduleId);
    if (report) {
      console.log('Viewing scheduled report:', report);
      // Here you would typically open a detailed modal or navigate to a detail page
    }
  };

  const handleAddScheduledReport = () => {
    setShowScheduleReportModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Reports & Analytics</h1>
        <p className="text-xl text-white/80">Generate reports and view performance analytics</p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-white/70" />
            <input
              type="date"
              value={selectedDateRange.start}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="form-input text-sm"
            />
            <span className="text-white/70">to</span>
            <input
              type="date"
              value={selectedDateRange.end}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="form-input text-sm"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={refetchReports}
            disabled={reportsLoading}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
          >
            {reportsLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </button>
          <button 
            onClick={() => setShowReportGenerator(true)}
            className="px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-lg text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-body p-6">
          <h2 className="text-xl font-semibold text-glass-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={handleGenerateScheduleReport}
              disabled={generatingReports.size > 0}
              className="glass p-4 rounded-lg hover:shadow-glass-lg transition-all text-left disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  {generatingReports.has('schedule') ? (
                    <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                  ) : (
                    <Calendar className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-glass-primary">Schedule Report</h3>
                  <p className="text-sm text-glass-muted">Generate route schedule PDF</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => handleGeneratePerformanceReport('month')}
              disabled={generatingReports.size > 0}
              className="glass p-4 rounded-lg hover:shadow-glass-lg transition-all text-left disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  {generatingReports.has('performance') ? (
                    <RefreshCw className="h-5 w-5 text-green-400 animate-spin" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-glass-primary">Performance Report</h3>
                  <p className="text-sm text-glass-muted">Team performance analytics</p>
                </div>
              </div>
            </button>

            <button 
              onClick={handleGenerateAnalyticsReport}
              disabled={generatingReports.size > 0}
              className="glass p-4 rounded-lg hover:shadow-glass-lg transition-all text-left disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  {generatingReports.has('analytics') ? (
                    <RefreshCw className="h-5 w-5 text-purple-400 animate-spin" />
                  ) : (
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-glass-primary">Analytics Dashboard</h3>
                  <p className="text-sm text-glass-muted">Comprehensive analytics report</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-glass-primary">Recent Reports</h2>
              <button 
                onClick={refetchReports}
                disabled={reportsLoading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 text-white/70 ${reportsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {reportsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-accent-400" />
              </div>
            ) : recentReports.length > 0 ? (
              <div className="space-y-4">
                {recentReports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-glass-primary">{report.name}</p>
                        <p className="text-sm text-glass-muted">
                          {new Date(report.generatedAt).toLocaleDateString()} • {report.templateName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        report.status === 'completed' 
                          ? 'bg-success-500/20 text-success-300' 
                          : report.status === 'failed'
                          ? 'bg-error-500/20 text-error-300'
                          : 'bg-warning-500/20 text-warning-300'
                      }`}>
                        {report.status}
                      </span>
                      {report.fileUrl && (
                        <a 
                          href={report.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-white/10 rounded text-accent-400"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-glass-muted">
                <FileText className="h-12 w-12 mx-auto mb-4 text-white/20" />
                <p>No recent reports generated</p>
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Reports */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-glass-primary">Scheduled Reports</h2>
              <button 
                onClick={handleAddScheduledReport}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Add Scheduled Report"
              >
                <Plus className="h-4 w-4 text-white/70" />
              </button>
            </div>
            
            {scheduledLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-accent-400" />
              </div>
            ) : scheduledReports.length > 0 ? (
              <div className="space-y-4">
                {scheduledReports.slice(0, 5).map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Clock className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-glass-primary">{schedule.name}</p>
                        <p className="text-sm text-glass-muted">
                          Next run: {new Date(schedule.nextRun).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        schedule.isActive 
                          ? 'bg-success-500/20 text-success-300' 
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {schedule.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button 
                        onClick={() => handleViewScheduledReport(schedule.id)}
                        className="p-1 hover:bg-white/10 rounded text-white/60"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-glass-muted">
                <Clock className="h-12 w-12 mx-auto mb-4 text-white/20" />
                <p>No scheduled reports configured</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="card">
        <div className="card-body p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-glass-primary">Analytics Overview</h2>
            <span className="text-sm text-glass-muted">Last 30 days</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Reports Generated */}
            <div className="glass-subtle p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-glass-muted">Reports Generated</p>
                  <p className="text-2xl font-bold text-glass-primary">{recentReports.length}</p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              {recentReports.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-glass-muted">Based on recent activity</span>
                </div>
              )}
            </div>

            {/* Success Rate */}
            <div className="glass-subtle p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-glass-muted">Success Rate</p>
                  <p className="text-2xl font-bold text-glass-primary">
                    {recentReports.length > 0 
                      ? Math.round((recentReports.filter(r => r.status === 'completed').length / recentReports.length) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
              </div>
              {recentReports.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-glass-muted">Current period</span>
                </div>
              )}
            </div>

            {/* Scheduled Reports */}
            <div className="glass-subtle p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-glass-muted">Scheduled Reports</p>
                  <p className="text-2xl font-bold text-glass-primary">{scheduledReports.length}</p>
                </div>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xs text-glass-muted">
                  {scheduledReports.length > 0 ? `${scheduledReports.filter(sr => sr.isActive).length} active` : 'No schedules configured'}
                </span>
              </div>
            </div>

            {/* Downloads */}
            <div className="glass-subtle p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-glass-muted">Downloads</p>
                  <p className="text-2xl font-bold text-glass-primary">
                    {recentReports.filter(r => r.fileUrl).length}
                  </p>
                </div>
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Download className="h-5 w-5 text-orange-400" />
                </div>
              </div>
              {recentReports.filter(r => r.fileUrl).length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-glass-muted">Available for download</span>
                </div>
              )}
            </div>
          </div>

          {/* Report Types Chart */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-glass-primary mb-4">Report Types Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-sm text-glass-muted">Schedule Reports</p>
                <p className="text-lg font-semibold text-glass-primary">
                  {recentReports.filter(r => r.templateName.toLowerCase().includes('schedule')).length}
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-sm text-glass-muted">Performance Reports</p>
                <p className="text-lg font-semibold text-glass-primary">
                  {recentReports.filter(r => r.templateName.toLowerCase().includes('performance')).length}
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
                <p className="text-sm text-glass-muted">Analytics Reports</p>
                <p className="text-lg font-semibold text-glass-primary">
                  {recentReports.filter(r => r.templateName.toLowerCase().includes('analytics')).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Report Modal */}
      {showScheduleReportModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowScheduleReportModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-glass rounded-xl shadow-xl border border-white/20 w-full max-w-lg backdrop-filter backdrop-blur-md custom-scrollbar">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Schedule Automated Report</h3>
                </div>
                <button
                  onClick={() => setShowScheduleReportModal(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Report Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Weekly Performance Report"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-accent-500/50 focus:ring-accent-500/20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Report Type</label>
                  <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-accent-500/50 focus:ring-accent-500/20">
                    <option value="schedule">Schedule Report</option>
                    <option value="performance">Performance Report</option>
                    <option value="analytics">Analytics Report</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Frequency</label>
                  <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-accent-500/50 focus:ring-accent-500/20">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Recipients</label>
                  <input
                    type="email"
                    placeholder="emails separated by commas"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-accent-500/50 focus:ring-accent-500/20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Delivery Time</label>
                  <input
                    type="time"
                    defaultValue="08:00"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-accent-500/50 focus:ring-accent-500/20"
                  />
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium">Preview Schedule</p>
                      <p className="text-blue-300/80 mt-1">This report will be generated and sent automatically according to your schedule.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-white/10">
                <button
                  onClick={() => setShowScheduleReportModal(false)}
                  className="px-6 py-2 bg-white/10 border border-white/20 rounded-xl text-white/90 hover:bg-white/15 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowScheduleReportModal(false);
                    // Here you would normally create the scheduled report
                    console.log('Creating scheduled report...');
                  }}
                  className="px-6 py-2 bg-accent-500/20 border border-accent-500/30 rounded-xl text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md"
                >
                  Create Schedule
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;