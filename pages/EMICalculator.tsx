import React, { useState } from 'react';
import { calculateEMI, formatCurrency } from '../utils/finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const EMICalculator: React.FC = () => {
  const [amount, setAmount] = useState('100000');
  const [rate, setRate] = useState('10');
  const [tenure, setTenure] = useState('12'); // Months

  const results = React.useMemo(() => {
    const p = parseFloat(amount) || 0;
    const r = parseFloat(rate) || 0;
    const t = parseFloat(tenure) || 0;
    
    if (p > 0 && r > 0 && t > 0) {
      return calculateEMI(p, r, t);
    }
    return { emi: 0, totalInterest: 0, totalPayment: 0 };
  }, [amount, rate, tenure]);

  const chartData = [
    { name: 'Principal', value: parseFloat(amount) || 0, color: '#10b981' },
    { name: 'Interest', value: results.totalInterest, color: '#f97316' },
  ];

  return (
    <div className="space-y-8">
       <h2 className="text-2xl font-bold text-slate-800 dark:text-white">EMI Calculator</h2>

       <div className="bg-white dark:bg-carddark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Loan Amount (₹)</label>
            <input 
               type="number"
               className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg dark:text-white font-semibold"
               value={amount}
               onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Interest (%)</label>
                <input 
                   type="number"
                   className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg dark:text-white font-semibold"
                   value={rate}
                   onChange={e => setRate(e.target.value)}
                />
             </div>
             <div className="flex-1">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tenure (Months)</label>
                <input 
                   type="number"
                   className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg dark:text-white font-semibold"
                   value={tenure}
                   onChange={e => setTenure(e.target.value)}
                />
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center text-center">
             <p className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-2">Monthly EMI</p>
             <p className="text-4xl font-extrabold text-emerald-400 mb-6">{formatCurrency(results.emi)}</p>
             
             <div className="w-full border-t border-slate-700 pt-4 flex justify-between text-sm">
                <span className="text-gray-400">Total Interest</span>
                <span className="font-bold text-orange-400">{formatCurrency(results.totalInterest)}</span>
             </div>
             <div className="w-full pt-2 flex justify-between text-sm">
                <span className="text-gray-400">Total Payable</span>
                <span className="font-bold">{formatCurrency(results.totalPayment)}</span>
             </div>
          </div>
          
          <div className="h-64 bg-white dark:bg-carddark rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 relative">
             <h3 className="absolute top-4 left-4 text-xs font-bold text-gray-400 uppercase">Breakdown</h3>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                   <p className="text-xs text-gray-400">Ratio</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default EMICalculator;
