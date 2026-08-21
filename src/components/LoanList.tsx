import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Calendar,
  ChevronRight,
  Printer,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { CompanySettings, Loan, LoanStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/finance';

interface LoanListProps {
  loans: Loan[];
  companySettings: CompanySettings;
  onSelectLoan: (loan: Loan) => void;
  onNewLoan: () => void;
  onQuickPayment: (loan: Loan) => void;
}

export const LoanList: React.FC<LoanListProps> = ({
  loans,
  companySettings,
  onSelectLoan,
  onNewLoan,
  onQuickPayment,
}) => {
  const currency = companySettings.currency || '$';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter loans
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchSearch =
        loan.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.customer.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loanCode.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'late') return loan.status === 'late';
      if (statusFilter === 'active') return loan.status === 'active';
      if (statusFilter === 'paid') return loan.status === 'paid';

      return true;
    });
  }, [loans, searchTerm, statusFilter]);

  // Metric counts
  const totalLoans = loans.length;
  const activeCount = loans.filter((l) => l.status === 'active').length;
  const lateCount = loans.filter((l) => l.status === 'late').length;
  const paidCount = loans.filter((l) => l.status === 'paid').length;

  const totalCapitalLent = loans.reduce((acc, l) => acc + l.principal, 0);
  const totalOutstanding = loans.reduce((acc, l) => acc + l.outstandingBalance, 0);
  const totalLateFees = loans.reduce((acc, l) => acc + (l.totalLateFeeAccrued || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Portfolio Financial Highlights Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capital Colocado</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">{formatCurrency(totalCapitalLent, currency)}</p>
          <p className="text-xs text-slate-500 mt-1">{totalLoans} préstamos registrados</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Préstamos al Día</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-2">{activeCount}</p>
          <p className="text-xs text-emerald-600 mt-1">Cumpliendo con las fechas pactadas</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">En Mora / Vencidos</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-700 mt-2">{lateCount}</p>
          <p className="text-xs text-red-600 font-medium mt-1">
            {formatCurrency(totalLateFees, currency)} de mora devengada
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Cartera por Cobrar</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-indigo-900 mt-2">{formatCurrency(totalOutstanding, currency)}</p>
          <p className="text-xs text-slate-500 mt-1">Saldo restante en la calle</p>
        </div>
      </div>

      {/* Main Filter & Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, DNI o código de préstamo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* New Loan Action Button */}
          <button
            type="button"
            onClick={onNewLoan}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Diseñar Nuevo Préstamo</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar:</span>
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({totalLoans})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Al Día ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('late')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'late'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            ⚠️ En Mora ({lateCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'paid'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Liquidados ({paidCount})
          </button>
        </div>
      </div>

      {/* Loans Grid / List */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base">No se encontraron préstamos</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'No hay registros que coincidan con su búsqueda. Intente con otro término o limpie el filtro.'
                : 'Aún no tiene préstamos registrados. Comience creando su primer préstamo paso a paso.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onNewLoan}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Préstamo Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLoans.map((loan) => {
            const totalInst = loan.installments.length;
            const paidInst = loan.installments.filter((i) => i.status === 'paid').length;
            const lateInst = loan.installments.filter((i) => i.status === 'late').length;
            const progress = totalInst > 0 ? Math.round((paidInst / totalInst) * 100) : 0;
            const nextDue = loan.installments.find((i) => i.status !== 'paid');

            return (
              <div
                key={loan.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
              >
                {/* Header Card */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {loan.loanCode}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 mt-1.5 truncate group-hover:text-blue-600 transition-colors">
                        {loan.customer.fullName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        DNI: {loan.customer.documentId} · Tel: {loan.customer.phone}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {loan.status === 'paid' ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                          LIQUIDADO
                        </span>
                      ) : loan.status === 'late' || lateInst > 0 ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-[10px] font-bold animate-pulse">
                          EN MORA ({lateInst})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
                          AL DÍA
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial terms */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-3 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Capital Prestado</span>
                      <p className="font-bold text-slate-900 text-sm">{formatCurrency(loan.principal, currency)}</p>
                      <p className="text-[10px] text-blue-600">{loan.annualInterestRate}% TNA · {loan.termsCount}M</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Saldo Pendiente</span>
                      <p className="font-bold text-red-700 text-sm">{formatCurrency(loan.outstandingBalance, currency)}</p>
                      <p className="text-[10px] text-slate-500">Cuota: {formatCurrency(loan.installmentBaseAmount, currency)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Progreso de Pagos</span>
                      <span className="font-bold text-slate-700">{paidInst} de {totalInst} cuotas ({progress}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Due Notice */}
                  {nextDue && (
                    <div className="mt-2.5 text-[11px] text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="flex items-center space-x-1 text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>Próximo Vto:</span>
                      </span>
                      <span className={`font-semibold ${nextDue.status === 'late' ? 'text-red-600 font-bold' : 'text-slate-900'}`}>
                        Cuota #{nextDue.number} ({formatDate(nextDue.dueDate)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectLoan(loan)}
                    className="flex-1 inline-flex items-center justify-center space-x-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <span>Ver Detalle & Cuotas</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {loan.status !== 'paid' && (
                    <button
                      type="button"
                      onClick={() => onQuickPayment(loan)}
                      className="inline-flex items-center justify-center space-x-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      title="Registrar cobro de cuota"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Cobrar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
