import React, { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Plus,
  BarChart3,
  Menu,
  X,
  Target,
  ListTodo,
  Sparkles,
  Mic,
  FileSpreadsheet,
  Calendar,
  ShoppingBag,
  Check,
  ChevronRight,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { User } from '../types.ts';

interface MobileNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
  currentUser: User | null;
  users: User[];
  onSwitchUser: (user: User) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  currentUser,
  users,
  onSwitchUser,
  selectedMonth,
  setSelectedMonth,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const months = [
    { value: '2026-01', short: 'Jan' },
    { value: '2026-02', short: 'Fev' },
    { value: '2026-03', short: 'Mar' },
    { value: '2026-04', short: 'Abr' },
    { value: '2026-05', short: 'Mai' },
    { value: '2026-06', short: 'Jun' },
    { value: '2026-07', short: 'Jul' },
    { value: '2026-08', short: 'Ago' },
    { value: '2026-all', short: 'Ano Todo' },
  ];

  const drawerNavItems = [
    {
      id: 'reports',
      label: 'Relatórios & Consumo',
      description: 'Auditoria de compras, todos os itens e categorias',
      icon: BarChart3,
      badge: 'Completo',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'receipts',
      label: 'IA Comprovantes Fiscais',
      description: 'Leitor inteligente de notas NFC-e e cupons',
      icon: Sparkles,
      badge: 'IA',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'goals',
      label: 'Metas & Orçamento',
      description: 'Planejado vs Realizado e limites por categoria',
      icon: Target,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'shopping-list',
      label: 'Lista de Compras',
      description: 'Reconciliação e itens pendentes para o mercado',
      icon: ListTodo,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'integrations',
      label: 'Comandos de Voz Alexa & Siri',
      description: 'Atalhos e webhook para registrar pelo celular',
      icon: Mic,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'importer',
      label: 'Importador de Planilhas',
      description: 'Sincronizar dados das planilhas mensais',
      icon: FileSpreadsheet,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Navigation Bar on Mobile */}
      <nav
        aria-label="Navegação Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg md:hidden pb-safe"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-center px-2">
          {/* 1. Início / Dashboard */}
          <button
            onClick={() => handleSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'dashboard'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] mt-1">Início</span>
          </button>

          {/* 2. Transações */}
          <button
            onClick={() => handleSelectTab('transactions')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'transactions'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wallet className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] mt-1">Extrato</span>
          </button>

          {/* 3. Central Action Button: + Nova Despesa */}
          <div className="flex items-center justify-center">
            <button
              onClick={onOpenNewTransaction}
              aria-label="Adicionar Nova Transação"
              className="w-12 h-12 -mt-5 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 4. Relatórios / Consumo */}
          <button
            onClick={() => handleSelectTab('reports')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'reports'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeTab === 'reports' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] mt-1">Consumo</span>
          </button>

          {/* 5. Menu / Mais */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[48px] ${
              isDrawerOpen
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[11px] mt-1">Mais</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer (Bottom Sheet) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer sheet container */}
          <div className="relative bg-white rounded-t-3xl max-h-[88vh] overflow-y-auto p-5 shadow-2xl z-10 pb-safe animate-in slide-in-from-bottom duration-250">
            {/* Grab handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />

            {/* Header with Title and Close */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Menu Casal Duarte</h3>
                <p className="text-xs text-slate-500">Acesso rápido a todos os recursos</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Switcher Cards */}
            <div className="mb-5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Quem está usando agora?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {users.map(u => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => onSwitchUser(u)}
                      className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition min-h-[48px] ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                        style={{ backgroundColor: u.avatarColor || '#2563eb' }}
                      >
                        {u.nome.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{u.nome.split(' ')[0]}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {isCurrent ? 'Ativo agora' : 'Alternar'}
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Month Quick Selector */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Mês de Referência
                </label>
                <span className="text-xs font-bold text-blue-600">
                  {months.find(m => m.value === selectedMonth)?.short || selectedMonth}
                </span>
              </div>
              <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {months.map(m => {
                  const isSel = selectedMonth === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMonth(m.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition min-h-[40px] ${
                        isSel
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m.short}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation links */}
            <div className="space-y-2 mb-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Módulos do Aplicativo
              </label>
              {drawerNavItems.map(item => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition min-h-[56px] text-left ${
                      isCurrent
                        ? 'border-blue-300 bg-blue-50/50 text-blue-900 font-semibold'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 uppercase">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition min-h-[44px]"
            >
              Fechar Menu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
