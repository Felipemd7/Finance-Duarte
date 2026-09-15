import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem('duarte_receipts');
      localStorage.removeItem('duarte_transactions');
      localStorage.removeItem('duarte_goals');
      localStorage.removeItem('duarte_spreadsheets');
      localStorage.removeItem('duarte_fuel_logs');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8faff] flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#dce9ff] shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center mx-auto border border-[#fecdd3]">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="font-display font-bold text-lg text-[#0b1c30]">
                Ops! Ocorreu uma instabilidade
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Uma atualização ou dado armazenado causou uma falha temporária. Seus dados no banco de dados estão seguros.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-left font-mono text-[11px] text-gray-700 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 rounded-xl bg-[#006948] hover:bg-[#005a3c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Aplicação
              </button>

              <button
                onClick={this.handleClearCacheAndReset}
                className="w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                Limpar Cache Local e Reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
