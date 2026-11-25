'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation } from '@tanstack/react-query';
import { ticketAPI } from '../../lib/apiServices';
import Layout from '../../components/Layout';
import withAuth from '../../components/withAuth';
import toast from 'react-hot-toast';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../../lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function NewTicketPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', category: 'general', priority: 'medium', tags: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title || form.title.length < 5) e.title = 'Title must be at least 5 characters';
    if (!form.description || form.description.length < 10) e.description = 'Description must be at least 10 characters';
    if (!form.category) e.category = 'Category is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (data) => ticketAPI.create(data),
    onSuccess: (res) => {
      toast.success('Ticket created successfully!');
      router.push(`/tickets/${res.data.data.ticket._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create ticket'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/tickets" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
            <p className="text-gray-500 text-sm">Describe your issue and we&apos;ll help you resolve it.</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Brief summary of your issue"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={200}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              <p className="text-xs text-gray-400 mt-1">{form.title.length}/200</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                className={`input min-h-32 resize-y ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={2000}
                rows={5}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                <select
                  className="input capitalize"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="input capitalize"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-gray-400 font-normal">(optional, comma-separated)</span></label>
              <input
                className="input"
                placeholder="e.g. urgent, login, payment"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? 'Creating...' : 'Create Ticket'}
              </button>
              <Link href="/tickets" className="btn-secondary text-center flex-1">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(NewTicketPage);
