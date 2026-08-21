import React, { useState, useEffect } from 'react';
import { CompanySettings, Loan, PaymentRecord } from './types';
import {
  DEFAULT_COMPANY_SETTINGS,
  loadCompanySettings,
  loadLoans,
  saveCompanySettings,
  saveLoans,
} from './utils/storage';
import { syncLoanStatusWithCurrentDate } from './utils/finance';
import { Navbar, ActiveTab } from './components/Navbar';
import { LoanList } from './components/LoanList';
import { LoanDetail } from './components/LoanDetail';
import { LoanWizard } from './components/LoanWizard';
import { LoanSimulator } from './components/LoanSimulator';
import { DashboardMetrics } from './components/DashboardMetrics';
import { PaymentModal } from './components/PaymentModal';
import { TicketModal } from './components/TicketModal';
import { SettingsModal } from './components/SettingsModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { syncLoansToSpreadsheet } from './utils/googleSheets';

export default function App() {
  // State
  const [loans, setLoans] = useState<Loan[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('loans');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetLoan, setPaymentTargetLoan] = useState<Loan | null>(null);
  const [paymentTargetInstallmentNum, setPaymentTargetInstallmentNum] = useState<number | null>(null);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketPaymentRecord, setTicketPaymentRecord] = useState<PaymentRecord | null>(null);
  const [ticketLoanTarget, setTicketLoanTarget] = useState<Loan | null>(null);
  const [ticketType, setTicketType] = useState<'payment' | 'loan_agreement'>('payment');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Initialize data on load
  useEffect(() => {
    const initData = async () => {
      const loadedSettings = loadCompanySettings();
      setCompanySettings(loadedSettings);

      const sheets = loadedSettings.googleSheets;
      let loadedFromSheets = false;
      
      if (sheets?.spreadsheetId && sheets?.accessToken) {
        try {
          const { fetchLoansFromSpreadsheet } = await import('./utils/googleSheets');
          const fetchedLoans = await fetchLoansFromSpreadsheet(sheets.spreadsheetId, sheets.accessToken);
          if (fetchedLoans.length > 0) {
            setLoans(fetchedLoans.map((l) => syncLoanStatusWithCurrentDate(l)));
            loadedFromSheets = true;
          }
        } catch (err: any) {
          console.warn('Failed to load from Google Sheets', err);
        }
      }
      
      // Fallback only if sheets failed or was empty, though user prefers sheets
      if (!loadedFromSheets) {
        const loadedLoans = loadLoans();
        setLoans(loadedLoans.map((l) => syncLoanStatusWithCurrentDate(l)));
      }
      
      setIsLoadingInitial(false);
    };
    initData();
  }, []);

  // Background auto-sync to Google Sheets if configured
  const triggerAutoSyncIfEnabled = async (updatedLoans: Loan[], settings: CompanySettings) => {
    const sheets = settings.googleSheets;
    if (sheets?.autoSync && sheets?.spreadsheetId && sheets?.accessToken) {
      try {
        setIsSyncingSheets(true);
        const result = await syncLoansToSpreadsheet(
          updatedLoans,
          settings,
          sheets.spreadsheetId,
          sheets.accessToken
        );
        const updatedSettings: CompanySettings = {
          ...settings,
          googleSheets: {
            ...sheets,
            lastSyncedAt: result.syncedAt,
          },
        };
        setCompanySettings(updatedSettings);
        saveCompanySettings(updatedSettings);
      } catch (err) {
        console.warn('Auto-sync to Google Sheets skipped or requires token renewal:', err);
      } finally {
        setIsSyncingSheets(false);
      }
    }
  };

  // Sync loans whenever page is refreshed or day changes
  const refreshLoansState = () => {
    const refreshed = loans.map((l) => syncLoanStatusWithCurrentDate(l));
    setLoans(refreshed);
    triggerAutoSyncIfEnabled(refreshed, companySettings);
  };

  // Find currently active loan in detail view
  const selectedLoan = loans.find((l) => l.id === selectedLoanId) || null;

  // Handlers
  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoanId(loan.id);
    setActiveTab('loans');
  };

  const handleBackToLoanList = () => {
    setSelectedLoanId(null);
  };

  const handleNewLoan = () => {
    setSelectedLoanId(null);
    setActiveTab('wizard');
  };

  const handleSaveNewLoan = (newLoan: Loan) => {
    const updatedList = [newLoan, ...loans];
    setLoans(updatedList);
    setSelectedLoanId(newLoan.id);
    setActiveTab('loans');

    // Automatically open agreement ticket for the new loan
    setTicketLoanTarget(newLoan);
    setTicketPaymentRecord(null);
    setTicketType('loan_agreement');
    setIsTicketModalOpen(true);

    // Auto sync to Google Sheets (acts as database write)
    triggerAutoSyncIfEnabled(updatedList, companySettings);
  };

  const handleOpenPaymentModal = (loanToPay?: Loan, installmentNum?: number) => {
    const target = loanToPay || selectedLoan;
    if (!target) return;
    setPaymentTargetLoan(target);
    setPaymentTargetInstallmentNum(installmentNum || null);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentRecord: PaymentRecord, updatedLoan: Loan) => {
    // Update loans list
    const updatedList = loans.map((l) => (l.id === updatedLoan.id ? updatedLoan : l));
    setLoans(updatedList);

    // Close payment modal and open ticket modal with printed ticket
    setIsPaymentModalOpen(false);
    setTicketPaymentRecord(paymentRecord);
    setTicketLoanTarget(updatedLoan);
    setTicketType('payment');
    setIsTicketModalOpen(true);

    // Auto sync to Google Sheets
    triggerAutoSyncIfEnabled(updatedList, companySettings);
  };

  const handleOpenTicketModal = (payment?: PaymentRecord, type: 'payment' | 'loan_agreement' = 'payment') => {
    setTicketPaymentRecord(payment || null);
    setTicketLoanTarget(selectedLoan);
    setTicketType(type);
    setIsTicketModalOpen(true);
  };

  const handleConvertFromSimulator = (params: any) => {
    setActiveTab('wizard');
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    saveCompanySettings(newSettings);
  };

  const overdueCount = loans.filter((l) => l.status === 'late').length;

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-bold text-slate-800">Cargando base de datos...</h2>
          <p className="text-sm text-slate-500">Conectando con Google Sheets para sincronizar información.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'loans') {
            setSelectedLoanId(null);
          }
        }}
        companySettings={companySettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSheets={() => setIsSheetsModalOpen(true)}
        onNewLoan={handleNewLoan}
        overdueCount={overdueCount}
        isSyncingSheets={isSyncingSheets}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tab 1: Cartera de Préstamos (Lista o Detalle) */}
        {activeTab === 'loans' && (
          <>
            {selectedLoan ? (
              <LoanDetail
                loan={selectedLoan}
                companySettings={companySettings}
                onBack={handleBackToLoanList}
                onOpenPaymentModal={(instNum) => handleOpenPaymentModal(selectedLoan, instNum)}
                onOpenTicketModal={handleOpenTicketModal}
              />
            ) : (
              <LoanList
                loans={loans}
                companySettings={companySettings}
                onSelectLoan={handleSelectLoan}
                onNewLoan={handleNewLoan}
                onQuickPayment={(loan) => handleOpenPaymentModal(loan)}
                onOpenSheets={() => setIsSheetsModalOpen(true)}
              />
            )}
          </>
        )}

        {/* Tab 2: Diseñar Préstamo Paso a Paso (Wizard) */}
        {activeTab === 'wizard' && (
          <LoanWizard
            companySettings={companySettings}
            existingLoans={loans}
            onSaveLoan={handleSaveNewLoan}
            onCancel={() => setActiveTab('loans')}
          />
        )}

        {/* Tab 3: Simulador Express */}
        {activeTab === 'simulator' && (
          <LoanSimulator
            companySettings={companySettings}
            onConvertIntoLoan={handleConvertFromSimulator}
          />
        )}

        {/* Tab 4: Reporte Financiero */}
        {activeTab === 'metrics' && (
          <DashboardMetrics
            loans={loans}
            companySettings={companySettings}
            onSelectLoan={handleSelectLoan}
          />
        )}
      </main>

      {/* Global Modals */}
      {/* 1. Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        loan={paymentTargetLoan}
        installmentNumberToPay={paymentTargetInstallmentNum}
        companySettings={companySettings}
        onPaymentSuccess={handlePaymentSuccess}
        allLoans={loans}
      />

      {/* 2. Ticket / Receipt Printer Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        payment={ticketPaymentRecord}
        loan={ticketLoanTarget}
        companySettings={companySettings}
        type={ticketType}
      />

      {/* 3. Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={companySettings}
        onSaveSettings={handleSaveSettings}
        allLoans={loans}
        onReloadLoans={(newLoans) => setLoans(newLoans)}
      />

      {/* 4. Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        loans={loans}
        companySettings={companySettings}
        onUpdateSettings={handleSaveSettings}
      />
    </div>
  );
}
