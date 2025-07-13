'use client';

import { useState, useEffect } from 'react';
import { LeadRecord, api } from '../utils/api';
import { ArrowUpDown, Filter, Search, TrendingUp, TrendingDown } from 'lucide-react';

interface LeadsTableProps {
  refreshTrigger: number;
}

export default function LeadsTable({ refreshTrigger }: LeadsTableProps) {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof LeadRecord>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntent, setFilterIntent] = useState<string>('all');

  useEffect(() => {
    loadLeads();
  }, [refreshTrigger]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await api.getLeads();
      setLeads(data);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof LeadRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-very-high';
    if (score >= 60) return 'score-high';
    if (score >= 40) return 'score-medium';
    if (score >= 20) return 'score-low';
    return 'score-very-low';
  };

  const getIntentClass = (intent: string) => {
    switch (intent) {
      case 'Very High': return 'score-very-high';
      case 'High': return 'score-high';
      case 'Medium': return 'score-medium';
      case 'Low': return 'score-low';
      case 'Very Low': return 'score-very-low';
      default: return 'score-medium';
    }
  };

  // Helper to get avatar initials
  const getInitials = (email: string) => {
    const [name] = email.split('@');
    return name.slice(0, 2).toUpperCase();
  };
  // Helper to get intent dot and border class
  const getIntentDotClass = (intent: string) => {
    switch (intent) {
      case 'Very High': return 'intent-dot intent-dot-very-high';
      case 'High': return 'intent-dot intent-dot-high';
      case 'Medium': return 'intent-dot intent-dot-medium';
      case 'Low': return 'intent-dot intent-dot-low';
      case 'Very Low': return 'intent-dot intent-dot-very-low';
      default: return 'intent-dot intent-dot-medium';
    }
  };
  const getIntentBorderClass = (intent: string) => {
    switch (intent) {
      case 'Very High': return 'intent-border-very-high';
      case 'High': return 'intent-border-high';
      case 'Medium': return 'intent-border-medium';
      case 'Low': return 'intent-border-low';
      case 'Very Low': return 'intent-border-very-low';
      default: return 'intent-border-medium';
    }
  };
  // Helper to get intent icon
  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'Very High': return '⬆️';
      case 'High': return '🔼';
      case 'Medium': return '➖';
      case 'Low': return '⚠️';
      case 'Very Low': return '⛔';
      default: return '';
    }
  };

  const filteredAndSortedLeads = leads
    .filter(lead => {
      const matchesSearch = 
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.comments.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterIntent === 'all' || lead.intent_level === filterIntent;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle timestamp sorting
      if (sortField === 'timestamp') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-animate">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Scored Leads</h2>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
          />
        </div>
        <select
          value={filterIntent}
          onChange={(e) => setFilterIntent(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto"
        >
          <option value="all">All Intent Levels</option>
          <option value="Very High">Very High</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
          <option value="Very Low">Very Low</option>
        </select>
        <button
          onClick={loadLeads}
          className="btn-secondary flex items-center gap-2 px-3 py-2 whitespace-nowrap"
          style={{minWidth: 'auto'}}
        >
          <Filter className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {filteredAndSortedLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <svg width="64" height="64" fill="none" viewBox="0 0 24 24" className="mb-4"><path stroke="currentColor" strokeWidth="1.5" d="M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8Zm0-4v-4m0 0V8m0 4h4m-4 0H8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {leads.length === 0 ? 'No leads scored yet.' : 'No leads match your search criteria.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-zebra">
            <thead className="table-header-sticky">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider rounded-tl-lg">Contact</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('initial_score')}
                >
                  <div className="flex items-center gap-1">
                    Initial Score
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('reranked_score')}
                >
                  <div className="flex items-center gap-1">
                    Final Score
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('intent_level')}
                >
                  <div className="flex items-center gap-1">
                    Intent Level
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider rounded-tr-lg">Comments</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-1">
                    Scored At
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedLeads.map((lead) => (
                <tr key={lead.id} className={`row-hover ${getIntentBorderClass(lead.intent_level)} transition-shadow duration-200`} style={{height: '64px'}}>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center">
                    <div className="avatar-circle">{getInitials(lead.email)}</div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{lead.email}</div>
                      <div className="text-xs text-gray-400">{lead.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`score-badge badge-pill ${getScoreClass(lead.initial_score)}`}>
                      {lead.initial_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`score-badge badge-pill ${getScoreClass(lead.reranked_score)}`}>
                      {lead.reranked_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getIntentDotClass(lead.intent_level)}></span>
                    <span className={`score-badge badge-pill ${getIntentClass(lead.intent_level)}`}>{getIntentIcon(lead.intent_level)} {lead.intent_level}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={lead.comments}>
                      {lead.comments || 'No comments'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                    {formatDate(lead.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredAndSortedLeads.length} of {leads.length} leads
      </div>
    </div>
  );
} 