import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Pencil, Trash2, Check, X } from 'lucide-react';

type Unidade = {
  id: string;
  unidade: string;
  created_at: string;
};

function ConsultaUnidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Unidade>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    const { data, error } = await supabase
      .from('unidades')
      .select('*')
      .order('unidade');

    if (error) {
      console.error('Erro ao buscar unidades:', error);
      return;
    }

    setUnidades(data || []);
  };

  const startEditing = (unidade: Unidade) => {
    setEditingId(unidade.id);
    setEditForm(unidade);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
    setError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.unidade) return;

    try {
      const { error } = await supabase
        .from('unidades')
        .update({ unidade: editForm.unidade })
        .eq('id', editingId);

      if (error) throw error;

      await fetchUnidades();
      setEditingId(null);
      setEditForm({});
      setError(null);
    } catch (error: any) {
      setError('Erro ao atualizar unidade: ' + error.message);
    }
  };

  const deleteUnidade = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;

    try {
      // First delete all related retornados records
      const { error: retornadosError } = await supabase
        .from('retornados')
        .delete()
        .eq('unidade_id', id);

      if (retornadosError) throw retornadosError;

      // Then delete the unidade
      const { error: unidadeError } = await supabase
        .from('unidades')
        .delete()
        .eq('id', id);

      if (unidadeError) throw unidadeError;

      await fetchUnidades();
      setError(null);
    } catch (error: any) {
      setError('Erro ao excluir unidade: ' + error.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Consulta de Unidades</h2>
        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Unidade</th>
              <th className="px-6 py-3">Data de Cadastro</th>
              <th className="px-6 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {unidades.map((unidade) => (
              <tr key={unidade.id} className="bg-white border-b hover:bg-gray-50">
                {editingId === unidade.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        name="unidade"
                        value={editForm.unidade || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {new Date(unidade.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">{unidade.unidade}</td>
                    <td className="px-6 py-4">
                      {new Date(unidade.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(unidade)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteUnidade(unidade.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ConsultaUnidades;