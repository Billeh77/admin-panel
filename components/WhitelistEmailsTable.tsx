'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type WhitelistEmail = {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
  email_address: string;
  is_registered: boolean;
};

type Props = {
  emails: WhitelistEmail[];
};

export function WhitelistEmailsTable({ emails }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEdit = (email: WhitelistEmail) => {
    setEditingId(email.id);
    setEditEmail(email.email_address);
  };

  const handleSave = async (id: number) => {
    if (!editEmail.trim() || !editEmail.includes('@')) {
      alert('Valid email is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('whitelist_email_addresses')
      .update({ 
        email_address: editEmail.toLowerCase().trim(),
        modified_datetime_utc: new Date().toISOString(),
      })
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
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('Valid email is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('whitelist_email_addresses')
      .insert([{ email_address: newEmail.toLowerCase().trim() }]);

    if (error) {
      alert('Failed to create: ' + error.message);
    } else {
      setShowCreate(false);
      setNewEmail('');
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, email: string) => {
    if (!confirm(`Remove "${email}" from whitelist?`)) return;
    const { error } = await supabase.from('whitelist_email_addresses').delete().eq('id', id);
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
          + Add Email
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Whitelist Email Address</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full max-w-md px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              placeholder="e.g., user@example.com"
            />
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
              {saving ? 'Adding...' : 'Add Email'}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Added</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Modified</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {emails.map((email) => (
              <tr key={email.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-300 font-mono">{email.id}</td>
                <td className="px-4 py-3">
                  {editingId === email.id ? (
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm w-64"
                      autoFocus
                    />
                  ) : (
                    <span className="text-white">{email.email_address}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {email.is_registered ? (
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                      Registered
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(email.created_datetime_utc).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {email.modified_datetime_utc 
                    ? new Date(email.modified_datetime_utc).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {editingId === email.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(email.id)}
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
                        onClick={() => handleEdit(email)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(email.id, email.email_address)}
                        className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No whitelisted emails found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
