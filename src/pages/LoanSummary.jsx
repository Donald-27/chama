import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, HandCoins, Clock, Check, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function LoanSummary() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const chamaId = urlParams.get('chamaId');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error(e);
      }
    };
    loadUser();
  }, []);

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['chama-loans', chamaId],
    queryFn: () => base44.entities.Loan.filter({ chama_id: chamaId }),
    enabled: !!chamaId,
  });

  const { data: chama } = useQuery({
    queryKey: ['chama', chamaId],
    queryFn: async () => {
      const chamas = await base44.entities.Chama.filter({ id: chamaId });
      return chamas[0];
    },
    enabled: !!chamaId,
  });

  const totalDisbursed = loans.reduce((sum, l) => sum + (l.principal_amount || 0), 0);
  const totalOutstanding = loans
    .filter(l => ['disbursed', 'repaying'].includes(l.status))
    .reduce((sum, l) => sum + (l.outstanding_balance || 0), 0);

  const statusColors = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock },
    approved: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Check },
    disbursed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: HandCoins },
    repaying: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: HandCoins },
    completed: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Check },
    defaulted: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertTriangle },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertTriangle },
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a2332' }}>
      {/* Header */}
      <header className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-4">
          <Link 
            to={createPageUrl(`ChamaDetail?id=${chamaId}`)}
            className="p-2 rounded-xl"
            style={{ backgroundColor: '#243447' }}
          >
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <h1 className="text-lg font-bold text-white">Loan Summary</h1>
        </div>
      </header>

      <main className="px-4">
        {/* Summary Header */}
        <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: '#243447' }}>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Total Disbursed</p>
              <p className="text-white font-bold text-xl">KES {totalDisbursed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Outstanding</p>
              <p className="text-amber-400 font-bold text-xl">KES {totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Loans List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" style={{ backgroundColor: '#243447' }} />
            ))}
          </div>
        ) : loans.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#243447' }}>
            <HandCoins className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No loans yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => {
              const status = statusColors[loan.status] || statusColors.pending;
              const StatusIcon = status.icon;
              
              return (
                <div key={loan.id} className="rounded-xl p-4" style={{ backgroundColor: '#243447' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-medium">{loan.borrower_name}</p>
                      <p className="text-gray-500 text-xs">
                        {loan.loan_type?.replace(/_/g, ' ')} • {loan.duration_months} months
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${status.bg} ${status.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {loan.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Principal</p>
                      <p className="text-white font-medium">KES {(loan.principal_amount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Interest</p>
                      <p className="text-cyan-400 font-medium">{loan.interest_rate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Outstanding</p>
                      <p className="text-amber-400 font-medium">KES {(loan.outstanding_balance || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {loan.application_date && (
                    <p className="text-gray-600 text-xs mt-3">
                      Applied: {format(new Date(loan.application_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}