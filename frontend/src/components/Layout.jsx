'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  TicketIcon, LayoutDashboard, LogOut, User,
  Bell, Menu, X, Settings, Users, Activity
} from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const isAdmin = user?.role === 'admin';

  const navItems = isAdmin
    ? [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/tickets', label: 'All Tickets', icon: TicketIcon },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/activity', label: 'Activity Log', icon: Activity },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/tickets', label: 'My Tickets', icon: TicketIcon },
        { href: '/tickets/new', label: 'New Ticket', icon: TicketIcon },
        { href: '/activity', label: 'Activity', icon: Activity },
      ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TicketIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">HelpDesk</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isExact = router.pathname === href;
              const isSub =
                href !== '/admin' &&
                href !== '/tickets' &&
                router.pathname.startsWith(href + '/');
              const isActive = isExact || isSub;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <User className="w-4 h-4" /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  User
                </span>
              )}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
