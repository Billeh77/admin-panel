'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Domain = {
  id: number;
  created_datetime_utc: string;
  apex_domain: string;
  user_count: number;
};

type Props = {
  domains: Domain[];
};

export function AllowedDomainsTable({ domains }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDomain, setEditDomain] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEdit = (domain: Domain) => {
    setEditingId(domain.id);
    setEditDomain(domain.apex_domain);
  };

  const handleSave = async (id: number) => {
    if (!editDomain.trim()) {
      alert('Domain is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('allowed_signup_domains')
      .update({ apex_domain: editDomain.toLowerCase().trim() })
      .eq('id', id);

    if (error) {
      alert('Failed to update: ' + error.message);
    } else {
      setEditingId(null);
      router.refresh();
    }
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!newDomain.trim()) {
      alert('Domain is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('allowed_signup_domains')
      .insert([{ apex_domain: newDomain.toLowerCase().trim() }]);

    if (error) {
      alert('Failed to create: ' + error.message);
    } else {
      setShowCreate(false);
      setNewDomain('');
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, domain: string, userCount: number) => {
    const message = userCount > 0
      ? `Delete domain "${domain}"? This will NOT remove existing users (${userCount} users), but new signups from this domain will be blocked.`
      : `Delete domain "${domain}"?`;
    if (!confirm(message)) return;
    const { error } = await supabase.from('allowed_signup_domains').delete().eq('id', id);
    if (error) {
      alert('Failed to delete: ' + error.message);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Domain
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Add Allowed Domain</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Domain (apex only)</label>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="w-full max-w-md px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              placeholder="e.g., university.edu"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter the apex domain only (e.g., &quot;columbia.edu&quot;, not &quot;@columbia.edu&quot;)
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Domain'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Domain</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Users</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Added</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {domains.map((domain) => (
              <tr key={domain.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-300 font-mono">{domain.id}</td>
                <td className="px-4 py-3">
                  {editingId === domain.id ? (
                    <input
                      type="text"
                      value={editDomain}
                      onChange={(e) => setEditDomain(e.target.value)}
                      className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-sm rounded-full font-medium">
                      @{domain.apex_domain}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-400">
                    {domain.user_count} user{domain.user_count !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(domain.created_datetime_utc).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {editingId === domain.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(domain.id)}
                        disabled={saving}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(domain)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(domain.id, domain.apex_domain, domain.user_count)}
                        className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {domains.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No allowed domains found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
