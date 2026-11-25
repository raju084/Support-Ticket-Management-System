'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminAPI } from '../../lib/apiServices';
import Layout from '../../components/Layout';
import withAuth from '../../components/withAuth';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';
import { Search, UserCheck, UserX, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../../lib/utils';

function AdminUsers() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, limit: 15, role: '', search: '' });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', filters],
    queryFn: () => adminAPI.getAllUsers(filters),
    placeholderData: keepPreviousData,
  });

  const users = data?.data?.data?.users || [];
  const pagination = data?.data?.data?.pagination || {};

  const toggleMutation = useMutation({
    mutationFn: (id) => adminAPI.toggleUserStatus(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success(res.data.message);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage all registered users.</p>
        </div>

        <div className="card">
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2 flex-1">
              <input
                className="input flex-1"
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setFilters(f => ({ ...f, search: searchInput, page: 1 }))}
              />
              <button onClick={() => setFilters(f => ({ ...f, search: searchInput, page: 1 }))} className="btn-secondary px-3">
                <Search className="w-4 h-4" />
              </button>
            </div>
            <select className="input w-auto" value={filters.role} onChange={(e) => setFilters(f => ({ ...f, role: e.target.value, page: 1 }))}>
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          {isLoading ? <Spinner className="py-16" /> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {u.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleMutation.mutate(u._id)}
                          disabled={toggleMutation.isPending}
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                            u.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {u.isActive ? <><UserX className="w-3 h-3" /> Deactivate</> : <><UserCheck className="w-3 h-3" /> Activate</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
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

export default withAuth(AdminUsers, 'admin');
