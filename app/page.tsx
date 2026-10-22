'use client';

import { useState, useEffect } from 'react';

const ATENDENTES = [
  'ANA PAULA',
  'DIOGO',
  'CARLA',
  'GRAZIELA',
  'ROUSY',
  'ROUSY-FONE',
  'ROSANGELA',
  'EMILY',
  'VLADINA',
  'WENDERSON',
  'PORTARIA',
  'IRMAS',
  'QUÉSIA',
  'RECLAME AQUI',
  'INSTAGRAM'
];

const LINHA_STATUS_CORES = {
  '': 'bg-white hover:bg-gray-50',
  'EM ANÁLISE': 'bg-yellow-50/70 hover:bg-yellow-100/70',
  'REPASSADO': 'bg-blue-50/70 hover:bg-blue-100/70',
  'FINALIZADO': 'bg-green-50/70 hover:bg-green-100/70',
  'RETOR. CLIEN': 'bg-purple-50/70 hover:bg-purple-100/70',
  'AGENDADO': 'bg-amber-100/60 hover:bg-amber-200/60'
};

const STATUS_CORES = {
  '': 'bg-gray-100 text-gray-500 border-gray-300',
  'EM ANÁLISE': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'REPASSADO': 'bg-blue-100 text-blue-800 border-blue-300',
  'FINALIZADO': 'bg-green-100 text-green-800 border-green-300',
  'RETOR. CLIEN': 'bg-purple-100 text-purple-800 border-purple-300',
  'AGENDADO': 'bg-amber-800 text-white border-amber-900'
};

