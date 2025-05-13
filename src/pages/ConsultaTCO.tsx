import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Printer, Pencil, Trash2, Check, X } from 'lucide-react';

type TCO = {
  id: string;
  modelo: string;
  fabricante: string;
  tipo: string;
  preco_impressora: number;
  pis: number;
  ipi: number;
  icms: number;
  cofins: number;
  acessorios: number;
  total_aquisicao: number;
  observacao: string;
  created_at: string;
  custos_operacionais: Array<{
    id: string;
    titulo: string;
    valor: number;
  }>;
  custos_indiretos: Array<{
    id: string;
    titulo: string;
    valor: number;
  }>;
};

type EditFormData = {
  modelo: string;
  fabricante: string;
  tipo: string;
  preco_impressora: number;
  pis: number;
  ipi: number;
  icms: number;
  cofins: number;
  acessorios: number;
  observacao: string;
  custos_operacionais: Array<{
    titulo: string;
    valor: number;
  }>;
  custos_indiretos: Array<{
    titulo: string;
    valor: number;
  }>;
};

function ConsultaTCO() {
  const [tcos, setTCOs] = useState<TCO[]>([]);
  const [selectedTCO, setSelectedTCO] = useState<TCO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTCOs();
  }, []);

  const fetchTCOs = async () => {
    try {
      const { data: tcosData, error: tcosError } = await supabase
        .from('tcos')
        .select('*')
        .order('created_at', { ascending: false });

      if (tcosError) throw tcosError;

      const tcosWithCosts = await Promise.all(
        (tcosData || []).map(async (tco) => {
          const { data: operacionais } = await supabase
            .from('tco_custos_operacionais')
            .select('id, titulo, valor')
            .eq('tco_id', tco.id);

          const { data: indiretos } = await supabase
            .from('tco_custos_indiretos')
            .select('id, titulo, valor')
            .eq('tco_id', tco.id);

          return {
            ...tco,
            custos_operacionais: operacionais || [],
            custos_indiretos: indiretos || []
          };
        })
      );

      setTCOs(tcosWithCosts);
      setLoading(false);
    } catch (error: any) {
      setError('Erro ao carregar TCOs: ' + error.message);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const startEditing = (tco: TCO) => {
    setEditForm({
      modelo: tco.modelo,
      fabricante: tco.fabricante,
      tipo: tco.tipo,
      preco_impressora: tco.preco_impressora,
      pis: tco.pis,
      ipi: tco.ipi,
      icms: tco.icms,
      cofins: tco.cofins,
      acessorios: tco.acessorios,
      observacao: tco.observacao || '',
      custos_operacionais: tco.custos_operacionais.map(c => ({
        titulo: c.titulo,
        valor: c.valor
      })),
      custos_indiretos: tco.custos_indiretos.map(c => ({
        titulo: c.titulo,
        valor: c.valor
      }))
    });
    setIsEditing(true);
  };

  const handleEditChange = (
    field: keyof EditFormData,
    value: string | number
  ) => {
    if (!editForm) return;

    if (field === 'preco_impressora' || field === 'pis' || field === 'ipi' || 
        field === 'icms' || field === 'cofins' || field === 'acessorios') {
      value = Number(value) || 0;
    }

    setEditForm({
      ...editForm,
      [field]: value
    });
  };

  const handleEditOperacionalChange = (index: number, field: 'titulo' | 'valor', value: string | number) => {
    if (!editForm) return;

    const newCustos = [...editForm.custos_operacionais];
    if (field === 'valor') {
      newCustos[index] = { ...newCustos[index], [field]: Number(value) || 0 };
    } else {
      newCustos[index] = { ...newCustos[index], [field]: value };
    }
    
    setEditForm({
      ...editForm,
      custos_operacionais: newCustos
    });
  };

  const handleEditIndiretoChange = (index: number, field: 'titulo' | 'valor', value: string | number) => {
    if (!editForm) return;

    const newCustos = [...editForm.custos_indiretos];
    if (field === 'valor') {
      newCustos[index] = { ...newCustos[index], [field]: Number(value) || 0 };
    } else {
      newCustos[index] = { ...newCustos[index], [field]: value };
    }
    
    setEditForm({
      ...editForm,
      custos_indiretos: newCustos
    });
  };

  const saveEdit = async () => {
    if (!selectedTCO || !editForm) return;

    try {
      // Calculate total_aquisicao
      const total_aquisicao = 
        Number(editForm.preco_impressora) +
        Number(editForm.pis) +
        Number(editForm.ipi) +
        Number(editForm.icms) +
        Number(editForm.cofins) +
        Number(editForm.acessorios);

      // Update TCO
      const { error: tcoError } = await supabase
        .from('tcos')
        .update({
          ...editForm,
          total_aquisicao
        })
        .eq('id', selectedTCO.id);

      if (tcoError) throw tcoError;

      // Delete existing costs
      await supabase
        .from('tco_custos_operacionais')
        .delete()
        .eq('tco_id', selectedTCO.id);

      await supabase
        .from('tco_custos_indiretos')
        .delete()
        .eq('tco_id', selectedTCO.id);

      // Insert new costs
      if (editForm.custos_operacionais.length > 0) {
        const { error: opError } = await supabase
          .from('tco_custos_operacionais')
          .insert(
            editForm.custos_operacionais.map(custo => ({
              tco_id: selectedTCO.id,
              titulo: custo.titulo,
              valor: Number(custo.valor) || 0
            }))
          );

        if (opError) throw opError;
      }

      if (editForm.custos_indiretos.length > 0) {
        const { error: indError } = await supabase
          .from('tco_custos_indiretos')
          .insert(
            editForm.custos_indiretos.map(custo => ({
              tco_id: selectedTCO.id,
              titulo: custo.titulo,
              valor: Number(custo.valor) || 0
            }))
          );

        if (indError) throw indError;
      }

      await fetchTCOs();
      setIsEditing(false);
      setEditForm(null);
      setError(null);
    } catch (error: any) {
      setError('Erro ao atualizar TCO: ' + error.message);
    }
  };

  const deleteTCO = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este TCO?')) return;

    try {
      const { error } = await supabase
        .from('tcos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTCOs();
      setSelectedTCO(null);
      setError(null);
    } catch (error: any) {
      setError('Erro ao excluir TCO: ' + error.message);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Consulta de TCO</h2>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tcos.map((tco) => (
          <div
            key={tco.id}
            onClick={() => !isEditing && setSelectedTCO(tco)}
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <h3 className="font-medium text-lg">{tco.modelo}</h3>
            <p className="text-gray-600">{tco.fabricante}</p>
            <p className="text-sm text-gray-500">{formatDate(tco.created_at)}</p>
          </div>
        ))}
      </div>

      {selectedTCO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold">
                TCO - {isEditing ? 'Editando ' : ''}{selectedTCO.modelo}
              </h3>
              <div className="flex gap-2">
                {!isEditing && (
                  <>
                    <button
                      onClick={() => startEditing(selectedTCO)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => deleteTCO(selectedTCO.id)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 bg-[#3f4c6b] hover:bg-[#2c3e50] text-white px-4 py-2 rounded-md"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>
                  </>
                )}
                {isEditing ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                    >
                      <Check className="w-4 h-4" />
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm(null);
                      }}
                      className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedTCO(null)}
                    className="text-gray-600 hover:text-gray-800 px-4 py-2"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Informações Gerais */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Informações Gerais</h4>
                <div className="grid grid-cols-3 gap-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Modelo</label>
                        <input
                          type="text"
                          value={editForm?.modelo || ''}
                          onChange={(e) => handleEditChange('modelo', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fabricante</label>
                        <input
                          type="text"
                          value={editForm?.fabricante || ''}
                          onChange={(e) => handleEditChange('fabricante', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                        <input
                          type="text"
                          value={editForm?.tipo || ''}
                          onChange={(e) => handleEditChange('tipo', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Modelo</p>
                        <p className="font-medium">{selectedTCO.modelo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fabricante</p>
                        <p className="font-medium">{selectedTCO.fabricante}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tipo</p>
                        <p className="font-medium">{selectedTCO.tipo}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Valor do Bem Principal + Impostos */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Valor do Bem Principal + Impostos</h4>
                <div className="grid grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Preço da Impressora</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm?.preco_impressora || 0}
                          onChange={(e) => handleEditChange('preco_impressora', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">PIS</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm?.pis || 0}
                          onChange={(e) => handleEditChange('pis', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">IPI</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm?.ipi || 0}
                          onChange={(e) => handleEditChange('ipi', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">ICMS</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm?.icms || 0}
                          onChange={(e) => handleEditChange('icms', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">COFINS</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm?.cofins || 0}
                          onChange={(e) => handleEditChange('cofins', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Acessórios</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm?.acessorios || 0}
                          onChange={(e) => handleEditChange('acessorios', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Preço da Impressora</p>
                        <p className="font-medium">{formatCurrency(selectedTCO.preco_impressora)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">PIS</p>
                        <p className="font-medium">{formatCurrency(selectedTCO.pis)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">IPI</p>
                        <p className="font-medium">{formatCurrency(selectedTCO.ipi)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ICMS</p>
                        <p className="font-medium">{formatCurrency(selectedTCO.icms)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">COFINS</p>
                        <p className="font-medium">{formatCurrency(selectedTCO.cofins)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Acessórios</p>
                        <p className="font-medium">{formatCurrency(selectedTCO.acessorios)}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-blue-800 font-medium">
                    Total de Aquisição: {formatCurrency(selectedTCO.total_aquisicao)}
                  </p>
                </div>
              </div>

              {/* Custos Operacionais */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Custos Operacionais</h4>
                {isEditing ? (
                  editForm?.custos_operacionais.map((custo, index) => (
                    <div key={index} className="flex gap-4 mb-2">
                      <input
                        type="text"
                        value={custo.titulo}
                        onChange={(e) => handleEditOperacionalChange(index, 'titulo', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded"
                        placeholder="Título"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={custo.valor}
                        onChange={(e) => handleEditOperacionalChange(index, 'valor', e.target.value)}
                        className="w-32 px-3 py-2 border rounded"
                        placeholder="Valor"
                      />
                    </div>
                  ))
                ) : (
                  selectedTCO.custos_operacionais.map((custo, index) => (
                    <div key={index} className="flex justify-between py-2 border-b">
                      <span>{custo.titulo}</span>
                      <span className="font-medium">{formatCurrency(custo.valor)}</span>
                    </div>
                  ))
                )}
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-blue-800 font-medium">
                    Total Operacional Mensal: {formatCurrency(
                      selectedTCO.custos_operacionais.reduce((acc, curr) => acc + curr.valor, 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Custos Indiretos */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Custos Indiretos</h4>
                {isEditing ? (
                  editForm?.custos_indiretos.map((custo, index) => (
                    <div key={index} className="flex gap-4 mb-2">
                      <input
                        type="text"
                        value={custo.titulo}
                        onChange={(e) => handleEditIndiretoChange(index, 'titulo', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded"
                        placeholder="Título"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={custo.valor}
                        onChange={(e) => handleEditIndiretoChange(index, 'valor', e.target.value)}
                        className="w-32 px-3 py-2 border rounded"
                        placeholder="Valor"
                      />
                    </div>
                  ))
                ) : (
                  selectedTCO.custos_indiretos.map((custo, index) => (
                    <div key={index} className="flex justify-between py-2 border-b">
                      <span>{custo.titulo}</span>
                      <span className="font-medium">{formatCurrency(custo.valor)}</span>
                    </div>
                  ))
                )}
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-blue-800 font-medium">
                    Total Indireto Mensal: {formatCurrency(
                      selectedTCO.custos_indiretos.reduce((acc, curr) => acc + curr.valor, 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Observação */}
              {(selectedTCO.observacao || isEditing) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Observação</h4>
                  {isEditing ? (
                    <textarea
                      value={editForm?.observacao || ''}
                      onChange={(e) => handleEditChange('observacao', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-700">{selectedTCO.observacao}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultaTCO;