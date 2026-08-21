import React from 'react';
import {
  Banknote,
  Plus,
  LayoutDashboard,
  Calculator,
  PieChart,
  Settings,
  Receipt,
} from 'lucide-react';
import { CompanySettings } from '../types';

export type ActiveTab = 'loans' | 'wizard' | 'simulator' | 'metrics';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  companySettings: CompanySettings;
  onOpenSettings: () => void;
  onNewLoan: () => void;
  overdueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  companySettings,
  onOpenSettings,
  onNewLoan,
  overdueCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onTabChange('loans')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white leading-tight">
                {companySettings.name}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Control de Préstamos & Impresión de Tickets
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
            <button
              type="button"
              onClick={() => onTabChange('loans')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'loans'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Cartera de Préstamos</span>
              {overdueCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-red-500 text-white font-bold rounded-full">
                  {overdueCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange('wizard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'wizard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Diseñar Préstamo</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('simulator')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Simulador Express</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('metrics')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'metrics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Reporte Financiero</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onNewLoan}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Préstamo</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Configuración de la empresa y moneda"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onTabChange('loans')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              activeTab === 'loans' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Cartera</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('wizard')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              activeTab === 'wizard' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Plus className="w-4 h-4 mb-0.5" />
            <span>Diseñar</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('simulator')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              activeTab === 'simulator' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Calculator className="w-4 h-4 mb-0.5" />
            <span>Simular</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('metrics')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              activeTab === 'metrics' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            <PieChart className="w-4 h-4 mb-0.5" />
            <span>Reportes</span>
          </button>
        </div>
      </div>
    </header>
  );
};
