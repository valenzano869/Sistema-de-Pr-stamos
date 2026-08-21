import { CompanySettings, Loan, GoogleSheetsConfig, SyncResult } from '../types';
import { formatCurrency, formatDate } from './finance';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
  }
}

// OAuth Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

export const DEFAULT_SPREADSHEET_ID = '1Jidwpe0RgA05Qksrcs2wsBcZDutoHbbda04wtXk86Ww';
export const DEFAULT_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1Jidwpe0RgA05Qksrcs2wsBcZDutoHbbda04wtXk86Ww/edit';

/**
 * Extracts a Google Spreadsheet ID from a URL or raw ID string
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return DEFAULT_SPREADSHEET_ID;
  const trimmed = input.trim();
  // Match https://docs.google.com/spreadsheets/d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let cachedAccessToken: string | null = null;
let cachedTokenExpiresAt: number | null = null;

/**
 * Request an access token via Firebase Auth
 */
export async function requestGoogleAccessToken(): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  // Use cached token if still valid for at least 5 minutes
  if (cachedAccessToken && cachedTokenExpiresAt && Date.now() < cachedTokenExpiresAt - 300000) {
    return {
      accessToken: cachedAccessToken,
      expiresIn: Math.floor((cachedTokenExpiresAt - Date.now()) / 1000)
    };
  }

  try {
    const provider = new GoogleAuthProvider();
    SCOPES.forEach((scope) => provider.addScope(scope));

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso desde Google.');
    }

    cachedAccessToken = credential.accessToken;
    // Firebase doesn't explicitly return token expiration in the credential object,
    // so we approximate 1 hour (3600 seconds) standard expiration
    cachedTokenExpiresAt = Date.now() + 3600 * 1000;

    return {
      accessToken: credential.accessToken,
      expiresIn: 3600,
    };
  } catch (err: any) {
    console.error('Error in requestGoogleAccessToken:', err);
    throw new Error(err.message || 'Error al autenticar con Google');
  }
}

/**
 * Fetch basic user info using Google OAuth token
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<{ email?: string; name?: string }> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      return { email: data.email, name: data.name };
    }
  } catch (e) {
    // Non-blocking
  }
  return {};
}

/**
 * Create a new Google Spreadsheet with 3 structured sheets
 */
