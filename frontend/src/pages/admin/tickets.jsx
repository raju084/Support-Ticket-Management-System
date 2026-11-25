'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminAPI } from '../../lib/apiServices';
import Layout from '../../components/Layout';
import withAuth from '../../components/withAuth';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { timeAgo, STATUS_OPTIONS, PRIORITY_OPTIONS, CATEGORY_OPTIONS } from '../../lib/utils';

function AdminTickets() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    page: 1, limit: 15, search: '', status: '', priority: '', category: '', sortBy: 'createdAt', sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const { status = '', priority = '', category = '' } = router.query;
    setFilters((f) => ({
      ...f,
      status: typeof status === 'string' ? status : '',
      priority: typeof priority === 'string' ? priority : '',
      category: typeof category === 'string' ? category : '',
      page: 1,
    }));
  }, [router.isReady, router.query]);

  const { data, isLoading } = useQuery({
    queryKey: ['adminTickets', filters],
    queryFn: () => adminAPI.getAllTickets(filters),
    placeholderData: keepPreviousData,
  });

  const tickets = data?.data?.data?.tickets || [];
  const pagination = data?.data?.data?.pagination || {};

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateStatus(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries(['adminTickets']); toast.success('Status updated'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const priorityMutation = useMutation({
    mutationFn: ({ id, priority }) => adminAPI.updatePriority(id, { priority }),
    onSuccess: () => { queryClient.invalidateQueries(['adminTickets']); toast.success('Priority updated'); },
  });

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>
          <p className="text-gray-500 mt-1">Manage and respond to all support tickets.</p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2 flex-1 min-w-48">
              <input
                className="input flex-1"
                placeholder="Search tickets..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setFilter('search', searchInput)}
              />
              <button onClick={() => setFilter('search', searchInput)} className="btn-secondary px-3">
                <Search className="w-4 h-4" />
              </button>
            </div>
            {[
              { key: 'status', options: STATUS_OPTIONS, label: 'Status' },
              { key: 'priority', options: PRIORITY_OPTIONS, label: 'Priority' },
              { key: 'category', options: CATEGORY_OPTIONS, label: 'Category' },
            ].map(({ key, options, label }) => (
              <select key={key} className="input w-auto" value={filters[key]} onChange={(e) => setFilter(key, e.target.value)}>
                <option value="">All {label}s</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {isLoading ? <Spinner className="py-16" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Title', 'User', 'Category', 'Priority', 'Status', 'Created', 'Actions'].map(h => (
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
                      <td className="px-4 py-3 text-gray-600">{ticket.createdBy?.name}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{ticket.category}</td>
                      <td className="px-4 py-3">
                        <select
                          className="text-xs border border-gray-200 rounded px-1 py-0.5"
                          value={ticket.priority}
                          onChange={(e) => priorityMutation.mutate({ id: ticket._id, priority: e.target.value })}
                        >
                          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="text-xs border border-gray-200 rounded px-1 py-0.5"
                          value={ticket.status}
                          onChange={(e) => statusMutation.mutate({ id: ticket._id, status: e.target.value })}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{timeAgo(ticket.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/tickets/${ticket._id}`} className="text-blue-600 hover:underline font-medium flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {tickets.length === 0 && (
                <div className="text-center py-16 text-gray-500">No tickets found</div>
              )}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages} ({pagination.total} tickets)</p>
              <div className="flex gap-2">
                <button disabled={!pagination.hasPrevPage} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="btn-secondary py-1 px-2 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={!pagination.hasNextPage} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="btn-secondary py-1 px-2 disabled:opacity-40">
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

export default withAuth(AdminTickets, 'admin');
