import React, { useState, useMemo } from 'react';
import { X, DollarSign, Calendar, AlertCircle, CheckCircle2, Calculator, CreditCard, Sparkles, User, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CompanySettings, Installment, Loan, PaymentRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/finance';
import { generateNextTicketNumber } from '../utils/storage';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  installmentNumberToPay?: number | null;
  companySettings: CompanySettings;
  onPaymentSuccess: (paymentRecord: PaymentRecord, updatedLoan: Loan) => void;
  allLoans: Loan[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  loan,
  installmentNumberToPay,
  companySettings,
  onPaymentSuccess,
  allLoans,
}) => {
  if (!isOpen || !loan) return null;

  const currency = companySettings.currency || '$';

  // Find target installment
  const targetInstallment = useMemo(() => {
    if (installmentNumberToPay) {
      return loan.installments.find((i) => i.number === installmentNumberToPay);
    }
    // Default to the first unpaid installment
    return loan.installments.find((i) => i.status !== 'paid') || loan.installments[0];
  }, [loan, installmentNumberToPay]);

  // Form states
  const [selectedInstNum, setSelectedInstNum] = useState<number>(targetInstallment?.number || 1);
  const currentInst = loan.installments.find((i) => i.number === selectedInstNum) || targetInstallment || loan.installments[0];

  const baseDue = (currentInst?.totalDue || 0) - (currentInst?.paidAmount || 0);
  const calculatedLateFee = currentInst?.lateFeeCalculated || 0;
  const isLate = (currentInst?.daysOverdue || 0) > 0 && calculatedLateFee > 0;

  const [lateFeeCharged, setLateFeeCharged] = useState<number>(calculatedLateFee);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'other'>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [collectedBy, setCollectedBy] = useState('Caja Principal - Administrador');
  const [notes, setNotes] = useState('');

  // Update lateFeeCharged if installment changes
  React.useEffect(() => {
    if (currentInst) {
      setLateFeeCharged(currentInst.lateFeeCalculated || 0);
    }
  }, [currentInst]);

  const totalToPay = Math.max(0, baseDue + lateFeeCharged);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInst) return;

    // Trigger celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    const nowISO = new Date().toISOString();
    const ticketNum = generateNextTicketNumber(allLoans);

    // Update installments
    const updatedInstallments: Installment[] = loan.installments.map((inst) => {
      if (inst.number === currentInst.number) {
        return {
          ...inst,
          status: 'paid' as const,
          paidAmount: inst.totalDue,
          paidDate: nowISO,
          receiptNumber: ticketNum,
          paymentMethod,
          lateFeePaid: lateFeeCharged,
          lateFeeWaived: Math.max(0, (inst.lateFeeCalculated || 0) - lateFeeCharged),
        };
      }
      return inst;
    });

    // Create payment record
    const paymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      ticketNumber: ticketNum,
      loanId: loan.id,
      customerId: loan.customerId,
      customerName: loan.customer.fullName,
      installmentNumbers: [currentInst.number],
      paymentDate: nowISO,
      principalPaid: currentInst.principal,
      interestPaid: currentInst.interest,
      lateFeePaid: lateFeeCharged,
      totalAmountPaid: totalToPay,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
      collectedBy,
      remainingLoanBalance: Math.max(0, currentInst.remainingBalance),
    };

    // Check if entire loan is completed
    const allCompleted = updatedInstallments.every((i) => i.status === 'paid');
    const hasRemainingLate = updatedInstallments.some((i) => i.status === 'late');

    const totalPaidSum = updatedInstallments.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    const newOutstanding = Math.max(0, loan.totalToRepay - totalPaidSum);

    const updatedLoan: Loan = {
      ...loan,
      installments: updatedInstallments,
      payments: [paymentRecord, ...(loan.payments || [])],
      totalPaid: totalPaidSum,
      outstandingBalance: newOutstanding,
      status: allCompleted ? 'paid' : hasRemainingLate ? 'late' : 'active',
      updatedAt: nowISO,
    };

    onPaymentSuccess(paymentRecord, updatedLoan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-700 text-white">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">Registrar Cobro de Cuota</h3>
              <p className="text-xs text-emerald-100 mt-1">
                Préstamo: <span className="font-mono font-semibold text-white">{loan.loanCode}</span> · {loan.customer.fullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white hover:bg-emerald-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePay} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Select Installment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Seleccionar Cuota a Cobrar
            </label>
            <select
              value={selectedInstNum}
              onChange={(e) => setSelectedInstNum(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {loan.installments.map((inst) => {
                const isPaid = inst.status === 'paid';
                return (
                  <option key={inst.number} value={inst.number} disabled={isPaid}>
                    Cuota #{inst.number} (Vence: {formatDate(inst.dueDate)}) — {formatCurrency(inst.totalDue, currency)}{' '}
                    {isPaid ? '✓ PAGADA' : inst.status === 'late' ? `⚠️ VENCIDA (${inst.daysOverdue} días mora)` : '⏳ PENDIENTE'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Breakdown Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Fecha de Vencimiento Pactada:</span>
              </span>
              <span className="font-semibold text-slate-800">{formatDate(currentInst?.dueDate || '')}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Amortización de Capital:</span>
              <span className="font-medium text-slate-800">{formatCurrency(currentInst?.principal || 0, currency)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Interés Ordinario Mensual:</span>
              <span className="font-medium text-slate-800">{formatCurrency(currentInst?.interest || 0, currency)}</span>
            </div>

            <div className="flex justify-between items-center text-sm font-semibold text-slate-900 pt-1 border-t border-slate-200">
              <span>Cuota Base:</span>
              <span>{formatCurrency(baseDue, currency)}</span>
            </div>

            {/* Late Fee Notice & Control */}
            {isLate ? (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-start space-x-2 text-red-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="font-bold">Cuota Vencida ({currentInst.daysOverdue} días de retraso)</p>
                    <p className="text-red-700 text-[11px]">
                      Se aplica la tasa pactada de {loan.lateInterestRateDaily}% diario tras {loan.gracePeriodDays} días de tolerancia.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Interés Moratorio a Cobrar:
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-slate-500">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={lateFeeCharged}
                      onChange={(e) => setLateFeeCharged(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 bg-white border border-red-300 rounded-lg text-right font-bold text-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {lateFeeCharged < calculatedLateFee && (
                  <p className="text-[10px] text-amber-700 italic">
                    * Se está condonando {formatCurrency(calculatedLateFee - lateFeeCharged, currency)} de mora.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cuota al día dentro del plazo o periodo de gracia. Sin mora.</span>
              </div>
            )}

            {/* Grand Total Highlight */}
            <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-emerald-800">
              <span className="font-bold text-base">TOTAL A COBRAR:</span>
              <span className="font-bold text-2xl text-emerald-700">{formatCurrency(totalToPay, currency)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Forma de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-4 h-4 mb-1" />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'transfer'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1" />
                <span>Transferencia</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Tag className="w-4 h-4 mb-1" />
                <span>Tarjeta / Otro</span>
              </button>
            </div>
          </div>

          {/* Reference for non-cash payments */}
          {paymentMethod !== 'cash' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Operación / Referencia Bancaria
              </label>
              <input
                type="text"
                placeholder="Ej. SPEI-849201948 / Depósito"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Cashier & Notes */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1 flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Atendido por</span>
              </label>
              <input
                type="text"
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Notas / Observaciones</label>
              <input
                type="text"
                placeholder="Comentarios opcionales"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Confirmar Cobro y Emitir Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