export default function Home() {
  const [chamados, setChamados] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nf: '',
    bling: '',
    ticket: '',
    pedido: '',
    atendente: '',
    obs: '',
    status: '',
    resolucao: ''
  });

  const [pedidoExistenteModal, setPedidoExistenteModal] = useState(null);
  const [modoAtualizacao, setModoAtualizacao] = useState(false);
  const [atendenteAtualizador, setAtendenteAtualizador] = useState('');
  const [novaObservacao, setNovaObservacao] = useState('');

  const [editandoTimelineId, setEditandoTimelineId] = useState(null);
  const [textoEditado, setTextoEditado] = useState('');

  // Estados para a adição rápida com status obrigatório
  const [adicionandoEmId, setAdicionandoEmId] = useState(null);
  const [atendenteRapido, setAtendenteRapido] = useState('');
  const [statusRapido, setStatusRapido] = useState('');
  const [obsRapida, setObsRapida] = useState('');

  useEffect(() => {
    carregarChamados();
  }, []);

  const carregarChamados = async () => {
    try {
      const res = await fetch('/api/chamados');
      const resultado = await res.json();
      if (resultado.success) {
        setChamados(resultado.data);
      }
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
    }
  };

  const verificarPedidoImediato = async (numeroPedido) => {
    if (!numeroPedido || numeroPedido.trim() === '') return;

    try {
      const res = await fetch(`/api/chamados?pedido=${numeroPedido}`);
      const resultado = await res.json();
      if (resultado.success && resultado.data.length > 0) {
        setPedidoExistenteModal(resultado.data[0]);
        setModoAtualizacao(true);
      }
    } catch (error) {
      console.error('Erro ao verificar pedido:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pedido || !form.atendente) {
      alert('Preencha pelo menos o Número do Pedido e o Atendente!');
      return;
    }

    setLoading(true);
    const resolucaoPadrao = `Pedido: ${form.pedido}\nBling: ${form.bling || '-'}\nNF: ${form.nf || '-'}\n`;

    try {
      const res = await fetch('/api/chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, resolucao: resolucaoPadrao })
      });

      const resultado = await res.json();

      if (resultado.success) {
        setForm({ nf: '', bling: '', ticket: '', pedido: '', atendente: '', obs: '', status: '', resolucao: '' });
        carregarChamados();
        alert('Chamado registrado com sucesso!');
      } else if (resultado.duplicado) {
        setPedidoExistenteModal(resultado.data);
        setModoAtualizacao(true);
      } else {
        alert('Erro ao registrar: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarExistente = async () => {
    if (!atendenteAtualizador || !novaObservacao) {
      alert('Selecione seu nome e digite a nova observação!');
      return;
    }

    try {
      const res = await fetch('/api/chamados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoExistenteModal._id,
          novaObs: novaObservacao,
          atendenteAtualizacao: atendenteAtualizador
        })
      });

      const resultado = await res.json();
      if (resultado.success) {
        alert('Nova observação adicionada à timeline do pedido!');
        setPedidoExistenteModal(null);
        setModoAtualizacao(false);
        setNovaObservacao('');
        setAtendenteAtualizador('');
        setForm({ nf: '', bling: '', ticket: '', pedido: '', atendente: '', obs: '', status: '', resolucao: '' });
        carregarChamados();
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  // Salvar adição rápida com status obrigatório
  const salvarAdicaoRapida = async (id) => {
    if (!atendenteRapido || !statusRapido || !obsRapida.trim()) {
      alert('Preencha o Atendente, selecione um Status obrigatório e digite a observação!');
      return;
    }

    try {
      const res = await fetch('/api/chamados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          novaObs: obsRapida,
          atendenteAtualizacao: atendenteRapido,
          status: statusRapido
        })
      });

      const resultado = await res.json();
      if (resultado.success) {
        setAdicionandoEmId(null);
        setAtendenteRapido('');
        setStatusRapido('');
        setObsRapida('');
        carregarChamados();
      }
    } catch (error) {
      console.error('Erro ao adicionar observação rápida:', error);
    }
  };

  const atualizarCampo = async (id, dados) => {
    try {
      const res = await fetch('/api/chamados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...dados })
      });
      const resultado = await res.json();
      if (resultado.success) {
        if (pedidoExistenteModal && pedidoExistenteModal._id === id) {
          const resAtualizado = await fetch(`/api/chamados?pedido=${pedidoExistenteModal.pedido}`);
          const resJson = await resAtualizado.json();
          if (resJson.success && resJson.data.length > 0) {
            setPedidoExistenteModal(resJson.data[0]);
          }
        }
        carregarChamados();
      }
    } catch (error) {
      console.error('Erro ao atualizar campo:', error);
    }
  };

  const salvarEdicaoTimeline = async (id, timelineId) => {
    try {
      const res = await fetch('/api/chamados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, editarTimelineId: timelineId, novaObsEditada: textoEditado })
      });
      const resultado = await res.json();
      if (resultado.success) {
        setEditandoTimelineId(null);
        setTextoEditado('');
        carregarChamados();
      }
    } catch (error) {
      console.error('Erro ao editar item da timeline:', error);
    }
  };

  const deletarItemTimeline = async (id, timelineId) => {
    if (confirm('Deseja realmente excluir esta observação do histórico?')) {
      try {
        const res = await fetch(`/api/chamados?id=${id}&timelineId=${timelineId}`, { method: 'DELETE' });
        const resultado = await res.json();
        if (resultado.success) {
          carregarChamados();
        }
      } catch (error) {
        console.error('Erro ao excluir item:', error);
      }
    }
  };

  const deletarChamado = async (id, pedido) => {
    if (confirm(`Tem certeza que deseja excluir permanentemente o chamado do pedido ${pedido}?`)) {
      try {
        const res = await fetch(`/api/chamados?id=${id}`, { method: 'DELETE' });
        const resultado = await res.json();
        if (resultado.success) {
          carregarChamados();
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
  };

  const chamadosFiltrados = chamados.filter((item) => {
    const termo = busca.toLowerCase();
    const stringTimeline = item.timeline?.map(t => `${t.atendente} ${t.obs} ${t.data}`).join(' ').toLowerCase() || '';
    
    return (
      item.pedido?.toLowerCase().includes(termo) ||
      item.nf?.toLowerCase().includes(termo) ||
      item.bling?.toLowerCase().includes(termo) ||
      item.ticket?.toLowerCase().includes(termo) ||
      item.atendenteCriacao?.toLowerCase().includes(termo) ||
      (item.status || '').toLowerCase().includes(termo) ||
      item.resolucao?.toLowerCase().includes(termo) ||
      stringTimeline.includes(termo)
    );
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sistema de Chamados de Atendimento</h1>
            <p className="text-sm text-gray-500">Gestão unificada de pedidos, Bling, tickets e histórico</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="🔍 Buscar na planilha (pedido, ticket, obs...)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 w-72 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <div className="text-sm font-medium bg-amber-50 text-amber-800 px-4 py-2 rounded-lg border border-amber-200 whitespace-nowrap">
              Registros: {chamadosFiltrados.length}
            </div>
          </div>
        </div>

        {/* Formulário de Novo Chamado */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Novo Atendimento / Chamado</h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">NÚMERO DO PEDIDO *</label>
              <input
                type="text"
                required
                value={form.pedido}
                onChange={(e) => setForm({ ...form, pedido: e.target.value })}
                onBlur={(e) => verificarPedidoImediato(e.target.value)}
                placeholder="Ex: 192973"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ATENDENTE *</label>
              <select
                required
                value={form.atendente}
                onChange={(e) => setForm({ ...form, atendente: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 font-medium bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Selecione o Atendente</option>
                {ATENDENTES.map((atendente) => (
                  <option key={atendente} value={atendente}>{atendente}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">NOTA FISCAL (NF)</label>
              <input
                type="text"
                value={form.nf}
                onChange={(e) => setForm({ ...form, nf: e.target.value })}
                placeholder="Número da NF"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">BLING (Até 30 dígitos)</label>
              <input
                type="text"
                maxLength={30}
                value={form.bling}
                onChange={(e) => setForm({ ...form, bling: e.target.value })}
                placeholder="ID Bling"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">TICKET (Plataforma)</label>
              <input
                type="text"
                value={form.ticket}
                onChange={(e) => setForm({ ...form, ticket: e.target.value })}
                placeholder="Nº do Ticket"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">OBSERVAÇÃO / MOTIVO *</label>
              <textarea
                rows="2"
                required
                value={form.obs}
                onChange={(e) => setForm({ ...form, obs: e.target.value })}
                placeholder="Descreva o motivo do chamado... (Pode quebrar linhas)"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none resize-y"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium p-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                {loading ? 'Salvando...' : 'Cadastrar Chamado'}
              </button>
            </div>

          </form>
        </div>

        {/* Tabela de Chamados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Histórico de Chamados (Prioridade: Em Análise &gt; Nenhum Status)</h2>
            <span className="text-xs text-gray-500">Ordenado por status prioritário e antiguidade</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-amber-900 text-white text-xs uppercase tracking-wider">
                  <th className="p-3 border-b border-amber-950">Data Original</th>
                  <th className="p-3 border-b border-amber-950">Pedido</th>
                  <th className="p-3 border-b border-amber-950">NF</th>
                  <th className="p-3 border-b border-amber-950">Bling</th>
                  <th className="p-3 border-b border-amber-950">Ticket</th>
                  <th className="p-3 border-b border-amber-950">Atendente (Criador)</th>
                  <th className="p-3 border-b border-amber-950">
                    <div className="flex justify-between items-center">
                      <span>Histórico / Timeline de Observações</span>
                    </div>
                  </th>
                  <th className="p-3 border-b border-amber-950">Status</th>
                  <th className="p-3 border-b border-amber-950">Resolução (Wesley)</th>
                  <th className="p-3 border-b border-amber-950 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chamadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center p-6 text-gray-400">Nenhum chamado encontrado.</td>
                  </tr>
                ) : (
                  chamadosFiltrados.map((item) => (
                    <tr 
                      key={item._id} 
                      className={`transition-colors align-top border-b border-gray-300 ${LINHA_STATUS_CORES[item.status] || LINHA_STATUS_CORES['']}`}
                    >
                      <td className="p-3 text-gray-800 font-medium text-xs whitespace-nowrap border-r border-gray-200/60">{item.dataCriacao || '-'}</td>
                      <td className="p-3 font-bold text-gray-900 whitespace-nowrap border-r border-gray-200/60">{item.pedido}</td>
                      <td className="p-3 text-gray-700 border-r border-gray-200/60">{item.nf || '-'}</td>
                      <td className="p-3 text-gray-700 truncate max-w-xs border-r border-gray-200/60">{item.bling || '-'}</td>
                      <td className="p-3 text-gray-700 border-r border-gray-200/60">{item.ticket || '-'}</td>
                      <td className="p-3 font-medium text-gray-800 border-r border-gray-200/60">{item.atendenteCriacao}</td>
                      
                      {/* Timeline com Botão "+" Rápido */}
                      <td className="p-3 space-y-2 max-w-md border-r border-gray-200/60 relative">
                        <div className="flex justify-end mb-1">
                          <button
                            type="button"
                            onClick={() => { setAdicionandoEmId(item._id); setAtendenteRapido(''); setStatusRapido(item.status || ''); setObsRapida(''); }}
                            title="Adicionar nova observação rapidamente"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                          >
                            + Novo Comentário
                          </button>
                        </div>

                        {item.timeline?.map((t) => {
                          const isResolucao = t.tipo === 'resolucao' || t.atendente === 'WESLEY';
                          const isEditando = editandoTimelineId === t._id;

                          return (
                            <div 
                              key={t._id} 
                              className={`p-2.5 rounded border text-xs ${
                                isResolucao 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm' 
                                  : 'bg-white/90 border-amber-200 text-gray-800 shadow-xs'
                              }`}
                            >
                              <div className="flex justify-between font-bold items-center">
                                <span className={isResolucao ? 'text-emerald-800' : 'text-amber-900'}>
                                  {isResolucao ? '🟢 WESLEY (Resolução)' : `👤 ${t.atendente}`}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 font-normal">{t.data}</span>
                                  {!isEditando && (
                                    <>
                                      <button 
                                        onClick={() => { setEditandoTimelineId(t._id); setTextoEditado(t.obs); }}
                                        title="Editar observação"
                                        className="text-gray-500 hover:text-blue-600 text-xs"
                                      >
                                        ✏️
                                      </button>
                                      <button 
                                        onClick={() => deletarItemTimeline(item._id, t._id)}
                                        title="Excluir observação"
                                        className="text-gray-500 hover:text-red-600 text-xs"
                                      >
                                        🗑️
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {isEditando ? (
                                <div className="mt-2 space-y-2">
                                  <textarea
                                    rows="2"
                                    value={textoEditado}
                                    onChange={(e) => setTextoEditado(e.target.value)}
                                    className="w-full p-1.5 border rounded text-xs bg-white text-gray-900"
                                  />
                                  <div className="flex justify-end gap-1">
                                    <button 
                                      onClick={() => setEditandoTimelineId(null)}
                                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px]"
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      onClick={() => salvarEdicaoTimeline(item._id, t._id)}
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-[10px]"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-1 font-medium whitespace-pre-wrap">{t.obs}</div>
                              )}
                            </div>
                          );
                        })}

                        {/* Caixa de Adição Rápida com Status Obrigatório */}
                        {adicionandoEmId === item._id && (
                          <div className="bg-emerald-50 border-2 border-emerald-400 p-3 rounded-lg shadow-md space-y-2 mt-2">
                            <div className="text-xs font-bold text-emerald-900 uppercase">Novo Comentário na Timeline:</div>
                            
                            <select
                              value={atendenteRapido}
                              onChange={(e) => setAtendenteRapido(e.target.value)}
                              className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white text-gray-900 font-medium focus:outline-none"
                            >
                              <option value="">Selecione o Atendente *</option>
                              {ATENDENTES.map((atendente) => (
                                <option key={atendente} value={atendente}>{atendente}</option>
                              ))}
                            </select>

                            <select
                              required
                              value={statusRapido}
                              onChange={(e) => setStatusRapido(e.target.value)}
                              className="w-full border border-emerald-300 rounded p-1.5 text-xs bg-white text-gray-900 font-bold focus:outline-none"
                            >
                              <option value="">Selecione o Status Obrigatório *</option>
                              <option value="EM ANÁLISE">EM ANÁLISE</option>
                              <option value="REPASSADO">REPASSADO</option>
                              <option value="FINALIZADO">FINALIZADO</option>
                              <option value="RETOR. CLIEN">RETOR. CLIEN</option>
                              <option value="AGENDADO">AGENDADO</option>
                            </select>

                            <textarea
                              rows="2"
                              value={obsRapida}
                              onChange={(e) => setObsRapida(e.target.value)}
                              placeholder="Digite a nova observação..."
                              className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white text-gray-900 focus:outline-none resize-y"
                            />

                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setAdicionandoEmId(null)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-medium"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => salvarAdicaoRapida(item._id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-medium"
                              >
                                Salvar Comentário
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      
                      {/* Status */}
                      <td className="p-3 border-r border-gray-200/60">
                        <select
                          value={item.status || ''}
                          onChange={(e) => atualizarCampo(item._id, { status: e.target.value })}
                          className={`text-xs font-bold p-1.5 rounded-lg border ${STATUS_CORES[item.status] || STATUS_CORES['']} focus:outline-none`}
                        >
                          <option value="">(Nenhum Status)</option>
                          <option value="EM ANÁLISE">EM ANÁLISE</option>
                          <option value="REPASSADO">REPASSADO</option>
                          <option value="FINALIZADO">FINALIZADO</option>
                          <option value="RETOR. CLIEN">RETOR. CLIEN</option>
                          <option value="AGENDADO">AGENDADO</option>
                        </select>
                      </td>

                      {/* Resolução */}
                      <td className="p-3 border-r border-gray-200/60">
                        <textarea
                          rows="4"
                          defaultValue={item.resolucao || `Pedido: ${item.pedido}\nBling: ${item.bling || '-'}\nNF: ${item.nf || '-'}\n`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              e.target.blur();
                              atualizarCampo(item._id, { resolucao: e.target.value });
                            }
                          }}
                          placeholder="Digite a resolução..."
                          className="w-full border border-emerald-300 rounded p-2 text-xs text-gray-900 font-semibold bg-white/80 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y"
                        />
                      </td>

                      {/* Excluir Chamado */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => deletarChamado(item._id, item.pedido)}
                          title="Excluir Chamado Inteiro"
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg border border-red-200 transition-colors"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal de Pedido Duplicado */}
      {pedidoExistenteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-xl w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 text-amber-600">
              <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pedido #{pedidoExistenteModal.pedido} Já Cadastrado!</h3>
                <p className="text-xs text-gray-500">Veja abaixo o histórico e gerencie este pedido:</p>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase">Status Atual do Pedido:</span>
              <select
                value={pedidoExistenteModal.status || ''}
                onChange={(e) => atualizarCampo(pedidoExistenteModal._id, { status: e.target.value })}
                className={`text-xs font-bold p-1.5 rounded-lg border ${STATUS_CORES[pedidoExistenteModal.status] || STATUS_CORES['']} focus:outline-none`}
              >
                <option value="">(Nenhum Status)</option>
                <option value="EM ANÁLISE">EM ANÁLISE</option>
                <option value="REPASSADO">REPASSADO</option>
                <option value="FINALIZADO">FINALIZADO</option>
                <option value="RETOR. CLIEN">RETOR. CLIEN</option>
                <option value="AGENDADO">AGENDADO</option>
              </select>
            </div>

            <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 space-y-2 max-h-40 overflow-y-auto">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Histórico de Conversas Anteriores:</div>
              {pedidoExistenteModal.timeline?.map((t) => {
                const isRes = t.tipo === 'resolucao' || t.atendente === 'WESLEY';
                return (
                  <div key={t._id} className={`p-2 rounded border text-xs ${isRes ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-gray-200 text-gray-800'}`}>
                    <div className="flex justify-between font-bold">
                      <span className={isRes ? 'text-emerald-800' : 'text-amber-900'}>
                        {isRes ? '🟢 WESLEY (Resolução)' : `👤 ${t.atendente}`}
                      </span>
                      <span className="text-gray-500 font-normal">{t.data}</span>
                    </div>
                    <div className="mt-1 font-medium whitespace-pre-wrap">{t.obs}</div>
                  </div>
                );
              })}
            </div>

            {modoAtualizacao && (
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-xs font-bold text-gray-700 uppercase">Adicionar Nova Atualização / Contato:</div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">SEU NOME (ATENDENTE) *</label>
                  <select
                    value={atendenteAtualizador}
                    onChange={(e) => setAtendenteAtualizador(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 font-medium bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">Selecione quem está atendendo agora</option>
                    {ATENDENTES.map((atendente) => (
                      <option key={atendente} value={atendente}>{atendente}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">NOVA OBSERVAÇÃO / SOLICITAÇÃO DO CLIENTE *</label>
                  <textarea
                    rows="3"
                    value={novaObservacao}
                    onChange={(e) => setNovaObservacao(e.target.value)}
                    placeholder="Descreva o novo contato..."
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 font-medium bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setPedidoExistenteModal(null); setModoAtualizacao(false); setForm({ ...form, pedido: '' }); }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Fechar / Limpar Pedido
                  </button>
                  <button
                    type="button"
                    onClick={handleAtualizarExistente}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Adicionar à Timeline
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
