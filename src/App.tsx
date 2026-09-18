import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ScannerView } from './components/ScannerView';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { GoalsView } from './components/GoalsView';
import { ShoppingListView } from './components/ShoppingListView';
import { MarketAnalyticsReportsView } from './components/MarketAnalyticsReportsView';
import { VoiceApiView } from './components/VoiceApiView';
import { NewTransactionModal } from './components/NewTransactionModal';

import {
  INITIAL_USERS,
  INITIAL_RECEIPTS,
  INITIAL_TRANSACTIONS,
  INITIAL_GOALS,
  INITIAL_SPREADSHEETS,
  INITIAL_FUEL_LOGS,
} from './data/initialData';
import { Transaction, Receipt, FinancialGoal, SpreadsheetRow, User, FuelLog } from './types';
import {
  fetchSupabaseData,
  addFuelLogToCloud,
  updateFuelLogInCloud,
  deleteFuelLogFromCloud,
  saveScannedReceiptToCloud,
  saveScannedReceiptDraftToCloud,
  deleteReceiptFromCloud,
  saveGoalToCloud,
  updateGoalInCloud,
  deleteGoalFromCloud,
  updateTransactionInCloud,
} from './services/supabaseService';

export default function App() {
  // Current active tab - default to 'dashboard' (Visão Consolidada do Casal)
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('Março 2026');
  const [activeUser, setActiveUser] = useState<string>('casal');
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

  // Supabase sync state
  const [isSupabaseSynced, setIsSupabaseSynced] = useState<boolean>(false);

  // Core Data State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    try {
      const saved = localStorage.getItem('duarte_receipts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_RECEIPTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('duarte_transactions');
      if (saved && !saved.includes('guilherme') && !saved.includes('mariana')) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_TRANSACTIONS;
  });
  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    try {
      const saved = localStorage.getItem('duarte_goals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_GOALS;
  });
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetRow[]>(() => {
    try {
      const saved = localStorage.getItem('duarte_spreadsheets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_SPREADSHEETS;
  });
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => {
    try {
      const saved = localStorage.getItem('duarte_fuel_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FUEL_LOGS;
  });

  // Modals
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);

  // Sync with Supabase on Mount
  useEffect(() => {
    // Clear old mock cache if it had legacy users
    try {
      const cachedTx = localStorage.getItem('duarte_transactions');
      if (cachedTx && (cachedTx.includes('guilherme') || cachedTx.includes('mariana'))) {
        localStorage.removeItem('duarte_transactions');
        localStorage.removeItem('duarte_receipts');
        localStorage.removeItem('duarte_goals');
        localStorage.removeItem('duarte_spreadsheets');
      }
    } catch {}

    async function loadCloudData() {
      try {
        const cloudData = await fetchSupabaseData();
        if (cloudData && cloudData.transactions.length > 0) {
          if (cloudData.users.length > 0) setUsers(cloudData.users);
          setTransactions(cloudData.transactions);
          if (cloudData.goals.length > 0) setGoals(cloudData.goals);
          if (cloudData.spreadsheets.length > 0) setSpreadsheets(cloudData.spreadsheets);
          if (cloudData.fuelLogs && cloudData.fuelLogs.length > 0) setFuelLogs(cloudData.fuelLogs);
          if (cloudData.receipts && cloudData.receipts.length > 0) setReceipts(cloudData.receipts);
          setIsSupabaseSynced(true);
        }
      } catch (err) {
        console.warn('[App] Erro ao sincronizar dados da nuvem:', err);
      }
    }
    loadCloudData();
  }, []);

  // Sync to localStorage com proteção contra QuotaExceededError
  useEffect(() => {
    try {
      // Remover imagemUrl pesada do localStorage para nunca estourar a cota de 5MB do celular
      const sanitized = receipts.map((r) => {
        if (r.imagemUrl && r.imagemUrl.length > 15000) {
          return { ...r, imagemUrl: undefined };
        }
        return r;
      });
      localStorage.setItem('duarte_receipts', JSON.stringify(sanitized));
    } catch (err) {
      console.warn('[App] LocalStorage quota para receipts:', err);
    }
  }, [receipts]);

  useEffect(() => {
    try {
      localStorage.setItem('duarte_transactions', JSON.stringify(transactions));
    } catch (err) {
      console.warn('[App] LocalStorage quota para transactions:', err);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('duarte_goals', JSON.stringify(goals));
    } catch (err) {
      console.warn('[App] LocalStorage quota para goals:', err);
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem('duarte_spreadsheets', JSON.stringify(spreadsheets));
    } catch (err) {
      console.warn('[App] LocalStorage quota para spreadsheets:', err);
    }
  }, [spreadsheets]);

  useEffect(() => {
    try {
      localStorage.setItem('duarte_fuel_logs', JSON.stringify(fuelLogs));
    } catch (err) {
      console.warn('[App] LocalStorage quota para fuel_logs:', err);
    }
  }, [fuelLogs]);

  // Handlers para Abastecimentos de Combustível (Compass)
  const handleAddFuelLog = async (log: FuelLog) => {
    setFuelLogs((prev) => [...prev, log]);
    await addFuelLogToCloud(log);
  };

  const handleUpdateFuelLog = async (log: FuelLog) => {
    setFuelLogs((prev) => prev.map((f) => (f.id === log.id ? log : f)));
    await updateFuelLogInCloud(log);
  };

  const handleDeleteFuelLog = async (id: string) => {
    setFuelLogs((prev) => prev.filter((f) => f.id !== id));
    await deleteFuelLogFromCloud(id);
  };

  // Handler: Approve and reconcile receipt
  const handleApproveReceipt = async (receipt: Receipt): Promise<boolean> => {
    // 1. Normaliza data que pode vir em formato BR (dd/mm/yyyy) ou ISO (yyyy-mm-dd)
    const normalizeReceiptDate = (d: string): string => {
      if (!d) return new Date().toISOString().split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
      if (/^\d{2}\/\d{2}\/\d{4}/.test(d)) {
        const [day, month, year] = d.split('/');
        return `${year}-${month}-${day.slice(0, 2)}`;
      }
      return new Date().toISOString().split('T')[0];
    };
    const txDate = normalizeReceiptDate(receipt.data);

    // Identificar o nome do mês da transação (ex: '2026-09' -> 'Setembro 2026')
    const mesNomeMap: Record<string, string> = {
      '01': 'Janeiro 2026',
      '02': 'Fevereiro 2026',
      '03': 'Março 2026',
      '04': 'Abril 2026',
      '05': 'Maio 2026',
      '06': 'Junho 2026',
      '07': 'Julho 2026',
      '08': 'Agosto 2026',
      '09': 'Setembro 2026',
      '10': 'Outubro 2026',
      '11': 'Novembro 2026',
      '12': 'Dezembro 2026',
    };
    const parts = txDate.split('-');
    const targetMes = (parts.length >= 2 && mesNomeMap[parts[1]]) ? mesNomeMap[parts[1]] : selectedMonth;

    // Atualiza automaticamente o mês ativo para o mês do comprovante para ficar visível imediatamente no extrato!
    setSelectedMonth(targetMes);

    // 2. Mark receipt as Conciliado e garantir presença na lista
    const approvedReceiptObj: Receipt = {
      ...receipt,
      data: txDate,
      status: 'Conciliado' as const,
    };

    setReceipts((prev) => {
      const exists = prev.some((r) => r.id === receipt.id);
      if (exists) {
        return prev.map((r) => (r.id === receipt.id ? approvedReceiptObj : r));
      }
      return [approvedReceiptObj, ...prev];
    });

    // 3. Create new transaction in extrato
    const txId = receipt.transacaoId || ('tx-rec-' + Date.now());
    const formaPgtoResolved = receipt.formaPagamento || 'Cartão de Crédito Compartilhado';
    const isCredit = formaPgtoResolved.toLowerCase().includes('credito') ||
                     formaPgtoResolved.toLowerCase().includes('crédito') ||
                     (formaPgtoResolved.toLowerCase().includes('cartao') && !formaPgtoResolved.toLowerCase().includes('debito'));

    const newTx: Transaction = {
      id: txId,
      data: txDate,
      tipo: 'despesa',
      categoria: 'Variável',
      subcategoria:
        receipt.tipoEstabelecimento === 'Farmácia'
          ? 'Farmácia'
          : receipt.tipoEstabelecimento === 'Posto de combustível'
          ? 'Combustível'
          : 'Supermercado',
      estabelecimento: receipt.estabelecimento,
      valor: receipt.valorTotal,
      formaPagamento: formaPgtoResolved,
      status: isCredit ? 'pendente' : 'pago',
      pagoPor: receipt.pagoPor || 'Felipe Duarte',
      comprovanteId: receipt.id,
      itensDetalhados: receipt.itens,
      observacoes: `Leitura automática ${receipt.numeroCupom || ''} • ${formaPgtoResolved}`,
    };

    setTransactions((prev) => {
      const exists = prev.some((t) => t.id === txId);
      if (exists) return prev.map((t) => (t.id === txId ? newTx : t));
      return [newTx, ...prev];
    });

    // Salvar na nuvem Supabase com await e retorno booleano
    const ok = await saveScannedReceiptToCloud(approvedReceiptObj, newTx);
    if (ok) {
      console.log('[App] Comprovante e transação salvos no Supabase com sucesso:', newTx.id);
    }

    // 4. Update spreadsheet reality row for target month
    setSpreadsheets((prev) => {
      const matchIdx = prev.findIndex(
        (row) =>
          row.mes === targetMes &&
          row.descricao.toLowerCase().includes(receipt.tipoEstabelecimento.toLowerCase().substring(0, 4))
      );
      if (matchIdx !== -1) {
        const copy = [...prev];
        const oldRow = copy[matchIdx];
        const newReal = oldRow.realidade + receipt.valorTotal;
        copy[matchIdx] = {
          ...oldRow,
          realidade: newReal,
          diferenca: oldRow.expectativa - newReal,
        };
        return copy;
      }
      return prev;
    });

    return ok;
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    const recToDelete = receipts.find((r) => r.id === receiptId);
    setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
    if (recToDelete?.transacaoId) {
      setTransactions((prev) => prev.filter((t) => t.id !== recToDelete.transacaoId));
    }
    await deleteReceiptFromCloud(receiptId, recToDelete?.transacaoId);
  };

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    await updateTransactionInCloud(updatedTx);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddGoal = async (goal: FinancialGoal) => {
    setGoals((prev) => [goal, ...prev]);
    await saveGoalToCloud(goal);
  };

  const handleUpdateGoal = async (goal: FinancialGoal) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    await updateGoalInCloud(goal);
  };

  const handleDeleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await deleteGoalFromCloud(id);
  };

  const handleImportSpreadsheetRows = (newRows: SpreadsheetRow[]) => {
    setSpreadsheets((prev) => [...newRows, ...prev]);
  };

  const handleAddSpreadsheetRow = (row: SpreadsheetRow) => {
    setSpreadsheets((prev) => [row, ...prev]);
  };

  const handleDeleteSpreadsheetRow = (id: string) => {
    setSpreadsheets((prev) => prev.filter((r) => r.id !== id));
  };

  const handleViewReceipt = (receipt: Receipt) => {
    setViewingReceipt(receipt);
    setCurrentTab('scanner');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans selection:bg-[#006948] selection:text-white">
      {/* Sticky Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        activeUser={activeUser}
        onUserChange={setActiveUser}
        users={users}
        onOpenNewTx={() => setIsNewTxModalOpen(true)}
      />


      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {currentTab === 'scanner' && (
          <ScannerView
            receipts={receipts}
            initialReceiptToView={viewingReceipt}
            onApproveReceipt={handleApproveReceipt}
            onLinkToTransaction={handleApproveReceipt}
            onDeleteReceipt={handleDeleteReceipt}
            onSaveReceiptDraft={saveScannedReceiptDraftToCloud}
            onNavigateToExtrato={(mes?: string) => {
              if (mes) setSelectedMonth(mes);
              setCurrentTab('extrato');
            }}
            selectedMonth={selectedMonth}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            selectedMonth={selectedMonth}
            transactions={transactions}
            goals={goals}
            spreadsheets={spreadsheets}
            onNavigateToTab={setCurrentTab}
            onOpenNewTx={() => setIsNewTxModalOpen(true)}
          />
        )}

        {currentTab === 'extrato' && (
          <TransactionsView
            transactions={transactions}
            receipts={receipts}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            spreadsheets={spreadsheets}
            onOpenNewTx={() => setIsNewTxModalOpen(true)}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {currentTab === 'metas' && (
          <GoalsView
            goals={goals}
            transactions={transactions}
            selectedMonth={selectedMonth}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            fuelLogs={fuelLogs}
            onAddFuelLog={handleAddFuelLog}
            onUpdateFuelLog={handleUpdateFuelLog}
            onDeleteFuelLog={handleDeleteFuelLog}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {currentTab === 'lista' && (
          <ShoppingListView
            receipts={receipts}
            transactions={transactions}
            onNavigateTab={setCurrentTab}
            onSaveReceiptDraft={saveScannedReceiptDraftToCloud}
          />
        )}

        {currentTab === 'relatorios' && (
          <MarketAnalyticsReportsView
            transactions={transactions}
            receipts={receipts}
            goals={goals}
            selectedMonth={selectedMonth}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'voz' && <VoiceApiView />}
      </main>

      {/* Floating Action & Bottom Nav for Mobile */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewTx={() => setIsNewTxModalOpen(true)}
      />

      {/* Modal: New Transaction */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        onSave={handleAddTransaction}
        defaultMonth={selectedMonth}
      />
    </div>
  );
}
