import React, { useMemo } from 'react';
import { LoanRecord } from '../types';
import { calculateLoanStatus, formatCurrency } from '../utils/finance';
import { ArrowRight, Calendar, CheckCircle2, TrendingUp, Clock } from 'lucide-react';

interface LoanCardProps {
  record: LoanRecord;
  onClick: () => void;
}

const LoanCard: React.FC<LoanCardProps> = ({ record, onClick }) => {
  const status = useMemo(() => calculateLoanStatus(record), [record]);
  const isEMI = record.type === 'EMI';

  if (record.status === 'COMPLETED') {
    return (
      <div 
        onClick={onClick}
        className="bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-4 cursor-pointer opacity-75 hover:opacity-100 transition-all"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-500 dark:text-gray-400 line-through decoration-2 decoration-primary">{record.title}</h3>
            <span className="text-xs inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium mt-1">
              <CheckCircle2 size={12} /> Completed
            </span>
          </div>
          <div className="text-right">
             <p className="text-xs text-gray-500">Total Paid</p>
             <p className="font-bold text-gray-600 dark:text-gray-300">{formatCurrency(record.repayments.reduce((acc, cur) => acc + cur.amountPaid, 0))}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-carddark rounded-xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div>
             <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{record.title}</h3>
             <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(record.startDate).toLocaleDateString()}</span>
                {isEMI ? (
                    <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-blue-600 dark:text-blue-300 flex items-center gap-1">
                        <Clock size={10} /> {record.tenure} Mo
                    </span>
                ) : (
                    <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{record.rate}% p.a.</span>
                )}
             </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold uppercase">
            {isEMI ? 'EMI' : 'Active'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">{isEMI ? 'Remaining Bal.' : 'Principal'}</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(status.currentPrincipal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">{isEMI ? 'EMI / Mo' : 'Interest'}</p>
            <p className="text-sm font-semibold text-orange-500">
                {isEMI ? formatCurrency(status.emiAmount || 0) : formatCurrency(status.accruedInterest)}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-50 dark:border-slate-700 flex justify-between items-end">
          <div>
             <p className="text-xs text-gray-500 dark:text-gray-400">{isEMI ? 'Total Outstanding' : 'Total Amount Due'}</p>
             <p className="text-2xl font-bold text-primary">{formatCurrency(status.totalDue)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700 p-2 rounded-full text-gray-400 dark:text-gray-300">
             <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanCard;