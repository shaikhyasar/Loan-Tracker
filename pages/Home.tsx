import React, { useState } from 'react';
import { LoanRecord } from '../types';
import LoanCard from '../components/LoanCard';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HomeProps {
  loans: LoanRecord[];
}

const Home: React.FC<HomeProps> = ({ loans }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  
  const filteredLoans = loans.filter(l => {
      const searchTerms = filter.toLowerCase().split(' ');
      const loanString = `${l.title} ${l.principal} ${l.status} ${new Date(l.startDate).toLocaleDateString()}`.toLowerCase();
      
      return searchTerms.every(term => loanString.includes(term));
  });
  
  const activeLoans = filteredLoans.filter(l => l.status === 'ACTIVE');
  const completedLoans = filteredLoans.filter(l => l.status === 'COMPLETED');

  return (
    <div className="space-y-6">
       {/* Welcome / Stats Section */}
       <div className="mb-2">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Overview</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Track your daily growth and EMIs</p>
       </div>

       {/* Search */}
       <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
         <input 
            type="text" 
            placeholder="Search name, amount, date..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-white placeholder-gray-400 shadow-sm transition-all"
         />
       </div>

       {/* Active List */}
       <div className="space-y-1">
         {activeLoans.length === 0 && !filter && (
           <div className="text-center py-10 opacity-50">
             <p className="text-gray-400">No active records</p>
           </div>
         )}
         {activeLoans.length === 0 && filter && (
             <p className="text-gray-400 text-center py-4 text-sm">No matching active records</p>
         )}
         {activeLoans.map(loan => (
             <LoanCard 
               key={loan.id} 
               record={loan} 
               onClick={() => navigate(`/loan/${loan.id}`)}
             />
         ))}
       </div>

       {/* Completed Section */}
       {completedLoans.length > 0 && (
         <div className="mt-8 border-t border-gray-100 dark:border-slate-700 pt-4">
            <button 
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 w-full text-left text-gray-500 dark:text-gray-400 hover:text-primary transition-colors py-2"
            >
               {showCompleted ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
               <span className="font-semibold text-sm">Completed Loans ({completedLoans.length})</span>
            </button>
            
            {showCompleted && (
              <div className="mt-4 space-y-1 animate-fade-in">
                 {completedLoans.map(loan => (
                   <LoanCard 
                     key={loan.id} 
                     record={loan} 
                     onClick={() => navigate(`/loan/${loan.id}`)}
                   />
                 ))}
              </div>
            )}
         </div>
       )}
    </div>
  );
};

export default Home;