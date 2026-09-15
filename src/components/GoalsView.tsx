import React, { useState } from 'react';
import { FinancialGoal, Transaction, FuelLog } from '../types';
import { GoalsDesktopView } from './GoalsDesktopView';

interface GoalsViewProps {
  goals?: FinancialGoal[];
  transactions?: Transaction[];
  selectedMonth?: string;
  onAddGoal?: (goal: FinancialGoal) => void;
  onUpdateGoal?: (goal: FinancialGoal) => void;
  fuelLogs?: FuelLog[];
  onAddFuelLog?: (log: FuelLog) => void;
  onUpdateFuelLog?: (log: FuelLog) => void;
  onDeleteFuelLog?: (id: string) => void;
  onDeleteGoal?: (id: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals = [],
  transactions = [],
  selectedMonth = 'Março 2026',
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  fuelLogs,
  onAddFuelLog,
  onUpdateFuelLog,
  onDeleteFuelLog,
}) => {
  const [isReclassified, setIsReclassified] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleReclassification = () => {
    setIsReclassified(!isReclassified);
    showToast(
      !isReclassified
        ? 'Despesas reclassificadas para proteger o teto de Alimentação.'
        : 'Classificação original restaurada.'
    );
  };

  return (
    <div className="w-full font-sans animate-in fade-in duration-300 pb-24 md:pb-12">
      {/* Visualização de Metas 100% Responsiva: mesma interface rica do desktop adaptada para mobile */}
      <GoalsDesktopView
        isReclassified={isReclassified}
        onToggleReclassification={handleToggleReclassification}
        onShowToast={showToast}
        onOpenAddGoal={() => {}}
        goals={goals}
        transactions={transactions}
        selectedMonth={selectedMonth}
        onAddGoal={onAddGoal}
        onUpdateGoal={onUpdateGoal}
        fuelLogs={fuelLogs}
        onAddFuelLog={onAddFuelLog}
        onUpdateFuelLog={onUpdateFuelLog}
        onDeleteFuelLog={onDeleteFuelLog}
        onDeleteGoal={onDeleteGoal}
      />
    </div>
  );
};
