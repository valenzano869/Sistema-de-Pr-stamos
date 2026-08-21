import React, { useState } from 'react';
import { Printer, Copy, Check, Share2, X, FileText, QrCode } from 'lucide-react';
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
  const [paperFormat, setPaperFormat] = useState<'80mm' | 'A4'>('80mm');

  if (!isOpen || (!payment && !loan)) return null;

  const currency = companySettings.currency || '$';

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
${payment.cashReceived ? `Efectivo Recibido:   ${formatCurrency(payment.cashReceived, currency)}\nCambio:              ${formatCurrency(payment.changeGiven || 0, currency)}` : ''}
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg">
              {type === 'payment' ? 'Comprobante de Pago / Ticket' : 'Pagaré y Resumen de Préstamo'}
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            {/* Format toggle */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPaperFormat('80mm')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  paperFormat === '80mm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ticket 80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat('A4')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  paperFormat === 'A4' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hoja A4
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 bg-slate-100 border-b border-slate-200 text-sm">
          <span className="text-slate-600 text-xs">
            Vista previa antes de imprimir. Optimizado para impresoras térmicas y láser.
          </span>
          <div className="flex items-center space-x-2">
            {type === 'payment' && (
              <>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 text-xs font-medium transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Printable Ticket Container */}
        <div className="p-6 bg-slate-100 flex justify-center max-h-[70vh] overflow-y-auto">
          {paperFormat === '80mm' ? (
            /* THERMAL TICKET FORMAT (80mm) */
            <div
              id="printable-ticket"
              className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-md border border-slate-300 font-mono text-xs text-slate-900 leading-relaxed"
            >
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <h4 className="font-bold text-sm uppercase tracking-wide text-black">{companySettings.name}</h4>
                <p className="text-[11px] text-slate-700">{companySettings.legalId}</p>
                <p className="text-[10px] text-slate-600">{companySettings.address}</p>
                <p className="text-[10px] text-slate-600">Tel: {companySettings.phone}</p>
                <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-semibold text-[11px]">
                  {type === 'payment' ? 'RECIBO OFICIAL DE PAGO' : 'PAGARÉ DE PRÉSTAMO'}
                </div>
              </div>

              {type === 'payment' && payment && loan ? (
                <>
                  {/* Metadata */}
                  <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nº Ticket:</span>
                      <span className="font-bold">{payment.ticketNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fecha/Hora:</span>
                      <span>{new Date(payment.paymentDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nº Préstamo:</span>
                      <span className="font-semibold">{loan.loanCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cliente:</span>
                      <span className="font-semibold text-right max-w-[170px] truncate">{payment.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Doc / DNI:</span>
                      <span>{loan.customer.documentId}</span>
                    </div>
                  </div>

                  {/* Payment Concept Breakdown */}
                  <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5">
                    <div className="font-bold text-[11px] uppercase text-slate-800">
                      CONCEPTO DE COBRO
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Cuota Nº {payment.installmentNumbers.join(', ')} de {loan.termsCount}</span>
                      <span>{formatCurrency(payment.principalPaid + payment.interestPaid, currency)}</span>
                    </div>
                    
                    {payment.lateFeePaid > 0 && (
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>Intereses por Mora / Retraso:</span>
                        <span>+{formatCurrency(payment.lateFeePaid, currency)}</span>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-slate-300 flex justify-between font-bold text-sm text-black">
                      <span>TOTAL COBRADO:</span>
                      <span>{formatCurrency(payment.totalAmountPaid, currency)}</span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Forma de Pago:</span>
                      <span className="font-semibold">{payment.paymentMethod === 'cash' ? 'EFECTIVO' : payment.paymentMethod.toUpperCase()}</span>
                    </div>
                    {payment.referenceNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Referencia:</span>
                        <span>{payment.referenceNumber}</span>
                      </div>
                    )}
                    {payment.cashReceived ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Efectivo Recibido:</span>
                          <span>{formatCurrency(payment.cashReceived, currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Cambio Entregado:</span>
                          <span>{formatCurrency(payment.changeGiven || 0, currency)}</span>
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* Loan Balance After Payment */}
                  <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 bg-slate-50 p-2 rounded">
                    <div className="flex justify-between font-semibold">
                      <span>Saldo Restante Préstamo:</span>
                      <span className="text-blue-900">{formatCurrency(payment.remainingLoanBalance, currency)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>Atendido por:</span>
                      <span>{payment.collectedBy}</span>
                    </div>
                  </div>

                  {/* QR & Barcode Simulation */}
                  <div className="py-3 text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 border-2 border-slate-800 p-1 flex items-center justify-center rounded">
                        <QrCode className="w-12 h-12 text-slate-900" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 tracking-wider">
                      VERIFICACIÓN: {payment.ticketNumber}
                    </p>
                  </div>

                  {/* Footer & Signature */}
                  <div className="pt-2 text-center space-y-3">
                    <div className="pt-6 border-t border-slate-400 mx-6">
                      <p className="text-[10px] text-slate-600">Firma / Sello de Conformidad</p>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-700">{companySettings.ticketFooter}</p>
                    <p className="text-[9px] text-slate-500 leading-tight">{companySettings.ticketNotice}</p>
                  </div>
                </>
              ) : loan ? (
                /* LOAN DISBURSEMENT / AGREEMENT TICKET */
                <>
                  <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cód. Préstamo:</span>
                      <span className="font-bold">{loan.loanCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fecha Desembolso:</span>
                      <span>{formatDate(loan.disbursementDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cliente:</span>
                      <span className="font-semibold text-right max-w-[170px] truncate">{loan.customer.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Identificación:</span>
                      <span>{loan.customer.documentId}</span>
                    </div>
                  </div>

                  <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5">
                    <div className="font-bold text-[11px] uppercase text-slate-800">
                      CONDICIONES PACTADAS
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Capital Prestado:</span>
                      <span className="font-bold">{formatCurrency(loan.principal, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tasa Interés Anual:</span>
                      <span>{loan.annualInterestRate}% ({loan.monthlyInterestRate.toFixed(2)}% mensual)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Plazo / Cuotas:</span>
                      <span className="font-semibold">{loan.termsCount} meses</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cuota Mensual:</span>
                      <span className="font-bold text-emerald-800">{formatCurrency(loan.installmentBaseAmount, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tasa de Mora diaria:</span>
                      <span className="text-red-700">{loan.lateInterestRateDaily}% / día (tras {loan.gracePeriodDays} días de gracia)</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-300 flex justify-between font-bold text-sm">
                      <span>TOTAL A PAGAR:</span>
                      <span>{formatCurrency(loan.totalToRepay, currency)}</span>
                    </div>
                  </div>

                  <div className="py-3 text-[10px] text-slate-600 leading-tight space-y-2 border-b border-dashed border-slate-400">
                    <p className="font-semibold text-slate-800 text-center">PAGARÉ A LA VISTA</p>
                    <p>
                      Por el presente documento, el deudor <strong>{loan.customer.fullName}</strong> promete pagar incondicionalmente
                      la suma de <strong>{formatCurrency(loan.totalToRepay, currency)}</strong> dividida en {loan.termsCount} cuotas mensuales
                      en las fechas de vencimiento pactadas. En caso de retraso, se aplicará el interés moratorio acordado del {loan.lateInterestRateDaily}% diario.
                    </p>
                  </div>

                  <div className="pt-8 text-center space-y-6">
                    <div className="border-t border-slate-400 mx-4 pt-1">
                      <p className="font-semibold text-[10px]">{loan.customer.fullName}</p>
                      <p className="text-[9px] text-slate-500">Firma del Deudor (Prestatario)</p>
                    </div>
                    {loan.customer.guarantorName && (
                      <div className="border-t border-slate-400 mx-4 pt-1">
                        <p className="font-semibold text-[10px]">{loan.customer.guarantorName}</p>
                        <p className="text-[9px] text-slate-500">Firma del Aval / Garante</p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            /* FULL A4 SHEET FORMAT */
            <div
              id="printable-ticket"
              className="w-full max-w-xl bg-white p-8 rounded-lg shadow-md border border-slate-300 text-sm text-slate-800 space-y-6"
            >
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{companySettings.name}</h3>
                  <p className="text-xs text-slate-500">{companySettings.legalId}</p>
                  <p className="text-xs text-slate-500">{companySettings.address} · Tel: {companySettings.phone}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded font-mono text-xs font-semibold">
                    {type === 'payment' ? (payment?.ticketNumber || 'RECIBO') : (loan?.loanCode || 'CONTRATO')}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Emisión: {new Date().toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              {type === 'payment' && payment && loan ? (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-medium text-slate-500">DATOS DEL CLIENTE</p>
                      <p className="font-semibold text-slate-900">{payment.customerName}</p>
                      <p className="text-xs text-slate-600">ID/Doc: {loan.customer.documentId}</p>
                      <p className="text-xs text-slate-600">Tel: {loan.customer.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">DETALLES DEL PRÉSTAMO</p>
                      <p className="font-semibold text-slate-900">Préstamo: {loan.loanCode}</p>
                      <p className="text-xs text-slate-600">Cuota pagada: Cuota #{payment.installmentNumbers.join(', ')} de {loan.termsCount}</p>
                      <p className="text-xs text-slate-600">Fecha de cobro: {new Date(payment.paymentDate).toLocaleString('es-ES')}</p>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Concepto</th>
                        <th className="p-2.5 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5">Amortización de Capital</td>
                        <td className="p-2.5 text-right font-medium">{formatCurrency(payment.principalPaid, currency)}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Intereses Compensatorios Ordinarios</td>
                        <td className="p-2.5 text-right font-medium">{formatCurrency(payment.interestPaid, currency)}</td>
                      </tr>
                      {payment.lateFeePaid > 0 && (
                        <tr className="text-red-600 bg-red-50/50">
                          <td className="p-2.5 font-medium">Intereses Moratorios por Días Vencidos</td>
                          <td className="p-2.5 text-right font-bold">+{formatCurrency(payment.lateFeePaid, currency)}</td>
                        </tr>
                      )}
                      <tr className="bg-slate-50 font-bold text-sm text-slate-900">
                        <td className="p-3">TOTAL RECIBIDO</td>
                        <td className="p-3 text-right text-emerald-700">{formatCurrency(payment.totalAmountPaid, currency)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex justify-between items-center bg-blue-50/70 p-3 rounded-lg border border-blue-200 text-xs">
                    <div>
                      <span className="text-slate-600">Saldo pendiente de capital e interés: </span>
                      <span className="font-bold text-blue-900">{formatCurrency(payment.remainingLoanBalance, currency)}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Medio de pago: </span>
                      <span className="font-semibold uppercase">{payment.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                    <div className="border-t border-slate-400 pt-2">
                      <p className="font-semibold text-slate-900">{payment.collectedBy}</p>
                      <p className="text-slate-500">Cajero / Cobrador Autorizado</p>
                    </div>
                    <div className="border-t border-slate-400 pt-2">
                      <p className="font-semibold text-slate-900">{payment.customerName}</p>
                      <p className="text-slate-500">Firma del Cliente</p>
                    </div>
                  </div>
                </>
              ) : loan ? (
                /* Full Loan Schedule A4 */
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-slate-500 font-medium">Cliente</p>
                      <p className="font-bold text-slate-900">{loan.customer.fullName}</p>
                      <p className="text-slate-600">DNI: {loan.customer.documentId}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Monto Prestado</p>
                      <p className="font-bold text-emerald-700 text-sm">{formatCurrency(loan.principal, currency)}</p>
                      <p className="text-slate-600">Tasa Anual: {loan.annualInterestRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Plazo</p>
                      <p className="font-bold text-slate-900">{loan.termsCount} Meses</p>
                      <p className="text-slate-600">Total a Pagar: {formatCurrency(loan.totalToRepay, currency)}</p>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 pt-2">Cronograma de Amortización Oficial</h4>
                  <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Vencimiento</th>
                        <th className="p-2 text-right">Capital</th>
                        <th className="p-2 text-right">Interés</th>
                        <th className="p-2 text-right">Cuota Mensual</th>
                        <th className="p-2 text-right">Saldo Restante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loan.installments.map((inst) => (
                        <tr key={inst.number} className={inst.status === 'paid' ? 'bg-emerald-50/50' : ''}>
                          <td className="p-2 font-medium">{inst.number}</td>
                          <td className="p-2">{formatDate(inst.dueDate)}</td>
                          <td className="p-2 text-right">{formatCurrency(inst.principal, currency)}</td>
                          <td className="p-2 text-right">{formatCurrency(inst.interest, currency)}</td>
                          <td className="p-2 text-right font-semibold">{formatCurrency(inst.totalDue, currency)}</td>
                          <td className="p-2 text-right text-slate-600">{formatCurrency(inst.remainingBalance, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="grid grid-cols-2 gap-8 pt-10 text-center text-xs">
                    <div className="border-t border-slate-400 pt-2">
                      <p className="font-semibold text-slate-900">{loan.customer.fullName}</p>
                      <p className="text-slate-500">Firma del Deudor</p>
                    </div>
                    <div className="border-t border-slate-400 pt-2">
                      <p className="font-semibold text-slate-900">{companySettings.name}</p>
                      <p className="text-slate-500">Firma y Sello de la Entidad</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end">
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
