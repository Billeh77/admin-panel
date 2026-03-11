'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type HumorMix = {
  id: number;
  created_datetime_utc: string;
  humor_flavor_id: number;
  caption_count: number;
  flavor?: { slug: string; description: string };
};

type Flavor = {
  id: number;
  slug: string;
  description: string;
};

type Props = {
  mixes: HumorMix[];
  allFlavors: Flavor[];
};

export function HumorMixTable({ mixes, allFlavors }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEdit = (mix: HumorMix) => {
    setEditingId(mix.id);
    setEditValue(mix.caption_count);
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    const { error } = await supabase
      .from('humor_flavor_mix')
      .update({ caption_count: editValue })
      .eq('id', id);

    if (error) {
      console.error('Error updating mix:', error);
      alert('Failed to update: ' + error.message);
    } else {
      setEditingId(null);
      router.refresh();
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue(0);
  };

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Flavor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Description</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Caption Count</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {mixes.map((mix) => (
            <tr key={mix.id} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-300 font-mono">{mix.id}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                  {mix.flavor?.slug || `ID: ${mix.humor_flavor_id}`}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-400 max-w-[200px] truncate">
                {mix.flavor?.description || '—'}
              </td>
              <td className="px-4 py-3">
                {editingId === mix.id ? (
                  <input
                    type="number"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    autoFocus
                  />
                ) : (
                  <span className="inline-flex items-center px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm font-medium">
                    {mix.caption_count}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(mix.created_datetime_utc).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                {editingId === mix.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(mix.id)}
                      disabled={saving}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(mix)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition-colors"
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
          {mixes.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                No humor flavor mixes found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
