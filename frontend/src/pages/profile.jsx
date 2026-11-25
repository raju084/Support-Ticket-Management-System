'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../lib/apiServices';
import Layout from '../components/Layout';
import withAuth from '../components/withAuth';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Calendar } from 'lucide-react';
import { formatDate } from '../lib/utils';

function ProfilePage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});

  const updateProfileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data.data.user);
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const validatePw = () => {
    const e = {};
    if (!pwForm.currentPassword) e.currentPassword = 'Required';
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) e.newPassword = 'At least 6 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

        {/* Profile info */}
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <span className={`badge mt-1 ${user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                {user?.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {user?.email}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Joined {formatDate(user?.createdAt)}
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(nameForm); }} className="pt-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><User className="w-4 h-4" /> Update Name</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                className="input"
                value={nameForm.name}
                onChange={(e) => setNameForm({ name: e.target.value })}
                minLength={2}
                required
              />
            </div>
            <button type="submit" disabled={updateProfileMutation.isPending} className="btn-primary">
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Lock className="w-4 h-4" /> Change Password</h3>
          <form onSubmit={(e) => { e.preventDefault(); if (validatePw()) changePasswordMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }); }} className="space-y-4">
            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword', label: 'New Password' },
              { key: 'confirmPassword', label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="password"
                  className={`input ${pwErrors[key] ? 'border-red-500' : ''}`}
                  value={pwForm[key]}
                  onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                />
                {pwErrors[key] && <p className="text-red-500 text-xs mt-1">{pwErrors[key]}</p>}
              </div>
            ))}
            <button type="submit" disabled={changePasswordMutation.isPending} className="btn-primary">
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(ProfilePage);
