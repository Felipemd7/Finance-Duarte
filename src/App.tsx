import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ScannerView } from './components/ScannerView';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { GoalsView } from './components/GoalsView';
import { ShoppingListView } from './components/ShoppingListView';
import { MarketAnalyticsReportsView } from './components/MarketAnalyticsReportsView';
import { SpreadsheetImportView } from './components/SpreadsheetImportView';
import { VoiceApiView } from './components/VoiceApiView';
import { NewTransactionModal } from './components/NewTransactionModal';

import {
  INITIAL_USERS,
  INITIAL_RECEIPTS,
  INITIAL_TRANSACTIONS,
  INITIAL_GOALS,
  INITIAL_SPREADSHEETS,
} from './data/initialData';
import { Transaction, Receipt, FinancialGoal, SpreadsheetRow, User } from './types';
import { fetchSupabaseData } from './services/supabaseService';

export default function App() {
  // Current active tab - default to 'dashboard' (Visão Consolidada do Casal)
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('Março 2026');
  const [activeUser, setActiveUser] = useState<string>('casal');

  // Supabase sync state
  const [isSupabaseSynced, setIsSupabaseSynced] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>('Conectando ao Supabase...');

  // Core Data State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('duarte_receipts');
    return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('duarte_transactions');
    if (saved && !saved.includes('guilherme') && !saved.includes('mariana')) {
      return JSON.parse(saved);
    }
    return INITIAL_TRANSACTIONS;
  });
  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    const saved = localStorage.getItem('duarte_goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetRow[]>(() => {
    const saved = localStorage.getItem('duarte_spreadsheets');
    return saved ? JSON.parse(saved) : INITIAL_SPREADSHEETS;
  });

  // Modals
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);

  // Sync with Supabase on Mount
  useEffect(() => {
    // Clear old mock cache if it had legacy users
    const cachedTx = localStorage.getItem('duarte_transactions');
    if (cachedTx && (cachedTx.includes('guilherme') || cachedTx.includes('mariana'))) {
      localStorage.removeItem('duarte_transactions');
      localStorage.removeItem('duarte_receipts');
      localStorage.removeItem('duarte_goals');
      localStorage.removeItem('duarte_spreadsheets');
    }

    async function loadCloudData() {
      const cloudData = await fetchSupabaseData();
      if (cloudData && cloudData.transactions.length > 0) {
        if (cloudData.users.length > 0) setUsers(cloudData.users);
        setTransactions(cloudData.transactions);
        if (cloudData.goals.length > 0) setGoals(cloudData.goals);
        if (cloudData.spreadsheets.length > 0) setSpreadsheets(cloudData.spreadsheets);
        setIsSupabaseSynced(true);
        setSyncStatusText(`🟢 Supabase Conectado • ${cloudData.transactions.length} transações de Felipe & Genivânia sincronizadas`);
      } else {
        setSyncStatusText('Dados locais ativos (Supabase offline)');
      }
    }
    loadCloudData();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('duarte_receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('duarte_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('duarte_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('duarte_spreadsheets', JSON.stringify(spreadsheets));
  }, [spreadsheets]);

  // Handler: Approve and reconcile receipt
  const handleApproveReceipt = (receipt: Receipt) => {
    // 1. Mark receipt as Conciliado
    const updatedReceipts = receipts.map((r) =>
      r.id === receipt.id ? { ...r, status: 'Conciliado' as const } : r
    );
    setReceipts(updatedReceipts);

    // 2. Create new transaction in extrato
    const newTx: Transaction = {
      id: 'tx-rec-' + Date.now(),
      data: receipt.data.split(' ')[0] || new Date().toISOString().split('T')[0],
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
      formaPagamento: 'Cartão de Crédito NuBank',
      status: 'pago',
      pagoPor: 'Conta Conjunta Casal',
      comprovanteId: receipt.id,
      itensDetalhados: receipt.itens,
      observacoes: `Leitura automática ${receipt.numeroCupom} • NuBank Compartilhado`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // 3. Update spreadsheet reality row for active month
    setSpreadsheets((prev) => {
      const matchIdx = prev.findIndex(
        (row) =>
          row.mes === selectedMonth &&
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
  };

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddGoal = (goal: FinancialGoal) => {
    setGoals((prev) => [goal, ...prev]);
  };

  const handleUpdateGoal = (goal: FinancialGoal) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
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

      {/* Supabase Sync Banner */}
      <div className="bg-[#f0fdf4] border-b border-[#bbf7d0] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[#166534]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSupabaseSynced ? 'bg-[#16a34a] animate-pulse' : 'bg-[#eab308]'}`} />
            <span className="font-medium text-xs">{syncStatusText}</span>
          </div>
          <span className="text-[11px] text-[#15803d] font-semibold hidden sm:inline">
            Felipe Duarte & Genivânia Duarte
          </span>
        </div>
      </div>

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {currentTab === 'scanner' && (
          <ScannerView
            receipts={receipts}
            onApproveReceipt={handleApproveReceipt}
            onLinkToTransaction={handleApproveReceipt}
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
          />
        )}

        {currentTab === 'lista' && (
          <ShoppingListView receipts={receipts} />
        )}

        {currentTab === 'relatorios' && (
          <MarketAnalyticsReportsView onNavigateTab={setCurrentTab} />
        )}

        {currentTab === 'planilhas' && (
          <SpreadsheetImportView
            spreadsheets={spreadsheets}
            selectedMonth={selectedMonth}
            onUpdateRow={(row) =>
              setSpreadsheets((prev) => prev.map((r) => (r.id === row.id ? row : r)))
            }
            onAddRow={handleAddSpreadsheetRow}
            onDeleteRow={handleDeleteSpreadsheetRow}
            onImportRows={handleImportSpreadsheetRows}
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
