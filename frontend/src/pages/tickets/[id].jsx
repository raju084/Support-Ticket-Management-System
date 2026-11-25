'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketAPI, commentAPI, activityAPI } from '../../lib/apiServices';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import withAuth from '../../components/withAuth';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Trash2, Edit2, MessageSquare, Send,
  Clock, User, Tag, AlertCircle, Lock
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, timeAgo, STATUS_OPTIONS, PRIORITY_OPTIONS, CATEGORY_OPTIONS } from '../../lib/utils';

function TicketDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketAPI.getById(id),
    enabled: !!id,
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentAPI.getAll(id),
    enabled: !!id,
  });

  const { data: activityData } = useQuery({
    queryKey: ['ticketActivity', id],
    queryFn: () => activityAPI.getByTicket(id),
    enabled: !!id && isAdmin,
  });

  const ticket = data?.data?.data?.ticket;
  const comments = commentsData?.data?.data?.comments || [];
  const activities = activityData?.data?.data?.activities || [];

  const updateMutation = useMutation({
    mutationFn: (data) => ticketAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      toast.success('Ticket updated');
      setEditing(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => ticketAPI.delete(id),
    onSuccess: () => {
      toast.success('Ticket deleted');
      router.push('/tickets');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => commentAPI.add(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', id]);
      setComment('');
      toast.success('Comment added');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add comment'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => commentAPI.delete(id, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', id]);
      toast.success('Comment deleted');
    },
  });

  if (isLoading) return <Layout><Spinner size="lg" className="mt-16" /></Layout>;
  if (!ticket) return <Layout><div className="text-center py-16 text-gray-500">Ticket not found</div></Layout>;

  const currentUserId = user?._id || user?.id;
  const ticketOwnerId = ticket.createdBy?._id || ticket.createdBy?.id;
  const isOwner = Boolean(currentUserId && ticketOwnerId === currentUserId);
  const canEdit = isOwner || isAdmin;
  const canDelete = (isOwner && ticket.status === 'open') || isAdmin;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={isAdmin ? '/admin/tickets' : '/tickets'} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <p className="text-sm text-gray-500">Ticket Details</p>
              <h1 className="text-xl font-bold text-gray-900 mt-0.5">{ticket.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && !editing && (
              <button
                onClick={() => { setEditing(true); setEditForm({ title: ticket.title, description: ticket.description, category: ticket.category }); }}
                className="btn-secondary flex items-center gap-2 py-1.5 px-3"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => { if (confirm('Delete this ticket?')) deleteMutation.mutate(); }}
                className="btn-danger flex items-center gap-2 py-1.5 px-3"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket body */}
            <div className="card">
              {editing ? (
                <div className="space-y-4">
                  <input
                    className="input text-lg font-semibold"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                  <textarea
                    className="input min-h-32"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={5}
                  />
                  <select className="input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-3">
                    <button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending} className="btn-primary">Save</button>
                    <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                  {ticket.tags?.length > 0 && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {ticket.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          <Tag className="w-3 h-3" /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Comments */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
              </h2>

              {commentsLoading ? <Spinner /> : comments.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">No comments yet. Be the first to respond!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c._id} className={`flex gap-3 ${c.isInternal ? 'opacity-80' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                        {c.author?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">{c.author?.name}</span>
                          <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                          {c.isInternal && (
                            <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              <Lock className="w-3 h-3" /> Internal
                            </span>
                          )}
                          {c.author?.role === 'admin' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                          {c.content}
                        </div>
                        {(c.author?._id === currentUserId || c.author?.id === currentUserId || isAdmin) && (
                          <button
                            onClick={() => deleteCommentMutation.mutate(c._id)}
                            className="text-xs text-red-500 hover:text-red-700 mt-1"
                          >Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment */}
              {ticket.status !== 'closed' && (
                <div className="pt-4 border-t border-gray-100">
                  <textarea
                    className="input min-h-20"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-2">
                    {isAdmin && (
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
                        <Lock className="w-4 h-4" /> Internal note
                      </label>
                    )}
                    <div className="ml-auto">
                      <button
                        disabled={!comment.trim() || addCommentMutation.isPending}
                        onClick={() => addCommentMutation.mutate({ content: comment, isInternal })}
                        className="btn-primary flex items-center gap-2 py-1.5"
                      >
                        <Send className="w-4 h-4" />
                        {addCommentMutation.isPending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Ticket meta */}
            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-900">Details</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  {isAdmin ? (
                    <select
                      className="input py-1 text-xs"
                      value={ticket.status}
                      onChange={(e) => updateMutation.mutate({ status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : <StatusBadge status={ticket.status} />}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Priority</span>
                  {isAdmin ? (
                    <select
                      className="input py-1 text-xs"
                      value={ticket.priority}
                      onChange={(e) => updateMutation.mutate({ priority: e.target.value })}
                    >
                      {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : <PriorityBadge priority={ticket.priority} />}
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="capitalize font-medium">{ticket.category}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Created by</span>
                  <span className="font-medium">{ticket.createdBy?.name}</span>
                </div>

                {ticket.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned to</span>
                    <span className="font-medium">{ticket.assignedTo?.name}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-700">{timeAgo(ticket.createdAt)}</span>
                </div>

                {ticket.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Resolved</span>
                    <span className="text-green-600">{timeAgo(ticket.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status History */}
            {ticket.statusHistory?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Status History</h3>
                <div className="space-y-2">
                  {ticket.statusHistory.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0" />
                      <div>
                        <StatusBadge status={h.status} />
                        {h.note && <p className="text-gray-500 mt-0.5">{h.note}</p>}
                        <p className="text-gray-400">{timeAgo(h.changedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Log (admin only) */}
            {isAdmin && activities.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Activity Log</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activities.map((a) => (
                    <div key={a._id} className="text-xs text-gray-600 py-1 border-b border-gray-50 last:border-0">
                      <span className="font-medium">{a.actor?.name}</span>: {a.description}
                      <p className="text-gray-400">{timeAgo(a.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(TicketDetail);
