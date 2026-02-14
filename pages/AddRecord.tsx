import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoanRecord } from '../types';
import { Save, X, Info } from 'lucide-react';
import { calculateEMI, formatCurrency } from '../utils/finance';

interface AddRecordProps {
  onSave: (record: LoanRecord) => void;
}

const AddRecord: React.FC<AddRecordProps> = ({ onSave }) => {
  const navigate = useNavigate();
  const [loanType, setLoanType] = useState<'DAILY' | 'EMI'>('DAILY');
  const [formData, setFormData] = useState({
    title: '',
    principal: '',
    rate: '',
    tenure: '12', // Default 12 months for EMI
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.principal || !formData.rate) return;

    const newRecord: LoanRecord = {
      id: crypto.randomUUID(),
      title: formData.title,
      principal: parseFloat(formData.principal),
      rate: parseFloat(formData.rate),
      startDate: formData.startDate,
      repayments: [],
      status: 'ACTIVE',
      type: loanType,
      tenure: loanType === 'EMI' ? parseFloat(formData.tenure) : undefined
    };

    onSave(newRecord);
    navigate('/');
  };

  // Live EMI Preview
  const emiPreview = React.useMemo(() => {
     if (loanType === 'EMI' && formData.principal && formData.rate && formData.tenure) {
         return calculateEMI(parseFloat(formData.principal), parseFloat(formData.rate), parseFloat(formData.tenure));
     }
     return null;
  }, [loanType, formData.principal, formData.rate, formData.tenure]);

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">New Record</h2>
        <button onClick={() => navigate('/')} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full">
           <X size={24} />
        </button>
      </div>

      <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
         <button 
           type="button"
           onClick={() => setLoanType('DAILY')}
           className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loanType === 'DAILY' ? 'bg-white dark:bg-slate-600 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
         >
           Daily Interest
         </button>
         <button 
           type="button"
           onClick={() => setLoanType('EMI')}
           className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loanType === 'EMI' ? 'bg-white dark:bg-slate-600 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
         >
           EMI Loan
         </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
           <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Title / Name</label>
           <input 
             required
             type="text"
             className="w-full p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all"
             placeholder="e.g. Home Loan, Personal Loan"
             value={formData.title}
             onChange={e => setFormData({...formData, title: e.target.value})}
           />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Principal (₹)</label>
             <input 
               required
               type="number"
               min="0"
               step="100"
               className="w-full p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
               placeholder="0.00"
               value={formData.principal}
               onChange={e => setFormData({...formData, principal: e.target.value})}
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Rate (% p.a.)</label>
             <input 
               required
               type="number"
               min="0"
               step="0.1"
               className="w-full p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
               placeholder="e.g. 12"
               value={formData.rate}
               onChange={e => setFormData({...formData, rate: e.target.value})}
             />
           </div>
        </div>

        {loanType === 'EMI' && (
           <div className="animate-fade-in">
             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tenure (Months)</label>
             <input 
               required
               type="number"
               min="1"
               step="1"
               className="w-full p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
               placeholder="e.g. 24"
               value={formData.tenure}
               onChange={e => setFormData({...formData, tenure: e.target.value})}
             />
             
             {emiPreview && (
                 <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                     <div className="flex justify-between items-center mb-1">
                         <span className="text-xs text-blue-500 uppercase font-bold">Monthly EMI</span>
                         <span className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrency(emiPreview.emi)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-blue-400">Total Payable</span>
                         <span className="text-sm font-medium text-blue-600 dark:text-blue-300">{formatCurrency(emiPreview.totalPayment)}</span>
                     </div>
                 </div>
             )}
           </div>
        )}

        <div>
           <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Start Date</label>
           <input 
             required
             type="date"
             className="w-full p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
             value={formData.startDate}
             onChange={e => setFormData({...formData, startDate: e.target.value})}
           />
        </div>

        <button 
          type="submit"
          className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center gap-2 mt-8"
        >
          <Save size={20} />
          Save Record
        </button>
      </form>
    </div>
  );
};

export default AddRecord;