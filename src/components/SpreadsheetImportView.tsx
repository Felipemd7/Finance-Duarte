import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { SpreadsheetRow } from '../types';
import { formatBRL } from '../utils/formatters';

interface SpreadsheetImportViewProps {
  spreadsheets: SpreadsheetRow[];
  selectedMonth: string;
  onUpdateRow: (row: SpreadsheetRow) => void;
  onAddRow: (row: SpreadsheetRow) => void;
  onDeleteRow: (id: string) => void;
  onImportRows: (rows: SpreadsheetRow[]) => void;
}

export const SpreadsheetImportView: React.FC<SpreadsheetImportViewProps> = ({
  spreadsheets,
  selectedMonth,
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  onImportRows,
}) => {
  const [activeMonth, setActiveMonth] = useState(selectedMonth);
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [showNewRowModal, setShowNewRowModal] = useState(false);

  const months = [
    'Janeiro 2026',
    'Fevereiro 2026',
    'Março 2026',
    'Abril 2026',
    'Maio 2026',
    'Junho 2026',
    'Julho 2026',
    'Agosto 2026',
  ];

  const filteredRows = spreadsheets.filter((r) => {
    const matchesMonth = r.mes === activeMonth;
    const matchesCat = categoryFilter === 'Todas' || r.categoria === categoryFilter;
    const matchesSearch =
      r.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.observacoes && r.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesMonth && matchesCat && matchesSearch;
  });

  const totalExpectativa = filteredRows.reduce((s, r) => s + r.expectativa, 0);
  const totalRealidade = filteredRows.reduce((s, r) => s + r.realidade, 0);
  const totalDiferenca = totalExpectativa - totalRealidade;

  // Handle CSV upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseAndImportText(text);
    };
    reader.readAsText(file);
  };

  const parseAndImportText = (text: string) => {
    const lines = text.split('\n');
    const newRows: SpreadsheetRow[] = [];

    lines.forEach((line, index) => {
      if (index === 0 && line.toLowerCase().includes('categoria')) return; // header
      const parts = line.split(/[;,\t]/);
      if (parts.length >= 4) {
        const cat = parts[0]?.trim() || 'Variável';
        const desc = parts[1]?.trim() || 'Item Importado';
        const exp = parseFloat(parts[2]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        const real = parseFloat(parts[3]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        const sit = parts[4]?.trim() || 'Pago';
        const obs = parts[5]?.trim() || '';

        newRows.push({
          id: `imp-${Date.now()}-${index}`,
          categoria: cat as any,
          descricao: desc,
          situacao: sit as any,
          expectativa: exp,
          realidade: real,
          diferenca: exp - real,
          observacoes: obs,
          mes: activeMonth,
        });
      }
    });

    if (newRows.length > 0) {
      onImportRows(newRows);
      setShowImportModal(false);
      alert(`${newRows.length} linhas importadas com sucesso para ${activeMonth}!`);
    } else {
      alert('Formato inválido. Use colunas: Categoria, Descrição, Expectativa, Realidade, Situação');
    }
  };

  return (
    <div id="spreadsheet-view-container" className="max-w-6xl mx-auto flex flex-col gap-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e5eeff] shadow-xs">
        <div>
          <h2 className="font-display font-bold text-lg sm:text-xl text-[#0b1c30] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#006948]" />
            Planilhas Mensais do Casal Duarte (Jan - Ago 2026)
          </h2>
          <p className="text-xs text-[#565e74]">
            Estrutura 100% fiel às planilhas originais com Expectativa vs Realidade
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#cbd5e1] hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#565e74]" />
            <span>Importar CSV / Excel</span>
          </button>

          <button
            onClick={() => setShowNewRowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006948] hover:bg-[#00563b] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Linha</span>
          </button>
        </div>
      </div>

      {/* Months Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMonth(m)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeMonth === m
                ? 'bg-[#006948] text-white shadow-xs'
                : 'bg-white text-[#565e74] border border-[#e5eeff] hover:bg-[#eff4ff]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Summary Totals for Active Month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs">
          <span className="text-xs text-[#565e74]">Expectativa Total (Planejado)</span>
          <div className="font-display font-bold text-lg text-[#0b1c30] tnum mt-0.5">
            {formatBRL(totalExpectativa)}
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs">
          <span className="text-xs text-[#565e74]">Realidade Total (Realizado)</span>
          <div className="font-display font-bold text-lg text-[#0b1c30] tnum mt-0.5">
            {formatBRL(totalRealidade)}
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs">
          <span className="text-xs text-[#565e74]">Diferença Líquida (Sobra / Estouro)</span>
          <div
            className={`font-display font-bold text-lg tnum mt-0.5 ${
              totalDiferenca >= 0 ? 'text-[#006948]' : 'text-[#ba1a1a]'
            }`}
          >
            {totalDiferenca >= 0 ? '+' : ''}
            {formatBRL(totalDiferenca)}
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-xl border border-[#e5eeff] shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#565e74] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filtrar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#f8f9ff] border border-[#dce9ff] rounded-lg focus:outline-hidden"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs bg-[#f8f9ff] border border-[#dce9ff] rounded-lg px-3 py-2 text-[#0b1c30] font-medium"
        >
          <option value="Todas">Todas Categorias</option>
          <option value="Invariável">Invariável</option>
          <option value="Variável">Variável</option>
          <option value="Extra/Eventualidades">Extra / Eventualidades</option>
        </select>
      </div>

      {/* Full Spreadsheet Table */}
      <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eff4ff] text-[#0b1c30] font-bold border-b border-[#dce9ff]">
                <th className="py-3 px-3">CATEGORIA</th>
                <th className="py-3 px-3">DESCRIÇÃO</th>
                <th className="py-3 px-3">SITUAÇÃO</th>
                <th className="py-3 px-3 text-right">EXPECTATIVA</th>
                <th className="py-3 px-3 text-right">REALIDADE</th>
                <th className="py-3 px-3 text-right">DIFERENÇA</th>
                <th className="py-3 px-3">OBSERVAÇÕES</th>
                <th className="py-3 px-2 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#565e74]">
                    Nenhuma linha encontrada para {activeMonth}.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isOver = row.diferenca < 0;
                  return (
                    <tr key={row.id} className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.categoria === 'Invariável'
                              ? 'bg-[#f1f5f9] text-[#475569]'
                              : row.categoria === 'Variável'
                              ? 'bg-[#ecfdf5] text-[#006948]'
                              : 'bg-[#fef3c7] text-[#d97706]'
                          }`}
                        >
                          {row.categoria}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-[#0b1c30]">
                        {row.descricao}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            row.situacao === 'Pago'
                              ? 'bg-[#dae2fd] text-[#131b2e]'
                              : 'bg-[#fef3c7] text-[#d97706]'
                          }`}
                        >
                          {row.situacao}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right text-[#565e74] tnum">
                        {formatBRL(row.expectativa)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-[#0b1c30] tnum">
                        {formatBRL(row.realidade)}
                      </td>

                      <td
                        className={`py-2.5 px-3 text-right font-bold tnum ${
                          isOver ? 'text-[#ba1a1a]' : 'text-[#006948]'
                        }`}
                      >
                        {row.diferenca >= 0 ? '+' : ''}
                        {formatBRL(row.diferenca)}
                      </td>

                      <td className="py-2.5 px-3 text-[11px] text-[#565e74] max-w-[200px] truncate">
                        {row.observacoes || '-'}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Excluir linha "${row.descricao}"?`)) {
                              onDeleteRow(row.id);
                            }
                          }}
                          className="p-1 rounded text-[#94a3b8] hover:text-[#ba1a1a]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-[#e5eeff] flex flex-col gap-3">
            <h3 className="font-display font-bold text-base text-[#0b1c30]">
              Importar Planilha ({activeMonth})
            </h3>
            <p className="text-xs text-[#565e74]">
              Você pode fazer upload de um arquivo .csv/.xlsx ou colar o conteúdo copiado do Excel/Google Sheets.
            </p>

            <div className="p-4 border-2 border-dashed border-[#cbd5e1] rounded-xl flex flex-col items-center justify-center text-center">
              <Upload className="w-6 h-6 text-[#006948] mb-1" />
              <span className="text-xs font-semibold text-[#0b1c30]">Selecione um arquivo CSV</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleCSVUpload}
                className="text-xs text-[#565e74] mt-2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#0b1c30]">
                Ou cole o texto da tabela:
              </label>
              <textarea
                rows={5}
                placeholder="CATEGORIA, DESCRIÇÃO, EXPECTATIVA, REALIDADE, SITUAÇÃO"
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                className="w-full p-2 text-xs bg-[#f8f9ff] border border-[#cbd5e1] rounded-lg font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#e5eeff]">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-2 text-xs font-semibold text-[#565e74]"
              >
                Cancelar
              </button>
              <button
                onClick={() => parseAndImportText(pasteData)}
                className="px-4 py-2 bg-[#006948] text-white text-xs font-bold rounded-xl"
              >
                Processar e Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Row Modal */}
      {showNewRowModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-[#e5eeff] flex flex-col gap-3">
            <h3 className="font-display font-bold text-base text-[#0b1c30]">
              Adicionar Linha em {activeMonth}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const exp = parseFloat(form.expectativa.value) || 0;
                const real = parseFloat(form.realidade.value) || 0;
                onAddRow({
                  id: 'row-' + Date.now(),
                  categoria: form.categoria.value,
                  descricao: form.descricao.value,
                  situacao: form.situacao.value,
                  expectativa: exp,
                  realidade: real,
                  diferenca: exp - real,
                  observacoes: form.observacoes.value,
                  mes: activeMonth,
                });
                setShowNewRowModal(false);
              }}
              className="flex flex-col gap-3 text-xs"
            >
              <div>
                <label className="font-semibold text-[#0b1c30]">Categoria</label>
                <select name="categoria" className="w-full mt-1 p-2 bg-[#f8f9ff] border rounded-lg">
                  <option value="Invariável">Invariável</option>
                  <option value="Variável">Variável</option>
                  <option value="Extra/Eventualidades">Extra / Eventualidades</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#0b1c30]">Descrição</label>
                <input
                  name="descricao"
                  required
                  placeholder="Ex: Supermercado Semanal, Farmácia..."
                  className="w-full mt-1 p-2 bg-[#f8f9ff] border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#0b1c30]">Expectativa (R$)</label>
                  <input
                    name="expectativa"
                    type="number"
                    step="0.01"
                    required
                    className="w-full mt-1 p-2 bg-[#f8f9ff] border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#0b1c30]">Realidade (R$)</label>
                  <input
                    name="realidade"
                    type="number"
                    step="0.01"
                    required
                    className="w-full mt-1 p-2 bg-[#f8f9ff] border rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#0b1c30]">Situação</label>
                <select name="situacao" className="w-full mt-1 p-2 bg-[#f8f9ff] border rounded-lg">
                  <option value="Pago">Pago</option>
                  <option value="A Pagar">A Pagar</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#0b1c30]">Observações</label>
                <input
                  name="observacoes"
                  placeholder="Ex: Pago por Guilherme via NuBank"
                  className="w-full mt-1 p-2 bg-[#f8f9ff] border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e5eeff]">
                <button
                  type="button"
                  onClick={() => setShowNewRowModal(false)}
                  className="px-3 py-2 text-[#565e74]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006948] text-white font-bold rounded-xl"
                >
                  Adicionar Linha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
