'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Provider = {
  id: number;
  created_datetime_utc: string;
  name: string;
  model_count: number;
};

type Props = {
  providers: Provider[];
};

export function LLMProvidersTable({ providers }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEdit = (provider: Provider) => {
    setEditingId(provider.id);
    setEditName(provider.name);
  };

  const handleSave = async (id: number) => {
    if (!editName.trim()) {
      alert('Name is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('llm_providers')
      .update({ name: editName })
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
    if (!newName.trim()) {
      alert('Name is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('llm_providers').insert([{ name: newName }]);

    if (error) {
      alert('Failed to create: ' + error.message);
    } else {
      setShowCreate(false);
      setNewName('');
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string, modelCount: number) => {
    if (modelCount > 0) {
      alert(`Cannot delete provider "${name}" - it has ${modelCount} models associated with it.`);
      return;
    }
    if (!confirm(`Delete provider "${name}"?`)) return;
    const { error } = await supabase.from('llm_providers').delete().eq('id', id);
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
          + Add Provider
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Provider</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Provider Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full max-w-md px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              placeholder="e.g., Anthropic"
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
              {saving ? 'Creating...' : 'Create'}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Models</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {providers.map((provider) => (
              <tr key={provider.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-300 font-mono">{provider.id}</td>
                <td className="px-4 py-3">
                  {editingId === provider.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="text-white font-medium">{provider.name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                    {provider.model_count} model{provider.model_count !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(provider.created_datetime_utc).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {editingId === provider.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(provider.id)}
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
                        onClick={() => handleEdit(provider)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(provider.id, provider.name, provider.model_count)}
                        className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No LLM providers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
