import React, { useState, useEffect } from 'react';
import {
  Mic,
  Volume2,
  Terminal,
  Code2,
  Copy,
  CheckCircle2,
  Play,
  Sparkles,
  Smartphone,
  Radio,
  ArrowRight,
} from 'lucide-react';

export const VoiceApiView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alexa' | 'siri' | 'logs'>('alexa');
  const [logs, setLogs] = useState<any[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Live tester state
  const [testAssistant, setTestAssistant] = useState<'alexa' | 'siri'>('alexa');
  const [testCommand, setTestCommand] = useState('Alexa, quanto gastei em supermercado este mês?');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/voice/logs');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExecuteVoiceTest = async () => {
    setLoadingTest(true);
    setTestResult(null);

    try {
      if (testAssistant === 'alexa') {
        let intent = 'ConsultarGastos';
        let slots: any = { categoria: 'supermercado' };

        if (testCommand.toLowerCase().includes('adicionar')) {
          intent = 'AdicionarItemLista';
          slots = { item: 'Feijão carioca', local: 'Supermercado', quantidade: '2 un' };
        } else if (testCommand.toLowerCase().includes('estouro') || testCommand.toLowerCase().includes('estourou')) {
          intent = 'VerificarEstouro';
          slots = {};
        } else if (testCommand.toLowerCase().includes('meta')) {
          intent = 'ConsultarMetas';
          slots = {};
        }

        const res = await fetch('/api/voice/alexa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent,
            commandText: testCommand,
            slots,
          }),
        });
        const data = await res.json();
        setTestResult(data.response?.outputSpeech?.text || 'Sucesso!');
      } else {
        const res = await fetch('/api/voice/siri', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RegistrarDespesa',
            commandText: testCommand,
            params: { valor: 65.5, subcategoria: 'Lazer', estabelecimento: 'Cafeteria' },
          }),
        });
        const data = await res.json();
        setTestResult(data.message || 'Sucesso!');
      }
      fetchLogs();
    } catch (err: any) {
      setTestResult('Erro: ' + err.message);
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div id="voice-api-container" className="max-w-5xl mx-auto flex flex-col gap-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e5eeff] shadow-xs">
        <div>
          <h2 className="font-display font-bold text-lg sm:text-xl text-[#0b1c30] flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#006948]" />
            Integração por Voz: Alexa Skill & Siri Shortcuts
          </h2>
          <p className="text-xs text-[#565e74]">
            APIs REST em produção para comandos por voz no ecossistema do Casal Duarte
          </p>
        </div>

        <div className="flex bg-[#eff4ff] p-1 rounded-xl border border-[#dce9ff]">
          <button
            onClick={() => setActiveTab('alexa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'alexa'
                ? 'bg-white text-[#006948] shadow-xs'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            Amazon Alexa
          </button>
          <button
            onClick={() => setActiveTab('siri')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'siri'
                ? 'bg-white text-[#006948] shadow-xs'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            Apple Siri
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-white text-[#006948] shadow-xs'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            Logs em Tempo Real ({logs.length})
          </button>
        </div>
      </div>

      {/* Interactive Simulator */}
      <div className="p-4 bg-white rounded-2xl border border-[#e5eeff] shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-sm text-[#0b1c30] flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-[#006948]" />
            Console Interativo de Testes de Voz
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948]">
            API Online • Port 3000
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={testAssistant}
            onChange={(e) => setTestAssistant(e.target.value as any)}
            className="px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl font-bold text-[#0b1c30]"
          >
            <option value="alexa">Amazon Alexa</option>
            <option value="siri">Apple Siri</option>
          </select>

          <input
            type="text"
            value={testCommand}
            onChange={(e) => setTestCommand(e.target.value)}
            placeholder="Digite o comando por voz..."
            className="flex-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl focus:outline-hidden"
          />

          <button
            onClick={handleExecuteVoiceTest}
            disabled={loadingTest}
            className="px-4 py-2 bg-[#006948] hover:bg-[#00563b] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loadingTest ? 'Executando...' : 'Enviar Comando'}</span>
          </button>
        </div>

        {/* Voice suggestions */}
        <div className="flex flex-wrap gap-1.5 text-xs text-[#565e74]">
          <span className="text-[11px] font-medium mr-1">Sugestões:</span>
          {[
            'Alexa, adicionar café em grãos à lista do supermercado',
            'Alexa, quanto eu gastei em supermercado este mês?',
            'Alexa, alguma categoria estourou o orçamento?',
            'Siri, registrar despesa de R$ 50 em Lazer hoje',
          ].map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                setTestCommand(cmd);
                setTestAssistant(cmd.startsWith('Siri') ? 'siri' : 'alexa');
              }}
              className="text-[10px] px-2 py-0.5 rounded-md bg-[#eff4ff] hover:bg-[#dce9ff] text-[#006948] transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Test Result Speech Box */}
        {testResult && (
          <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#dce9ff] flex items-start gap-2.5 animate-in fade-in">
            <Volume2 className="w-5 h-5 text-[#006948] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#006948] uppercase tracking-wider">
                Resposta de Voz do Assistente ({testAssistant.toUpperCase()})
              </span>
              <p className="text-xs font-semibold text-[#0b1c30] mt-0.5">"{testResult}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Documentation based on tab */}
      {activeTab === 'alexa' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-white rounded-2xl border border-[#e5eeff] shadow-xs flex flex-col gap-3">
            <h3 className="font-display font-bold text-sm text-[#0b1c30] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#006948]" />
              Esquema de Intenções da Skill Alexa
            </h3>
            <p className="text-xs text-[#565e74]">
              Endpoint configurado para responder no protocolo padrão Alexa Custom Skills
              (JSON Response com outputSpeech PlainText).
            </p>

            <div className="space-y-3 pt-1">
              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0b1c30]">
                    1. Intenção: AdicionarItemLista
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#dae2fd] text-[#131b2e]">
                    POST /api/voice/alexa
                  </span>
                </div>
                <p className="text-[11px] text-[#565e74] mt-1">
                  Exemplo de comando: "Alexa, adicionar 2 kg de arroz à lista do supermercado"
                </p>
                <pre className="mt-2 p-2 bg-[#0b1c30] text-[#ecfdf5] text-[10px] rounded-lg font-mono overflow-x-auto">
{`{
  "intent": "AdicionarItemLista",
  "slots": {
    "item": "2 kg de arroz",
    "local": "Supermercado"
  }
}`}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0b1c30]">
                    2. Intenção: ConsultarGastos
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#dae2fd] text-[#131b2e]">
                    POST /api/voice/alexa
                  </span>
                </div>
                <p className="text-[11px] text-[#565e74] mt-1">
                  Exemplo de comando: "Alexa, quanto eu gastei em supermercado este mês?"
                </p>
                <pre className="mt-2 p-2 bg-[#0b1c30] text-[#ecfdf5] text-[10px] rounded-lg font-mono overflow-x-auto">
{`{
  "intent": "ConsultarGastos",
  "slots": {
    "categoria": "supermercado"
  }
}`}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0b1c30]">
                    3. Intenção: VerificarEstouro
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#dae2fd] text-[#131b2e]">
                    POST /api/voice/alexa
                  </span>
                </div>
                <p className="text-[11px] text-[#565e74] mt-1">
                  Exemplo de comando: "Alexa, alguma categoria estourou o orçamento?"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'siri' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-white rounded-2xl border border-[#e5eeff] shadow-xs flex flex-col gap-3">
            <h3 className="font-display font-bold text-sm text-[#0b1c30] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#006948]" />
              Atalhos do iOS / Siri Shortcuts
            </h3>
            <p className="text-xs text-[#565e74]">
              Permite acionar ações rápidas dizendo "E aí Siri, registrar gasto no Duarte Finanças".
            </p>

            <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0b1c30]">
                  Ação: RegistrarDespesa (Siri)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#dae2fd] text-[#131b2e]">
                  POST /api/voice/siri
                </span>
              </div>
              <pre className="mt-2 p-2 bg-[#0b1c30] text-[#ecfdf5] text-[10px] rounded-lg font-mono overflow-x-auto">
{`curl -X POST http://localhost:3000/api/voice/siri \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "RegistrarDespesa",
    "params": {
      "valor": 50,
      "subcategoria": "Lazer",
      "estabelecimento": "Cinema"
    }
  }'`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="p-4 bg-white rounded-2xl border border-[#e5eeff] shadow-xs flex flex-col gap-2">
          <span className="font-display font-bold text-sm text-[#0b1c30]">
            Histórico Recente de Interações de Voz
          </span>
          <div className="divide-y divide-[#f1f5f9]">
            {logs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        log.source === 'Alexa'
                          ? 'bg-[#eff4ff] text-[#006194]'
                          : 'bg-[#dae2fd] text-[#131b2e]'
                      }`}
                    >
                      {log.source}
                    </span>
                    <span className="text-[#565e74] text-[11px]">{log.timestamp}</span>
                  </div>
                  <span className="font-semibold text-[#0b1c30] mt-1 truncate">
                    "{log.command}"
                  </span>
                  <span className="text-[#006948] text-[11px] mt-0.5">
                    → Resposta: {log.result}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#006948] bg-[#ecfdf5] px-2 py-0.5 rounded-full shrink-0">
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
