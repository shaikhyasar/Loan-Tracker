
export interface Repayment {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  amountPaid: number;
  principalComponent: number;
  interestComponent: number;
}

export interface LoanRecord {
  id: string;
  title: string;
  principal: number; // Initial Principal
  rate: number; // Annual Interest Rate in %
  startDate: string; // ISO Date string YYYY-MM-DD
  repayments: Repayment[];
  status: 'ACTIVE' | 'COMPLETED';
  type?: 'DAILY' | 'EMI'; // Default to DAILY if undefined
  tenure?: number; // Months, required if type is EMI
}

export interface LoanStatus {
  currentPrincipal: number;
  accruedInterest: number;
  totalDue: number;
  daysElapsed: number;
  emiAmount?: number; // Added for display
}

export interface DailyGrowthPoint {
  day: string;
  interest: number;
  total: number;
}

// PWA Install Prompt Event Type
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
