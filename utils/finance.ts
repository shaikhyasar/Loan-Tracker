import { LoanRecord, Repayment, LoanStatus, DailyGrowthPoint } from '../types';

export const calculateDaysBetween = (start: string, end: string): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  const startDate = new Date(start).setHours(0, 0, 0, 0);
  const endDate = new Date(end).setHours(0, 0, 0, 0);
  return Math.round(Math.abs((startDate - endDate) / oneDay));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Simple EMI Calculator
export const calculateEMI = (principal: number, rate: number, months: number) => {
    const r = rate / 1200; // Monthly rate
    const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;
    return { emi, totalInterest, totalPayment };
};

export const calculateLoanStatus = (record: LoanRecord, targetDate: string = new Date().toISOString()): LoanStatus => {
  // EMI Logic
  if (record.type === 'EMI' && record.tenure) {
      const { emi, totalPayment } = calculateEMI(record.principal, record.rate, record.tenure);
      const totalPaid = record.repayments.reduce((sum, r) => sum + r.amountPaid, 0);
      
      const totalDue = Math.max(0, totalPayment - totalPaid);
      
      let amortizedPrincipal = record.principal;
      record.repayments.forEach(r => {
          amortizedPrincipal -= r.principalComponent;
      });

      return {
          currentPrincipal: Math.max(0, amortizedPrincipal), 
          accruedInterest: 0, 
          totalDue: totalDue,
          daysElapsed: calculateDaysBetween(record.startDate, targetDate),
          emiAmount: emi
      };
  }

  // Daily Interest Logic
  let currentPrincipal = record.principal;
  let accruedInterest = 0;
  let lastDate = new Date(record.startDate);
  const today = new Date(targetDate);

  // Sort repayments by date
  const sortedRepayments = [...record.repayments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const repayment of sortedRepayments) {
    const payDate = new Date(repayment.date);
    
    // Calculate interest for the period before this payment
    if (payDate > lastDate) {
      const days = calculateDaysBetween(lastDate.toISOString(), payDate.toISOString());
      const periodInterest = (currentPrincipal * record.rate * days) / 36500; 
      accruedInterest += periodInterest;
    }

    accruedInterest -= repayment.interestComponent;
    currentPrincipal -= repayment.principalComponent;
    
    lastDate = payDate;
  }

  // Calculate interest from last repayment (or start date) to now
  if (today > lastDate) {
    const days = calculateDaysBetween(lastDate.toISOString(), today.toISOString());
    const finalPeriodInterest = (currentPrincipal * record.rate * days) / 36500;
    accruedInterest += finalPeriodInterest;
  }

  return {
    currentPrincipal,
    accruedInterest,
    totalDue: currentPrincipal + accruedInterest,
    daysElapsed: calculateDaysBetween(record.startDate, today.toISOString()),
  };
};

export const generateGrowthChartData = (record: LoanRecord): DailyGrowthPoint[] => {
  const data: DailyGrowthPoint[] = [];
  const start = new Date(record.startDate);
  const end = new Date();
  
  if (record.type === 'EMI') {
       data.push({
        day: start.toLocaleDateString(),
        interest: 0,
        total: calculateEMI(record.principal, record.rate, record.tenure || 12).totalPayment
      });
       data.push({
        day: end.toLocaleDateString(),
        interest: 0,
        total: calculateLoanStatus(record).totalDue
      });
      return data;
  }

  // Daily Logic
  let tempPrincipal = record.principal;
  let tempInterest = 0;
  let cursorDate = new Date(start);
  let lastCalcDate = new Date(start);
  
  const sortedRepayments = [...record.repayments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let repIndex = 0;

  // Initial Point
  data.push({
    day: start.toLocaleDateString(),
    interest: 0,
    total: tempPrincipal
  });

  const totalDays = calculateDaysBetween(record.startDate, end.toISOString());
  const step = Math.max(1, Math.floor(totalDays / 20)); 

  for (let i = 1; i <= totalDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);

    while(repIndex < sortedRepayments.length) {
       const rep = sortedRepayments[repIndex];
       const repDate = new Date(rep.date);
       if (repDate.toDateString() === currentDate.toDateString()) {
           const days = calculateDaysBetween(lastCalcDate.toISOString(), currentDate.toISOString());
           const periodInterest = (tempPrincipal * record.rate * days) / 36500;
           tempInterest += periodInterest;
           
           tempInterest -= rep.interestComponent;
           tempPrincipal -= rep.principalComponent;
           
           lastCalcDate = new Date(currentDate);
           repIndex++;
       } else if (repDate < currentDate) {
           repIndex++;
       } else {
           break;
       }
    }

    if (i % step === 0 || i === totalDays) {
       const days = calculateDaysBetween(lastCalcDate.toISOString(), currentDate.toISOString());
       const periodInterest = (tempPrincipal * record.rate * days) / 36500;
       
       data.push({
           day: currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
           interest: Math.max(0, tempInterest + periodInterest),
           total: Math.max(0, tempPrincipal + tempInterest + periodInterest)
       });
    }
  }

  return data;
};

export const getOverdueEMIs = (record: LoanRecord): Repayment[] => {
  if (record.type !== 'EMI' || !record.tenure) return [];
  
  const repaymentsToAdd: Repayment[] = [];
  const start = new Date(record.startDate);
  const now = new Date();
  
  const { emi } = calculateEMI(record.principal, record.rate, record.tenure);
  const monthlyRate = record.rate / 1200;

  let currentBalance = record.principal;
  const sortedRepayments = [...record.repayments].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedRepayments.forEach(r => {
      currentBalance -= r.principalComponent;
  });

  // Calculate full months elapsed since start date
  let monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  
  // If today is equal to or past the start day of month, that month counts.
  // E.g. Start Jan 4. Today Feb 3. Months = 1. Day < 4. Months = 0.
  // E.g. Start Jan 4. Today Feb 4. Months = 1. Day >= 4. Months = 1.
  if (now.getDate() < start.getDate()) {
      monthsElapsed--;
  }

  // We should stop if we exceed tenure
  monthsElapsed = Math.min(monthsElapsed, record.tenure);

  const existingCount = record.repayments.length;
  const missingCount = monthsElapsed - existingCount;

  if (missingCount > 0) {
      for (let i = 0; i < missingCount; i++) {
          if (currentBalance <= 1) break;

          const interestPart = currentBalance * monthlyRate;
          const principalPart = emi - interestPart;
          
          // Next Due Date: Start Date + (Existing + 1 + i) months
          const dueDate = new Date(start);
          dueDate.setMonth(start.getMonth() + existingCount + 1 + i);
          
          repaymentsToAdd.push({
              id: crypto.randomUUID(),
              date: dueDate.toISOString().split('T')[0],
              amountPaid: Math.round(emi),
              principalComponent: Math.round(principalPart),
              interestComponent: Math.round(interestPart)
          });

          currentBalance -= principalPart;
      }
  }
  
  return repaymentsToAdd;
};