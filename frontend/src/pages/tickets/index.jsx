'use client';
import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ticketAPI } from '../../lib/apiServices';
import Layout from '../../components/Layout';
import withAuth from '../../components/withAuth';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import Spinner from '../../components/Spinner';
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { timeAgo, STATUS_OPTIONS, PRIORITY_OPTIONS, CATEGORY_OPTIONS } from '../../lib/utils';

function TicketsPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', status: '', priority: '', category: '', sortBy: 'createdAt', sortOrder: 'desc' });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['myTickets', filters],
    queryFn: () => ticketAPI.getAll(filters),
    placeholderData: keepPreviousData,
  });

  const tickets = data?.data?.data?.tickets || [];
  const pagination = data?.data?.data?.pagination || {};

  const handleSearch = () => setFilters(f => ({ ...f, search: searchInput, page: 1 }));
  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <Link href="/tickets/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Ticket
          </Link>
        </div>

        {/* Filters */}
        <div className="card space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 flex gap-2">
              <input
                className="input flex-1"
                placeholder="Search tickets..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="btn-secondary px-3">
                <Search className="w-4 h-4" />
              </button>
            </div>
            {[
              { key: 'status', options: STATUS_OPTIONS, label: 'Status' },
              { key: 'priority', options: PRIORITY_OPTIONS, label: 'Priority' },
              { key: 'category', options: CATEGORY_OPTIONS, label: 'Category' },
            ].map(({ key, options, label }) => (
              <select
                key={key}
                className="input w-auto"
                value={filters[key]}
                onChange={(e) => setFilter(key, e.target.value)}
              >
                <option value="">All {label}s</option>
                {options.map((o) => <option key={o} value={o} className="capitalize">{o}</option>)}
              </select>
            ))}
            <select
              className="input w-auto"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(f => ({ ...f, sortBy, sortOrder, page: 1 }));
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="priority-desc">Priority ↓</option>
              <option value="updatedAt-desc">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {isLoading ? (
            <Spinner className="py-16" />
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium mb-1">No tickets found</p>
              <p className="text-sm">Try adjusting your filters or create a new ticket.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Title', 'Category', 'Priority', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 max-w-xs truncate">{ticket.title}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{ticket.category}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                      <td className="px-4 py-3 text-gray-500">{timeAgo(ticket.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/tickets/${ticket._id}`} className="text-blue-600 hover:underline font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} tickets)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  className="btn-secondary py-1 px-2 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  className="btn-secondary py-1 px-2 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(TicketsPage);
