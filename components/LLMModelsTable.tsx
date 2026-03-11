'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type LLMModel = {
  id: number;
  created_datetime_utc: string;
  name: string;
  llm_provider_id: number;
  provider_model_id: string;
  is_temperature_supported: boolean;
  provider_name: string;
};

type Provider = {
  id: number;
  name: string;
};

type Props = {
  models: LLMModel[];
  providers: Provider[];
  usageMap: Record<number, number>;
};

type EditingModel = {
  name: string;
  llm_provider_id: number;
  provider_model_id: string;
  is_temperature_supported: boolean;
};

export function LLMModelsTable({ models, providers, usageMap }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditingModel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newModel, setNewModel] = useState<EditingModel>({
    name: '',
    llm_provider_id: providers[0]?.id || 1,
    provider_model_id: '',
    is_temperature_supported: true,
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEdit = (model: LLMModel) => {
    setEditingId(model.id);
    setEditData({
      name: model.name,
      llm_provider_id: model.llm_provider_id,
      provider_model_id: model.provider_model_id,
      is_temperature_supported: model.is_temperature_supported,
    });
  };

  const handleSave = async (id: number) => {
    if (!editData) return;
    setSaving(true);
    const { error } = await supabase
      .from('llm_models')
      .update(editData)
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
    if (!newModel.name.trim() || !newModel.provider_model_id.trim()) {
      alert('Name and Provider Model ID are required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('llm_models').insert([newModel]);

    if (error) {
      alert('Failed to create: ' + error.message);
    } else {
      setShowCreate(false);
      setNewModel({ name: '', llm_provider_id: providers[0]?.id || 1, provider_model_id: '', is_temperature_supported: true });
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete model "${name}"? This may affect flavor steps using this model.`)) return;
    const { error } = await supabase.from('llm_models').delete().eq('id', id);
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
          + Add Model
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Add New LLM Model</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                value={newModel.name}
                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="e.g., GPT-4 Turbo"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Provider</label>
              <select
                value={newModel.llm_provider_id}
                onChange={(e) => setNewModel({ ...newModel, llm_provider_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Provider Model ID</label>
              <input
                type="text"
                value={newModel.provider_model_id}
                onChange={(e) => setNewModel({ ...newModel, provider_model_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="e.g., gpt-4-turbo-preview"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newModel.is_temperature_supported}
                  onChange={(e) => setNewModel({ ...newModel, is_temperature_supported: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                />
                <span className="text-sm text-slate-300">Temperature Supported</span>
              </label>
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
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Model ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Temp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Usage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {models.map((model) => (
              <tr key={model.id} className="hover:bg-slate-800/30 transition-colors">
                {editingId === model.id && editData ? (
                  <>
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">{model.id}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={editData.llm_provider_id}
                        onChange={(e) => setEditData({ ...editData, llm_provider_id: parseInt(e.target.value) })}
                        className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      >
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editData.provider_model_id}
                        onChange={(e) => setEditData({ ...editData, provider_model_id: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={editData.is_temperature_supported}
                        onChange={(e) => setEditData({ ...editData, is_temperature_supported: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-700"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{usageMap[model.id] || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(model.id)}
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
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">{model.id}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{model.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        {model.provider_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 font-mono">{model.provider_model_id}</td>
                    <td className="px-4 py-3">
                      {model.is_temperature_supported ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-slate-500">✗</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{usageMap[model.id] || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(model)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(model.id, model.name)}
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
            {models.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No LLM models found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
