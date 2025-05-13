import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Search, Printer } from 'lucide-react';

type Auditoria = {
  id: string;
  titulo: string;
  auditor: string;
  data_auditoria: string;
  unidade: {
    id: string;
    unidade: string;
  };
  link_evidencias: string;
  observacoes_gap: string;
  observacoes_melhorias: string;
  assinatura_responsavel: string;
  subtitulos: {
    id: string;
    titulo: string;
    ordem: number;
    itens: {
      id: string;
      descricao: string;
      ordem: number;
      respostas: {
        conforme: boolean;
        observacao: string;
      }[];
    }[];
  }[];
};

function ConsultaAuditorias() {
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedAuditoria, setSelectedAuditoria] = useState<Auditoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditorias();
  }, [startDate, endDate]);

  const fetchAuditorias = async () => {
    try {
      let query = supabase
        .from('registros_auditoria')
        .select(`
          id,
          formulario:formulario_id (
            titulo,
            auditor,
            data_auditoria,
            unidade:unidade_id (
              id,
              unidade
            ),
            link_evidencias,
            observacoes_gap,
            observacoes_melhorias,
            assinatura_responsavel,
            subtitulos:subtitulos_auditoria (
              id,
              titulo,
              ordem,
              itens:itens_auditoria (
                id,
                descricao,
                ordem,
                respostas:respostas_auditoria (
                  conforme,
                  observacao
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('data_hora', startDate);
      }
      if (endDate) {
        query = query.lte('data_hora', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data.map(registro => ({
        id: registro.id,
        ...registro.formulario,
        subtitulos: registro.formulario.subtitulos.sort((a, b) => a.ordem - b.ordem).map(subtitulo => ({
          ...subtitulo,
          itens: subtitulo.itens.sort((a, b) => a.ordem - b.ordem)
        }))
      }));

      setAuditorias(formattedData);
      setLoading(false);
    } catch (error: any) {
      setError('Erro ao carregar auditorias: ' + error.message);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-6">
        <div className="bg-white rounded-lg shadow">
          {/* Print-only header */}
          <div className="hidden print:block print:mb-8">
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold mb-2">Relatório de Auditoria</h1>
              <div className="text-sm text-gray-600">
                Data de impressão: {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6 print:hidden">
              <h2 className="text-2xl font-semibold text-gray-800">Consulta de Auditorias</h2>
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
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
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg print:hidden">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
              {auditorias.map((auditoria) => (
                <div
                  key={auditoria.id}
                  onClick={() => setSelectedAuditoria(auditoria)}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-lg">{auditoria.titulo}</h3>
                  <p className="text-gray-600">{auditoria.unidade.unidade}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(auditoria.data_auditoria).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedAuditoria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 print:static print:bg-transparent print:p-0">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible">
              <div className="flex justify-between items-start mb-6 print:hidden">
                <h3 className="text-xl font-semibold">
                  {selectedAuditoria.titulo}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </button>
                  <button
                    onClick={() => setSelectedAuditoria(null)}
                    className="text-gray-600 hover:text-gray-800 px-4 py-2"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* Cabeçalho */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 print:bg-transparent print:border print:border-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Auditor</p>
                    <p className="font-medium">{selectedAuditoria.auditor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data da Auditoria</p>
                    <p className="font-medium">
                      {new Date(selectedAuditoria.data_auditoria).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unidade</p>
                    <p className="font-medium">{selectedAuditoria.unidade.unidade}</p>
                  </div>
                </div>
              </div>

              {/* Subtítulos e Itens */}
              {selectedAuditoria.subtitulos.map((subtitulo) => (
                <div key={subtitulo.id} className="mb-6">
                  <h4 className="text-lg font-medium mb-4">{subtitulo.titulo}</h4>
                  <div className="space-y-4">
                    {subtitulo.itens.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg print:bg-transparent print:border print:border-gray-300">
                        <div className="flex-1">
                          <p className="font-medium">{item.descricao}</p>
                          {item.respostas[0] && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.respostas[0].conforme
                                    ? 'bg-green-100 text-green-800 print:bg-transparent print:border print:border-green-800'
                                    : 'bg-red-100 text-red-800 print:bg-transparent print:border print:border-red-800'
                                }`}>
                                  {item.respostas[0].conforme ? 'Conforme' : 'Não Conforme'}
                                </span>
                                {item.respostas[0].observacao && (
                                  <span className="text-sm text-gray-600">
                                    {item.respostas[0].observacao}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Rodapé */}
              <div className="space-y-4 print:mt-8">
                {selectedAuditoria.link_evidencias && (
                  <div>
                    <h4 className="font-medium mb-2">Link de Evidências</h4>
                    <a
                      href={selectedAuditoria.link_evidencias}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 print:text-black print:no-underline"
                    >
                      {selectedAuditoria.link_evidencias}
                    </a>
                  </div>
                )}

                {selectedAuditoria.observacoes_gap && (
                  <div>
                    <h4 className="font-medium mb-2">Observações de Gap</h4>
                    <p className="text-gray-700">{selectedAuditoria.observacoes_gap}</p>
                  </div>
                )}

                {selectedAuditoria.observacoes_melhorias && (
                  <div>
                    <h4 className="font-medium mb-2">Observações de Melhorias</h4>
                    <p className="text-gray-700">{selectedAuditoria.observacoes_melhorias}</p>
                  </div>
                )}

                {/* Assinaturas */}
                <div className="print:mt-16 print:pt-8 print:border-t grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="border-t border-gray-300 mt-16 pt-4">
                      <p className="font-medium">{selectedAuditoria.auditor}</p>
                      <p className="text-sm text-gray-600">Auditor</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="border-t border-gray-300 mt-16 pt-4">
                      <p className="font-medium">{selectedAuditoria.assinatura_responsavel}</p>
                      <p className="text-sm text-gray-600">Responsável pela Unidade</p>
                    </div>
                  </div>
                </div>

                {/* Data e Local */}
                <div className="text-center mt-8 pt-8">
                  <p className="text-sm text-gray-600">
                    {selectedAuditoria.unidade.unidade}, {new Date(selectedAuditoria.data_auditoria).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultaAuditorias;