import React from 'react';
import {
  LayoutGrid,
  ReceiptText,
  ScanLine,
  Flag,
  Plus,
  ShoppingCart,
  FileSpreadsheet,
  Mic,
  BarChart3,
  MoreHorizontal,
  X,
  SlidersHorizontal,
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenNewTx: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenNewTx,
}) => {
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);

  return (
    <>
      {/* More Options Modal / Sheet for Mobile */}
      {showMoreMenu && (
        <div
          id="mobile-more-backdrop"
          onClick={() => setShowMoreMenu(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end justify-center md:hidden animate-in fade-in"
        >
          <div
            id="mobile-more-drawer"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-2xl p-4 shadow-2xl border-t border-[#e5eeff] animate-in slide-in-from-bottom"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <span className="font-display font-bold text-sm text-[#0b1c30]">Módulos Adicionais</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-full hover:bg-[#eff4ff] text-[#565e74]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-3">
              <button
                id="drawer-tab-metas"
                onClick={() => {
                  onTabChange('metas');
                  setShowMoreMenu(false);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all cursor-pointer ${
                  currentTab === 'metas'
                    ? 'bg-[#ecfdf5] text-[#006948] font-bold border border-[#a7f3d0]'
                    : 'bg-[#f8faff] hover:bg-[#eff4ff] text-[#0b1c30] border border-[#e5eeff]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center shadow-xs">
                  <Flag className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-center leading-tight">Metas & Carro</span>
              </button>

              <button
                id="drawer-tab-relatorios"
                onClick={() => {
                  onTabChange('relatorios');
                  setShowMoreMenu(false);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all cursor-pointer ${
                  currentTab === 'relatorios'
                    ? 'bg-[#ecfdf5] text-[#006948] font-bold border border-[#a7f3d0]'
                    : 'bg-[#f8faff] hover:bg-[#eff4ff] text-[#0b1c30] border border-[#e5eeff]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center shadow-xs">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-center leading-tight">Relatórios BI</span>
              </button>

              <button
                id="drawer-tab-lista"
                onClick={() => {
                  onTabChange('lista');
                  setShowMoreMenu(false);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all cursor-pointer ${
                  currentTab === 'lista'
                    ? 'bg-[#dae2fd] text-[#006194] font-bold border border-[#b6c7ff]'
                    : 'bg-[#f8faff] hover:bg-[#eff4ff] text-[#0b1c30] border border-[#e5eeff]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#dae2fd] text-[#006194] flex items-center justify-center shadow-xs">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-center leading-tight">Lista Compras</span>
              </button>

              <button
                id="drawer-tab-scanner"
                onClick={() => {
                  onTabChange('scanner');
                  setShowMoreMenu(false);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all cursor-pointer ${
                  currentTab === 'scanner'
                    ? 'bg-[#eff4ff] text-[#006194] font-bold border border-[#dce9ff]'
                    : 'bg-[#f8faff] hover:bg-[#eff4ff] text-[#0b1c30] border border-[#e5eeff]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#006194] flex items-center justify-center shadow-xs">
                  <ScanLine className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-center leading-tight">Scanner IA</span>
              </button>

              <button
                id="drawer-tab-voz"
                onClick={() => {
                  onTabChange('voz');
                  setShowMoreMenu(false);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all cursor-pointer ${
                  currentTab === 'voz'
                    ? 'bg-[#ecfdf5] text-[#006948] font-bold border border-[#a7f3d0]'
                    : 'bg-[#f8faff] hover:bg-[#eff4ff] text-[#0b1c30] border border-[#e5eeff]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center shadow-xs">
                  <Mic className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-center leading-tight">API Alexa / Siri</span>
              </button>

              <button
                id="drawer-tab-extrato"
                onClick={() => {
                  onTabChange('extrato');
                  setShowMoreMenu(false);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all cursor-pointer ${
                  currentTab === 'extrato'
                    ? 'bg-[#ecfdf5] text-[#006948] font-bold border border-[#a7f3d0]'
                    : 'bg-[#f8faff] hover:bg-[#eff4ff] text-[#0b1c30] border border-[#e5eeff]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#f8faff] text-[#565e74] flex items-center justify-center shadow-xs">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-center leading-tight">Extrato & Fechamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar matching reference */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 w-full z-40 pb-safe bg-white/95 backdrop-blur-xl border-t border-[#e5eeff] shadow-[0_-4px_16px_rgba(11,28,48,0.06)] md:hidden"
      >
        <div className="flex justify-between items-center h-16 px-3 max-w-[430px] mx-auto relative">
          {/* Tab 1: Início */}
          <button
            id="mobile-tab-inicio"
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] transition-colors cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-[#006948] font-bold'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Início</span>
          </button>

          {/* Tab 2: Extrato */}
          <button
            id="mobile-tab-extrato"
            onClick={() => onTabChange('extrato')}
            className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] transition-colors cursor-pointer ${
              currentTab === 'extrato'
                ? 'text-[#006948] font-bold'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            <ReceiptText className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Extrato</span>
          </button>

          {/* Center Floating Action Button (+) */}
          <div className="relative -top-5 flex flex-col items-center justify-center">
            <button
              id="btn-floating-new-tx"
              onClick={onOpenNewTx}
              className="flex items-center justify-center w-13 h-13 rounded-full bg-[#005a3c] text-white shadow-[0_6px_20px_rgba(0,90,60,0.4)] active:scale-95 transition-all hover:bg-[#00472f] border-4 border-white cursor-pointer"
              title="Nova Transação"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Tab 3: Scanner */}
          <button
            id="mobile-tab-scanner"
            onClick={() => onTabChange('scanner')}
            className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] transition-colors cursor-pointer ${
              currentTab === 'scanner'
                ? 'text-[#006948] font-bold'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            <ScanLine className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Scanner</span>
          </button>

          {/* Tab 4: Metas */}
          <button
            id="mobile-tab-metas"
            onClick={() => onTabChange('metas')}
            className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] transition-colors cursor-pointer ${
              currentTab === 'metas'
                ? 'text-[#006948] font-bold'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            <Flag className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Metas</span>
          </button>

          {/* Tab 5: Menu Mais (Relatórios, Lista, Voz) */}
          <button
            id="mobile-tab-mais"
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] transition-colors cursor-pointer relative ${
              currentTab === 'relatorios' || currentTab === 'lista' || currentTab === 'voz'
                ? 'text-[#006948] font-bold'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Mais</span>
            {(currentTab === 'relatorios' || currentTab === 'lista' || currentTab === 'voz') && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#006948]" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
