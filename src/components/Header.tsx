import React from 'react';
import {
  Wallet,
  Sparkles,
  ChevronDown,
  Users,
  User as UserIcon,
  Mic,
  FileSpreadsheet,
  CheckCircle2,
  Bell,
  Calendar,
  Plus,
} from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  activeUser: string; // 'casal' | 'felipe' | 'genivania'
  onUserChange: (user: string) => void;
  users: User[];
  onOpenNewTx: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  selectedMonth,
  onMonthChange,
  activeUser,
  onUserChange,
  users,
  onOpenNewTx,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = React.useState(false);

  const monthsList = [
    'Janeiro 2026',
    'Fevereiro 2026',
    'Março 2026',
    'Abril 2026',
    'Maio 2026',
    'Junho 2026',
    'Julho 2026',
    'Agosto 2026',
    'Setembro 2026',
    'Outubro 2026',
    'Novembro 2026',
    'Dezembro 2026',
  ];

  const getActiveUserLabel = () => {
    if (activeUser === 'felipe' || activeUser === 'usr-felipe') return 'Felipe';
    if (activeUser === 'genivania' || activeUser === 'usr-genivania') return 'Genivânia';
    return 'Casal Duarte';
  };

  const getSubTitle = () => {
    switch (currentTab) {
      case 'extrato':
        return 'Transações & Fechamento';
      case 'scanner':
        return 'Comprovantes com IA';
      case 'dashboard':
        return 'Dashboard';
      case 'metas':
        return 'Metas & Planejamento';
      case 'lista':
        return 'Lista & Integrações';
      case 'relatorios':
        return 'Relatórios & Cestas';
      case 'voz':
        return 'API Alexa & Siri';
      default:
        return 'Gestão Compartilhada';
    }
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-[#e5eeff] shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div
          id="header-brand"
          onClick={() => onTabChange('dashboard')}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer select-none group"
        >
          <div className="h-9 w-9 rounded-xl bg-[#006948] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col shrink-0">
            <span className="font-display text-sm sm:text-lg font-bold text-[#0b1c30] leading-tight flex items-center gap-1.5 whitespace-nowrap">
              Duarte Finanças
            </span>
            <span className="text-[8px] font-extrabold tracking-wider text-[#006948] uppercase block leading-tight whitespace-nowrap">
              GESTÃO COMPARTILHADA
            </span>
            <span className="hidden sm:flex text-[11px] font-medium text-[#3d4a42] truncate items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006948]" />
              {getSubTitle()}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links with clean, proportional names */}
        <div className="hidden md:flex items-center gap-1.5">
          <nav className="flex items-center gap-0.5 bg-[#eff4ff] p-1 rounded-xl border border-[#dce9ff]">
            <button
              id="nav-tab-dashboard-geral"
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-white text-[#006948] shadow-xs font-bold'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Dashboard
            </button>
            <button
              id="nav-tab-extrato"
              onClick={() => onTabChange('extrato')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'extrato'
                  ? 'bg-white text-[#006948] shadow-xs font-bold'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Transações & Fechamento
            </button>
            <button
              id="nav-tab-scanner"
              onClick={() => onTabChange('scanner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'scanner'
                  ? 'bg-white text-[#006948] shadow-xs font-bold'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Comprovantes com IA
            </button>
            <button
              id="nav-tab-metas"
              onClick={() => onTabChange('metas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'metas'
                  ? 'bg-white text-[#006948] shadow-xs font-bold'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Metas & Planejamento
            </button>
            <button
              id="nav-tab-lista"
              onClick={() => onTabChange('lista')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'lista'
                  ? 'bg-white text-[#006948] shadow-xs font-bold'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Lista & Integrações
            </button>
            <button
              id="nav-tab-relatorios"
              onClick={() => onTabChange('relatorios')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'relatorios'
                  ? 'bg-white text-[#006948] shadow-xs font-bold'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Relatórios
            </button>
          </nav>
        </div>

        {/* Right Action Button & Profile Switcher matching reference */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Month Dropdown Pill */}
          <div className="relative hidden md:block">
            <button
              id="header-month-btn"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold transition-colors border border-[#cbd5e1] shadow-2xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#565e74]" />
              <span className="font-medium whitespace-nowrap">
                {selectedMonth}
              </span>
              <ChevronDown className="w-3 h-3 text-[#565e74]" />
            </button>

            {showMonthDropdown && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-[#cbd5e1] py-1.5 z-50 animate-in fade-in">
                {monthsList.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      onMonthChange(m);
                      setShowMonthDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#eff4ff] cursor-pointer ${
                      selectedMonth === m
                        ? 'text-[#006948] font-bold bg-[#ecfdf5]'
                        : 'text-[#0b1c30]'
                    }`}
                  >
                    <span>{m}</span>
                    {selectedMonth === m && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006948]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            id="btn-nova-despesa-header"
            onClick={onOpenNewTx}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#006948] hover:bg-[#00563b] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Despesa / PIX</span>
          </button>

          <button
            id="btn-notifications"
            className="hidden sm:flex relative p-2 rounded-full hover:bg-[#eff4ff] text-[#565e74] hover:text-[#0b1c30] transition-colors cursor-pointer"
            title="Notificações"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a]" />
          </button>

          {/* Mobile Sync Pill & Dropdown */}
          <div className="relative flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-[10px] font-bold shrink-0 cursor-pointer active:scale-95 transition-transform"
              title="Mês de Referência"
            >
              <span className="whitespace-nowrap">{selectedMonth}</span>
            </button>

            {showMonthDropdown && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-[#cbd5e1] py-1.5 z-50 animate-in fade-in">
                {monthsList.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      onMonthChange(m);
                      setShowMonthDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#eff4ff] cursor-pointer ${
                      selectedMonth === m
                        ? 'text-[#006948] font-bold bg-[#ecfdf5]'
                        : 'text-[#0b1c30]'
                    }`}
                  >
                    <span>{m}</span>
                    {selectedMonth === m && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006948]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Avatar matching reference: Casal Duarte / Conta Conjunta */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-1 pr-1 sm:pr-2 py-1 rounded-full hover:bg-[#eff4ff] transition-colors cursor-pointer"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#eff4ff] border-2 border-[#006948]/20 flex items-center justify-center text-xs font-bold text-[#006948] shadow-2xs overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Felipe & Genivânia"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#16a34a] border-2 border-white" />
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold text-[#0b1c30] leading-none">
                  Felipe & Genivânia
                </span>
                <span className="text-[10px] text-[#565e74] mt-0.5">
                  Casal Duarte
                </span>
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#cbd5e1] py-1.5 z-50 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-[#f1f5f9]">
                  <span className="text-[10px] uppercase font-bold text-[#565e74]">
                    Gestão Familiar
                  </span>
                </div>
                <div className="px-3 py-2 text-xs text-[#0b1c30] flex items-center gap-2 bg-[#ecfdf5] border-b border-[#e5eeff]">
                  <Users className="w-4 h-4 text-[#006948]" />
                  <div>
                    <span className="font-bold text-[#006948] block">Casal Duarte</span>
                    <span className="text-[10px] text-[#565e74]">Felipe & Genivânia</span>
                  </div>
                </div>
                <div className="py-1">
                  <div className="px-3 py-1.5 text-xs text-[#0b1c30] flex items-center gap-2 hover:bg-[#f8faff]">
                    <div className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[10px] font-bold">F</div>
                    <span className="font-medium text-xs">Felipe Duarte</span>
                  </div>
                  <div className="px-3 py-1.5 text-xs text-[#0b1c30] flex items-center gap-2 hover:bg-[#f8faff]">
                    <div className="w-5 h-5 rounded-full bg-[#ec4899] text-white flex items-center justify-center text-[10px] font-bold">G</div>
                    <span className="font-medium text-xs">Genivânia Duarte</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Tabs Strip (Only on mobile < 768px) */}
      <div className="flex md:hidden items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-t border-[#e5eeff]/80 bg-white/80 backdrop-blur-md">
        <button
          id="m-tab-dashboard"
          onClick={() => onTabChange('dashboard')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            currentTab === 'dashboard'
              ? 'bg-[#006948] text-white shadow-xs font-bold'
              : 'bg-[#f0f4f9] text-[#565e74] hover:text-[#0b1c30]'
          }`}
        >
          Dashboard
        </button>
        <button
          id="m-tab-extrato"
          onClick={() => onTabChange('extrato')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            currentTab === 'extrato'
              ? 'bg-[#006948] text-white shadow-xs font-bold'
              : 'bg-[#f0f4f9] text-[#565e74] hover:text-[#0b1c30]'
          }`}
        >
          Extrato
        </button>
        <button
          id="m-tab-scanner"
          onClick={() => onTabChange('scanner')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            currentTab === 'scanner'
              ? 'bg-[#006948] text-white shadow-xs font-bold'
              : 'bg-[#f0f4f9] text-[#565e74] hover:text-[#0b1c30]'
          }`}
        >
          Scanner IA
        </button>
        <button
          id="m-tab-metas"
          onClick={() => onTabChange('metas')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            currentTab === 'metas'
              ? 'bg-[#006948] text-white shadow-xs font-bold'
              : 'bg-[#f0f4f9] text-[#565e74] hover:text-[#0b1c30]'
          }`}
        >
          Metas & Carro
        </button>
        <button
          id="m-tab-relatorios"
          onClick={() => onTabChange('relatorios')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            currentTab === 'relatorios'
              ? 'bg-[#006948] text-white shadow-xs font-bold'
              : 'bg-[#f0f4f9] text-[#565e74] hover:text-[#0b1c30]'
          }`}
        >
          Relatórios BI
        </button>
        <button
          id="m-tab-lista"
          onClick={() => onTabChange('lista')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            currentTab === 'lista'
              ? 'bg-[#006948] text-white shadow-xs font-bold'
              : 'bg-[#f0f4f9] text-[#565e74] hover:text-[#0b1c30]'
          }`}
        >
          Lista de Compras
        </button>
      </div>
    </header>
  );
};
