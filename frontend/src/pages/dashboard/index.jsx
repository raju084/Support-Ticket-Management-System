'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { ticketAPI } from '../../lib/apiServices';
import Layout from '../../components/Layout';
import withAuth from '../../components/withAuth';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import Spinner from '../../components/Spinner';
import { Plus, Ticket, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { timeAgo } from '../../lib/utils';

function Dashboard() {
  const { user } = useAuth();

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['myTickets'],
    queryFn: () => ticketAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['myStats'],
    queryFn: () => ticketAPI.getMyStats(),
  });

  const tickets = ticketsData?.data?.data?.tickets || [];
  const statusStats = statsData?.data?.data?.statusStats || [];
  const totalTickets = statusStats.reduce((sum, s) => sum + s.count, 0);

  const getCount = (status) => statusStats.find((s) => s._id === status)?.count || 0;

  const statCards = [
    { label: 'Total Tickets', value: totalTickets, icon: Ticket, iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
    { label: 'Open', value: getCount('open'), icon: AlertCircle, iconBg: 'bg-orange-100', iconText: 'text-orange-600' },
    { label: 'In Progress', value: getCount('in-progress'), icon: TrendingUp, iconBg: 'bg-yellow-100', iconText: 'text-yellow-600' },
    { label: 'Resolved', value: getCount('resolved'), icon: CheckCircle, iconBg: 'bg-green-100', iconText: 'text-green-600' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-gray-500 mt-1">Here&apos;s a summary of your support tickets.</p>
          </div>
          <Link href="/tickets/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Ticket
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, iconBg, iconText }) => (
            <div key={label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconText}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Tickets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
            <Link href="/tickets" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>

          {isLoading ? (
            <Spinner className="py-8" />
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tickets yet.</p>
              <Link href="/tickets/new" className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create your first ticket
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Link
                  key={ticket._id}
                  href={`/tickets/${ticket._id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{timeAgo(ticket.createdAt)} · {ticket.category}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Dashboard);
