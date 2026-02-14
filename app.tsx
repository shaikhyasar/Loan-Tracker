import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AddRecord from './pages/AddRecord';
import LoanDetails from './pages/LoanDetails';
import EMICalculator from './pages/EMICalculator';
import Settings from './pages/Settings';
import { LoanRecord } from './types';
import { getOverdueEMIs } from './utils/finance';

const App: React.FC = () => {
  const [loans, setLoans] = useState<LoanRecord[]>(() => {
    const saved = localStorage.getItem('loan_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    localStorage.setItem('loan_records', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Check for auto-updates (overdue EMIs)
  useEffect(() => {
      let hasChanges = false;
      const updatedLoans = loans.map(loan => {
          if (loan.status === 'ACTIVE' && loan.type === 'EMI') {
              const newRepayments = getOverdueEMIs(loan);
              if (newRepayments.length > 0) {
                  hasChanges = true;
                  return {
                      ...loan,
                      repayments: [...loan.repayments, ...newRepayments]
                  };
              }
          }
          return loan;
      });

      if (hasChanges) {
          setLoans(updatedLoans);
      }
  }, [loans]); 

  const addLoan = (record: LoanRecord) => {
    setLoans(prev => [...prev, record]);
  };

  const updateLoan = (updated: LoanRecord) => {
    setLoans(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const deleteLoan = (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <HashRouter>
      <Layout darkMode={darkMode} toggleTheme={toggleTheme}>
        <Routes>
          <Route path="/" element={<Home loans={loans} />} />
          <Route path="/add" element={<AddRecord onSave={addLoan} />} />
          <Route path="/loan/:id" element={<LoanDetails loans={loans} updateLoan={updateLoan} deleteLoan={deleteLoan} />} />
          <Route path="/emi" element={<EMICalculator />} />
          <Route path="/settings" element={<Settings darkMode={darkMode} toggleTheme={toggleTheme} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;