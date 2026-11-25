'use client';
import { useQuery } from '@tanstack/react-query';
import { activityAPI } from '../../lib/apiServices';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import withAuth from '../../components/withAuth';
import Spinner from '../../components/Spinner';
import { timeAgo } from '../../lib/utils';
import { Activity } from 'lucide-react';
import Link from 'next/link';

const EVENT_COLORS = {
  TICKET_CREATED: 'bg-blue-100 text-blue-800',
  TICKET_UPDATED: 'bg-yellow-100 text-yellow-800',
  TICKET_DELETED: 'bg-red-100 text-red-800',
  STATUS_CHANGED: 'bg-purple-100 text-purple-800',
  PRIORITY_CHANGED: 'bg-orange-100 text-orange-800',
  COMMENT_ADDED: 'bg-green-100 text-green-800',
  TICKET_RESOLVED: 'bg-emerald-100 text-emerald-800',
  TICKET_CLOSED: 'bg-gray-100 text-gray-800',
  USER_REGISTERED: 'bg-indigo-100 text-indigo-800',
};

function ActivityPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityAPI.getAll({ limit: 50 }),
  });

  const activities = data?.data?.data?.activities || [];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-500 mt-1">{isAdmin ? 'All system activity' : 'Your activity history'}</p>
        </div>

        <div className="card">
          {isLoading ? <Spinner className="py-16" /> : activities.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No activity yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((a) => (
                <div key={a._id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`badge text-xs mb-1 ${EVENT_COLORS[a.event] || 'bg-gray-100 text-gray-700'}`}>
                          {a.event?.replace(/_/g, ' ')}
                        </span>
                        <p className="text-sm text-gray-700">{a.description}</p>
                        {a.ticket && (
                          <Link href={`/tickets/${a.ticket._id}`} className="text-xs text-blue-600 hover:underline mt-0.5 inline-block">
                            {a.ticket.title}
                          </Link>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{timeAgo(a.createdAt)}</span>
                    </div>
                    {isAdmin && a.actor && (
                      <p className="text-xs text-gray-400 mt-1">By: {a.actor.name} ({a.actor.role})</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(ActivityPage);
