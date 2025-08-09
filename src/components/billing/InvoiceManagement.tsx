// Think Tank Technologies Installation Scheduler - Invoice Management Component
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Loading,
  Input
} from '../ui';
import { stripeService } from '../../services/stripeService';
import { formatPrice } from '../../config/subscriptionPlans';
import { Invoice } from '../../types';
import {
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface InvoiceManagementProps {
  organizationId: string;
  className?: string;
}

interface InvoiceFilters {
  status: 'all' | 'paid' | 'open' | 'void' | 'uncollectible';
  dateRange: '30d' | '90d' | '1y' | 'all';
  search: string;
}

const getInvoiceStatusIcon = (status: string) => {
  switch (status) {
    case 'paid':
      return CheckCircle;
    case 'open':
      return Clock;
    case 'void':
      return AlertCircle;
    case 'uncollectible':
      return AlertCircle;
    default:
      return FileText;
  }
};

const getInvoiceStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200'
      };
    case 'open':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200'
      };
    case 'void':
    case 'uncollectible':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200'
      };
  }
};

const InvoiceRow: React.FC<{
  invoice: Invoice;
  onDownload: (invoice: Invoice) => void;
  onViewDetails: (invoice: Invoice) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ invoice, onDownload, onViewDetails, isExpanded, onToggleExpand }) => {
  const StatusIcon = getInvoiceStatusIcon(invoice.status);
  const statusColors = getInvoiceStatusColor(invoice.status);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <StatusIcon className={`w-5 h-5 ${statusColors.text}`} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <Typography variant="body1" className="font-semibold">
                  Invoice #{invoice.stripeInvoiceId.slice(-8)}
                </Typography>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text} ${statusColors.border} border`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>{formatPrice(invoice.amountPaid > 0 ? invoice.amountPaid : invoice.amountDue)}</span>
                {invoice.paidAt && (
                  <>
                    <span>•</span>
                    <span>Paid {new Date(invoice.paidAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {invoice.hostedInvoiceUrl && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(invoice)}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload(invoice)}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              </>
            )}
            
            <button
              onClick={onToggleExpand}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-gray-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Typography variant="body2" className="text-gray-600 mb-1">
                Total Amount
              </Typography>
              <Typography variant="body1" className="font-semibold">
                {formatPrice(invoice.amountDue)}
              </Typography>
            </div>
            
            <div>
              <Typography variant="body2" className="text-gray-600 mb-1">
                Amount Paid
              </Typography>
              <Typography variant="body1" className="font-semibold">
                {formatPrice(invoice.amountPaid)}
              </Typography>
            </div>
            
            {invoice.amountRemaining > 0 && (
              <div>
                <Typography variant="body2" className="text-gray-600 mb-1">
                  Amount Due
                </Typography>
                <Typography variant="body1" className="font-semibold text-red-600">
                  {formatPrice(invoice.amountRemaining)}
                </Typography>
              </div>
            )}
            
            {invoice.dueDate && (
              <div>
                <Typography variant="body2" className="text-gray-600 mb-1">
                  Due Date
                </Typography>
                <Typography variant="body1" className="font-semibold">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </Typography>
              </div>
            )}
          </div>

          {/* Line Items */}
          {invoice.lineItems && invoice.lineItems.length > 0 && (
            <div>
              <Typography variant="body2" className="text-gray-600 mb-2 font-medium">
                Line Items
              </Typography>
              <div className="space-y-2">
                {invoice.lineItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-white p-3 rounded border">
                    <div>
                      <Typography variant="body2" className="font-medium">
                        {item.description}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        {new Date(item.period.start).toLocaleDateString()} - {new Date(item.period.end).toLocaleDateString()}
                        {item.quantity > 1 && ` • Qty: ${item.quantity}`}
                      </Typography>
                    </div>
                    <Typography variant="body2" className="font-semibold">
                      {formatPrice(item.amount)}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const InvoiceManagement: React.FC<InvoiceManagementProps> = ({
  organizationId,
  className = ''
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState<InvoiceFilters>({
    status: 'all',
    dateRange: '1y',
    search: ''
  });

  // Load invoices
  useEffect(() => {
    loadInvoices();
  }, [organizationId]);

  const loadInvoices = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      setLoading(true);
      const invoiceData = await stripeService.getInvoices(organizationId, 50);
      setInvoices(invoiceData);
      setError(null);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter invoices based on current filters
  const filteredInvoices = invoices.filter(invoice => {
    // Status filter
    if (filters.status !== 'all' && invoice.status !== filters.status) {
      return false;
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const invoiceDate = new Date(invoice.createdAt);
      const now = new Date();
      const daysAgo = {
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[filters.dateRange];

      if (daysAgo && invoiceDate < new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)) {
        return false;
      }
    }

    // Search filter
    if (filters.search && !invoice.stripeInvoiceId.toLowerCase().includes(filters.search.toLowerCase()) &&
        !invoice.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Calculate totals
  const totals = {
    total: filteredInvoices.length,
    paid: filteredInvoices.filter(inv => inv.status === 'paid').length,
    open: filteredInvoices.filter(inv => inv.status === 'open').length,
    totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0),
    outstandingAmount: filteredInvoices.reduce((sum, inv) => sum + inv.amountRemaining, 0)
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.hostedInvoiceUrl) {
      window.open(invoice.hostedInvoiceUrl, '_blank');
    }
  };

  const handleViewInvoiceDetails = (invoice: Invoice) => {
    if (invoice.hostedInvoiceUrl) {
      window.open(invoice.hostedInvoiceUrl, '_blank');
    }
  };

  const toggleInvoiceExpansion = (invoiceId: string) => {
    setExpandedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const exportInvoices = () => {
    const csvContent = [
      ['Invoice ID', 'Status', 'Amount', 'Paid Date', 'Period Start', 'Period End'],
      ...filteredInvoices.map(invoice => [
        invoice.stripeInvoiceId,
        invoice.status,
        invoice.amountPaid / 100,
        invoice.paidAt || '',
        invoice.periodStart,
        invoice.periodEnd
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${organizationId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Typography variant="h2" className="text-2xl font-bold">
            Invoice Management
          </Typography>
          <Typography variant="body2" className="text-gray-600">
            View and download your billing history
          </Typography>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadInvoices(true)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportInvoices}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3 p-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <Typography variant="body1" className="text-red-800 font-medium">
                Error
              </Typography>
              <Typography variant="body2" className="text-red-700">
                {error}
              </Typography>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadInvoices()}
              className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <Typography variant="body2" className="text-gray-600 font-medium">
              Total Invoices
            </Typography>
          </div>
          <Typography variant="h3" className="text-2xl font-bold">
            {totals.total}
          </Typography>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <Typography variant="body2" className="text-gray-600 font-medium">
              Paid Invoices
            </Typography>
          </div>
          <Typography variant="h3" className="text-2xl font-bold">
            {totals.paid}
          </Typography>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <Typography variant="body2" className="text-gray-600 font-medium">
              Total Paid
            </Typography>
          </div>
          <Typography variant="h3" className="text-2xl font-bold">
            {formatPrice(totals.totalAmount)}
          </Typography>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <Typography variant="body2" className="text-gray-600 font-medium">
              Outstanding
            </Typography>
          </div>
          <Typography variant="h3" className="text-2xl font-bold">
            {formatPrice(totals.outstandingAmount)}
          </Typography>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <Typography variant="body2" className="font-medium mb-2">
              Search
            </Typography>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <Typography variant="body2" className="font-medium mb-2">
              Status
            </Typography>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="open">Open</option>
              <option value="void">Void</option>
              <option value="uncollectible">Uncollectible</option>
            </select>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <Typography variant="body2" className="font-medium mb-2">
              Date Range
            </Typography>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Typography variant="h3" className="font-semibold mb-2">
              No invoices found
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              {filters.status !== 'all' || filters.search || filters.dateRange !== 'all'
                ? 'No invoices match your current filters.'
                : 'You haven\'t received any invoices yet.'
              }
            </Typography>
          </Card>
        ) : (
          filteredInvoices.map(invoice => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              onDownload={handleDownloadInvoice}
              onViewDetails={handleViewInvoiceDetails}
              isExpanded={expandedInvoices.has(invoice.id)}
              onToggleExpand={() => toggleInvoiceExpansion(invoice.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default InvoiceManagement;