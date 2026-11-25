'use client';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../lib/apiServices';
import Layout from '../../components/Layout';
import withAuth from '../../components/withAuth';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import Spinner from '../../components/Spinner';
import Link from 'next/link';
import {
  TicketIcon, Users, CheckCircle, Clock, AlertTriangle, TrendingUp, Activity
} from 'lucide-react';
import { timeAgo } from '../../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminAPI.getDashboard(),
  });

  const dashboard = data?.data?.data;

  if (isLoading) return <Layout><Spinner size="lg" className="mt-16" /></Layout>;

  const { summary, recentTickets = [], ticketsByCategory = [], ticketsByPriority = [], ticketsOverTime = [] } = dashboard || {};

  const statCards = [
    { label: 'Total Tickets', value: summary?.totalTickets, icon: TicketIcon, iconBg: 'bg-blue-100', iconText: 'text-blue-600', link: '/admin/tickets' },
    { label: 'Open Tickets', value: summary?.openTickets, icon: AlertTriangle, iconBg: 'bg-orange-100', iconText: 'text-orange-600', link: '/admin/tickets?status=open' },
    { label: 'In Progress', value: summary?.inProgressTickets, icon: TrendingUp, iconBg: 'bg-yellow-100', iconText: 'text-yellow-600', link: '/admin/tickets?status=in-progress' },
    { label: 'Resolved', value: summary?.resolvedTickets, icon: CheckCircle, iconBg: 'bg-green-100', iconText: 'text-green-600', link: '/admin/tickets?status=resolved' },
    { label: 'Total Users', value: summary?.totalUsers, icon: Users, iconBg: 'bg-purple-100', iconText: 'text-purple-600', link: '/admin/users' },
    { label: 'Critical', value: summary?.criticalTickets, icon: AlertTriangle, iconBg: 'bg-red-100', iconText: 'text-red-600', link: '/admin/tickets?priority=critical' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of all support tickets and system activity.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, iconBg, iconText, link }) => (
            <Link href={link} key={label} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconText}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Category chart */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Tickets by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ticketsByCategory.map(c => ({ name: c._id, count: c.count }))}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Priority pie */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ticketsByPriority.map(p => ({ name: p._id, value: p.count }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {ticketsByPriority.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Volume over time */}
          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Ticket Volume (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={ticketsOverTime.map(t => ({ date: t._id, count: t.count }))}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Tickets</h3>
            <Link href="/admin/tickets" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket._id}
                href={`/tickets/${ticket._id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ticket.createdBy?.name} · {timeAgo(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(AdminDashboard, 'admin');
