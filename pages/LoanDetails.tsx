import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoanRecord, Repayment } from '../types';
import { calculateLoanStatus, formatCurrency, generateGrowthChartData } from '../utils/finance';
import { ArrowLeft, Trash2, Edit2, CheckCircle, Plus, X, Calendar, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface LoanDetailsProps {
  loans: LoanRecord[];
  updateLoan: (updated: LoanRecord) => void;
  deleteLoan: (id: string) => void;
}

const LoanDetails: React.FC<LoanDetailsProps> = ({ loans, updateLoan, deleteLoan }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loan = loans.find(l => l.id === id);

  const [showRepayModal, setShowRepayModal] = useState(false);
  
  // Repayment Form State
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayInterest, setRepayInterest] = useState('');
  const [repayPrincipal, setRepayPrincipal] = useState('');

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editPrincipal, setEditPrincipal] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editTenure, setEditTenure] = useState('');

  useEffect(() => {
     if (loan) {
         setEditTitle(loan.title);
         setEditStartDate(loan.startDate);
         setEditPrincipal(loan.principal.toString());
         setEditRate(loan.rate.toString());
         if (loan.tenure) setEditTenure(loan.tenure.toString());
     }
  }, [loan]);

  const currentStatus = useMemo(() => {
    return loan ? calculateLoanStatus(loan) : null;
  }, [loan]);

  const chartData = useMemo(() => {
     return loan ? generateGrowthChartData(loan) : [];
  }, [loan]);

  const isEMI = loan?.type === 'EMI';

  useEffect(() => {
    if (!repayAmount || !currentStatus) return;
    
    const amt = parseFloat(repayAmount);
    if (isNaN(amt)) return;

    if (!isEMI) {
      // Daily Interest Logic: prioritize paying off accrued interest
      const interestPart = Math.min(amt, currentStatus.accruedInterest);
      const principalPart = amt - interestPart;
      
      setRepayInterest(interestPart.toFixed(2));
      setRepayPrincipal(principalPart.toFixed(2));
    } else {
        // EMI Logic: Calculate interest on current outstanding principal
        // Interest = Outstanding Principal * (Annual Rate / 1200)
        const monthlyRate = (loan?.rate || 0) / 1200;
        const interestRaw = currentStatus.currentPrincipal * monthlyRate;
        
        // Cap interest part at total amount paid (in case of tiny payment)
        const interestPart = Math.min(amt, interestRaw);
        const principalPart = amt - interestPart;

        setRepayInterest(interestPart.toFixed(2));
        setRepayPrincipal(principalPart.toFixed(2));
    }
  }, [repayAmount, currentStatus, isEMI, loan]);


  if (!loan || !currentStatus) return <div className="p-10 text-center">Record not found</div>;

  const handleComplete = () => {
    if (window.confirm('Are you sure you want to mark this loan as fully paid and completed?')) {
        updateLoan({ ...loan, status: 'COMPLETED' });
        navigate('/');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this record forever? This cannot be undone.')) {
        deleteLoan(loan.id);
        navigate('/');
    }
  };

  const handleUpdate = () => {
      const p = parseFloat(editPrincipal);
      const r = parseFloat(editRate);
      const t = parseFloat(editTenure);

      if (!editTitle || isNaN(p) || isNaN(r)) {
          alert("Please check your inputs.");
          return;
      }

      const updatedRecord: LoanRecord = {
          ...loan,
          title: editTitle,
          startDate: editStartDate,
          principal: p,
          rate: r,
          tenure: loan.type === 'EMI' ? t : undefined
      };

      updateLoan(updatedRecord);
      setIsEditing(false);
  }

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(repayAmount);
    let pComp = parseFloat(repayPrincipal);
    let iComp = parseFloat(repayInterest);

    if (isNaN(amount) || amount <= 0) return;
    
    if (isNaN(pComp)) pComp = amount;
    if (isNaN(iComp)) iComp = 0;

    const newRepayment: Repayment = {
      id: crypto.randomUUID(),
      date: repayDate,
      amountPaid: amount,
      principalComponent: pComp,
      interestComponent: iComp
    };

    const updatedLoan = {
      ...loan,
      repayments: [...loan.repayments, newRepayment]
    };
    
    updateLoan(updatedLoan);
    setShowRepayModal(false);
    setRepayAmount('');
    setRepayInterest('');
    setRepayPrincipal('');
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
          <ArrowLeft size={24} className="text-slate-600 dark:text-gray-300" />
        </button>
        <div className="flex gap-3">
             <button 
                type="button"
                onClick={() => setIsEditing(!isEditing)} 
                className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-blue-100 text-blue-600' : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                title="Edit Record"
             >
                <Edit2 size={20} />
             </button>
             {loan.status === 'ACTIVE' && (
                <button 
                    type="button"
                    onClick={handleComplete} 
                    className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                    title="Mark as Completed"
                >
                    <CheckCircle size={20} />
                </button>
             )}
             <button 
                type="button"
                onClick={handleDelete} 
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="Delete Record"
             >
                <Trash2 size={20} />
             </button>
        </div>
      </div>

      {isEditing ? (
          <div className="mb-6 bg-white dark:bg-carddark p-5 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-4 shadow-lg animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Edit Loan Details</h3>
              
              <div className="space-y-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Title</label>
                    <input 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                        className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Principal</label>
                        <input 
                            type="number"
                            value={editPrincipal} 
                            onChange={e => setEditPrincipal(e.target.value)} 
                            className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Rate (%)</label>
                        <input 
                            type="number"
                            value={editRate} 
                            onChange={e => setEditRate(e.target.value)} 
                            className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                </div>

                {isEMI && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Tenure (Months)</label>
                        <input 
                            type="number"
                            value={editTenure} 
                            onChange={e => setEditTenure(e.target.value)} 
                            className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Start Date</label>
                    <input 
                        type="date"
                        value={editStartDate} 
                        onChange={e => setEditStartDate(e.target.value)} 
                        className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 mt-2 border-t border-gray-100 dark:border-slate-700">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
                  <button type="button" onClick={handleUpdate} className="flex items-center gap-2 px-6 py-2 text-sm bg-primary text-white rounded-lg font-bold shadow-md hover:bg-emerald-600 transition-all">
                      <Save size={16} />
                      Save
                  </button>
              </div>
          </div>
      ) : (
          <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">{loan.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 inline-flex px-3 py-1 rounded-full border border-gray-100 dark:border-slate-700 shadow-sm">
                  <Calendar size={14} />
                  <span>Started: {new Date(loan.startDate).toLocaleDateString()}</span>
              </div>
          </div>
      )}

      {/* Main Stats */}
      <div className={`p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 relative overflow-hidden ${loan.status === 'COMPLETED' ? 'bg-gray-100 dark:bg-slate-800' : 'bg-white dark:bg-carddark'}`}>
         {loan.status === 'COMPLETED' && <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10 font-bold text-green-600 text-xl border-4 border-green-500 rounded-2xl m-2 backdrop-blur-[1px]">COMPLETED</div>}
         
         <div className="grid grid-cols-2 gap-y-8 gap-x-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{isEMI ? 'Total Outstanding' : 'Total Due'}</p>
              <p className="text-2xl font-extrabold text-primary">{formatCurrency(currentStatus.totalDue)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{isEMI ? 'EMI / Month' : 'Interest Only'}</p>
              <p className="text-xl font-bold text-orange-500">
                  {isEMI ? formatCurrency(currentStatus.emiAmount || 0) : formatCurrency(currentStatus.accruedInterest)}
              </p>
            </div>
            <div>
               <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{isEMI ? 'Principal Balance' : 'Principal'}</p>
               <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                   {formatCurrency(currentStatus.currentPrincipal)}
               </p>
            </div>
            <div className="text-right">
               <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Rate</p>
               <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">{loan.rate}% p.a.</p>
            </div>
         </div>
      </div>

      {/* Chart */}
      <div className="mb-8 h-64 w-full bg-white dark:bg-carddark p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-sm font-bold text-gray-400 mb-4">{isEMI ? 'Balance Trend' : 'Interest Growth'}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => formatCurrency(value)}
            />
            <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
            {!isEMI && <Line type="monotone" dataKey="interest" stroke="#f97316" strokeWidth={2} dot={false} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Repayments */}
      <div>
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white">Repayments</h3>
           {loan.status === 'ACTIVE' && (
               <button 
                 onClick={() => setShowRepayModal(true)}
                 className="flex items-center gap-1 text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all"
               >
                 <Plus size={16} /> Add Payment
               </button>
           )}
        </div>

        <div className="bg-white dark:bg-carddark rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">{isEMI ? 'EMI Amount' : 'Paid'}</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Principal</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Interest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {loan.repayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">No repayments yet</td>
                  </tr>
                ) : (
                  [...loan.repayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(rep => (
                    <tr key={rep.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-700 dark:text-gray-300 whitespace-nowrap">{new Date(rep.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-bold text-green-600 whitespace-nowrap">{formatCurrency(rep.amountPaid)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-gray-400 whitespace-nowrap">{formatCurrency(rep.principalComponent)}</td>
                      <td className="px-4 py-3 text-orange-500 whitespace-nowrap">{formatCurrency(rep.interestComponent)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showRepayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-carddark w-full max-w-md rounded-2xl p-6 shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add Repayment</h3>
               <button onClick={() => setShowRepayModal(false)} className="text-gray-400 hover:text-gray-600">
                 <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleRepaySubmit} className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={repayDate}
                    onChange={e => setRepayDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{isEMI ? 'EMI Amount (₹)' : 'Amount Paid (₹)'}</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    step="1"
                    value={repayAmount}
                    onChange={e => setRepayAmount(e.target.value)}
                    placeholder="Enter total amount"
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg dark:text-white font-bold text-lg"
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Principal Part</label>
                    <input 
                       type="number"
                       step="0.01"
                       value={repayPrincipal}
                       onChange={e => setRepayPrincipal(e.target.value)}
                       className="w-full p-2 bg-gray-100 dark:bg-slate-900 border-none rounded text-sm dark:text-gray-300"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Interest Part</label>
                    <input 
                       type="number"
                       step="0.01"
                       value={repayInterest}
                       onChange={e => setRepayInterest(e.target.value)}
                       className="w-full p-2 bg-gray-100 dark:bg-slate-900 border-none rounded text-sm text-orange-500"
                    />
                 </div>
               </div>
               
               <p className="text-xs text-gray-400 mt-2 text-center">Breakdown auto-calculated based on {isEMI ? 'amortization' : 'accrued interest'}. Adjust if needed.</p>

               <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors">
                 Confirm Payment
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDetails;