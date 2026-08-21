import { Loan, CompanySettings } from '../types';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'PrestaFácil S.A.',
  phone: '+1 800 555 1234',
  address: 'Av. Principal 123, Ciudad Central',
  email: 'contacto@prestafacil.com',
  logoUrl: 'https://images.unsplash.com/photo-1550565118-3a14e8d0386f?auto=format&fit=crop&q=80&w=256&h=256',
  currency: 'MXN',
  theme: 'light'
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
