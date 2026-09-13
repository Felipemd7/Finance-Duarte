import React, { useState } from 'react';
import {
  Mic,
  Volume2,
  Terminal,
  Play,
  CheckCircle2,
  Copy,
  ExternalLink,
  Code2,
  Sparkles,
  Smartphone,
  Radio,
} from 'lucide-react';
import { formatBRL } from '../utils/formatters.ts';

interface VoiceIntegrationsViewProps {
  onRefreshData: () => Promise<void>;
}

export const VoiceIntegrationsView: React.FC<VoiceIntegrationsViewProps> = ({
  onRefreshData,
}) => {
  const [activeVoiceTool, setActiveVoiceTool] = useState<'alexa' | 'siri'>('alexa');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Quick tests for Alexa & Siri
  const voiceTests = [
    {
      id: 'alexa-add-arroz',
      service: 'alexa',
      title: 'Adicionar à Lista de Supermercado',
      command: '“Alexa, adicionar 2 kg de arroz à lista de supermercado”',
      method: 'POST',
      url: '/api/listas-compras',
      payload: {
        item: '2 kg de arroz',
        tipo_estabelecimento: 'Supermercado',
        origem: 'Alexa',
      },
      description: 'Cria automaticamente um item pendente vinculado ao supermercado.',
    },
    {
      id: 'alexa-query-supermercado',
      service: 'alexa',
      title: 'Consultar Gastos em Supermercado no Mês',
      command: '“Alexa, quanto eu gastei em supermercado este mês?”',
      method: 'GET',
      url: '/api/resumo-mensal?mes=2026-08&subcategoria=supermercado',
      description: 'Retorna a resposta falada e dados estruturados de expectativa vs realidade.',
    },
    {
      id: 'alexa-query-estouro',
      service: 'alexa',
      title: 'Consultar Categorias Estouradas',
      command: '“Alexa, alguma categoria estourou o orçamento este mês?”',
      method: 'GET',
      url: '/api/categorias-estouradas?mes=2026-08',
      description: 'Informa alertas de estouro e valor excedente em cada categoria.',
    },
    {
      id: 'siri-register-lazer',
      service: 'siri',
      title: 'Registrar Despesa Imediata por Voz',
      command: '“Siri, registrar despesa de R$ 50 em Lazer hoje”',
      method: 'POST',
      url: '/api/siri/transacao',
      payload: {
        valor: 50.0,
        subcategoria: 'Lazer',
        descricao: 'Café da tarde e sorvete',
        usuario: 'Felipe Duarte',
      },
      description: 'Registra a transação com data de hoje e atualiza o saldo do casal.',
    },
    {
      id: 'siri-query-carro',
      service: 'siri',
      title: 'Consultar Custos Totais do Carro',
      command: '“Siri, quanto já gastamos com o carro este ano?”',
      method: 'GET',
      url: '/api/resumo-mensal?mes=2026-all&subcategoria=carro',
      description: 'Soma combustível, rastreador, manutenção, seguro e IPVA.',
    },
  ];

  const handleRunVoiceTest = async (test: any) => {
    setIsRunningTest(true);
    setTestResult(null);

    try {
      let res;
      if (test.method === 'POST') {
        res = await fetch(test.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.payload),
        });
      } else {
        res = await fetch(test.url);
      }

      const json = await res.json();
      setTestResult({
        test,
        status: res.status,
        response: json,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Refresh parent data if something was written
      if (test.method === 'POST') {
        await onRefreshData();
      }
    } catch (e: any) {
      setTestResult({
        test,
        status: 500,
        response: { error: e.message },
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-sm">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Integrações de Voz (Alexa & Siri)
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              API REST completa para alimentar assistentes virtuais do casal com consultas e inclusão rápida de despesas
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Playground & Command Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Command Buttons */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <Radio className="w-4 h-4 mr-2 text-cyan-600 animate-pulse" />
                Playground de Comandos de Voz
              </h2>
              <span className="text-[11px] text-slate-400">Clique em "Executar" para simular</span>
            </div>

            <div className="space-y-3">
              {voiceTests.map((vt, idx) => (
                <div
                  key={vt.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/20 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            vt.service === 'alexa'
                              ? 'bg-cyan-100 text-cyan-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {vt.service}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{vt.title}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1 italic">
                        {vt.command}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{vt.description}</p>
                    </div>

                    <button
                      onClick={() => handleRunVoiceTest(vt)}
                      disabled={isRunningTest}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg transition shrink-0 ml-2"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Testar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Response Console & Audio Simulation */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-lg min-h-[380px] flex flex-col justify-between font-mono text-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 text-[11px]">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Terminal de Retorno da Assistente</span>
                </div>
                <span>{testResult?.timestamp || 'Aguardando comando...'}</span>
              </div>

              {testResult ? (
                <div className="mt-4 space-y-3">
                  {/* Spoken output highlight */}
                  {testResult.response?.fala && (
                    <div className="p-3 bg-cyan-950/80 border border-cyan-800 rounded-xl text-cyan-200">
                      <div className="flex items-center space-x-2 text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Áudio / Fala da Assistente:</span>
                      </div>
                      <p className="font-sans text-sm font-semibold text-white">
                        "{testResult.response.fala}"
                      </p>
                    </div>
                  )}

                  {/* JSON Payload response */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                      Payload JSON Retornado (Status {testResult.status}):
                    </div>
                    <pre className="p-3 bg-slate-900 rounded-xl overflow-x-auto text-[11px] text-emerald-400 border border-slate-800">
                      {JSON.stringify(testResult.response, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-500 font-sans text-xs">
                  Selecione um comando à esquerda para ver a resposta em tempo real falada e em JSON.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between items-center">
              <span>Endpoint: {testResult?.test?.url || 'Pronto'}</span>
              <span className="text-emerald-400">● Conectado ao Casal Duarte Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Developer API Documentation Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Code2 className="w-5 h-5 mr-2 text-slate-600" />
            Documentação da API REST (Endpoints para Siri e Alexa)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            URLs prontas para configurar no aplicativo "Atalhos" (Shortcuts) do iPhone ou na Skill da Alexa Developer Console
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Endpoint 1 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                POST
              </span>
              <span className="text-slate-400 font-mono text-[11px]">/api/listas-compras</span>
            </div>
            <p className="text-slate-700 font-semibold mb-1">
              Adiciona itens à lista de compras por voz
            </p>
            <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-[10px] overflow-x-auto">
{`{
  "item": "2 kg de arroz",
  "tipo_estabelecimento": "Supermercado",
  "origem": "Alexa"
}`}
            </pre>
          </div>

          {/* Endpoint 2 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                GET
              </span>
              <span className="text-slate-400 font-mono text-[11px]">/api/resumo-mensal</span>
            </div>
            <p className="text-slate-700 font-semibold mb-1">
              Consulta resumo de gastos ou subcategoria específica
            </p>
            <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-600 text-[11px]">
              Query params: <code>?mes=2026-08&subcategoria=supermercado</code>
            </div>
          </div>

          {/* Endpoint 3 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                GET
              </span>
              <span className="text-slate-400 font-mono text-[11px]">/api/categorias-estouradas</span>
            </div>
            <p className="text-slate-700 font-semibold mb-1">
              Verifica se alguma subcategoria ultrapassou o orçamento
            </p>
            <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-600 text-[11px]">
              Query params: <code>?mes=2026-08</code>
            </div>
          </div>

          {/* Endpoint 4 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                POST
              </span>
              <span className="text-slate-400 font-mono text-[11px]">/api/siri/transacao</span>
            </div>
            <p className="text-slate-700 font-semibold mb-1">
              Grava transação financeira direto pelo iPhone / Apple Watch
            </p>
            <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-[10px] overflow-x-auto">
{`{
  "valor": 50.0,
  "subcategoria": "Lazer",
  "descricao": "Café",
  "usuario": "Felipe Duarte"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
