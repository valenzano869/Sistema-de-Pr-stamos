import { AmortizationType, Installment, LoanSimulationParams, PaymentFrequency } from '../types';

/**
 * Format currency with symbol
 */
export function formatCurrency(amount: number, currency: string = '$'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${currency} 0.00`;
  }
  const formattedNumber = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currency} ${formattedNumber}`;
}

/**
 * Format percentage
 */
export function formatPercent(rate: number): string {
  return `${Number(rate || 0).toFixed(2)}%`;
}

/**
 * Format date in readable Spanish format (e.g. 15 Ago 2026)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Calculate due date for installment n
 */
export function calculateDueDate(baseDateStr: string, installmentNumber: number, frequency: PaymentFrequency): string {
  const parts = baseDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);

  if (frequency === 'monthly') {
    // Add (n - 1) months to the first payment date
    date.setMonth(date.getMonth() + (installmentNumber - 1));
  } else if (frequency === 'biweekly') {
    date.setDate(date.getDate() + (installmentNumber - 1) * 14);
  } else if (frequency === 'weekly') {
    date.setDate(date.getDate() + (installmentNumber - 1) * 7);
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generate full amortization schedule
 */
export function generateAmortizationSchedule(params: LoanSimulationParams): {
  installments: Installment[];
  totalInterest: number;
  totalToRepay: number;
  monthlyRate: number;
  installmentBase: number;
} {
  const { principal, annualInterestRate, termsCount, frequency, amortizationType, firstPaymentDate } = params;

  if (principal <= 0 || termsCount <= 0) {
    return {
      installments: [],
      totalInterest: 0,
      totalToRepay: 0,
      monthlyRate: 0,
      installmentBase: 0,
    };
  }

  // Periods per year based on frequency
  let periodsPerYear = 12;
  if (frequency === 'biweekly') periodsPerYear = 26;
  if (frequency === 'weekly') periodsPerYear = 52;

  // Periodic interest rate
  const periodicRate = (annualInterestRate / 100) / periodsPerYear;
  const monthlyRate = (annualInterestRate / 12);

  const installments: Installment[] = [];
  let remainingBalance = principal;
  let totalInterestAccrued = 0;
  let installmentBase = 0;

  if (amortizationType === 'french') {
    // Sistema Francés: Cuota total constante
    if (periodicRate === 0) {
      installmentBase = principal / termsCount;
    } else {
      installmentBase = (principal * periodicRate) / (1 - Math.pow(1 + periodicRate, -termsCount));
    }

    for (let i = 1; i <= termsCount; i++) {
      const interest = remainingBalance * periodicRate;
      let principalPayment = installmentBase - interest;
      
      // Handle rounding on the last installment
      if (i === termsCount || remainingBalance - principalPayment < 0.05) {
        principalPayment = remainingBalance;
      }
      
      const totalDue = principalPayment + interest;
      const initialBalance = remainingBalance;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);
      totalInterestAccrued += interest;

      const dueDate = calculateDueDate(firstPaymentDate, i, frequency);

      installments.push({
        number: i,
        dueDate,
        initialBalance,
        principal: principalPayment,
        interest,
        totalDue,
        remainingBalance,
        status: 'pending',
        paidAmount: 0,
        daysOverdue: 0,
        lateFeeCalculated: 0,
        lateFeePaid: 0,
      });
    }
  } else if (amortizationType === 'german') {
    // Sistema Alemán: Amortización de capital fija, cuota decreciente
    const fixedPrincipal = principal / termsCount;

    for (let i = 1; i <= termsCount; i++) {
      const interest = remainingBalance * periodicRate;
      let principalPayment = fixedPrincipal;

      if (i === termsCount || remainingBalance - principalPayment < 0.05) {
        principalPayment = remainingBalance;
      }

      const totalDue = principalPayment + interest;
      const initialBalance = remainingBalance;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);
      totalInterestAccrued += interest;

      const dueDate = calculateDueDate(firstPaymentDate, i, frequency);

      installments.push({
        number: i,
        dueDate,
        initialBalance,
        principal: principalPayment,
        interest,
        totalDue,
        remainingBalance,
        status: 'pending',
        paidAmount: 0,
        daysOverdue: 0,
        lateFeeCalculated: 0,
        lateFeePaid: 0,
      });
    }
    installmentBase = installments[0]?.totalDue || 0;
  } else {
    // Sistema Simple / Fijo Directo: Interés total calculado sobre el capital
    // y dividido en partes iguales
    const totalInterestDirect = principal * (annualInterestRate / 100) * (termsCount / periodsPerYear);
    totalInterestAccrued = totalInterestDirect;
    const fixedPrincipal = principal / termsCount;
    const fixedInterest = totalInterestDirect / termsCount;
    installmentBase = fixedPrincipal + fixedInterest;

    for (let i = 1; i <= termsCount; i++) {
      let principalPayment = fixedPrincipal;
      if (i === termsCount) {
        principalPayment = remainingBalance;
      }
      const initialBalance = remainingBalance;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);
      const dueDate = calculateDueDate(firstPaymentDate, i, frequency);

      installments.push({
        number: i,
        dueDate,
        initialBalance,
        principal: principalPayment,
        interest: fixedInterest,
        totalDue: installmentBase,
        remainingBalance,
        status: 'pending',
        paidAmount: 0,
        daysOverdue: 0,
        lateFeeCalculated: 0,
        lateFeePaid: 0,
      });
    }
  }

  const totalToRepay = principal + totalInterestAccrued;

  return {
    installments,
    totalInterest: totalInterestAccrued,
    totalToRepay,
    monthlyRate,
    installmentBase,
  };
}

/**
 * Calculate late fees and overdue days for an installment compared against a reference date (usually today)
 */
export function evaluateInstallmentOverdue(
  installment: Installment,
  gracePeriodDays: number = 3,
  lateRateDaily: number = 0.2, // e.g. 0.2% per day
  fixedLateFee: number = 0,
  referenceDateStr?: string
): {
  daysOverdue: number;
  lateFeeCalculated: number;
  isOverdue: boolean;
  status: 'paid' | 'pending' | 'late' | 'partial';
} {
  // If already paid, keep paid metrics
  if (installment.status === 'paid') {
    return {
      daysOverdue: installment.daysOverdue || 0,
      lateFeeCalculated: installment.lateFeeCalculated || 0,
      isOverdue: false,
      status: 'paid',
    };
  }

  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  refDate.setHours(0, 0, 0, 0);

  const dueParts = installment.dueDate.split('-');
  const dueDate = new Date(parseInt(dueParts[0], 10), parseInt(dueParts[1], 10) - 1, parseInt(dueParts[2], 10));
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = refDate.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    // Passed due date
    const effectiveLateDays = Math.max(0, diffDays - gracePeriodDays);
    let lateFee = 0;

    if (effectiveLateDays > 0) {
      // Apply daily rate over the pending installment amount
      const pendingBase = installment.totalDue - (installment.paidAmount || 0);
      const dailyRateDecimal = (lateRateDaily / 100);
      lateFee = (pendingBase * dailyRateDecimal * effectiveLateDays) + fixedLateFee;
    }

    return {
      daysOverdue: diffDays,
      lateFeeCalculated: Math.round(lateFee * 100) / 100,
      isOverdue: effectiveLateDays > 0,
      status: 'late',
    };
  }

  return {
    daysOverdue: 0,
    lateFeeCalculated: 0,
    isOverdue: false,
    status: (installment.paidAmount > 0) ? 'partial' : 'pending',
  };
}

/**
 * Re-evaluate entire loan status and recalculate live late fees
 */
export function syncLoanStatusWithCurrentDate(loan: any, referenceDateStr?: string): any {
  let hasLateInstallments = false;
  let totalLateFeeAccrued = 0;
  let allPaid = true;
  let totalPaid = 0;
  let remainingOutstanding = 0;

  const updatedInstallments = loan.installments.map((inst: Installment) => {
    if (inst.status === 'paid') {
      totalPaid += (inst.paidAmount || inst.totalDue);
      return inst;
    }

    allPaid = false;
    const evalResult = evaluateInstallmentOverdue(
      inst,
      loan.gracePeriodDays ?? 3,
      loan.lateInterestRateDaily ?? 0.2,
      loan.fixedLateFee ?? 0,
      referenceDateStr
    );

    if (evalResult.isOverdue) {
      hasLateInstallments = true;
    }

    totalLateFeeAccrued += evalResult.lateFeeCalculated;
    totalPaid += (inst.paidAmount || 0);
    remainingOutstanding += (inst.totalDue - (inst.paidAmount || 0));

    return {
      ...inst,
      daysOverdue: evalResult.daysOverdue,
      lateFeeCalculated: evalResult.lateFeeCalculated,
      status: evalResult.status,
    };
  });

  return {
    ...loan,
    installments: updatedInstallments,
    totalPaid,
    outstandingBalance: remainingOutstanding,
    totalLateFeeAccrued,
    status: allPaid ? 'paid' : hasLateInstallments ? 'late' : 'active',
  };
}
