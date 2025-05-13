import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import AdminPasswordModal from '../components/AdminPasswordModal';
import { useAdminPassword } from '../hooks/useAdminPassword';

type Toner = {
  id: string;
  modelo: string;
  peso_cheio: number;
  peso_vazio: number;
  impressoras_compativeis: string;
  cor: 'Black' | 'Cyan' | 'Magenta' | 'Yellow';
  area_impressa_iso: number;
  capacidade_folhas: number;
  tipo: 'Compatível' | 'Original';
  preco: number;
  preco_folha: number;
  gramatura: number;
};

function ConsultaToners() {
  const [toners, setToners] = useState<Toner[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Toner>>({});
  const [error, setError] = useState<string | null>(null);
  const { showAdminModal, requireAdminPassword, handleConfirm, handleClose } = useAdminPassword();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchToners();
  }, []);

  const fetchToners = async () => {
    const { data, error } = await supabase.from('toners').select('*');
    if (error) {
      console.error('Erro ao buscar toners:', error);
      return;
    }
    setToners(data);
  };

  const startEditing = (toner: Toner) => {
    requireAdminPassword(() => {
      setEditingId(toner.id);
      setEditForm(toner);
      setError(null);
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
    setError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'peso_cheio' || name === 'peso_vazio' || name === 'area_impressa_iso' || 
              name === 'capacidade_folhas' || name === 'preco' ? 
              Number(value) : value
    }));
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      // Calculate derived values
      const gramatura = Number(editForm.peso_cheio) - Number(editForm.peso_vazio);
      const preco_folha = Number(editForm.preco) / Number(editForm.capacidade_folhas);

      const { error } = await supabase
        .from('toners')
        .update({
          ...editForm,
          gramatura,
          preco_folha: Number(preco_folha.toFixed(3))
        })
        .eq('id', editingId);

      if (error) throw error;

      await fetchToners();
      setEditingId(null);
      setEditForm({});
      setError(null);
    } catch (error: any) {
      setError('Erro ao atualizar toner: ' + error.message);
    }
  };

  const deleteToner = async (id: string) => {
    setPendingDeleteId(id);
    requireAdminPassword(async () => {
      try {
        // First delete all related retornados records
        const { error: retornadosError } = await supabase
          .from('retornados')
          .delete()
          .eq('toner_id', id);

        if (retornadosError) throw retornadosError;

        // Then delete the toner
        const { error: tonerError } = await supabase
          .from('toners')
          .delete()
          .eq('id', id);

        if (tonerError) throw tonerError;

        await fetchToners();
        setPendingDeleteId(null);
        setError(null);
      } catch (error: any) {
        setError('Erro ao excluir toner: ' + error.message);
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Consulta de Toners</h2>
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Modelo</th>
              <th className="px-6 py-3">Peso Cheio (g)</th>
              <th className="px-6 py-3">Peso Vazio (g)</th>
              <th className="px-6 py-3">Impressoras Compatíveis</th>
              <th className="px-6 py-3">Cor</th>
              <th className="px-6 py-3">Área ISO</th>
              <th className="px-6 py-3">Capacidade</th>
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Preço</th>
              <th className="px-6 py-3">Gramatura</th>
              <th className="px-6 py-3">Preço/Folha</th>
              <th className="px-6 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {toners.map((toner) => (
              <tr key={toner.id} className="bg-white border-b hover:bg-gray-50">
                {editingId === toner.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        name="modelo"
                        value={editForm.modelo || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        name="peso_cheio"
                        value={editForm.peso_cheio || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        name="peso_vazio"
                        value={editForm.peso_vazio || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        name="impressoras_compativeis"
                        value={editForm.impressoras_compativeis || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        name="cor"
                        value={editForm.cor || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="Black">Black</option>
                        <option value="Cyan">Cyan</option>
                        <option value="Magenta">Magenta</option>
                        <option value="Yellow">Yellow</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        name="area_impressa_iso"
                        value={editForm.area_impressa_iso || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="0.05">5%</option>
                        <option value="0.06">6%</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        name="capacidade_folhas"
                        value={editForm.capacidade_folhas || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        name="tipo"
                        value={editForm.tipo || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="Compatível">Compatível</option>
                        <option value="Original">Original</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        name="preco"
                        value={editForm.preco || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {(Number(editForm.peso_cheio || 0) - Number(editForm.peso_vazio || 0)).toFixed(1)}
                    </td>
                    <td className="px-6 py-4">
                      {formatCurrency(Number(editForm.preco || 0) / Number(editForm.capacidade_folhas || 1))}
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
                    <td className="px-6 py-4">{toner.modelo}</td>
                    <td className="px-6 py-4">{toner.peso_cheio}</td>
                    <td className="px-6 py-4">{toner.peso_vazio}</td>
                    <td className="px-6 py-4">{toner.impressoras_compativeis}</td>
                    <td className="px-6 py-4">{toner.cor}</td>
                    <td className="px-6 py-4">{toner.area_impressa_iso * 100}%</td>
                    <td className="px-6 py-4">{toner.capacidade_folhas}</td>
                    <td className="px-6 py-4">{toner.tipo}</td>
                    <td className="px-6 py-4">{formatCurrency(toner.preco)}</td>
                    <td className="px-6 py-4">{toner.gramatura.toFixed(1)}</td>
                    <td className="px-6 py-4">{formatCurrency(toner.preco_folha)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(toner)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteToner(toner.id)}
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

      <AdminPasswordModal
        isOpen={showAdminModal}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={pendingDeleteId ? "Confirmar Exclusão" : "Editar Registro"}
      />
    </div>
  );
}

export default ConsultaToners;