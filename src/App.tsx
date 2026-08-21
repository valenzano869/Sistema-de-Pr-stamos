import React, { useState, useEffect } from 'react';
import { CompanySettings, Loan, PaymentRecord } from './types';
import {
  DEFAULT_COMPANY_SETTINGS,
  loadCompanySettings,
  loadLoans,
} from './utils/storage';
import {
  subscribeToLoans,
  subscribeToSettings,
  saveLoanToFirebase,
  saveSettingsToFirebase,
  initializeFirebaseData
} from './utils/firebaseStorage';
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

  // Initialize data from Firebase on load
  useEffect(() => {
    const unsubscribeLoans = subscribeToLoans((firebaseLoans) => {
      setLoans(firebaseLoans);
    });

    const unsubscribeSettings = subscribeToSettings((settings) => {
      setCompanySettings(settings);
    });

    // Seed initial local data to Firebase if the collection is empty
    const localLoans = loadLoans();
    initializeFirebaseData(localLoans);

    return () => {
      unsubscribeLoans();
      unsubscribeSettings();
    };
  }, []);

  // Sync loans whenever page is refreshed or day changes
  const refreshLoansState = () => {
    loans.forEach(async (l) => {
      const refreshed = syncLoanStatusWithCurrentDate(l);
      await saveLoanToFirebase(refreshed);
    });
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

  const handleSaveNewLoan = async (newLoan: Loan) => {
    await saveLoanToFirebase(newLoan);
    setSelectedLoanId(newLoan.id);
    setActiveTab('loans');

    // Automatically open agreement ticket for the new loan
    setTicketLoanTarget(newLoan);
    setTicketPaymentRecord(null);
    setTicketType('loan_agreement');
    setIsTicketModalOpen(true);
  };

  const handleOpenPaymentModal = (loanToPay?: Loan, installmentNum?: number) => {
    const target = loanToPay || selectedLoan;
    if (!target) return;
    setPaymentTargetLoan(target);
    setPaymentTargetInstallmentNum(installmentNum || null);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (paymentRecord: PaymentRecord, updatedLoan: Loan) => {
    await saveLoanToFirebase(updatedLoan);

    // Close payment modal and open ticket modal with printed ticket
    setIsPaymentModalOpen(false);
    setTicketPaymentRecord(paymentRecord);
    setTicketLoanTarget(updatedLoan);
    setTicketType('payment');
    setIsTicketModalOpen(true);
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

  const handleSaveSettings = async (newSettings: CompanySettings) => {
    await saveSettingsToFirebase(newSettings);
  };

  const overdueCount = loans.filter((l) => l.status === 'late').length;

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
        onNewLoan={handleNewLoan}
        overdueCount={overdueCount}
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
    </div>
  );
}
