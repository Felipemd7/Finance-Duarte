import React, { useState } from 'react';
import {
  X,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  CreditCard,
  Building2,
  Calendar,
  Tag,
} from 'lucide-react';
import { Transaction, CategoryType, PartnerSplit } from '../types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  defaultMonth: string;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultMonth,
}) => {
  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa');
  const [estabelecimento, setEstabelecimento] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState<CategoryType>('Variável');
  const [subcategoria, setSubcategoria] = useState('Supermercado');
  const [formaPagamento, setFormaPagamento] = useState('Cartão de Crédito NuBank');
  const [splitType, setSplitType] = useState<'50/50' | '100_guilherme' | '100_mariana'>('50/50');
  const [observacoes, setObservacoes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(valor.replace(',', '.'));
    if (isNaN(numVal) || numVal <= 0) return;

    let split: PartnerSplit = {
      tipo: splitType,
      porcentagemGuilherme: 50,
      porcentagemMariana: 50,
      valorGuilherme: numVal / 2,
      valorMariana: numVal / 2,
    };

    if (splitType === '100_guilherme') {
      split = {
        tipo: '100_guilherme',
        porcentagemGuilherme: 100,
        porcentagemMariana: 0,
        valorGuilherme: numVal,
        valorMariana: 0,
      };
    } else if (splitType === '100_mariana') {
      split = {
        tipo: '100_mariana',
        porcentagemGuilherme: 0,
        porcentagemMariana: 100,
        valorGuilherme: 0,
        valorMariana: numVal,
      };
    }

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      data,
      tipo,
      categoria: tipo === 'receita' ? 'Receita' : categoria,
      subcategoria,
      estabelecimento: estabelecimento.trim() || 'Estabelecimento Diverso',
      valor: numVal,
      formaPagamento,
      status: 'pago',
      pagoPor: splitType === '100_mariana' ? 'Mariana' : 'Guilherme',
      divisaoCasal: split,
      observacoes: observacoes.trim() || undefined,
    };

    onSave(newTx);
    onClose();
  };

  const subcategoryOptions: Record<CategoryType, string[]> = {
    Invariável: ['Aluguel', 'Condomínio', 'Seguro (Carro)', 'Rastreador', 'Plano de Saúde', 'Internet / TV'],
    Variável: ['Supermercado', 'Combustível', 'Farmácia', 'Lazer', 'Manutenção de carro', 'Energia Elétrica', 'Gás'],
    'Extra/Eventualidades': ['IPVA', 'Presentes & Comemorações', 'Médico / Exames', 'Viagem', 'Manutenção Casa'],
    Receita: ['Salário Guilherme', 'Salário Mariana', 'Rendimento / Outros'],
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-[#e5eeff] flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5eeff]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#006948] text-white flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                Novo Lançamento Financeiro
              </h3>
              <p className="text-xs text-[#565e74]">Casal Duarte • {defaultMonth}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#eff4ff] text-[#565e74]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 flex flex-col gap-3">
          {/* Tipo Selector */}
          <div className="grid grid-cols-2 gap-2 bg-[#eff4ff] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTipo('despesa')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipo === 'despesa'
                  ? 'bg-white text-[#0b1c30] shadow-xs'
                  : 'text-[#565e74]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-[#ba1a1a]" />
              <span>Despesa</span>
            </button>
            <button
              type="button"
              onClick={() => setTipo('receita')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipo === 'receita'
                  ? 'bg-white text-[#006948] shadow-xs'
                  : 'text-[#565e74]'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-[#006948]" />
              <span>Receita / Entrada</span>
            </button>
          </div>

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
                className="w-full pl-10 pr-3 py-2 text-base font-bold text-[#0b1c30] bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl focus:outline-hidden focus:border-[#006948]"
              />
            </div>
          </div>

          {/* Estabelecimento & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-[#0b1c30]">
                {tipo === 'despesa' ? 'Estabelecimento / Local' : 'Fonte / Pagador'}
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Atacadão, Shell, Droga Raia..."
                value={estabelecimento}
                onChange={(e) => setEstabelecimento(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl focus:outline-hidden focus:border-[#006948]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0b1c30]">Data</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl focus:outline-hidden"
              />
            </div>
          </div>

          {/* Categoria & Subcategoria */}
          {tipo === 'despesa' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-[#0b1c30]">Categoria</label>
                <select
                  value={categoria}
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
          )}

          {/* Forma de Pagamento */}
          <div>
            <label className="text-xs font-semibold text-[#0b1c30]">Forma de Pagamento</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl font-medium"
            >
              <option value="Cartão de Crédito NuBank">Cartão de Crédito NuBank (Compartilhado)</option>
              <option value="PIX">PIX</option>
              <option value="Débito em Conta">Débito em Conta</option>
              <option value="Boleto Bancário">Boleto Bancário</option>
              <option value="Dinheiro">Dinheiro Físico</option>
            </select>
          </div>

          {/* Divisão do Casal */}
          <div className="p-3 bg-[#e5eeff] rounded-xl border border-[#dce9ff]">
            <label className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5 mb-1.5">
              <Users className="w-3.5 h-3.5 text-[#006948]" />
              Rateio Casal Duarte
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSplitType('50/50')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  splitType === '50/50'
                    ? 'bg-[#006948] text-white shadow-xs'
                    : 'bg-white text-[#0b1c30] hover:bg-[#f8f9ff]'
                }`}
              >
                50% / 50%
              </button>
              <button
                type="button"
                onClick={() => setSplitType('100_guilherme')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  splitType === '100_guilherme'
                    ? 'bg-[#006948] text-white shadow-xs'
                    : 'bg-white text-[#0b1c30] hover:bg-[#f8f9ff]'
                }`}
              >
                100% Guilherme
              </button>
              <button
                type="button"
                onClick={() => setSplitType('100_mariana')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  splitType === '100_mariana'
                    ? 'bg-[#006948] text-white shadow-xs'
                    : 'bg-white text-[#0b1c30] hover:bg-[#f8f9ff]'
                }`}
              >
                100% Mariana
              </button>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-[#0b1c30]">Observações (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: Compra com desconto, parcelado em 2x..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e5eeff]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#565e74]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#006948] hover:bg-[#00563b] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
