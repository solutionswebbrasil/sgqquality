import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Pencil, Trash2, Check, X } from 'lucide-react';
import * as XLSX from 'xlsx';

type Movimentacao = {
  id: string;
  numero_serie: string;
  tipo: string;
  numero_movimentacao: string;
  numero_os: string;
  created_at: string;
};

type EditFormData = {
  numero_serie: string;
  tipo: string;
  numero_movimentacao: string;
  numero_os: string;
};

function ConsultaMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);

  const tiposMovimentacao = [
    'De Estoque para Quarentena',
    'De Quarentena para Área Técnica Print',
    'De Quarentena para Área Técnica Mobile',
    'De Embalagem para Logística'
  ];

  useEffect(() => {
    fetchMovimentacoes();
  }, [startDate, endDate]);

  const fetchMovimentacoes = async () => {
    let query = supabase
      .from('movimentacoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar movimentações:', error);
      setError('Erro ao carregar os dados');
      return;
    }

    setMovimentacoes(data || []);
  };

  const startEditing = (movimentacao: Movimentacao) => {
    setEditingId(movimentacao.id);
    setEditForm({
      numero_serie: movimentacao.numero_serie,
      tipo: movimentacao.tipo,
      numero_movimentacao: movimentacao.numero_movimentacao || '',
      numero_os: movimentacao.numero_os || '',
    });
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
    setError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editForm) return;

    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;

    try {
      const { error } = await supabase
        .from('movimentacoes')
        .update({
          numero_serie: editForm.numero_serie,
          tipo: editForm.tipo,
          numero_movimentacao: editForm.numero_movimentacao,
          numero_os: editForm.numero_os,
        })
        .eq('id', editingId);

      if (error) throw error;

      await fetchMovimentacoes();
      setEditingId(null);
      setEditForm(null);
      setError(null);
    } catch (error: any) {
      setError('Erro ao atualizar movimentação: ' + error.message);
    }
  };

  const deleteMovimentacao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return;

    try {
      const { error } = await supabase
        .from('movimentacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchMovimentacoes();
      setError(null);
    } catch (error: any) {
      setError('Erro ao excluir movimentação: ' + error.message);
    }
  };

  const exportToExcel = () => {
    const exportData = movimentacoes.map(movimentacao => ({
      'Número de Série': movimentacao.numero_serie,
      'Tipo': movimentacao.tipo,
      'Número da Movimentação': movimentacao.numero_movimentacao,
      'Número da OS': movimentacao.numero_os,
      'Data': new Date(movimentacao.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');
    
    const filename = startDate && endDate
      ? `movimentacoes_${startDate}_a_${endDate}.xlsx`
      : 'movimentacoes.xlsx';
    
    XLSX.writeFile(wb, filename);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Consulta de Movimentações</h2>
        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Número de Série</th>
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Número da Movimentação</th>
              <th className="px-6 py-3">Número da OS</th>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {movimentacoes.map((movimentacao) => (
              <tr key={movimentacao.id} className="bg-white border-b hover:bg-gray-50">
                {editingId === movimentacao.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        name="numero_serie"
                        value={editForm?.numero_serie || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        name="tipo"
                        value={editForm?.tipo || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      >
                        {tiposMovimentacao.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        name="numero_movimentacao"
                        value={editForm?.numero_movimentacao || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        name="numero_os"
                        value={editForm?.numero_os || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-6 py-4">{formatDate(movimentacao.created_at)}</td>
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
                    <td className="px-6 py-4">{movimentacao.numero_serie}</td>
                    <td className="px-6 py-4">{movimentacao.tipo}</td>
                    <td className="px-6 py-4">{movimentacao.numero_movimentacao}</td>
                    <td className="px-6 py-4">{movimentacao.numero_os}</td>
                    <td className="px-6 py-4">{formatDate(movimentacao.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(movimentacao)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteMovimentacao(movimentacao.id)}
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

export default ConsultaMovimentacoes;