export async function createGoogleSpreadsheet(
  title: string,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const payload = {
    properties: {
      title,
      locale: 'es_ES',
      autoRecalc: 'ON_CHANGE',
    },
    sheets: [
      {
        properties: {
          title: '📋 Préstamos Activos',
          gridProperties: { rowCount: 100, columnCount: 15, frozenRowCount: 1 },
          tabColor: { red: 0.1, green: 0.4, blue: 0.8 },
        },
      },
      {
        properties: {
          title: '📅 Plan de Cuotas',
          gridProperties: { rowCount: 500, columnCount: 13, frozenRowCount: 1 },
          tabColor: { red: 0.2, green: 0.6, blue: 0.3 },
        },
      },
      {
        properties: {
          title: '🧾 Libro de Cobros',
          gridProperties: { rowCount: 500, columnCount: 12, frozenRowCount: 1 },
          tabColor: { red: 0.8, green: 0.4, blue: 0.1 },
        },
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Error al crear hoja de Google (${response.status})`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Ensures that the required tabs exist in the Google Spreadsheet, creating them if necessary.
 */
export async function ensureSpreadsheetTabsExist(
  spreadsheetId: string,
  accessToken: string
): Promise<void> {
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!metaRes.ok) {
      const err = await metaRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `No se pudo acceder a la hoja de cálculo (${metaRes.status})`);
    }

    const meta = await metaRes.json();
    const existingSheets = (meta.sheets || []).map((s: any) => s.properties?.title || '');

    const requiredSheets = [
      {
        title: '📋 Préstamos Activos',
        tabColor: { red: 0.1, green: 0.4, blue: 0.8 },
        rowCount: 500,
        columnCount: 16,
      },
      {
        title: '📅 Plan de Cuotas',
        tabColor: { red: 0.2, green: 0.6, blue: 0.3 },
        rowCount: 1000,
        columnCount: 14,
      },
      {
        title: '🧾 Libro de Cobros',
        tabColor: { red: 0.8, green: 0.4, blue: 0.1 },
        rowCount: 1000,
        columnCount: 13,
      },
      {
        title: '_AppData',
        tabColor: { red: 0.9, green: 0.9, blue: 0.9 },
        rowCount: 5000,
        columnCount: 2,
        hidden: true,
      }
    ];

    const addRequests: any[] = [];
    for (const sheet of requiredSheets) {
      if (!existingSheets.includes(sheet.title)) {
        addRequests.push({
          addSheet: {
            properties: {
              title: sheet.title,
              tabColor: sheet.tabColor,
              hidden: sheet.hidden || false,
              gridProperties: {
                rowCount: sheet.rowCount,
                columnCount: sheet.columnCount,
                frozenRowCount: sheet.title === '_AppData' ? 0 : 1,
              },
            },
          },
        });
      }
    }

    if (addRequests.length > 0) {
      const batchRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests: addRequests }),
        }
      );
      if (!batchRes.ok) {
        const batchErr = await batchRes.json().catch(() => ({}));
        console.warn('Could not add tabs automatically:', batchErr);
      }
    }
  } catch (err: any) {
    console.warn('ensureSpreadsheetTabsExist encountered issue, continuing with value update:', err);
  }
}

/**
 * Synchronize full loans dataset to Google Sheets
 */
export async function syncLoansToSpreadsheet(
  loans: Loan[],
  companySettings: CompanySettings,
  rawSpreadsheetId: string,
  accessToken: string
): Promise<SyncResult> {
  const spreadsheetId = extractSpreadsheetId(rawSpreadsheetId);
  const currency = companySettings.currency || '$';

  // Ensure sheet tabs exist before writing values
  await ensureSpreadsheetTabsExist(spreadsheetId, accessToken);

  // 1. Data for Sheet 1: 📋 Préstamos Activos
  const loansHeaders = [
    'Código Préstamo',
    'Cliente',
    'Documento / DNI',
    'Teléfono',
    'Dirección',
    'Garante / Aval',
    'Monto Capital',
    'TNA (%)',
    'Plazo (Meses)',
    'Sistema Amortización',
    'Fecha Desembolso',
    'Total a Pagar',
    'Total Cobrado',
    'Saldo Pendiente',
    'Estado Actual',
  ];

  const loansRows = loans.map((loan) => [
    loan.loanCode,
    loan.customer.fullName,
    loan.customer.documentId,
    loan.customer.phone || '-',
    loan.customer.address || '-',
    loan.customer.guarantorName ? `${loan.customer.guarantorName} (${loan.customer.guarantorPhone || ''})` : '-',
    loan.principal,
    loan.annualInterestRate,
    loan.termsCount,
    loan.amortizationType === 'french' ? 'Francés (Fijo)' : loan.amortizationType === 'german' ? 'Alemán' : 'Simple',
    loan.disbursementDate,
    loan.totalToRepay,
    loan.totalPaid,
    loan.outstandingBalance,
    loan.status === 'paid' ? 'PAGADO' : loan.status === 'late' ? 'EN MORA' : 'ACTIVO / AL DÍA',
  ]);

  // 2. Data for Sheet 2: 📅 Plan de Cuotas
  const installmentsHeaders = [
    'Código Préstamo',
    'Cliente',
    'Cuota #',
    'Fecha Vencimiento',
    'Capital Amortizado',
    'Interés Cuota',
    'Monto Cuota Base',
    'Saldo Restante',
    'Estado Cuota',
    'Días Retraso',
    'Mora Calculada',
    'Mora Cobrada',
    'Fecha Cobro',
  ];

  const installmentsRows = loans.flatMap((loan) =>
    loan.installments.map((inst) => [
      loan.loanCode,
      loan.customer.fullName,
      inst.number,
      inst.dueDate,
      inst.principal,
      inst.interest,
      inst.totalDue,
      inst.remainingBalance,
      inst.status === 'paid' ? 'PAGADA' : inst.status === 'late' ? 'VENCIDA / MORA' : 'PENDIENTE',
      inst.daysOverdue || 0,
      inst.lateFeeCalculated || 0,
      inst.lateFeePaid || 0,
      inst.paidDate ? formatDate(inst.paidDate) : '-',
    ])
  );

  // 3. Data for Sheet 3: 🧾 Libro de Cobros
  const paymentsHeaders = [
    'N° Recibo / Ticket',
    'Código Préstamo',
    'Cliente',
    'Fecha Cobro',
    'Cuotas Pagadas',
    'Capital Pagado',
    'Interés Pagado',
    'Mora Cobrada',
    'Total Percibido',
    'Método Pago',
    'Saldo Pendiente Préstamo',
    'Cobrado Por',
  ];

  const allPayments = loans.flatMap((loan) => loan.payments || []);
  // Sort payments by date descending
  allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  const paymentsRows = allPayments.map((p) => [
    p.ticketNumber,
    loans.find((l) => l.id === p.loanId)?.loanCode || '-',
    p.customerName,
    p.paymentDate ? formatDate(p.paymentDate) : '-',
    p.installmentNumbers.map((n) => `#${n}`).join(', '),
    p.principalPaid,
    p.interestPaid,
    p.lateFeePaid,
    p.totalAmountPaid,
    p.paymentMethod === 'cash'
      ? 'Efectivo'
      : p.paymentMethod === 'transfer'
      ? 'Transferencia Bancaria'
      : p.paymentMethod === 'card'
      ? 'Tarjeta'
      : 'Otro',
    p.remainingLoanBalance,
    p.collectedBy || companySettings.name,
  ]);

  // 4. Hidden DataStore for App state
  const appDataHeaders = ['Loan_ID', 'Loan_JSON'];
  const appDataRows = loans.map((loan) => [
    loan.id,
    JSON.stringify(loan)
  ]);
  
  // Pad with empty rows to overwrite deleted loans
  const originalLength = appDataRows.length;
  while (appDataRows.length < 500) {
    appDataRows.push(['', '']);
  }

  // Execute batchUpdate values API
  const valueData = [
    {
      range: "'📋 Préstamos Activos'!A1:O" + (loansRows.length + 1),
      values: [loansHeaders, ...loansRows],
    },
    {
      range: "'📅 Plan de Cuotas'!A1:M" + (installmentsRows.length + 1),
      values: [installmentsHeaders, ...installmentsRows],
    },
    {
      range: "'🧾 Libro de Cobros'!A1:L" + (paymentsRows.length + 1),
      values: [paymentsHeaders, ...paymentsRows],
    },
    {
      range: "'_AppData'!A1:B501",
      values: [appDataHeaders, ...appDataRows],
    },
  ];

  // First clear old ranges or update directly
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const res = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueData,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error al sincronizar datos en Google Sheets (${res.status})`);
  }

  const nowISO = new Date().toISOString();
  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    syncedLoansCount: loans.length,
    syncedInstallmentsCount: installmentsRows.length,
    syncedPaymentsCount: paymentsRows.length,
    syncedAt: nowISO,
  };
}

/**
 * Fetch full loans dataset directly from Google Sheets _AppData tab
 */
export async function fetchLoansFromSpreadsheet(
  rawSpreadsheetId: string,
  accessToken: string
): Promise<Loan[]> {
  const spreadsheetId = extractSpreadsheetId(rawSpreadsheetId);
  const fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'_AppData'!A2:B501`;
  
  const res = await fetch(fetchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    console.warn(`Could not fetch _AppData from Google Sheets (${res.status})`);
    return [];
  }

  const data = await res.json();
  const rows = data.values || [];
  
  const loans: Loan[] = [];
  for (const row of rows) {
    if (row[1]) {
      try {
        loans.push(JSON.parse(row[1]));
      } catch (e) {
        console.warn('Failed to parse a loan JSON row', e);
      }
    }
  }
  
  return loans;
}

/**
 * Export data to local CSV string for immediate download
 */
export function exportLoansToCSV(loans: Loan[], companySettings: CompanySettings): string {
  const headers = [
    'Codigo',
    'Cliente',
    'Documento',
    'Telefono',
    'Capital',
    'TNA_Porcentaje',
    'Meses',
    'Sistema',
    'Total_Pagar',
    'Total_Pagado',
    'Saldo_Pendiente',
    'Estado',
    'Fecha_Desembolso',
  ];

  const rows = loans.map((l) => [
    `"${l.loanCode}"`,
    `"${l.customer.fullName.replace(/"/g, '""')}"`,
    `"${l.customer.documentId}"`,
    `"${l.customer.phone || ''}"`,
    l.principal,
    l.annualInterestRate,
    l.termsCount,
    `"${l.amortizationType}"`,
    l.totalToRepay,
    l.totalPaid,
    l.outstandingBalance,
    `"${l.status}"`,
    `"${l.disbursementDate}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
