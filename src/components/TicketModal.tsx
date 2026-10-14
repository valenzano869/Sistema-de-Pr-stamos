import React, { useState } from 'react';
import { Printer, Copy, Check, Share2, X, FileText, QrCode, Info } from 'lucide-react';
import { CompanySettings, Loan, PaymentRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/finance';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: PaymentRecord | null;
  loan?: Loan | null;
  companySettings: CompanySettings;
  type?: 'payment' | 'loan_agreement';
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  payment,
  loan,
  companySettings,
  type = 'payment',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || (!payment && !loan)) return null;

  const currency = companySettings.currency || '$';
  const logoSrc = (!companySettings.logoUrl || companySettings.logoUrl.includes('unsplash.com'))
    ? '/logo.svg'
    : companySettings.logoUrl;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (type === 'payment' && payment && loan) {
      const text = `
========================================
       ${companySettings.name}
    ${companySettings.legalId}
  Tel: ${companySettings.phone}
========================================
TICKET DE COBRO: ${payment.ticketNumber}
FECHA: ${new Date(payment.paymentDate).toLocaleString('es-ES')}
PRÉSTAMO: ${loan.loanCode}
CLIENTE: ${payment.customerName}
CUOTA(S): ${payment.installmentNumbers.join(', ')} de ${loan.termsCount}
----------------------------------------
Capital / Cuota Base: ${formatCurrency(payment.principalPaid + payment.interestPaid, currency)}
Recargo por Mora:    ${formatCurrency(payment.lateFeePaid, currency)}
TOTAL PAGADO:        ${formatCurrency(payment.totalAmountPaid, currency)}
Método de Pago:      ${payment.paymentMethod.toUpperCase()}
----------------------------------------
SALDO PENDIENTE:     ${formatCurrency(payment.remainingLoanBalance, currency)}
Cobrado por:         ${payment.collectedBy}
========================================
${companySettings.ticketFooter}
${companySettings.ticketNotice}
========================================
      `.trim();
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else if (type === 'loan_agreement' && loan) {
      const totalInstallments = loan.installments.length;
      const paidInstallments = loan.installments.filter((i) => i.status === 'paid').length;
      const pendingInstallments = totalInstallments - paidInstallments;
      const nextPending = loan.installments.find((i) => i.status !== 'paid');
      const nextDueDate = nextPending ? formatDate(nextPending.dueDate) : 'Completado';
      const nextAmount = nextPending ? formatCurrency(nextPending.totalDue, currency) : formatCurrency(loan.monthlyPayment, currency);

      const text = `
========================================
       ${companySettings.name}
    ${companySettings.legalId}
  Tel: ${companySettings.phone}
========================================
RESUMEN DE PRÉSTAMO: ${loan.loanCode}
CLIENTE: ${loan.customer.fullName}
DNI / DOC: ${loan.customer.documentId}
TOTAL FINANCIADO: ${formatCurrency(loan.totalToRepay, currency)}
FECHA DESEMBOLSO: ${formatDate(loan.disbursementDate)}
----------------------------------------
MONTO A PAGAR (CUOTA): ${nextAmount}
PRÓXIMO VENCIMIENTO:   ${nextDueDate}
CUOTAS FALTANTES:      ${pendingInstallments} de ${totalInstallments}
SALDO RESTANTE:        ${formatCurrency(loan.outstandingBalance, currency)}
========================================
${companySettings.ticketFooter || 'Gracias por su confianza.'}
========================================
      `.trim();
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    if (type === 'payment' && payment && loan) {
      const cleanPhone = (loan.customer.phone || '').replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(
        `*COMPROBANTE DE PAGO*\n*${companySettings.name}*\n\n` +
        `Hola *${payment.customerName}*,\n` +
        `Confirmamos el registro de su pago:\n` +
        `📄 *Nº Ticket:* ${payment.ticketNumber}\n` +
        `💰 *Monto Pagado:* ${formatCurrency(payment.totalAmountPaid, currency)}\n` +
        `📅 *Fecha:* ${new Date(payment.paymentDate).toLocaleDateString('es-ES')}\n` +
        `🔢 *Cuota:* ${payment.installmentNumbers.join(', ')} de ${loan.termsCount}\n` +
        `💳 *Método:* ${payment.paymentMethod.toUpperCase()}\n` +
        `📉 *Saldo Restante:* ${formatCurrency(payment.remainingLoanBalance, currency)}\n\n` +
        `_${companySettings.ticketFooter}_`
      );
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    }
  };

  // Pre-calculate loan metrics for the client summary
  const totalInstallments = loan?.installments.length || 0;
  const paidInstallments = loan?.installments.filter((i) => i.status === 'paid').length || 0;
  const pendingInstallments = totalInstallments - paidInstallments;
  const nextPendingInstallment = loan?.installments.find((i) => i.status !== 'paid');
  const nextDueDateText = nextPendingInstallment ? formatDate(nextPendingInstallment.dueDate) : 'Totalmente al día';
  const nextAmountToPay = nextPendingInstallment
    ? nextPendingInstallment.totalDue
    : (loan?.monthlyPayment || 0);

  const frequencyLabels: Record<string, string> = {
    daily: 'Diarias',
    weekly: 'Semanales',
    biweekly: 'Quincenales',
    monthly: 'Mensuales',
  };
  const frequencyText = loan ? (frequencyLabels[loan.frequency] || 'Mensuales') : 'Mensuales';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto print-modal-overlay">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8 print-modal-card">
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white no-print print-hide">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg">
              {type === 'payment' ? 'Comprobante de Pago / Ticket' : 'Resumen de Préstamo y Plan de Pagos'}
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 bg-slate-100 border-b border-slate-200 text-sm no-print print-hide">
          <span className="text-slate-600 text-xs">
            {type === 'payment'
              ? 'Vista previa del comprobante de cobro emitido.'
              : 'Vista previa del resumen de préstamo para el cliente.'}
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 text-xs font-medium transition-colors shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Resumen'}</span>
            </button>
            {type === 'payment' && (
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Helpful Print Tip: How to remove URL, Date and Headers */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-6 py-2 flex items-center gap-2 text-xs text-amber-900 no-print print-hide">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <p>
            <span className="font-semibold">¿Cómo quitar la URL y fecha de la hoja?</span> En la ventana de impresión de tu navegador, despliega <span className="font-semibold">"Más ajustes"</span> y desmarca la casilla <span className="font-semibold text-amber-950 underline decoration-amber-400">"Encabezados y pies de página"</span>.
          </p>
        </div>

        {/* Printable Container */}
        <div className="p-6 bg-slate-100 flex justify-center max-h-[75vh] overflow-y-auto print-modal-scroll">
          {/* FULL A4 SHEET FORMAT */}
          <div
            id="printable-ticket"
            className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-md border border-slate-300 text-sm text-slate-800 space-y-6 print:p-0 print:border-none print:shadow-none print:space-y-4 print:text-slate-900 print:max-w-none"
          >
            {/* Header with official logo and company info */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 gap-4 print-avoid-break">
              <div className="flex items-center space-x-4">
                <img
                  src={logoSrc}
                  alt="Logo Empresa"
                  className="h-14 max-w-[220px] object-contain"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{companySettings.name}</h3>
                  <p className="text-xs text-slate-500">{companySettings.legalId}</p>
                  <p className="text-xs text-slate-500">{companySettings.address} · Tel: {companySettings.phone}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded font-mono text-sm font-semibold tracking-wider">
                  {type === 'payment' ? (payment?.ticketNumber || 'RECIBO') : (loan?.loanCode || 'PLAN DE PAGOS')}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-1.5">
                  {type === 'payment' ? 'Comprobante de Cobro' : 'Resumen y Cronograma de Cuotas'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Emisión: {new Date().toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            {type === 'payment' && payment && loan ? (
              <>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200 print-avoid-break">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Datos del Cliente</p>
                    <p className="font-bold text-slate-900 text-base">{payment.customerName}</p>
                    <p className="text-sm text-slate-600">ID/Doc: {loan.customer.documentId}</p>
                    <p className="text-sm text-slate-600">Tel: {loan.customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Detalles del Préstamo</p>
                    <p className="font-bold text-slate-900 text-base">Préstamo: {loan.loanCode}</p>
                    <p className="text-sm text-slate-600">Cuota pagada: Cuota #{payment.installmentNumbers.join(', ')} de {loan.termsCount}</p>
                    <p className="text-sm text-slate-600">Fecha de cobro: {new Date(payment.paymentDate).toLocaleString('es-ES')}</p>
                  </div>
                </div>

                <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden print-avoid-break">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Concepto</th>
                      <th className="p-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3">Amortización de Capital</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(payment.principalPaid, currency)}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Intereses Compensatorios Ordinarios</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(payment.interestPaid, currency)}</td>
                    </tr>
                    {payment.lateFeePaid > 0 && (
                      <tr className="text-red-600 bg-red-50/50">
                        <td className="p-3 font-medium">Intereses Moratorios por Días Vencidos</td>
                        <td className="p-3 text-right font-bold">+{formatCurrency(payment.lateFeePaid, currency)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold text-base text-slate-900">
                      <td className="p-4">TOTAL RECIBIDO</td>
                      <td className="p-4 text-right text-emerald-700">{formatCurrency(payment.totalAmountPaid, currency)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-between items-center bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-sm print-avoid-break">
                  <div>
                    <span className="text-slate-600">Saldo pendiente de capital e interés: </span>
                    <span className="font-bold text-blue-900">{formatCurrency(payment.remainingLoanBalance, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Medio de pago: </span>
                    <span className="font-bold text-slate-900 uppercase">{payment.paymentMethod}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-16 text-center text-sm print-avoid-break print-signatures">
                  <div className="border-t-2 border-slate-300 pt-3 mx-4">
                    <p className="font-bold text-slate-900">{payment.collectedBy}</p>
                    <p className="text-slate-500 font-medium">Cajero / Cobrador Autorizado</p>
                  </div>
                  <div className="border-t-2 border-slate-300 pt-3 mx-4">
                    <p className="font-bold text-slate-900">{payment.customerName}</p>
                    <p className="text-slate-500 font-medium">Firma del Cliente</p>
                  </div>
                </div>
              </>
            ) : loan ? (
              /* Enhanced Client-Friendly Loan Schedule (No Capital/Interest Split) */
              <div className="space-y-5 text-sm">
                {/* Document Banner */}
                <div className="bg-slate-50 border-y border-slate-200 py-2.5 px-4 text-center">
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
                    Resumen de Préstamo y Plan de Pagos
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Información detallada para el cliente · Conserve este documento para control de sus fechas de pago
                  </p>
                </div>

                {/* Client & Loan General Information Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200 print-avoid-break">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Datos del Titular</p>
                    <p className="font-bold text-slate-900 text-base">{loan.customer.fullName}</p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-500">DNI / Documento:</span> {loan.customer.documentId}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-500">Teléfono:</span> {loan.customer.phone || 'No registrado'}
                    </p>
                    {loan.customer.address && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium text-slate-500">Domicilio:</span> {loan.customer.address}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condiciones del Préstamo</p>
                    <p className="font-bold text-slate-900 text-base">
                      Código: <span className="font-mono text-blue-900">{loan.loanCode}</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-500">Monto Financiado:</span> {formatCurrency(loan.principal, currency)}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-500">Modalidad:</span> {loan.termsCount} Cuotas {frequencyText}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-500">Fecha de Desembolso:</span> {formatDate(loan.disbursementDate)}
                    </p>
                  </div>
                </div>

                {/* Hero Metrics for the Client: Monto a Pagar, Fecha de Vencimiento, Cuotas Faltantes, Saldo Restante */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 print-avoid-break print-hero-cards">
                  <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Monto a Pagar
                    </span>
                    <span className="block text-lg font-bold text-blue-900 font-mono tabular-nums mt-0.5">
                      {formatCurrency(nextAmountToPay, currency)}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {nextPendingInstallment ? `Cuota #${nextPendingInstallment.number}` : 'Crédito al día'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Fecha de Vencimiento
                    </span>
                    <span className="block text-lg font-bold text-slate-900 font-mono mt-0.5">
                      {nextDueDateText}
                    </span>
                    <span className="block text-[11px] mt-0.5 font-medium">
                      {nextPendingInstallment ? (
                        nextPendingInstallment.status === 'late' ? (
                          <span className="text-red-600 font-semibold">⚠️ Cuota Vencida</span>
                        ) : (
                          <span className="text-blue-700">Próximo vencimiento</span>
                        )
                      ) : (
                        <span className="text-emerald-700">Totalmente cancelado</span>
                      )}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Cuotas Faltantes
                    </span>
                    <span className="block text-lg font-bold text-slate-900 font-mono mt-0.5">
                      {pendingInstallments} de {totalInstallments}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {paidInstallments} abonadas · {pendingInstallments} pendientes
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Saldo Restante
                    </span>
                    <span className="block text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                      {formatCurrency(loan.outstandingBalance, currency)}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {loan.status === 'paid' ? 'Crédito liquidado' : 'Total por cancelar'}
                    </span>
                  </div>
                </div>

                {/* Client Installment Schedule Table (Cuota Nro, Fecha de Vencimiento, Monto a Pagar, Estado, Saldo Restante) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                      Cronograma de Pagos del Préstamo
                    </h4>
                    <span className="text-xs text-slate-500">
                      Total pactado: <strong className="text-slate-900 font-mono">{formatCurrency(loan.totalToRepay, currency)}</strong>
                    </span>
                  </div>

                  <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="p-2.5 text-center w-16">Cuota Nº</th>
                        <th className="p-2.5">Fecha de Vencimiento</th>
                        <th className="p-2.5 text-right">Monto a Pagar</th>
                        <th className="p-2.5 text-center w-28">Estado</th>
                        <th className="p-2.5 text-right">Saldo Restante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loan.installments.map((inst) => {
                        const isPaid = inst.status === 'paid';
                        const isLate = inst.status === 'late';
                        return (
                          <tr
                            key={inst.number}
                            className={
                              isPaid
                                ? 'bg-emerald-50/40 text-slate-700'
                                : isLate
                                ? 'bg-red-50/60 text-slate-900 font-medium'
                                : 'text-slate-800'
                            }
                          >
                            <td className="p-2.5 text-center font-bold text-slate-900">
                              #{inst.number}
                            </td>
                            <td className="p-2.5 font-medium text-slate-700">
                              {formatDate(inst.dueDate)}
                            </td>
                            <td className="p-2.5 text-right font-bold font-mono tabular-nums text-slate-900">
                              {formatCurrency(inst.totalDue, currency)}
                            </td>
                            <td className="p-2.5 text-center">
                              {isPaid ? (
                                <span className="text-emerald-700 font-bold text-[11px]">
                                  PAGADA
                                </span>
                              ) : isLate ? (
                                <span className="text-red-600 font-bold text-[11px]">
                                  VENCIDA
                                </span>
                              ) : (
                                <span className="text-slate-600 font-medium text-[11px]">
                                  PENDIENTE
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-mono tabular-nums text-slate-600 font-medium">
                              {formatCurrency(inst.remainingBalance, currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                      <tr>
                        <td colSpan={2} className="p-2.5 text-right uppercase tracking-wider text-[11px] text-slate-600">
                          Total Pactado / Saldo Pendiente:
                        </td>
                        <td className="p-2.5 text-right font-mono tabular-nums text-blue-900 text-sm">
                          {formatCurrency(loan.totalToRepay, currency)}
                        </td>
                        <td className="p-2.5 text-center text-xs text-slate-500">
                          {pendingInstallments === 0 ? 'Liquidado' : `${pendingInstallments} pendientes`}
                        </td>
                        <td className="p-2.5 text-right font-mono tabular-nums text-slate-900 text-sm">
                          {formatCurrency(loan.outstandingBalance, currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Important Notice & Payment Instructions for the Client */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 print-avoid-break print-notice">
                  <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Información Importante de Pago
                  </p>
                  <p>
                    Recuerde realizar sus pagos puntualmente en o antes de la fecha de vencimiento indicada para mantener su crédito al día.
                    {companySettings.phone && ` Para pagos por transferencia o consultas comuníquese al teléfono ${companySettings.phone}.`}
                    {companySettings.address && ` Centro de atención: ${companySettings.address}.`}
                  </p>
                  {companySettings.ticketNotice && (
                    <p className="text-slate-500 italic mt-1">{companySettings.ticketNotice}</p>
                  )}
                  {companySettings.ticketFooter && (
                    <p className="text-slate-500 font-medium mt-1">{companySettings.ticketFooter}</p>
                  )}
                </div>

                {/* Signatures Section */}
                <div className="grid grid-cols-2 gap-12 pt-10 text-center text-xs print-avoid-break print-signatures">
                  <div className="border-t-2 border-slate-400 pt-2.5 mx-4">
                    <p className="font-bold text-slate-900 text-sm">{loan.customer.fullName}</p>
                    <p className="text-slate-500">Firma del Cliente (Deudor)</p>
                    <p className="text-slate-400 text-[11px]">DNI / Doc: {loan.customer.documentId}</p>
                  </div>
                  <div className="border-t-2 border-slate-400 pt-2.5 mx-4">
                    <p className="font-bold text-slate-900 text-sm">{companySettings.name}</p>
                    <p className="text-slate-500">Firma y Sello Autorizado</p>
                    <p className="text-slate-400 text-[11px]">{companySettings.legalId}</p>
                  </div>
                </div>
              </div>
            ) : null}
            </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end no-print print-hide">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-medium text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
