import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit3,
  Users,
  CreditCard,
  Building2,
  Calendar,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Fuel,
} from 'lucide-react';
import { Transaction, CategoryType } from '../types';
import {
  addTransactionToCloud,
  updateTransactionInCloud,
  mapCategoryToId,
  mapSubcategoryToId,
} from '../services/supabaseService';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  defaultMonth?: string;
  transactionToEdit?: Transaction | null;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultMonth,
  transactionToEdit,
}) => {
  const [estabelecimento, setEstabelecimento] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState<CategoryType>('Variável');
  const [subcategoria, setSubcategoria] = useState('Supermercado');
  const [formaPagamento, setFormaPagamento] = useState('Cartão conjunto Inter');
  const [responsavel, setResponsavel] = useState<'Felipe' | 'Genivânia'>('Felipe');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');

  // Fuel Telemetry states
  const [kmAtual, setKmAtual] = useState('');
  const [litros, setLitros] = useState('');
  const [combustivel, setCombustivel] = useState('Gasolina Comum');

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync state when opening or when transactionToEdit changes
  useEffect(() => {
    if (transactionToEdit) {
      setEstabelecimento(transactionToEdit.estabelecimento || '');
      setValor(transactionToEdit.valor !== undefined ? String(transactionToEdit.valor) : '');
      setData(transactionToEdit.data ? transactionToEdit.data.slice(0, 10) : new Date().toISOString().split('T')[0]);
      setCategoria((transactionToEdit.categoria as CategoryType) || 'Variável');
      setSubcategoria(transactionToEdit.subcategoria || 'Supermercado');
      setFormaPagamento(transactionToEdit.formaPagamento || 'Cartão conjunto Inter');
      setResponsavel(
        transactionToEdit.pagoPor === 'Genivânia' || transactionToEdit.usuario_id === 'usr-genivania'
          ? 'Genivânia'
          : 'Felipe'
      );
      setObservacoes(transactionToEdit.observacoes || '');
      setStatus(
        transactionToEdit.status === 'pendente' || transactionToEdit.status === 'previsto'
          ? 'pendente'
          : 'pago'
      );
      setKmAtual(transactionToEdit.kmAtual ? String(transactionToEdit.kmAtual) : '');
      setLitros(transactionToEdit.litros ? String(transactionToEdit.litros) : '');
      setCombustivel(transactionToEdit.combustivel || 'Gasolina Comum');
      setSaveError(null);
      setSaveSuccess(null);
    } else {
      setEstabelecimento('');
      setValor('');
      setData(new Date().toISOString().split('T')[0]);
      setCategoria('Variável');
      setSubcategoria('Supermercado');
      setFormaPagamento('Cartão conjunto Inter');
      setResponsavel('Felipe');
      setObservacoes('');
      setStatus('pago');
      setKmAtual('');
      setLitros('');
      setCombustivel('Gasolina Comum');
      setSaveError(null);
      setSaveSuccess(null);
    }
  }, [transactionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(valor.replace(',', '.'));
    if (isNaN(numVal) || numVal <= 0) {
      setSaveError('Por favor, informe um valor válido maior que zero.');
      return;
    }

    if (!estabelecimento.trim()) {
      setSaveError('Por favor, informe o estabelecimento ou local.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const formaLower = formaPagamento.toLowerCase();
    const isCredit =
      formaLower.includes('inter') ||
      formaLower.includes('credito') ||
      formaLower.includes('crédito') ||
      (formaLower.includes('cartao') && !formaLower.includes('debito'));

    const catId = mapCategoryToId(categoria);
    const subcatId = mapSubcategoryToId(subcategoria, categoria);
    const parsedKm = kmAtual ? parseInt(kmAtual.replace(/\D/g, ''), 10) : undefined;
    const parsedLitros = litros ? parseFloat(litros.replace(',', '.')) : undefined;

    if (transactionToEdit) {
      const updatedTx: Transaction = {
        ...transactionToEdit,
        usuario_id: responsavel === 'Genivânia' ? 'usr-genivania' : 'usr-felipe',
        data,
        mesReferencia: data.substring(0, 7),
        categoria,
        categoria_id: catId,
        subcategoria,
        subcategoria_id: subcatId,
        estabelecimento: estabelecimento.trim() || 'Estabelecimento Diverso',
        valor: numVal,
        formaPagamento,
        status: isCredit ? 'pendente' : status,
        pagoPor: responsavel,
        observacoes: observacoes.trim() || undefined,
        kmAtual: parsedKm,
        litros: parsedLitros,
        combustivel: subcategoria === 'Combustível' ? combustivel : undefined,
      };

      try {
        const res = await updateTransactionInCloud(updatedTx);
        if (res.success) {
          setSaveSuccess('Lançamento atualizado com sucesso no banco!');
          onSave(updatedTx);
          setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(null);
            onClose();
          }, 800);
        } else {
          setIsSaving(false);
          setSaveError(res.error || 'Erro ao atualizar lançamento no banco de dados.');
        }
      } catch (err: any) {
        setIsSaving(false);
        setSaveError(err?.message || 'Falha de comunicação ao atualizar.');
      }
    } else {
      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        usuario_id: responsavel === 'Genivânia' ? 'usr-genivania' : 'usr-felipe',
        data,
        mesReferencia: data.substring(0, 7),
        tipo: 'despesa',
        categoria,
        categoria_id: catId,
        subcategoria,
        subcategoria_id: subcatId,
        estabelecimento: estabelecimento.trim() || 'Estabelecimento Diverso',
        valor: numVal,
        formaPagamento,
        status: isCredit ? 'pendente' : status,
        pagoPor: responsavel,
        observacoes: observacoes.trim() || undefined,
        kmAtual: parsedKm,
        litros: parsedLitros,
        combustivel: subcategoria === 'Combustível' ? combustivel : undefined,
      };

      try {
        const res = await addTransactionToCloud(newTx);
        if (res.success) {
          setSaveSuccess('Lançamento salvo com sucesso no banco!');
          onSave(newTx);
          setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(null);
            onClose();
            setValor('');
            setEstabelecimento('');
            setObservacoes('');
          }, 800);
        } else {
          setIsSaving(false);
          setSaveError(res.error || 'Erro ao salvar lançamento no banco de dados.');
        }
      } catch (err: any) {
        setIsSaving(false);
        setSaveError(err?.message || 'Falha de comunicação ao salvar.');
      }
    }
  };

  const subcategoryOptions: Record<CategoryType, string[]> = {
    Invariável: ['Aluguel', 'Condomínio', 'Seguro (Carro)', 'Rastreador', 'Internet / TV', 'Assinaturas Extras'],
    Variável: ['Supermercado', 'Combustível', 'Farmácia', 'Estacionamento', 'Lazer', 'Manutenção de carro', 'Energia Elétrica / Luz', 'Água', 'Gás', 'Uber / Transporte'],
    'Extra/Eventualidades': ['IPVA', 'Presentes & Comemorações', 'Farmácia', 'Viagem', 'Manutenção Casa', 'Eventualidades'],
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-[#e5eeff] flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5eeff]">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${transactionToEdit ? 'bg-[#006194]' : 'bg-[#006948]'} text-white flex items-center justify-center`}>
              {transactionToEdit ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                {transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento de Despesa'}
              </h3>
              <p className="text-xs text-[#565e74]">Casal Duarte • {defaultMonth || '2026'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg hover:bg-[#eff4ff] text-[#565e74] disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback banners */}
        {saveSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2 font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="flex-1">{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 flex flex-col gap-3">
          {/* Valor */}
          <div>
            <label className="text-xs font-semibold text-[#0b1c30]">Valor (R$)</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-sm font-bold text-[#565e74]">R$</span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                disabled={isSaving}
                className="w-full pl-10 pr-3 py-2 text-base font-bold text-[#0b1c30] bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl focus:outline-hidden focus:border-[#006948]"
              />
            </div>
          </div>

          {/* Estabelecimento & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-[#0b1c30]">
                Estabelecimento / Local
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Atacadão, Shell, Droga Raia..."
                value={estabelecimento}
                onChange={(e) => setEstabelecimento(e.target.value)}
                disabled={isSaving}
                className="w-full mt-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl focus:outline-hidden focus:border-[#006948]"
              />
              {/* Quick suggestion pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1.5 scrollbar-none">
                {[
                  { name: 'Atacadão', full: 'Atacadão S/A', cat: 'Variável', sub: 'Supermercado' },
                  { name: 'Drogasil', full: 'Farmácia Drogasil', cat: 'Variável', sub: 'Farmácia' },
                  { name: 'Shell', full: 'Posto Shell', cat: 'Variável', sub: 'Combustível' },
                  { name: 'Pão de Açúcar', full: 'Pão de Açúcar', cat: 'Variável', sub: 'Supermercado' },
                  { name: "Sam's Club", full: "Sam's Club", cat: 'Variável', sub: 'Supermercado' },
                  { name: 'Mateus', full: 'Mix Mateus', cat: 'Variável', sub: 'Supermercado' },
                ].map((sug) => (
                  <button
                    key={sug.name}
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      setEstabelecimento(sug.full);
                      setCategoria(sug.cat as CategoryType);
                      setSubcategoria(sug.sub);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#006194] text-[10px] font-bold border border-[#dce9ff] whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {sug.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0b1c30]">Data</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={isSaving}
                className="w-full mt-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl focus:outline-hidden"
              />
            </div>
          </div>

          {/* Categoria & Subcategoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-[#0b1c30]">Categoria</label>
              <select
                value={categoria}
                disabled={isSaving}
                onChange={(e) => {
                  const newCat = e.target.value as CategoryType;
                  setCategoria(newCat);
                  setSubcategoria(subcategoryOptions[newCat]?.[0] || '');
                }}
                className="w-full mt-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl font-medium"
              >
                <option value="Variável">Variável (Dia a dia)</option>
                <option value="Invariável">Invariável (Custos fixos)</option>
                <option value="Extra/Eventualidades">Extra / Eventualidades</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0b1c30]">Subcategoria</label>
              <select
                value={subcategoria}
                disabled={isSaving}
                onChange={(e) => setSubcategoria(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl font-medium"
              >
                {(subcategoryOptions[categoria] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Telemetria de Combustível (Módulo de Metas & Veículo) */}
          {subcategoria === 'Combustível' && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Fuel className="w-3.5 h-3.5 text-amber-700" />
                <span>Telemetria do Veículo (Módulo de Metas • Marco: 124.524 km)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-amber-900 block">
                    Odômetro Atual (KM) <span className="font-normal text-amber-700 font-mono">(último: 124.524 km)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 124900"
                    value={kmAtual}
                    onChange={(e) => setKmAtual(e.target.value)}
                    disabled={isSaving}
                    className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-bold bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-amber-900 block">Litros (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 42.5"
                    value={litros}
                    onChange={(e) => setLitros(e.target.value)}
                    disabled={isSaving}
                    className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-bold bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-semibold text-amber-900 block">Combustível</label>
                  <select
                    value={combustivel}
                    onChange={(e) => setCombustivel(e.target.value)}
                    disabled={isSaving}
                    className="w-full mt-0.5 px-2 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-lg focus:outline-none"
                  >
                    <option value="Gasolina Comum">Gasolina Comum</option>
                    <option value="Gasolina Aditivada">Gasolina Aditivada</option>
                    <option value="Etanol">Etanol</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Forma de Pagamento */}
          <div>
            <label className="text-xs font-semibold text-[#0b1c30]">Forma de Pagamento</label>
            <select
              value={formaPagamento}
              disabled={isSaving}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl font-medium"
            >
              <option value="Cartão conjunto Inter">Cartão conjunto Inter (Crédito - Pendente)</option>
              <option value="PIX">PIX</option>
              <option value="Débito em Conta">Débito em Conta</option>
              <option value="Boleto Bancário">Boleto Bancário</option>
              <option value="Dinheiro">Dinheiro Físico</option>
            </select>
            <div className="mt-1.5">
              {formaPagamento.toLowerCase().includes('inter') ||
              formaPagamento.toLowerCase().includes('credito') ||
              formaPagamento.toLowerCase().includes('crédito') ||
              (formaPagamento.toLowerCase().includes('cartao') &&
                !formaPagamento.toLowerCase().includes('debito')) ? (
                <div className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  💳 <strong>Cartão conjunto Inter:</strong> Classificado como <strong>Pendente</strong>. Não entra como desembolso imediato de quem passou o cartão; será quitado no fechamento futuro da fatura conjunta do casal.
                </div>
              ) : (
                <div className="text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  ✅ <strong>À Vista ({formaPagamento}):</strong> Classificado como <strong>Pago</strong>. Entra como desembolso imediato de <strong>{responsavel}</strong> para o rateio 50/50.
                </div>
              )}
            </div>
          </div>

          {/* Situação / Status */}
          <div>
            <label className="text-xs font-semibold text-[#0b1c30] flex items-center justify-between">
              <span>Situação do Lançamento</span>
              <span className="text-[10px] text-[#565e74]">
                {status === 'pendente' ? 'Pendente de quitação' : 'Desembolso já quitado'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setStatus('pago')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  status === 'pago'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-[#0b1c30] border border-[#cbd5e1] hover:bg-[#eff4ff]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pago</span>
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setStatus('pendente')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  status === 'pendente'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-[#0b1c30] border border-[#cbd5e1] hover:bg-[#eff4ff]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pendente</span>
              </button>
            </div>
          </div>

          {/* Quem pagou */}
          <div>
            <label className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5 mb-1.5">
              <Users className="w-3.5 h-3.5 text-[#006948]" />
              Quem realizou o pagamento?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setResponsavel('Felipe')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  responsavel === 'Felipe'
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-[#0b1c30] border border-[#cbd5e1] hover:bg-[#eff4ff]'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  F
                </span>
                Felipe Duarte
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setResponsavel('Genivânia')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  responsavel === 'Genivânia'
                    ? 'bg-[#ec4899] text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-[#0b1c30] border border-[#cbd5e1] hover:bg-[#eff4ff]'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  G
                </span>
                Genivânia Duarte
              </button>
            </div>
            <p className="text-[10px] text-[#565e74] mt-1.5">
              Despesa integrada ao orçamento conjunto 50/50 do casal.
            </p>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-[#0b1c30]">Observações (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: Compra com desconto, parcelado em 2x..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={isSaving}
              className="w-full mt-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e5eeff]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-[#565e74] hover:bg-[#f1f5f9] rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#006948] hover:bg-[#00563b] disabled:bg-[#006948]/60 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no banco...</span>
                </>
              ) : (
                <span>{transactionToEdit ? 'Salvar Alterações' : 'Salvar Lançamento'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
