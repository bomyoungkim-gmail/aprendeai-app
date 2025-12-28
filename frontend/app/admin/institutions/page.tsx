'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Plus, Edit2, Trash2, Mail, X } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  country?: string;
  maxMembers?: number;
  createdAt: string;
  _count: {
    members: number;
    domains: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const INSTITUTION_TYPES = ['SCHOOL', 'UNIVERSITY', 'COMPANY', 'OTHER'];

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Modals State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  
  // Form States
  const [inviteEmail, setInviteEmail] = useState('');
  const [processing, setProcessing] = useState(false);

  // Create/Edit Form Data
  const [formData, setFormData] = useState({
    name: '',
    type: 'SCHOOL',
    city: '',
    state: '',
    maxMembers: 0, // 0 means unlimited/undefined for UI logic, we'll send undefined/null
  });

  useEffect(() => {
    fetchInstitutions();
  }, [page, search]);

  const fetchInstitutions = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });

      const res = await api.get(`${API_BASE_URL}/admin/institutions`, { params });
      
      if (res.status === 200) {
        setInstitutions(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch institutions:', error);
      toast.error('Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInstitutions();
  };

  // --- Actions ---

  const handleDelete = async (inst: Institution) => {
    if (!window.confirm(`Are you sure you want to delete "${inst.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`${API_BASE_URL}/institutions/${inst.id}`);
      toast.success('Institution deleted successfully');
      fetchInstitutions();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete institution');
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      type: 'SCHOOL',
      city: '',
      state: '',
      maxMembers: 0,
    });
    setCreateModalOpen(true);
  };

  const openEditModal = (inst: Institution) => {
    setSelectedInstitution(inst);
    setFormData({
      name: inst.name,
      type: inst.type,
      city: inst.city,
      state: inst.state,
      maxMembers: inst.maxMembers || 0,
    });
    setEditModalOpen(true);
  };

  const openInviteModal = (inst: Institution) => {
    setSelectedInstitution(inst);
    setInviteEmail('');
    setInviteModalOpen(true);
  };

  // --- Submits ---

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const payload: any = { ...formData };
      if (payload.maxMembers <= 0) delete payload.maxMembers; // Handle "unlimited" logic if needed

      await api.post(`${API_BASE_URL}/institutions`, payload);
      toast.success('Institution created successfully');
      setCreateModalOpen(false);
      fetchInstitutions();
    } catch (error: any) {
      console.error('Create failed:', error);
      toast.error(error.response?.data?.message || 'Failed to create institution');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution) return;
    setProcessing(true);
    try {
      const payload: any = {
        name: formData.name,
        type: formData.type,
        city: formData.city,
        state: formData.state,
        maxMembers: formData.maxMembers > 0 ? Number(formData.maxMembers) : null,
      };

      await api.patch(`${API_BASE_URL}/institutions/${selectedInstitution.id}`, payload);
      toast.success('Institution updated successfully');
      setEditModalOpen(false);
      fetchInstitutions();
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update institution');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution || !inviteEmail) return;

    setProcessing(true);
    try {
      const res = await api.post(`${API_BASE_URL}/institutions/${selectedInstitution.id}/invites`, {
        email: inviteEmail,
        role: 'INSTITUTION_ADMIN',
      });

      if (res.status === 201) {
        toast.success(`Invite sent to ${inviteEmail}`);
        setInviteModalOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to invite:', error);
      toast.error(error.response?.data?.message || 'Failed to send invite');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Institutions</h1>
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Institutions</h1>
          <p className="text-gray-600 mt-1">Manage institutions and their limits</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Institution
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or state..."
            className="flex-1 rounded-md border-gray-300 shadow-sm px-4 py-2 border"
          />
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-semibold">
            Search
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members (Max)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domains</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {institutions.map((inst) => (
              <tr key={inst.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{inst.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{inst.type}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {inst.city}{inst.state ? `, ${inst.state}` : ''}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {inst._count.members} / {inst.maxMembers || '∞'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{inst._count.domains}</td>
                <td className="px-6 py-4 text-sm text-gray-500 space-x-2">
                   <button onClick={() => openInviteModal(inst)} title="Invite Admin" className="text-gray-600 hover:text-indigo-600">
                     <Mail className="h-5 w-5" />
                   </button>
                   <button onClick={() => openEditModal(inst)} title="Edit" className="text-gray-600 hover:text-blue-600">
                     <Edit2 className="h-5 w-5" />
                   </button>
                   <button onClick={() => handleDelete(inst)} title="Delete" className="text-gray-600 hover:text-red-600">
                     <Trash2 className="h-5 w-5" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination Logic (Simple) */}
        {pagination && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded text-sm disabled:opacity-50">Previous</button>
                    <span className="text-sm text-gray-700 self-center">Page {page} of {pagination.totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="px-4 py-2 border rounded text-sm disabled:opacity-50">Next</button>
                </div>
            </div>
        )}
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Institution</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input required className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium">Type</label>
                <select className="w-full border rounded p-2" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="block text-sm font-medium">City</label>
                    <input className="w-full border rounded p-2" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium">State</label>
                    <input className="w-full border rounded p-2" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Max Members (0 for unlimited)</label>
                <input type="number" className="w-full border rounded p-2" value={formData.maxMembers} onChange={e => setFormData({...formData, maxMembers: Number(e.target.value)})} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedInstitution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <h2 className="text-xl font-bold mb-4">Edit Institution</h2>
             <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium">Name</label>
                   <input required className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium">Type</label>
                   <select className="w-full border rounded p-2" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <label className="block text-sm font-medium">City</label>
                      <input className="w-full border rounded p-2" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium">State</label>
                      <input className="w-full border rounded p-2" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium">Max Members (0 for unlimited)</label>
                   <input type="number" className="w-full border rounded p-2" value={formData.maxMembers} onChange={e => setFormData({...formData, maxMembers: Number(e.target.value)})} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                   <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                   <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Save Changes</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && selectedInstitution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h2 className="text-lg font-bold mb-2">Invite Admin</h2>
              <p className="text-sm text-gray-600 mb-4">Invite an administrator for {selectedInstitution.name}</p>
              <form onSubmit={handleSendInvite}>
                 <input 
                    type="email" 
                    required 
                    placeholder="Email address"
                    className="w-full border rounded p-2 mb-4"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                 />
                 <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setInviteModalOpen(false)} className="px-3 py-2 border rounded text-sm">Cancel</button>
                    <button type="submit" disabled={processing} className="px-3 py-2 bg-indigo-600 text-white rounded text-sm disabled:opacity-50">Send Invite</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
