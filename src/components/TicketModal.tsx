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
            {/* FULL A4 SHEET FORMAT */}
            <div
              id="printable-ticket"
              className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md border border-slate-300 text-sm text-slate-800 space-y-6"
            >
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 gap-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={companySettings.logoUrl || '/logo.svg'}
                    alt="Logo Empresa"
                    className="h-12 max-w-[180px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">{companySettings.name}</h3>
                    <p className="text-xs text-slate-500">{companySettings.legalId}</p>
                    <p className="text-xs text-slate-500">{companySettings.address} · Tel: {companySettings.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded font-mono text-sm font-semibold tracking-wider">
                    {type === 'payment' ? (payment?.ticketNumber || 'RECIBO') : (loan?.loanCode || 'CONTRATO')}
                  </span>
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Emisión: {new Date().toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              {type === 'payment' && payment && loan ? (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
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

                  <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden">
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

                  <div className="flex justify-between items-center bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-sm">
                    <div>
                      <span className="text-slate-600">Saldo pendiente de capital e interés: </span>
                      <span className="font-bold text-blue-900">{formatCurrency(payment.remainingLoanBalance, currency)}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Medio de pago: </span>
                      <span className="font-bold text-slate-900 uppercase">{payment.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 pt-16 text-center text-sm">
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
                /* Full Loan Schedule A4 */
                <div className="space-y-6 text-sm">
                  <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-slate-500 font-semibold mb-1 uppercase text-xs tracking-wider">Cliente</p>
                      <p className="font-bold text-slate-900 text-base">{loan.customer.fullName}</p>
                      <p className="text-slate-600 mt-1">DNI: {loan.customer.documentId}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold mb-1 uppercase text-xs tracking-wider">Monto Prestado</p>
                      <p className="font-bold text-emerald-700 text-lg">{formatCurrency(loan.principal, currency)}</p>
                      <p className="text-slate-600 mt-1">Tasa Anual: {loan.annualInterestRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold mb-1 uppercase text-xs tracking-wider">Plazo</p>
                      <p className="font-bold text-slate-900 text-base">{loan.termsCount} Meses</p>
                      <p className="text-slate-600 mt-1">Total a Pagar: <span className="font-semibold">{formatCurrency(loan.totalToRepay, currency)}</span></p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="font-bold text-slate-900 text-lg mb-3">Tabla de Amortización y Pagos</h4>
                    <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden text-sm">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Vencimiento</th>
                          <th className="p-3 text-right">Capital</th>
                          <th className="p-3 text-right">Interés</th>
                          <th className="p-3 text-right">Cuota Mensual</th>
                          <th className="p-3 text-right">Saldo Restante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loan.installments.map((inst) => (
                          <tr key={inst.number} className={inst.status === 'paid' ? 'bg-emerald-50/30' : ''}>
                            <td className="p-3 font-medium text-slate-900">{inst.number}</td>
                            <td className="p-3 text-slate-700">{formatDate(inst.dueDate)}</td>
                            <td className="p-3 text-right text-slate-700">{formatCurrency(inst.principal, currency)}</td>
                            <td className="p-3 text-right text-slate-700">{formatCurrency(inst.interest, currency)}</td>
                            <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(inst.totalDue, currency)}</td>
                            <td className="p-3 text-right text-slate-500 font-medium">{formatCurrency(inst.remainingBalance, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 gap-12 pt-16 text-center text-sm">
                    <div className="border-t-2 border-slate-300 pt-3 mx-6">
                      <p className="font-bold text-slate-900">{loan.customer.fullName}</p>
                      <p className="text-slate-500 font-medium">Firma del Deudor</p>
                    </div>
                    <div className="border-t-2 border-slate-300 pt-3 mx-6">
                      <p className="font-bold text-slate-900">{companySettings.name}</p>
                      <p className="text-slate-500 font-medium">Firma y Sello de la Entidad</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
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
