import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Check,
  Trash2,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SpreadsheetRow } from '../types.ts';
import { formatBRL } from '../utils/formatters.ts';

interface SpreadsheetImporterProps {
  onRefreshData: () => Promise<void>;
  onCommitRows: (rows: SpreadsheetRow[]) => Promise<void>;
}

export const SpreadsheetImporter: React.FC<SpreadsheetImporterProps> = ({
  onRefreshData,
  onCommitRows,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<SpreadsheetRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV or Excel file client-side
  const handleFileUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    try {
      const fileName = selectedFile.name.toLowerCase();

      if (fileName.endsWith('.csv')) {
        // Parse CSV
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: results => {
            const normalized = normalizeRows(results.data);
            setParsedRows(normalized);
            setSuccessMsg(`CSV lido com sucesso! ${normalized.length} linhas identificadas.`);
            setIsProcessing(false);
          },
          error: err => {
            setErrorMsg(`Erro ao ler CSV: ${err.message}`);
            setIsProcessing(false);
          },
        });
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet);
            const normalized = normalizeRows(rawRows);
            setParsedRows(normalized);
            setSuccessMsg(`Planilha Excel lida com sucesso! ${normalized.length} linhas identificadas.`);
          } catch (err: any) {
            setErrorMsg(`Erro ao ler arquivo Excel: ${err.message}`);
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      } else {
        setErrorMsg('Formato não suportado. Utilize arquivos .csv, .xlsx ou .xls.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setErrorMsg(`Erro ao processar arquivo: ${err.message}`);
      setIsProcessing(false);
    }
  };

  // Normalize column names
  const normalizeRows = (rawRows: any[]): SpreadsheetRow[] => {
    return rawRows
      .map(row => {
        // Find keys case-insensitively
        const findVal = (keys: string[]): any => {
          const rowKeys = Object.keys(row);
          for (const k of keys) {
            const match = rowKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
            if (match && row[match] !== undefined) return row[match];
          }
          return undefined;
        };

        const categoria = String(findVal(['CATEGORIA', 'Categoria', 'Grupo']) || 'Variável').trim();
        const descricao = String(findVal(['DESCRIÇÃO', 'DESCRICAO', 'Descricao', 'Subcategoria', 'Item']) || 'Geral').trim();
        const situacao = String(findVal(['SITUAÇÃO', 'SITUACAO', 'Situacao', 'Status']) || 'Pago').trim();
        const rawExp = findVal(['EXPECTATIVA', 'Expectativa', 'Planejado', 'Meta']);
        const rawReal = findVal(['REALIDADE', 'Realidade', 'Gasto', 'Valor', 'Real']);
        const rawDif = findVal(['DIFERENÇA', 'DIFERENCA', 'Diferenca', 'Saldo']);
        const observacoes = String(findVal(['OBSERVAÇÕES', 'OBSERVACOES', 'Observacoes', 'Notas']) || '').trim();
        const mes = String(findVal(['MÊS', 'MES', 'Mes', 'Data', 'Periodo']) || '2026-08').trim();

        const parseNum = (v: any): number => {
          if (typeof v === 'number') return v;
          if (!v) return 0;
          const cleaned = String(v).replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        };

        const expectativa = parseNum(rawExp);
        const realidade = parseNum(rawReal);
        const diferenca = rawDif !== undefined ? parseNum(rawDif) : expectativa - realidade;

        return {
          CATEGORIA: categoria,
          DESCRICAO: descricao,
          SITUACAO: situacao,
          EXPECTATIVA: expectativa,
          REALIDADE: realidade,
          DIFERENCA: diferenca,
          OBSERVACOES: observacoes,
          mes,
          categoria,
          descricao,
          situacao,
          expectativa,
          realidade,
          diferenca,
          observacoes,
        };
      })
      .filter(r => r.DESCRICAO && (r.EXPECTATIVA > 0 || r.REALIDADE > 0));
  };

  // Commit preview rows to DB
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/import/spreadsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedRows,
          filename: file?.name || 'planilha_importada.csv',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao importar.');

      setSuccessMsg(data.message || 'Planilha importada com sucesso!');
      setParsedRows([]);
      setFile(null);
      await onRefreshData();
    } catch (err: any) {
      setErrorMsg(`Erro ao salvar dados: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove row from preview
  const handleRemoveRow = (idx: number) => {
    setParsedRows(prev => prev.filter((_, i) => i !== idx));
  };

  // Download official CSV template
  const handleDownloadTemplate = () => {
    const csvContent =
      'CATEGORIA,DESCRIÇÃO,SITUAÇÃO,EXPECTATIVA,REALIDADE,DIFERENÇA,OBSERVAÇÕES,MÊS\n' +
      'Invariável,Condomínio,Pago,1450.00,1450.00,0.00,Taxa mensal condomínio,2026-08\n' +
      'Variável,Supermercado,Pago,2200.00,2480.50,-280.50,Compras do mês Atacadão e Sam\'s Club,2026-08\n' +
      'Variável,Combustível,Pago,650.00,720.00,-70.00,Abastecimento Shell,2026-08\n' +
      'Extra,Manutenção de carro,Pago,500.00,480.00,20.00,Troca de pastilhas e óleo,2026-08\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_financas_casal_duarte_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reload default Jan-Aug 2026 spreadsheet data
  const handleReloadDefaultData = async () => {
    if (!confirm('Deseja recarregar o conjunto de dados original de Janeiro a Agosto de 2026?')) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/database/reset', { method: 'POST' });
      if (res.ok) {
        setSuccessMsg('Base de dados restaurada com o histórico oficial de Jan a Ago de 2026!');
        await onRefreshData();
      }
    } catch (e) {
      setErrorMsg('Erro ao restaurar dados.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Importação e Sincronização de Planilhas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Mapeador de colunas: CATEGORIA, DESCRIÇÃO, SITUAÇÃO, EXPECTATIVA, REALIDADE, DIFERENÇA, OBSERVAÇÕES
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Baixar Modelo CSV
          </button>
          <button
            onClick={handleReloadDefaultData}
            className="inline-flex items-center px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-semibold rounded-xl transition"
            title="Recarregar dados originais de Jan a Ago de 2026"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Restaurar Jan-Ago 2026
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition flex flex-col items-center justify-center min-h-[200px]"
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={e => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
        />
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-800">
          {file ? file.name : 'Clique ou arraste sua planilha CSV ou Excel (.xlsx, .xls)'}
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-md">
          O importador reconhece automaticamente as planilhas do Casal Duarte com expectativa, realidade e observações.
        </p>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preview Table if rows were parsed */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pré-visualização dos Dados ({parsedRows.length} linhas)
              </h2>
              <p className="text-xs text-slate-500">
                Revise os dados antes de gravar permanentemente no banco
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setParsedRows([])}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Salvar no Banco</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Mês</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3">Descrição (Subcategoria)</th>
                  <th className="py-2.5 px-3">Situação</th>
                  <th className="py-2.5 px-3 text-right">Expectativa</th>
                  <th className="py-2.5 px-3 text-right">Realidade</th>
                  <th className="py-2.5 px-3 text-right">Diferença</th>
                  <th className="py-2.5 px-3">Observações</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">{row.mes}</td>
                    <td className="py-2 px-3 text-slate-600">{row.CATEGORIA}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{row.DESCRICAO}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                        {row.SITUACAO}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      {formatBRL(row.EXPECTATIVA)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatBRL(row.REALIDADE)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      {row.DIFERENCA < 0 ? (
                        <span className="text-rose-600">-{formatBRL(Math.abs(row.DIFERENCA))}</span>
                      ) : (
                        <span className="text-emerald-600">+{formatBRL(row.DIFERENCA)}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-500 italic max-w-xs truncate">
                      {row.OBSERVACOES || '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        className="text-slate-300 hover:text-red-500 p-1"
                        title="Remover linha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
