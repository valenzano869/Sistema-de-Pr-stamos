import React from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  PieChart,
  Users,
  Clock,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { CompanySettings, Loan } from '../types';
import { formatCurrency, formatDate } from '../utils/finance';

interface DashboardMetricsProps {
  loans: Loan[];
  companySettings: CompanySettings;
  onSelectLoan: (loan: Loan) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  loans,
  companySettings,
  onSelectLoan,
}) => {
  const currency = companySettings.currency || '$';

  // Calculations
  const totalLent = loans.reduce((acc, l) => acc + l.principal, 0);
  const totalInterestExpected = loans.reduce((acc, l) => acc + l.totalInterest, 0);
  const totalCollected = loans.reduce((acc, l) => acc + l.totalPaid, 0);
  const totalOutstanding = loans.reduce((acc, l) => acc + l.outstandingBalance, 0);
  const totalLateFeeAccrued = loans.reduce((acc, l) => acc + (l.totalLateFeeAccrued || 0), 0);

  // Late installments across all loans
  const allOverdueInstallments = loans.flatMap((l) =>
    l.installments
      .filter((inst) => inst.status === 'late' && (inst.daysOverdue || 0) > 0)
      .map((inst) => ({
        loan: l,
        installment: inst,
      }))
  );

  // Upcoming maturities (due in next 15 days, status !== paid and status !== late)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next15Days = new Date(today);
  next15Days.setDate(next15Days.getDate() + 15);

  const upcomingInstallments = loans.flatMap((l) =>
    l.installments
      .filter((inst) => {
        if (inst.status === 'paid') return false;
        const dueParts = inst.dueDate.split('-');
        const dueDate = new Date(parseInt(dueParts[0], 10), parseInt(dueParts[1], 10) - 1, parseInt(dueParts[2], 10));
        return dueDate >= today && dueDate <= next15Days;
      })
      .map((inst) => ({
        loan: l,
        installment: inst,
      }))
  );

  const recoveryRate = totalLent > 0 ? Math.min(100, Math.round((totalCollected / (totalLent + totalInterestExpected)) * 100)) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Capital Colocado</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(totalLent, currency)}</p>
          <p className="text-xs text-blue-600 font-medium mt-1">Interés Proyectado: +{formatCurrency(totalInterestExpected, currency)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Recaudado</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{formatCurrency(totalCollected, currency)}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">{recoveryRate}% de tasa de retorno</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Cartera Vigente</span>
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-indigo-900 mt-2">{formatCurrency(totalOutstanding, currency)}</p>
          <p className="text-xs text-slate-500 mt-1">Capital e interés por recuperar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-red-600">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">Moras Devengadas</span>
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-red-700 mt-2">{formatCurrency(totalLateFeeAccrued, currency)}</p>
          <p className="text-xs text-red-600 font-medium mt-1">{allOverdueInstallments.length} cuotas con mora</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Debtors / Morosos Alert List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-red-50/50">
            <div className="flex items-center space-x-2 text-red-800">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-base">Alertas de Vencimiento y Mora</h3>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
              {allOverdueInstallments.length} vencidas
            </span>
          </div>

          <div className="p-4 divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {allOverdueInstallments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">¡Excelente salud de cartera!</p>
                <p className="text-xs">No hay clientes con cuotas en mora actualmente.</p>
              </div>
            ) : (
              allOverdueInstallments.map(({ loan, installment }) => (
                <div
                  key={`${loan.id}-${installment.number}`}
                  className="py-3 flex items-center justify-between hover:bg-red-50/40 rounded-xl px-2 transition-colors cursor-pointer"
                  onClick={() => onSelectLoan(loan)}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{loan.customer.fullName}</span>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {loan.loanCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cuota #{installment.number} · Venció el {formatDate(installment.dueDate)} (
                      <strong className="text-red-600">{installment.daysOverdue} días retraso</strong>)
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-sm text-red-700">
                      {formatCurrency(installment.totalDue + installment.lateFeeCalculated, currency)}
                    </p>
                    <p className="text-[10px] text-red-600 font-semibold">
                      +{formatCurrency(installment.lateFeeCalculated, currency)} mora
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Maturities Agenda */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-blue-800">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">Próximos Vencimientos (15 días)</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {upcomingInstallments.length} por cobrar
            </span>
          </div>

          <div className="p-4 divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {upcomingInstallments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs">No hay vencimientos programados en los próximos 15 días.</p>
              </div>
            ) : (
              upcomingInstallments.map(({ loan, installment }) => (
                <div
                  key={`${loan.id}-${installment.number}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-xl px-2 transition-colors cursor-pointer"
                  onClick={() => onSelectLoan(loan)}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{loan.customer.fullName}</span>
                      <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {loan.loanCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cuota #{installment.number} · Vence el <strong className="text-blue-700">{formatDate(installment.dueDate)}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-900">
                      {formatCurrency(installment.totalDue, currency)}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Al día
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
