'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { SafeImage } from './SafeImage';

type CaptionExample = {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
  image_description: string;
  caption: string;
  explanation: string;
  priority: number;
  image_id: string | null;
  image?: { id: string; url: string; image_description: string } | null;
};

type Props = {
  examples: CaptionExample[];
};

type EditingExample = {
  image_description: string;
  caption: string;
  explanation: string;
  priority: number;
};

export function CaptionExamplesTable({ examples }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditingExample | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newExample, setNewExample] = useState<EditingExample>({
    image_description: '',
    caption: '',
    explanation: '',
    priority: 0,
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEdit = (example: CaptionExample) => {
    setEditingId(example.id);
    setEditData({
      image_description: example.image_description || '',
      caption: example.caption || '',
      explanation: example.explanation || '',
      priority: example.priority || 0,
    });
  };

  const handleSave = async (id: number) => {
    if (!editData) return;
    setSaving(true);
    const { error } = await supabase
      .from('caption_examples')
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
    if (!newExample.caption.trim()) {
      alert('Caption is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('caption_examples').insert([newExample]);

    if (error) {
      alert('Failed to create: ' + error.message);
    } else {
      setShowCreate(false);
      setNewExample({ image_description: '', caption: '', explanation: '', priority: 0 });
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this caption example?')) return;
    const { error } = await supabase.from('caption_examples').delete().eq('id', id);
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
          + Add Example
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Caption Example</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Caption</label>
              <input
                type="text"
                value={newExample.caption}
                onChange={(e) => setNewExample({ ...newExample, caption: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="The funny caption text"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Image Description</label>
              <textarea
                value={newExample.image_description}
                onChange={(e) => setNewExample({ ...newExample, image_description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white h-24"
                placeholder="Describe the image context..."
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Explanation</label>
              <textarea
                value={newExample.explanation}
                onChange={(e) => setNewExample({ ...newExample, explanation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white h-24"
                placeholder="Why is this funny?"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm text-slate-400 mb-1">Priority</label>
              <input
                type="number"
                value={newExample.priority}
                onChange={(e) => setNewExample({ ...newExample, priority: parseInt(e.target.value) || 0 })}
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

      {/* Examples List */}
      <div className="space-y-3">
        {examples.map((example) => (
          <div
            key={example.id}
            className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden"
          >
            {editingId === example.id && editData ? (
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Caption</label>
                  <input
                    type="text"
                    value={editData.caption}
                    onChange={(e) => setEditData({ ...editData, caption: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Image Description</label>
                  <textarea
                    value={editData.image_description}
                    onChange={(e) => setEditData({ ...editData, image_description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm h-20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Explanation</label>
                  <textarea
                    value={editData.explanation}
                    onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm h-20"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-slate-400 mb-1">Priority</label>
                  <input
                    type="number"
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(example.id)}
                    disabled={saving}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditData(null); }}
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {example.image?.url && (
                    <SafeImage
                      src={example.image.url}
                      alt="Example image"
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full">
                        Priority: {example.priority}
                      </span>
                      <span className="text-xs text-slate-500">ID: {example.id}</span>
                    </div>
                    <p className="text-white font-medium mb-2">&ldquo;{example.caption}&rdquo;</p>
                    <button
                      onClick={() => setExpandedId(expandedId === example.id ? null : example.id)}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      {expandedId === example.id ? 'Hide details' : 'Show details'}
                    </button>
                    {expandedId === example.id && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Image Description:</p>
                          <p className="text-sm text-slate-300">{example.image_description || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Explanation:</p>
                          <p className="text-sm text-slate-300">{example.explanation || '—'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(example)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(example.id)}
                      className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {examples.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No caption examples found
          </div>
        )}
      </div>
    </div>
  );
}
