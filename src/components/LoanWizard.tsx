import React, { useState, useMemo } from 'react';
import {
  User,
  DollarSign,
  Calendar,
  Percent,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  AlertCircle,
  FileCheck2,
  ShieldCheck,
  Building,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';
import { AmortizationType, CompanySettings, Customer, Loan, PaymentFrequency } from '../types';
import { formatCurrency, formatDate, generateAmortizationSchedule } from '../utils/finance';
import { generateNextLoanCode } from '../utils/storage';

interface LoanWizardProps {
  companySettings: CompanySettings;
  existingLoans: Loan[];
  onSaveLoan: (newLoan: Loan) => Promise<void> | void;
  onCancel: () => void;
}

export const LoanWizard: React.FC<LoanWizardProps> = ({
  companySettings,
  existingLoans,
  onSaveLoan,
  onCancel,
}) => {
  const currency = companySettings.currency || '$';

  // Step state (1: Cliente, 2: Condiciones, 3: Cronograma, 4: Confirmación)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Step 1: Customer Data
  const [customer, setCustomer] = useState<Partial<Customer>>({
    fullName: '',
    documentId: '',
    phone: '',
    email: '',
    address: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorDocumentId: '',
    notes: '',
  });

  // Step 2: Financial Terms
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const defaultFirstPaymentStr = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [principal, setPrincipal] = useState<number>(10000);
  const [annualRate, setAnnualRate] = useState<number>(companySettings.defaultAnnualRate || 36);
  const [termsCount, setTermsCount] = useState<number>(6);
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const [amortizationType, setAmortizationType] = useState<AmortizationType>('french');
  const [disbursementDate, setDisbursementDate] = useState<string>(todayStr);
  const [firstPaymentDate, setFirstPaymentDate] = useState<string>(defaultFirstPaymentStr);

  // Late fee / Mora terms
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(companySettings.defaultGraceDays || 3);
  const [lateInterestRateDaily, setLateInterestRateDaily] = useState<number>(companySettings.defaultLateRateDaily || 0.25);
  const [fixedLateFee, setFixedLateFee] = useState<number>(0);
  const [loanNotes, setLoanNotes] = useState<string>('');

  // Generate real-time schedule
  const scheduleData = useMemo(() => {
    return generateAmortizationSchedule({
      principal: principal || 0,
      annualInterestRate: annualRate || 0,
      termsCount: termsCount || 1,
      frequency,
      amortizationType,
      startDate: disbursementDate,
      firstPaymentDate,
      gracePeriodDays,
      lateInterestRateDaily,
      fixedLateFee,
    });
  }, [
    principal,
    annualRate,
    termsCount,
    frequency,
    amortizationType,
    disbursementDate,
    firstPaymentDate,
    gracePeriodDays,
    lateInterestRateDaily,
    fixedLateFee,
  ]);

  // Validation
  const isStep1Valid = Boolean(
    customer.fullName?.trim() &&
    customer.documentId?.trim() &&
    customer.phone?.trim()
  );

  const isStep2Valid = principal > 0 && annualRate >= 0 && termsCount > 0;

  const handleNext = () => {
    if (currentStep === 1 && !isStep1Valid) return;
    if (currentStep === 2 && !isStep2Valid) return;
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const loanCode = generateNextLoanCode(existingLoans);
      const nowISO = new Date().toISOString();

      const fullCustomer: Customer = {
        id: `cust-${Date.now()}`,
        fullName: customer.fullName || '',
        documentId: customer.documentId || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        guarantorName: customer.guarantorName || '',
        guarantorPhone: customer.guarantorPhone || '',
        guarantorDocumentId: customer.guarantorDocumentId || '',
        notes: customer.notes || '',
        createdAt: nowISO,
      };

      const newLoan: Loan = {
        id: `loan-${Date.now()}`,
        loanCode,
        customerId: fullCustomer.id,
        customer: fullCustomer,
        principal,
        annualInterestRate: annualRate,
        monthlyInterestRate: annualRate / 12,
        termsCount,
        frequency,
        amortizationType,
        disbursementDate,
        firstPaymentDate,
        gracePeriodDays,
        lateInterestRateDaily,
        fixedLateFee,
        totalInterest: scheduleData.totalInterest,
        totalToRepay: scheduleData.totalToRepay,
        installmentBaseAmount: scheduleData.installmentBase,
        installments: scheduleData.installments,
        payments: [],
        status: 'active',
        totalPaid: 0,
        outstandingBalance: scheduleData.totalToRepay,
        totalLateFeeAccrued: 0,
        createdAt: nowISO,
        updatedAt: nowISO,
        notes: loanNotes || undefined,
      };

      await onSaveLoan(newLoan);
    } finally {
      setIsSaving(false);
    }
  };

  // Steps definition
  const steps = [
    { number: 1, title: 'Datos del Prestatario', subtitle: 'Información y Garante' },
    { number: 2, title: 'Condiciones y Tasas', subtitle: 'Monto, TNA % y Plazo' },
    { number: 3, title: 'Cronograma Mensual', subtitle: 'Tabla de Amortización' },
    { number: 4, title: 'Aprobación y Pagaré', subtitle: 'Resumen y Desembolso' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {steps.map((s) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <button
                key={s.number}
                type="button"
                onClick={() => {
                  if (s.number < currentStep || (s.number === 2 && isStep1Valid) || (s.number === 3 && isStep1Valid && isStep2Valid)) {
                    setCurrentStep(s.number);
                  }
                }}
                disabled={s.number > currentStep && (!isStep1Valid || !isStep2Valid)}
                className={`flex items-center space-x-3 p-3 rounded-xl text-left transition-all ${
                  isCurrent
                    ? 'bg-blue-50 border-2 border-blue-600 text-blue-900 shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border border-slate-200 text-slate-400 opacity-70'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : s.number}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{s.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">{s.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {/* ================= STEP 1: DATOS DEL CLIENTE ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center space-x-2 text-blue-700">
                <User className="w-5 h-5" />
                <h3 className="font-bold text-lg text-slate-900">Paso 1: Datos del Prestatario / Cliente</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ingrese los datos personales y de contacto de la persona que solicita el préstamo en efectivo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Roberto Sánchez Gómez"
                  value={customer.fullName || ''}
                  onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  DNI / Cédula / Identificación <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. 45892134 o INE/RFC"
                  value={customer.documentId || ''}
                  onChange={(e) => setCustomer({ ...customer, documentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Teléfono / WhatsApp Móvil <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Ej. +52 55 1234 5678"
                    value={customer.phone || ''}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={customer.email || ''}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Dirección de Domicilio o Negocio
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Calle, Número, Colonia, Ciudad"
                    value={customer.address || ''}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Aval / Garante (Opcional) */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Datos del Garante / Aval Solidario (Opcional)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Nombre del Aval</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={customer.guarantorName || ''}
                    onChange={(e) => setCustomer({ ...customer, guarantorName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">DNI / Documento Aval</label>
                  <input
                    type="text"
                    placeholder="Nº Identificación"
                    value={customer.guarantorDocumentId || ''}
                    onChange={(e) => setCustomer({ ...customer, guarantorDocumentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Teléfono del Aval</label>
                  <input
                    type="tel"
                    placeholder="Teléfono móvil"
                    value={customer.guarantorPhone || ''}
                    onChange={(e) => setCustomer({ ...customer, guarantorPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: CONDICIONES FINANCIERAS ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center space-x-2 text-blue-700">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-bold text-lg text-slate-900">Paso 2: Configuración del Préstamo y Tasas</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Especifique el monto en efectivo, la tasa de interés anual pactada, el plazo en meses y los recargos por mora.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Principal */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Monto en Efectivo Prestado
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">{currency}</span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={principal || ''}
                    onChange={(e) => setPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Capital inicial a entregar en efectivo.</p>
              </div>

              {/* Annual Interest Rate */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tasa de Interés Anual (TNA %)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    step="0.5"
                    value={annualRate || ''}
                    onChange={(e) => setAnnualRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-lg font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400">% anual</span>
                </div>
                <p className="text-[11px] text-blue-600 font-medium mt-1">
                  Equivale a {(annualRate / 12).toFixed(2)}% mensual
                </p>
              </div>

              {/* Term in Months */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Plazo en Meses (X Meses)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    step="1"
                    value={termsCount || ''}
                    onChange={(e) => setTermsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 font-medium text-slate-400">meses</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[3, 6, 12, 18, 24].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTermsCount(m)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        termsCount === m
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m}M
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Amortization Method */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Sistema de Amortización
                </label>
                <select
                  value={amortizationType}
                  onChange={(e) => setAmortizationType(e.target.value as AmortizationType)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="french">Sistema Francés (Cuota Fija Mensual)</option>
                  <option value="german">Sistema Alemán (Capital Constante)</option>
                  <option value="simple">Interés Simple / Fijo Directo</option>
                </select>
              </div>

              {/* Disbursement Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Fecha de Desembolso (Inicio)
                </label>
                <input
                  type="date"
                  value={disbursementDate}
                  onChange={(e) => setDisbursementDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* First Payment Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Fecha de 1º Vencimiento
                </label>
                <input
                  type="date"
                  value={firstPaymentDate}
                  onChange={(e) => setFirstPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Mora and Late Fee Policy Configuration */}
            <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Control de Vencimientos e Intereses Moratorios (%) por Retraso</span>
              </div>
              <p className="text-xs text-amber-800">
                Configure las condiciones automáticas aplicadas en caso de que el cliente supere la fecha pactada de pago mensual.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="bg-white p-3 rounded-xl border border-amber-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Días de Gracia / Tolerancia
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-800"
                    />
                    <span className="text-xs text-slate-500">días sin mora</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tasa de Mora Diaria (%)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      step="0.05"
                      value={lateInterestRateDaily}
                      onChange={(e) => setLateInterestRateDaily(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-red-700"
                    />
                    <span className="text-xs text-slate-500">% / día vencido</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    ≈ {(lateInterestRateDaily * 30).toFixed(2)}% al mes
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo Fijo por Incumplimiento
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={fixedLateFee}
                      onChange={(e) => setFixedLateFee(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Gastos de cobranza opcionales</p>
                </div>
              </div>
            </div>

            {/* Quick Live Preview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <span className="text-[11px] font-semibold text-blue-700 uppercase">Capital Prestado</span>
                <p className="text-base font-bold text-blue-950 mt-0.5">{formatCurrency(principal, currency)}</p>
              </div>
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <span className="text-[11px] font-semibold text-indigo-700 uppercase">Cuota Mensual</span>
                <p className="text-base font-bold text-indigo-950 mt-0.5">{formatCurrency(scheduleData.installmentBase, currency)}</p>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase">Interés a Ganar</span>
                <p className="text-base font-bold text-emerald-950 mt-0.5">{formatCurrency(scheduleData.totalInterest, currency)}</p>
              </div>
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-700 uppercase">Total a Devolver</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{formatCurrency(scheduleData.totalToRepay, currency)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CRONOGRAMA DE AMORTIZACIÓN ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2 text-blue-700">
                  <FileSpreadsheet className="w-5 h-5" />
                  <h3 className="font-bold text-lg text-slate-900">Paso 3: Cronograma de Pagos y Amortización</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Revisión detallada de las {termsCount} cuotas mensuales calculadas para el cliente {customer.fullName}.
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-semibold text-blue-800">
                <Info className="w-4 h-4" />
                <span>Cuota Mensual Fija: {formatCurrency(scheduleData.installmentBase, currency)}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center">Nº Cuota</th>
                    <th className="p-3">Fecha de Vencimiento</th>
                    <th className="p-3 text-right">Saldo Inicial</th>
                    <th className="p-3 text-right">Capital</th>
                    <th className="p-3 text-right">Interés Ordinario</th>
                    <th className="p-3 text-right font-bold text-blue-900">Cuota a Pagar</th>
                    <th className="p-3 text-right">Saldo Restante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scheduleData.installments.map((inst) => (
                    <tr key={inst.number} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-700">#{inst.number}</td>
                      <td className="p-3 font-medium text-slate-900">{formatDate(inst.dueDate)}</td>
                      <td className="p-3 text-right text-slate-600">{formatCurrency(inst.initialBalance, currency)}</td>
                      <td className="p-3 text-right text-slate-800 font-medium">{formatCurrency(inst.principal, currency)}</td>
                      <td className="p-3 text-right text-slate-800 font-medium">{formatCurrency(inst.interest, currency)}</td>
                      <td className="p-3 text-right font-bold text-blue-700 bg-blue-50/40">{formatCurrency(inst.totalDue, currency)}</td>
                      <td className="p-3 text-right text-slate-600">{formatCurrency(inst.remainingBalance, currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={3} className="p-3 text-right">TOTALES:</td>
                    <td className="p-3 text-right text-emerald-800">{formatCurrency(principal, currency)}</td>
                    <td className="p-3 text-right text-blue-800">{formatCurrency(scheduleData.totalInterest, currency)}</td>
                    <td className="p-3 text-right text-base text-blue-900 bg-blue-100/50">{formatCurrency(scheduleData.totalToRepay, currency)}</td>
                    <td className="p-3 text-right">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Note on late fee trigger */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Regla de vencimiento activa:</span> Si el prestatario no abona la cuota mensual en la fecha indicada, dispondrá de {gracePeriodDays} días de tolerancia; superado este periodo, el sistema devengará automáticamente {lateInterestRateDaily}% diario de mora sobre el monto adeudado.
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: RESUMEN Y APROBACIÓN ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <FileCheck2 className="w-5 h-5" />
                <h3 className="font-bold text-lg text-slate-900">Paso 4: Resumen, Pagaré y Confirmación de Desembolso</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Verifique las condiciones pactadas antes de registrar el préstamo en el sistema y habilitar el control de pagos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Customer & Loan Details */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Datos del Deudor</span>
                  </h4>
                  <div className="text-xs space-y-1 text-slate-700">
                    <p><strong className="text-slate-900">Nombre:</strong> {customer.fullName}</p>
                    <p><strong className="text-slate-900">DNI/Doc:</strong> {customer.documentId}</p>
                    <p><strong className="text-slate-900">Teléfono:</strong> {customer.phone}</p>
                    {customer.email && <p><strong className="text-slate-900">Email:</strong> {customer.email}</p>}
                    {customer.address && <p><strong className="text-slate-900">Dirección:</strong> {customer.address}</p>}
                    {customer.guarantorName && (
                      <p className="text-emerald-700 font-medium">
                        <strong>Aval:</strong> {customer.guarantorName} ({customer.guarantorPhone})
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Condiciones Financieras</span>
                  </h4>
                  <div className="text-xs space-y-1 text-slate-700">
                    <p><strong className="text-slate-900">Capital Prestado:</strong> {formatCurrency(principal, currency)}</p>
                    <p><strong className="text-slate-900">Tasa Anual:</strong> {annualRate}% ({scheduleData.monthlyRate.toFixed(2)}% mensual)</p>
                    <p><strong className="text-slate-900">Plazo:</strong> {termsCount} cuotas mensuales</p>
                    <p><strong className="text-slate-900">Cuota Mensual:</strong> {formatCurrency(scheduleData.installmentBase, currency)}</p>
                    <p><strong className="text-slate-900">Total Intereses:</strong> {formatCurrency(scheduleData.totalInterest, currency)}</p>
                    <p className="text-red-700 font-medium">
                      <strong>Mora por retraso:</strong> {lateInterestRateDaily}% diario (gracia: {gracePeriodDays} días)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Notas u Observaciones del Préstamo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Préstamo para capital de trabajo, comprobante de ingresos verificado..."
                    value={loanNotes}
                    onChange={(e) => setLoanNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Right Column: Mini Promissory Note Preview */}
              <div className="bg-amber-50/40 p-5 rounded-xl border border-amber-300/80 font-mono text-xs text-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-center pb-2 border-b border-dashed border-amber-300">
                    <p className="font-bold text-sm tracking-wide text-slate-900 uppercase">PAGARÉ NOTARIAL DE DEUDA</p>
                    <p className="text-[10px] text-slate-500">{companySettings.name}</p>
                  </div>

                  <div className="py-2 text-[11px] leading-relaxed space-y-2 text-slate-700">
                    <p>
                      Yo, <strong>{customer.fullName}</strong> con documento Nº <strong>{customer.documentId}</strong>, reconozco adeudar y me comprometo a pagar incondicionalmente a favor de <strong>{companySettings.name}</strong> la cantidad total de:
                    </p>
                    <p className="text-center font-bold text-base text-blue-900 bg-white/80 py-1 rounded border border-amber-200">
                      {formatCurrency(scheduleData.totalToRepay, currency)}
                    </p>
                    <p>
                      En <strong>{termsCount} cuotas mensuales</strong> de <strong>{formatCurrency(scheduleData.installmentBase, currency)}</strong>, iniciando el día <strong>{formatDate(firstPaymentDate)}</strong>.
                    </p>
                    <p className="text-[10px] text-red-800">
                      * En caso de no pagar en las fechas pactadas, acepto el recargo de {lateInterestRateDaily}% diario por concepto de mora tras {gracePeriodDays} días de tolerancia.
                    </p>
                  </div>
                </div>

                <div className="pt-6 text-center text-[10px] space-y-4">
                  <div className="border-t border-slate-400 mx-6 pt-1">
                    <p className="font-bold">{customer.fullName}</p>
                    <p className="text-slate-500">Firma del Deudor (Prestatario)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= BUTTON CONTROLS ================= */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Paso Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>Continuar a Paso {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Guardando...' : 'Aprobar y Desembolsar Préstamo'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
