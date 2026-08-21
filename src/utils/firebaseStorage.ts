import { doc, setDoc, onSnapshot, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, loansCollection, settingsCollection } from './firebase';
import { Loan, CompanySettings } from '../types';
import { syncLoanStatusWithCurrentDate } from './finance';
import { DEFAULT_COMPANY_SETTINGS } from './storage'; // Import defaults

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
      callback({ ...DEFAULT_COMPANY_SETTINGS, ...snapshot.data() } as CompanySettings);
    } else {
      callback(DEFAULT_COMPANY_SETTINGS);
      // Initialize if missing
      setDoc(docRef, DEFAULT_COMPANY_SETTINGS).catch(console.error);
    }
  });
}

export async function saveLoanToFirebase(loan: Loan) {
  const docRef = doc(loansCollection, loan.id);
  await setDoc(docRef, loan);
}

export async function saveSettingsToFirebase(settings: CompanySettings) {
  const docRef = doc(settingsCollection, SETTINGS_DOC_ID);
  await setDoc(docRef, settings);
}

// Ensure seed data is migrated to Firebase if empty
export async function initializeFirebaseData(localLoans: Loan[]) {
  const snapshot = await getDocs(loansCollection);
  if (snapshot.empty && localLoans && localLoans.length > 0) {
    // Seed database with the local generated loans
    for (const loan of localLoans) {
      await saveLoanToFirebase(loan);
    }
  }
}
