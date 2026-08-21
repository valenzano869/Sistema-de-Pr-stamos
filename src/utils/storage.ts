import { CompanySettings, Loan } from '../types';
import { generateAmortizationSchedule, syncLoanStatusWithCurrentDate } from './finance';

const STORAGE_KEY_LOANS = 'prestamos_app_loans_v1';
const STORAGE_KEY_SETTINGS = 'prestamos_app_settings_v1';
const STORAGE_KEY_CUSTOMERS = 'prestamos_app_customers_v1';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'Financiera Préstamo Rápido S.A.',
  legalId: 'RUC 20601234567',
  phone: '+52 55 1234 5678',
  email: 'contacto@prestamorapido.com',
  address: 'Av. Insurgentes Sur 1450, Piso 3, CDMX',
  currency: '$',
  currencyCode: 'MXN',
  defaultAnnualRate: 36, // 36% anual = 3% mensual
  defaultLateRateDaily: 0.25, // 0.25% diario por mora
  defaultGraceDays: 3, // 3 días de tolerancia
  ticketFooter: '¡Gracias por su puntualidad en sus pagos!',
  ticketNotice: 'Conserve este ticket como su comprobante oficial de pago.',
};

/**
 * Generate initial realistic seed loans for instant preview
 */
function createSeedLoans(): Loan[] {
  const today = new Date();
  
  // Seed Customer 1: Carlos Mendoza (Préstamo activo con cuotas al día y una pagada)
  const cust1 = {
    id: 'cust-1',
    fullName: 'Carlos Mendoza Ramos',
    documentId: 'DNI-45892134',
    phone: '+52 55 9876 5432',
    email: 'carlos.mendoza@email.com',
    address: 'Calle Primavera 123, Col. Centro',
    guarantorName: 'María Elena Ramos (Hermana)',
    guarantorPhone: '+52 55 1122 3344',
    createdAt: '2026-01-10T10:00:00Z',
  };

  const schedule1 = generateAmortizationSchedule({
    principal: 15000,
    annualInterestRate: 36,
    termsCount: 6,
    frequency: 'monthly',
    amortizationType: 'french',
    startDate: '2026-06-15',
    firstPaymentDate: '2026-07-15',
    gracePeriodDays: 3,
    lateInterestRateDaily: 0.25,
    fixedLateFee: 0,
  });

  // Mark installment 1 as paid
  schedule1.installments[0].status = 'paid';
  schedule1.installments[0].paidAmount = schedule1.installments[0].totalDue;
  schedule1.installments[0].paidDate = '2026-07-14T15:30:00Z';
  schedule1.installments[0].receiptNumber = 'TCK-2026-0001';
  schedule1.installments[0].paymentMethod = 'cash';

  // Mark installment 2 as paid
  schedule1.installments[1].status = 'paid';
  schedule1.installments[1].paidAmount = schedule1.installments[1].totalDue;
  schedule1.installments[1].paidDate = '2026-08-14T11:20:00Z';
  schedule1.installments[1].receiptNumber = 'TCK-2026-0015';
  schedule1.installments[1].paymentMethod = 'transfer';

  const loan1: Loan = {
    id: 'loan-1',
    loanCode: 'PR-2026-001',
    customerId: cust1.id,
    customer: cust1,
    principal: 15000,
    annualInterestRate: 36,
    monthlyInterestRate: 3,
    termsCount: 6,
    frequency: 'monthly',
    amortizationType: 'french',
    disbursementDate: '2026-06-15',
    firstPaymentDate: '2026-07-15',
    gracePeriodDays: 3,
    lateInterestRateDaily: 0.25,
    fixedLateFee: 0,
    totalInterest: schedule1.totalInterest,
    totalToRepay: schedule1.totalToRepay,
    installmentBaseAmount: schedule1.installmentBase,
    installments: schedule1.installments,
    payments: [
      {
        id: 'pay-1',
        ticketNumber: 'TCK-2026-0001',
        loanId: 'loan-1',
        customerId: cust1.id,
        customerName: cust1.fullName,
        installmentNumbers: [1],
        paymentDate: '2026-07-14T15:30:00Z',
        principalPaid: schedule1.installments[0].principal,
        interestPaid: schedule1.installments[0].interest,
        lateFeePaid: 0,
        totalAmountPaid: schedule1.installments[0].totalDue,
        paymentMethod: 'cash',
        cashReceived: 3000,
        changeGiven: 3000 - schedule1.installments[0].totalDue,
        collectedBy: 'Caja Principal - Laura G.',
        remainingLoanBalance: schedule1.installments[0].remainingBalance,
      },
      {
        id: 'pay-2',
        ticketNumber: 'TCK-2026-0015',
        loanId: 'loan-1',
        customerId: cust1.id,
        customerName: cust1.fullName,
        installmentNumbers: [2],
        paymentDate: '2026-08-14T11:20:00Z',
        principalPaid: schedule1.installments[1].principal,
        interestPaid: schedule1.installments[1].interest,
        lateFeePaid: 0,
        totalAmountPaid: schedule1.installments[1].totalDue,
        paymentMethod: 'transfer',
        referenceNumber: 'TRF-994821',
        collectedBy: 'Caja Principal - Laura G.',
        remainingLoanBalance: schedule1.installments[1].remainingBalance,
      }
    ],
    status: 'active',
    totalPaid: schedule1.installments[0].totalDue + schedule1.installments[1].totalDue,
    outstandingBalance: schedule1.totalToRepay - (schedule1.installments[0].totalDue + schedule1.installments[1].totalDue),
    totalLateFeeAccrued: 0,
    createdAt: '2026-06-15T09:00:00Z',
    updatedAt: '2026-08-14T11:20:00Z',
    notes: 'Cliente puntual con negocio propio de abarrotes.',
  };

  // Seed Customer 2: Ana Lucía Torres (Préstamo con cuota vencida y mora calculada)
  const cust2 = {
    id: 'cust-2',
    fullName: 'Ana Lucía Torres Vega',
    documentId: 'DNI-71239845',
    phone: '+52 55 4433 2211',
    email: 'ana.torres@empresa.com',
    address: 'Av. Las Palmas 450, Depto 2B',
    guarantorName: 'Jorge Torres (Esposo)',
    guarantorPhone: '+52 55 9988 7766',
    createdAt: '2026-04-01T11:00:00Z',
  };

  const schedule2 = generateAmortizationSchedule({
    principal: 20000,
    annualInterestRate: 42,
    termsCount: 12,
    frequency: 'monthly',
    amortizationType: 'french',
    startDate: '2026-04-01',
    firstPaymentDate: '2026-05-01',
    gracePeriodDays: 3,
    lateInterestRateDaily: 0.30, // 0.30% diario
    fixedLateFee: 50,
  });

  // Mark installments 1, 2, 3 as paid
  for (let i = 0; i < 3; i++) {
    schedule2.installments[i].status = 'paid';
    schedule2.installments[i].paidAmount = schedule2.installments[i].totalDue;
    schedule2.installments[i].paidDate = `2026-0${i + 5}-02T10:00:00Z`;
    schedule2.installments[i].receiptNumber = `TCK-2026-000${i + 2}`;
    schedule2.installments[i].paymentMethod = 'cash';
  }

  const loan2: Loan = {
    id: 'loan-2',
    loanCode: 'PR-2026-002',
    customerId: cust2.id,
    customer: cust2,
    principal: 20000,
    annualInterestRate: 42,
    monthlyInterestRate: 3.5,
    termsCount: 12,
    frequency: 'monthly',
    amortizationType: 'french',
    disbursementDate: '2026-04-01',
    firstPaymentDate: '2026-05-01',
    gracePeriodDays: 3,
    lateInterestRateDaily: 0.30,
    fixedLateFee: 50,
    totalInterest: schedule2.totalInterest,
    totalToRepay: schedule2.totalToRepay,
    installmentBaseAmount: schedule2.installmentBase,
    installments: schedule2.installments,
    payments: [
      {
        id: 'pay-201',
        ticketNumber: 'TCK-2026-0002',
        loanId: 'loan-2',
        customerId: cust2.id,
        customerName: cust2.fullName,
        installmentNumbers: [1],
        paymentDate: '2026-05-02T10:00:00Z',
        principalPaid: schedule2.installments[0].principal,
        interestPaid: schedule2.installments[0].interest,
        lateFeePaid: 0,
        totalAmountPaid: schedule2.installments[0].totalDue,
        paymentMethod: 'cash',
        collectedBy: 'Caja Principal - Laura G.',
        remainingLoanBalance: schedule2.installments[0].remainingBalance,
      },
      {
        id: 'pay-202',
        ticketNumber: 'TCK-2026-0003',
        loanId: 'loan-2',
        customerId: cust2.id,
        customerName: cust2.fullName,
        installmentNumbers: [2],
        paymentDate: '2026-06-02T10:00:00Z',
        principalPaid: schedule2.installments[1].principal,
        interestPaid: schedule2.installments[1].interest,
        lateFeePaid: 0,
        totalAmountPaid: schedule2.installments[1].totalDue,
        paymentMethod: 'cash',
        collectedBy: 'Caja Principal - Laura G.',
        remainingLoanBalance: schedule2.installments[1].remainingBalance,
      },
      {
        id: 'pay-203',
        ticketNumber: 'TCK-2026-0004',
        loanId: 'loan-2',
        customerId: cust2.id,
        customerName: cust2.fullName,
        installmentNumbers: [3],
        paymentDate: '2026-07-02T10:00:00Z',
        principalPaid: schedule2.installments[2].principal,
        interestPaid: schedule2.installments[2].interest,
        lateFeePaid: 0,
        totalAmountPaid: schedule2.installments[2].totalDue,
        paymentMethod: 'cash',
        collectedBy: 'Caja Principal - Laura G.',
        remainingLoanBalance: schedule2.installments[2].remainingBalance,
      }
    ],
    status: 'late',
    totalPaid: schedule2.installments[0].totalDue + schedule2.installments[1].totalDue + schedule2.installments[2].totalDue,
    outstandingBalance: schedule2.totalToRepay - (schedule2.installments[0].totalDue * 3),
    totalLateFeeAccrued: 0,
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-07-02T10:00:00Z',
    notes: 'Préstamo para ampliación de inventario.',
  };

  // Synchronize both with current date
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return [
    syncLoanStatusWithCurrentDate(loan1, todayStr),
    syncLoanStatusWithCurrentDate(loan2, todayStr),
  ];
}

export function loadLoans(): Loan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOANS);
    if (!raw) {
      const seed = createSeedLoans();
      saveLoans(seed);
      return seed;
    }
    const parsed = JSON.parse(raw);
    return parsed.map((l: any) => syncLoanStatusWithCurrentDate(l));
  } catch (err) {
    console.error('Failed to load loans from storage', err);
    return createSeedLoans();
  }
}

export function saveLoans(loans: Loan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
  } catch (err) {
    console.error('Failed to save loans to storage', err);
  }
}

export function loadCompanySettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      saveCompanySettings(DEFAULT_COMPANY_SETTINGS);
      return DEFAULT_COMPANY_SETTINGS;
    }
    return { ...DEFAULT_COMPANY_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_COMPANY_SETTINGS;
  }
}

export function saveCompanySettings(settings: CompanySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

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
