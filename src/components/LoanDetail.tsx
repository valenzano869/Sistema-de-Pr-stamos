import React from 'react';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  Clock,
  Printer,
  FileText,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building,
  CreditCard,
  Percent,
  Trash2,
} from 'lucide-react';
import { CompanySettings, Installment, Loan, PaymentRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/finance';

interface LoanDetailProps {
  loan: Loan;
  companySettings: CompanySettings;
  onBack: () => void;
  onOpenPaymentModal: (installmentNumber?: number) => void;
  onOpenTicketModal: (payment?: PaymentRecord, type?: 'payment' | 'loan_agreement') => void;
  onDeleteLoan?: (loanId: string) => void;
}

export const LoanDetail: React.FC<LoanDetailProps> = ({
  loan,
  companySettings,
  onBack,
  onOpenPaymentModal,
  onOpenTicketModal,
  onDeleteLoan,
}) => {
  const currency = companySettings.currency || '$';
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = React.useState('');

  // Compute stats
  const totalInstallments = loan.installments.length;
  const paidInstallments = loan.installments.filter((i) => i.status === 'paid').length;
  const lateInstallments = loan.installments.filter((i) => i.status === 'late').length;
  const progressPercent = totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0;

  // Next upcoming payment
  const nextPending = loan.installments.find((i) => i.status !== 'paid');

  const getStatusBadge = () => {
    if (loan.status === 'paid') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>PRÉSTAMO LIQUIDADO / TOTALMENTE PAGADO</span>
        </span>
      );
    }
    if (loan.status === 'late' || lateInstallments > 0) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold animate-pulse">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>EN MORA — {lateInstallments} CUOTA(S) VENCIDA(S)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>PRÉSTAMO ACTIVO / AL DÍA</span>
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            title="Volver a la cartera"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold text-slate-900">{loan.customer.fullName}</h2>
              <span className="font-mono text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold border border-slate-300">
                {loan.loanCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Doc: {loan.customer.documentId} · Tel: {loan.customer.phone} · Desembolso: {formatDate(loan.disbursementDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenTicketModal(undefined, 'loan_agreement')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Pagaré / Contrato</span>
          </button>

          {onDeleteLoan && (
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors border border-red-100"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          )}

          {loan.status !== 'paid' && (
            <button
              type="button"
              onClick={() => onOpenPaymentModal()}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <DollarSign className="w-4 h-4" />
              <span>Registrar Cobro</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards & Progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Capital Prestado</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(loan.principal, currency)}</p>
          <p className="text-[11px] text-blue-600 font-medium mt-0.5">
            TNA {loan.annualInterestRate}% · {loan.termsCount} meses
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total a Cobrar</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(loan.totalToRepay, currency)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Interés: {formatCurrency(loan.totalInterest, currency)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Total Recaudado</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(loan.totalPaid, currency)}</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{progressPercent}% pagado ({paidInstallments}/{totalInstallments} cuotas)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">Saldo Pendiente</span>
          <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(loan.outstandingBalance, currency)}</p>
          {loan.totalLateFeeAccrued > 0 ? (
            <p className="text-[11px] text-red-600 font-bold mt-0.5">
              +{formatCurrency(loan.totalLateFeeAccrued, currency)} mora acumulada
            </p>
          ) : (
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Sin recargos de mora</p>
          )}
        </div>
      </div>

      {/* Borrower & Loan Info Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Borrower info */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <User className="w-4 h-4 text-blue-600" />
            <span>Ficha del Prestatario</span>
          </div>
          <div className="text-xs space-y-1.5 text-slate-600">
            <p><strong className="text-slate-900">Nombre:</strong> {loan.customer.fullName}</p>
            <p><strong className="text-slate-900">Doc:</strong> {loan.customer.documentId}</p>
            <p><strong className="text-slate-900">Teléfono:</strong> {loan.customer.phone}</p>
            {loan.customer.address && <p><strong className="text-slate-900">Dirección:</strong> {loan.customer.address}</p>}
            {loan.customer.guarantorName && (
              <div className="pt-1.5 border-t border-slate-100 text-emerald-800">
                <span className="font-semibold">Aval Garante: </span>
                {loan.customer.guarantorName} ({loan.customer.guarantorPhone})
              </div>
            )}
          </div>
        </div>

        {/* Loan conditions */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>Condiciones del Contrato</span>
          </div>
          <div className="text-xs space-y-1.5 text-slate-600">
            <p><strong className="text-slate-900">Tasa Anual:</strong> {loan.annualInterestRate}% ({loan.monthlyInterestRate.toFixed(2)}% mensual)</p>
            <p><strong className="text-slate-900">Cuota Mensual Fija:</strong> {formatCurrency(loan.installmentBaseAmount, currency)}</p>
            <p><strong className="text-slate-900">Sistema:</strong> {loan.amortizationType.toUpperCase()}</p>
            <p className="text-red-700 font-medium">
              <strong>Mora por día:</strong> {loan.lateInterestRateDaily}% tras {loan.gracePeriodDays} días gracia
            </p>
          </div>
        </div>

        {/* Status & Next Due */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Estado Actual</span>
            </div>
            <div>{getStatusBadge()}</div>
          </div>

          {nextPending ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Próximo Vencimiento:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                Cuota #{nextPending.number} — {formatDate(nextPending.dueDate)}
              </p>
              <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                Importe: {formatCurrency(nextPending.totalDue, currency)}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold">
              ¡Todas las cuotas de este préstamo han sido pagadas en su totalidad!
            </div>
          )}
        </div>
      </div>

      {/* Control de Pagos Mensuales / Installments Ledger */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">Control de Pagos Mensuales y Vencimientos</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Estado en tiempo real de cada cuota, cálculo automático de días de mora e intereses de recargo.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5 text-center"># Cuota</th>
                <th className="p-3.5">Vencimiento</th>
                <th className="p-3.5 text-right">Capital</th>
                <th className="p-3.5 text-right">Interés</th>
                <th className="p-3.5 text-right font-bold text-slate-900">Cuota Base</th>
                <th className="p-3.5 text-center">Estado / Mora</th>
                <th className="p-3.5 text-right">Total Exigible</th>
                <th className="p-3.5 text-center">Acción / Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loan.installments.map((inst) => {
                const isPaid = inst.status === 'paid';
                const isLate = inst.status === 'late' && (inst.daysOverdue || 0) > 0;
                const totalDueWithLate = isPaid
                  ? (inst.paidAmount || inst.totalDue)
                  : inst.totalDue + (inst.lateFeeCalculated || 0);

                return (
                  <tr
                    key={inst.number}
                    className={`transition-colors ${
                      isPaid
                        ? 'bg-emerald-50/30'
                        : isLate
                        ? 'bg-red-50/40 hover:bg-red-50/70'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-3.5 text-center font-bold text-slate-800">#{inst.number}</td>
                    <td className="p-3.5 font-medium text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(inst.dueDate)}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right text-slate-700">{formatCurrency(inst.principal, currency)}</td>
                    <td className="p-3.5 text-right text-slate-700">{formatCurrency(inst.interest, currency)}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{formatCurrency(inst.totalDue, currency)}</td>

                    {/* Status / Mora */}
                    <td className="p-3.5 text-center">
                      {isPaid ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PAGADO</span>
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            {formatDate(inst.paidDate || '')}
                          </span>
                        </div>
                      ) : isLate ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full font-bold text-[11px]">
                            <AlertCircle className="w-3 h-3" />
                            <span>VENCIDO ({inst.daysOverdue} DÍAS)</span>
                          </span>
                          {inst.lateFeeCalculated > 0 && (
                            <span className="text-[10px] font-bold text-red-600 mt-0.5">
                              +{formatCurrency(inst.lateFeeCalculated, currency)} mora
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-semibold text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>PENDIENTE</span>
                        </span>
                      )}
                    </td>

                    {/* Total due with late */}
                    <td className="p-3.5 text-right font-bold text-sm">
                      {isPaid ? (
                        <span className="text-emerald-700">{formatCurrency(inst.paidAmount || inst.totalDue, currency)}</span>
                      ) : isLate ? (
                        <span className="text-red-700">{formatCurrency(totalDueWithLate, currency)}</span>
                      ) : (
                        <span className="text-slate-900">{formatCurrency(inst.totalDue, currency)}</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="p-3.5 text-center">
                      {isPaid ? (
                        <button
                          type="button"
                          onClick={() => {
                            const record = loan.payments.find((p) => p.ticketNumber === inst.receiptNumber);
                            onOpenTicketModal(record || undefined, 'payment');
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition-colors shadow-xs"
                          title="Reimprimir comprobante oficial"
                        >
                          <Printer className="w-3 h-3 text-slate-500" />
                          <span>{inst.receiptNumber || 'Ticket'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenPaymentModal(inst.number)}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs ${
                            isLate
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Cobrar Cuota</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History / Registro de Recibos Emitidos */}
      {loan.payments && loan.payments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>Historial de Pagos y Tickets Emitidos</span>
            </h3>
            <span className="text-xs text-slate-500">{loan.payments.length} recibos registrados</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loan.payments.map((p) => (
              <div
                key={p.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-100/80 transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                      {p.ticketNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      Cuota #{p.installmentNumbers.join(', ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {new Date(p.paymentDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })} ·{' '}
                    <span className="uppercase">{p.paymentMethod}</span>
                  </p>
                  {p.lateFeePaid > 0 && (
                    <p className="text-[10px] text-red-600 font-medium mt-0.5">
                      Incluye {formatCurrency(p.lateFeePaid, currency)} de mora
                    </p>
                  )}
                </div>

                <div className="text-right flex flex-col items-end space-y-1.5">
                  <span className="font-bold text-sm text-emerald-700">
                    {formatCurrency(p.totalAmountPaid, currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenTicketModal(p, 'payment')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-medium transition-colors shadow-xs"
                  >
                    <Printer className="w-3 h-3 text-slate-500" />
                    <span>Ver Ticket</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && onDeleteLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Eliminar Préstamo</h3>
                <p className="text-xs text-slate-500 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">
                Estás a punto de eliminar permanentemente el préstamo <strong className="text-slate-900">{loan.loanCode}</strong> de <strong className="text-slate-900">{loan.customer.fullName}</strong>.
              </p>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Para confirmar, escribe la palabra <strong className="text-red-600 select-all">ELIMINAR</strong>
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all"
                  placeholder="Escribe ELIMINAR"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeleteConfirmationText('');
                }}
                className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmationText === 'ELIMINAR') {
                    onDeleteLoan(loan.id);
                  }
                }}
                disabled={deleteConfirmationText !== 'ELIMINAR'}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Permanentemente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

