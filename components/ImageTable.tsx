'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Image = {
  id: string;
  url: string | null;
  image_description: string | null;
  is_public: boolean | null;
  is_common_use: boolean | null;
  profile_id: string | null;
  additional_context: string | null;
  created_datetime_utc: string | null;
  caption_count: number;
};

type Props = {
  images: Image[];
  error?: string;
};

export function ImageTable({ images: initialImages, error }: Props) {
  const [images, setImages] = useState(initialImages);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Image>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newImage, setNewImage] = useState({ url: '', is_public: false, is_common_use: false, additional_context: '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const router = useRouter();

  const supabase = createClient();

  const filteredImages = images.filter(img => {
    if (filter === 'public') return img.is_public === true;
    if (filter === 'private') return img.is_public !== true;
    return true;
  });

  const handleEdit = (image: Image) => {
    setEditingId(image.id);
    setEditForm({
      is_public: image.is_public,
      is_common_use: image.is_common_use,
      additional_context: image.additional_context,
    });
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('images')
      .update({
        is_public: editForm.is_public,
        is_common_use: editForm.is_common_use,
        additional_context: editForm.additional_context,
        modified_datetime_utc: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) {
      setImages(images.map(img => 
        img.id === id ? { ...img, ...editForm } : img
      ));
      setEditingId(null);
    }
    setSaving(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image? This cannot be undone.')) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', id);

    if (!error) {
      setImages(images.filter(img => img.id !== id));
    } else {
      alert('Error deleting image: ' + error.message);
    }
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!newImage.url) {
      alert('URL is required');
      return;
    }
    
    setSaving(true);
    const { data, error } = await supabase
      .from('images')
      .insert({
        url: newImage.url,
        is_public: newImage.is_public,
        is_common_use: newImage.is_common_use,
        additional_context: newImage.additional_context || null,
        created_datetime_utc: new Date().toISOString(),
        modified_datetime_utc: new Date().toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      setImages([{ ...data, caption_count: 0 }, ...images]);
      setIsCreating(false);
      setNewImage({ url: '', is_public: false, is_common_use: false, additional_context: '' });
    } else {
      alert('Error creating image: ' + error?.message);
    }
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Images</h2>
          <p className="text-slate-400 text-sm mt-1">
            {images.length} total • {images.filter(i => i.is_public).length} public
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'public' | 'private')}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Images</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
          {/* Create Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Image
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          Error loading images: {error}
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="bg-slate-900 border border-amber-500/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Image</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Image URL *</label>
              <input
                type="url"
                value={newImage.url}
                onChange={(e) => setNewImage({ ...newImage, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Additional Context</label>
              <textarea
                value={newImage.additional_context}
                onChange={(e) => setNewImage({ ...newImage, additional_context: e.target.value })}
                placeholder="Any additional context about this image..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={newImage.is_public}
                  onChange={(e) => setNewImage({ ...newImage, is_public: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                Public
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={newImage.is_common_use}
                  onChange={(e) => setNewImage({ ...newImage, is_common_use: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                Common Use
              </label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Creating...' : 'Create Image'}
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
          >
            {/* Image Preview */}
            <div className="aspect-video bg-slate-800 relative">
              {image.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.url}
                  alt={image.image_description || 'Image'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  No URL
                </div>
              )}
              {/* Status Badges */}
              <div className="absolute top-2 right-2 flex gap-1">
                {image.is_public && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    Public
                  </span>
                )}
                {image.is_common_use && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Common
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              {editingId === image.id ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Additional Context</label>
                    <textarea
                      value={editForm.additional_context || ''}
                      onChange={(e) => setEditForm({ ...editForm, additional_context: e.target.value })}
                      rows={2}
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={editForm.is_public || false}
                        onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                        className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                      />
                      Public
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={editForm.is_common_use || false}
                        onChange={(e) => setEditForm({ ...editForm, is_common_use: e.target.checked })}
                        className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                      />
                      Common Use
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveEdit(image.id)}
                      disabled={saving}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  <p className="text-xs text-slate-500 font-mono mb-2">{image.id.slice(0, 8)}...</p>
                  {image.image_description && (
                    <p className="text-sm text-slate-300 line-clamp-2 mb-2">{image.image_description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{image.caption_count} captions</span>
                    <span>
                      {image.created_datetime_utc 
                        ? new Date(image.created_datetime_utc).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleEdit(image)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      disabled={saving}
                      className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded transition-colors"
                    >
                      Delete
                    </button>
                    {image.url && (
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors ml-auto"
                      >
                        View ↗
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No images found</p>
        </div>
      )}
    </div>
  );
}
