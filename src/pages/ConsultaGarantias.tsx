import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Pencil, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminPasswordModal from '../components/AdminPasswordModal';
import { useAdminPassword } from '../hooks/useAdminPassword';

interface Garantia {
  id: string;
  solicitante: string;
  data_solicitacao: string;
  codigo_produto: string;
  numero_serie: string;
  tipo: string;
  nf_compra: string;
  nf_remessa: string;
  nf_devolucao: string;
  nf_compra_chave: string;
  nf_remessa_chave: string;
  nf_devolucao_chave: string;
  data_garantia: string;
  numero_ticket: string;
  status: string;
  fornecedor: string;
  quantidade: number;
  observacao_defeito: string;
  valor_total: number;
}

function ConsultaGarantias() {
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGarantia, setEditingGarantia] = useState<Garantia | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedGarantiaId, setSelectedGarantiaId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'edit' | 'delete' | null>(null);
  const { verifyAdminPassword } = useAdminPassword();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGarantias();
  }, []);

  async function fetchGarantias() {
    try {
      const { data, error } = await supabase
        .from('garantias')
        .select('*')
        .order('data_solicitacao', { ascending: false });

      if (error) throw error;
      setGarantias(data || []);
    } catch (error) {
      console.error('Error fetching garantias:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (garantia: Garantia) => {
    setEditingGarantia(garantia);
    setSelectedGarantiaId(garantia.id);
    setActionType('edit');
    setShowAdminModal(true);
  };

  const handleDelete = (id: string) => {
    setSelectedGarantiaId(id);
    setActionType('delete');
    setShowAdminModal(true);
  };

  const handleAdminPasswordVerified = async () => {
    if (actionType === 'edit' && selectedGarantiaId) {
      navigate(`/registro-garantias/${selectedGarantiaId}`);
    } else if (actionType === 'delete' && selectedGarantiaId) {
      try {
        const { error } = await supabase
          .from('garantias')
          .delete()
          .eq('id', selectedGarantiaId);

        if (error) throw error;
        fetchGarantias();
      } catch (error) {
        console.error('Error deleting garantia:', error);
      }
    }
    setShowAdminModal(false);
    setSelectedGarantiaId(null);
    setActionType(null);
  };

  const exportToCSV = () => {
    const headers = [
      'Solicitante',
      'Data Solicitação',
      'Código Produto',
      'Número Série',
      'Tipo',
      'NF Compra',
      'NF Remessa',
      'NF Devolução',
      'Data Garantia',
      'Número Ticket',
      'Status',
      'Fornecedor',
      'Quantidade',
      'Observação Defeito',
      'Valor Total'
    ];

    const csvData = garantias.map(garantia => [
      garantia.solicitante,
      garantia.data_solicitacao,
      garantia.codigo_produto,
      garantia.numero_serie,
      garantia.tipo,
      garantia.nf_compra,
      garantia.nf_remessa,
      garantia.nf_devolucao,
      garantia.data_garantia,
      garantia.numero_ticket,
      garantia.status,
      garantia.fornecedor,
      garantia.quantidade,
      garantia.observacao_defeito,
      garantia.valor_total
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'garantias.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGarantias = garantias.filter(garantia =>
    Object.values(garantia).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consulta de Garantias</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Solicitante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data Solicitação</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código Produto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Número Série</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredGarantias.map((garantia) => (
              <tr key={garantia.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{garantia.solicitante}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{garantia.data_solicitacao}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{garantia.codigo_produto}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{garantia.numero_serie}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{garantia.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {garantia.valor_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(garantia)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(garantia.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPasswordModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onVerified={handleAdminPasswordVerified}
      />
    </div>
  );
}

export default ConsultaGarantias;