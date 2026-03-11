'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Term = {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
  term: string;
  definition: string;
  example: string;
  priority: number;
  term_type_id: number;
  type_name: string;
};

type TermType = {
  id: number;
  name: string;
};

type Props = {
  terms: Term[];
  termTypes: TermType[];
};

type EditingTerm = {
  term: string;
  definition: string;
  example: string;
  priority: number;
  term_type_id: number;
};

export function TermsTable({ terms, termTypes }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditingTerm | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTerm, setNewTerm] = useState<EditingTerm>({
    term: '',
    definition: '',
    example: '',
    priority: 0,
    term_type_id: termTypes[0]?.id || 1,
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEdit = (term: Term) => {
    setEditingId(term.id);
    setEditData({
      term: term.term,
      definition: term.definition,
      example: term.example,
      priority: term.priority,
      term_type_id: term.term_type_id,
    });
  };

  const handleSave = async (id: number) => {
    if (!editData) return;
    setSaving(true);
    const { error } = await supabase
      .from('terms')
      .update({
        ...editData,
        modified_datetime_utc: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      alert('Failed to update: ' + error.message);
    } else {
      setEditingId(null);
      setEditData(null);
      router.refresh();
    }
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!newTerm.term.trim()) {
      alert('Term is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('terms').insert([newTerm]);

    if (error) {
      alert('Failed to create: ' + error.message);
    } else {
      setShowCreate(false);
      setNewTerm({ term: '', definition: '', example: '', priority: 0, term_type_id: termTypes[0]?.id || 1 });
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, termName: string) => {
    if (!confirm(`Delete term "${termName}"?`)) return;
    const { error } = await supabase.from('terms').delete().eq('id', id);
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
          + Add Term
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Term</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Term</label>
              <input
                type="text"
                value={newTerm.term}
                onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="e.g., rizz"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Type</label>
              <select
                value={newTerm.term_type_id}
                onChange={(e) => setNewTerm({ ...newTerm, term_type_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                {termTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Definition</label>
              <input
                type="text"
                value={newTerm.definition}
                onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="e.g., charisma"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Example</label>
              <input
                type="text"
                value={newTerm.example}
                onChange={(e) => setNewTerm({ ...newTerm, example: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="e.g., He has great rizz"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Priority</label>
              <input
                type="number"
                value={newTerm.priority}
                onChange={(e) => setNewTerm({ ...newTerm, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Term</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Definition</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Example</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {terms.map((term) => (
                <tr key={term.id} className="hover:bg-slate-800/30 transition-colors">
                  {editingId === term.id && editData ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editData.term}
                          onChange={(e) => setEditData({ ...editData, term: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editData.term_type_id}
                          onChange={(e) => setEditData({ ...editData, term_type_id: parseInt(e.target.value) })}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        >
                          {termTypes.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editData.definition}
                          onChange={(e) => setEditData({ ...editData, definition: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editData.example}
                          onChange={(e) => setEditData({ ...editData, example: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editData.priority}
                          onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(term.id)}
                            disabled={saving}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditData(null); }}
                            className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm text-white font-medium">{term.term}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                          {term.type_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-[200px] truncate">
                        {term.definition}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 max-w-[200px] truncate italic">
                        {term.example || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{term.priority}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(term)}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(term.id, term.term)}
                            className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {terms.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No terms found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
