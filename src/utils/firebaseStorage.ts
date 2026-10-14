import { doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import { db, loansCollection, settingsCollection } from './firebase';
import { Loan, CompanySettings } from '../types';
import { syncLoanStatusWithCurrentDate } from './finance';
import { DEFAULT_COMPANY_SETTINGS } from './storage';

const SETTINGS_DOC_ID = 'company-settings';

export function subscribeToLoans(callback: (loans: Loan[]) => void) {

  return onSnapshot(loansCollection, (snapshot) => {
    const loans = snapshot.docs.map(doc => {
      const data = doc.data() as Loan;
      return syncLoanStatusWithCurrentDate(data);
    });
    // Sort by creation date descending
    loans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(loans);
  });
}

export function subscribeToSettings(callback: (settings: CompanySettings) => void) {
  const docRef = doc(settingsCollection, SETTINGS_DOC_ID);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = { ...DEFAULT_COMPANY_SETTINGS, ...snapshot.data() } as CompanySettings;
      // Guarantee official institutional logo if missing or pointing to legacy external placeholder
      if (!data.logoUrl || data.logoUrl.includes('unsplash.com')) {
        data.logoUrl = '/logo.svg';
        setDoc(docRef, { logoUrl: '/logo.svg' }, { merge: true }).catch(console.error);
      }
      callback(data);
    } else {
      callback(DEFAULT_COMPANY_SETTINGS);
      // Initialize if missing
      setDoc(docRef, DEFAULT_COMPANY_SETTINGS).catch(console.error);
    }
  });
}

export async function saveLoanToFirebase(loan: Loan) {
  const docRef = doc(loansCollection, loan.id);
  // Remove undefined values to prevent Firebase "Unsupported field value" errors
  const cleanLoan = JSON.parse(JSON.stringify(loan));
  await setDoc(docRef, cleanLoan);
}

export async function saveSettingsToFirebase(settings: CompanySettings) {
  const docRef = doc(settingsCollection, SETTINGS_DOC_ID);
  const cleanSettings = JSON.parse(JSON.stringify(settings));
  await setDoc(docRef, cleanSettings);
}

export async function deleteLoanFromFirebase(loanId: string) {
  const docRef = doc(loansCollection, loanId);
  await deleteDoc(docRef);
}
