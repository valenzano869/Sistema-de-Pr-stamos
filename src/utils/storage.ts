import { Loan, CompanySettings } from '../types';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'Préstamos Fácil',
  legalId: 'RFC-123456789',
  phone: '+1 800 555 1234',
  email: 'contacto@prestamosfacil.com',
  address: 'Av. Principal 123, Ciudad Central',
  currency: '$',
  currencyCode: 'MXN',
  defaultAnnualRate: 36,
  defaultLateRateDaily: 0.2,
  defaultGraceDays: 3,
  ticketFooter: 'Gracias por su pago.',
  ticketNotice: 'Conserve este ticket para cualquier aclaración.',
  logoUrl: '/logo.svg',
};

export function generateNextTicketNumber(loans: Loan[]): string {
  let maxNum = 20;
  loans.forEach((loan) => {
    loan.payments?.forEach((p) => {
      if (p.ticketNumber && p.ticketNumber.startsWith('TCK-')) {
        const numPart = parseInt(p.ticketNumber.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
  });
  return `TCK-${new Date().getFullYear()}-${String(maxNum + 1).padStart(4, '0')}`;
}

export function generateNextLoanCode(loans: Loan[]): string {
  const currentYear = new Date().getFullYear();
  let count = loans.length + 1;
  return `PR-${currentYear}-${String(count).padStart(3, '0')}`;
}
