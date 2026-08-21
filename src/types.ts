export type LoanStatus = 'active' | 'late' | 'paid' | 'defaulted';

export type InstallmentStatus = 'paid' | 'pending' | 'late' | 'partial';

export type AmortizationType = 'french' | 'german' | 'simple'; // Francés (cuota fija), Alemán (capital fijo), Simple (interés directo)

export type PaymentFrequency = 'monthly' | 'biweekly' | 'weekly';

export interface Customer {
  id: string;
  fullName: string;
  documentId: string; // DNI / Cédula / RFC / NIE
  phone: string;
  email?: string;
  address?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorDocumentId?: string;
  notes?: string;
  createdAt: string;
}

export interface Installment {
  number: number;
  dueDate: string; // YYYY-MM-DD
  initialBalance: number;
  principal: number;
  interest: number;
  totalDue: number; // principal + interest (base installment)
  remainingBalance: number;
  
  // Payment tracking
  status: InstallmentStatus;
  paidAmount: number;
  paidDate?: string;
  paymentId?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  
  // Late fee tracking (Mora)
  daysOverdue: number;
  lateFeeCalculated: number; // calculated late penalty
  lateFeePaid: number;
  lateFeeWaived?: number; // condonación
}

export interface PaymentRecord {
  id: string;
  ticketNumber: string;
  loanId: string;
  customerId: string;
  customerName: string;
  installmentNumbers: number[];
  paymentDate: string; // ISO string
  principalPaid: number;
  interestPaid: number;
  lateFeePaid: number;
  totalAmountPaid: number;
  paymentMethod: 'cash' | 'transfer' | 'card' | 'other';
  referenceNumber?: string;
  cashReceived?: number;
  changeGiven?: number;
  notes?: string;
  collectedBy: string;
  remainingLoanBalance: number;
}

export interface Loan {
  id: string;
  loanCode: string; // e.g. PREST-2026-001
  customerId: string;
  customer: Customer;
  
  // Financial terms
  principal: number; // Monto en efectivo prestado
  annualInterestRate: number; // Tasa de interés anual en % (ej. 36%)
  monthlyInterestRate: number; // Tasa mensual calculada
  termsCount: number; // Plazo en meses / cuotas (ej. 6, 12, 24)
  frequency: PaymentFrequency;
  amortizationType: AmortizationType;
  
  // Dates
  disbursementDate: string; // Fecha de entrega del dinero
  firstPaymentDate: string; // Fecha de la primera cuota
  
  // Late fee / Mora configuration
  gracePeriodDays: number; // Días de tolerancia antes de aplicar mora (ej. 3 días)
  lateInterestRateDaily: number; // Tasa de mora diaria en % (ej. 0.2% diario o 6% mensual)
  fixedLateFee: number; // Cargo fijo por cuota vencida si aplica
  
  // Computed & Aggregated
  totalInterest: number;
  totalToRepay: number; // principal + totalInterest
  installmentBaseAmount: number; // Para sistema francés cuota fija
  
  // Schedule & Payments
  installments: Installment[];
  payments: PaymentRecord[];
  
  // Status
  status: LoanStatus;
  totalPaid: number;
  outstandingBalance: number; // Saldo actual de capital e interés pendiente
  totalLateFeeAccrued: number;
  
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetTitle?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  accessToken?: string;
  tokenExpiresAt?: number;
  userEmail?: string;
  userName?: string;
}

export interface SyncResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  syncedLoansCount: number;
  syncedInstallmentsCount: number;
  syncedPaymentsCount: number;
  syncedAt: string;
  error?: string;
}

export interface CompanySettings {
  name: string;
  legalId: string; // RFC / RUC / CIF
  phone: string;
  email: string;
  address: string;
  currency: string; // $, €, S/., etc.
  currencyCode: string; // USD, EUR, MXN, PEN, COP, etc.
  defaultAnnualRate: number;
  defaultLateRateDaily: number;
  defaultGraceDays: number;
  ticketFooter: string;
  ticketNotice: string;
  logoUrl?: string;
  googleSheets?: GoogleSheetsConfig;
}

export interface LoanSimulationParams {
  principal: number;
  annualInterestRate: number;
  termsCount: number;
  frequency: PaymentFrequency;
  amortizationType: AmortizationType;
  startDate: string;
  firstPaymentDate: string;
  gracePeriodDays: number;
  lateInterestRateDaily: number;
  fixedLateFee: number;
}
