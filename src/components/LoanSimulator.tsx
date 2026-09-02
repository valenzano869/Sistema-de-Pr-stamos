import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Sliders,
  DollarSign,
  Calendar,
  Percent,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AmortizationType, CompanySettings, PaymentFrequency } from '../types';
import { formatCurrency, formatDate, generateAmortizationSchedule } from '../utils/finance';

interface LoanSimulatorProps {
  companySettings: CompanySettings;
  onConvertIntoLoan: (params: {
    principal: number;
    annualRate: number;
    termsCount: number;
    amortizationType: AmortizationType;
  }) => void;
}

export const LoanSimulator: React.FC<LoanSimulatorProps> = ({
  companySettings,
  onConvertIntoLoan,
}) => {
  const currency = companySettings.currency || '$';

  // Simulator parameters
  const [principal, setPrincipal] = useState<number>(12000);
  const [annualRate, setAnnualRate] = useState<number>(36);
  const [termsCount, setTermsCount] = useState<number>(6);
  const [amortizationType, setAmortizationType] = useState<AmortizationType>('french');
  const [lateDailyRate, setLateDailyRate] = useState<number>(0.25);
  const [graceDays, setGraceDays] = useState<number>(3);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const firstPayStr = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute schedule
  const scheduleData = useMemo(() => {
    return generateAmortizationSchedule({
      principal: principal || 0,
      annualInterestRate: annualRate || 0,
      termsCount: termsCount || 1,
      frequency: 'monthly',
      amortizationType,
      startDate: todayStr,
      firstPaymentDate: firstPayStr,
      gracePeriodDays: graceDays,
      lateInterestRateDaily: lateDailyRate,
      fixedLateFee: 0,
    });
  }, [principal, annualRate, termsCount, amortizationType, todayStr, firstPayStr, graceDays, lateDailyRate]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-700">
            <Calculator className="w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">Simulador y Cotizador Rápido de Préstamos</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calcule cuotas mensuales, intereses totales y proyecciones de amortización al instante con tasas personalizables.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onConvertIntoLoan({
              principal,
              annualRate,
              termsCount,
              amortizationType,
            })
          }
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Crear Préstamo con estos Valores</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Controls & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Sliders and Inputs */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Parámetros de Simulación</span>
          </h3>

          {/* Principal Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">Monto en Efectivo</label>
              <span className="font-bold text-base text-blue-700">{formatCurrency(principal, currency)}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="1000000"
              step="500"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{currency} 1,000</span>
              <span>{currency} 1,000,000</span>
            </div>
          </div>

          {/* Annual Rate Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">Tasa Anual (TNA %)</label>
              <span className="font-bold text-base text-blue-700">{annualRate}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="250"
              step="1"
              value={annualRate}
              onChange={(e) => setAnnualRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>5%</span>
              <span className="text-blue-600 font-semibold">{(annualRate / 12).toFixed(2)}% mensual</span>
              <span>250%</span>
            </div>
          </div>

          {/* Term in Months Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">Plazo en Meses</label>
              <span className="font-bold text-base text-blue-700">{termsCount} Meses</span>
            </div>
            <input
              type="range"
              min="1"
              max="36"
              step="1"
              value={termsCount}
              onChange={(e) => setTermsCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 Mes</span>
              <span>36 Meses</span>
            </div>
          </div>

          {/* Amortization System */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Sistema de Cuotas</label>
            <select
              value={amortizationType}
              onChange={(e) => setAmortizationType(e.target.value as AmortizationType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white"
            >
              <option value="french">Sistema Francés (Cuota Fija)</option>
              <option value="german">Sistema Alemán (Capital Constante)</option>
              <option value="simple">Interés Simple / Fijo Directo</option>
            </select>
          </div>
        </div>

        {/* Right column: Results and Table */}
        <div className="lg:col-span-2 space-y-5">
          {/* Highlight KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <span className="text-[11px] font-bold text-blue-700 uppercase">Cuota Mensual</span>
              <p className="text-2xl font-bold text-blue-950 mt-1">{formatCurrency(scheduleData.installmentBase, currency)}</p>
              <p className="text-[10px] text-blue-700 mt-0.5">{termsCount} cuotas de amortización</p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Total Intereses</span>
              <p className="text-2xl font-bold text-emerald-950 mt-1">{formatCurrency(scheduleData.totalInterest, currency)}</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Ganancia financiera</p>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-300 uppercase">Total a Devolver</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(scheduleData.totalToRepay, currency)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Capital + Interés</p>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Tabla de Amortización Proyectada</span>
              </h4>
              <span className="text-xs text-slate-500">{scheduleData.installments.length} cuotas</span>
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-center">#</th>
                    <th className="p-2.5">Vencimiento</th>
                    <th className="p-2.5 text-right">Capital</th>
                    <th className="p-2.5 text-right">Interés</th>
                    <th className="p-2.5 text-right font-bold text-blue-900">Cuota</th>
                    <th className="p-2.5 text-right">Saldo Restante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scheduleData.installments.map((inst) => (
                    <tr key={inst.number} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center font-bold text-slate-700">#{inst.number}</td>
                      <td className="p-2.5 font-medium">{formatDate(inst.dueDate)}</td>
                      <td className="p-2.5 text-right text-slate-700">{formatCurrency(inst.principal, currency)}</td>
                      <td className="p-2.5 text-right text-slate-700">{formatCurrency(inst.interest, currency)}</td>
                      <td className="p-2.5 text-right font-bold text-blue-700">{formatCurrency(inst.totalDue, currency)}</td>
                      <td className="p-2.5 text-right text-slate-600">{formatCurrency(inst.remainingBalance, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
