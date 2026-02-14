import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Gavel, Clock, Check, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function FineSummary() {
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

  const { data: fines = [], isLoading } = useQuery({
    queryKey: ['chama-fines', chamaId],
    queryFn: () => base44.entities.Fine.filter({ chama_id: chamaId }),
    enabled: !!chamaId,
  });

  const totalPending = fines
    .filter(f => f.status === 'pending')
    .reduce((sum, f) => sum + (f.amount || 0), 0);
  
  const totalPaid = fines
    .filter(f => f.status === 'paid')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const statusColors = {
    pending: { bg: 'bg-red-500/20', text: 'text-red-400', icon: Clock },
    paid: { bg: 'bg-green-500/20', text: 'text-green-400', icon: Check },
    waived: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: X },
  };

  const fineTypeLabels = {
    late_contribution: 'Late Contribution',
    missed_meeting: 'Missed Meeting',
    late_loan_payment: 'Late Loan Payment',
    custom: 'Custom Fine',
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
            <ArrowLeft className="w-5 h-5 text-red-400" />
          </Link>
          <h1 className="text-lg font-bold text-white">Fine Summary</h1>
        </div>
      </header>

      <main className="px-4">
        {/* Summary Header */}
        <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: '#243447' }}>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Pending Fines</p>
              <p className="text-red-400 font-bold text-xl">KES {totalPending.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Paid Fines</p>
              <p className="text-green-400 font-bold text-xl">KES {totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Fines List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl" style={{ backgroundColor: '#243447' }} />
            ))}
          </div>
        ) : fines.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#243447' }}>
            <Gavel className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No fines recorded</p>
            <p className="text-gray-500 text-sm">Keep up the good work!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fines.map((fine) => {
              const status = statusColors[fine.status] || statusColors.pending;
              const StatusIcon = status.icon;
              
              return (
                <div key={fine.id} className="rounded-xl p-4" style={{ backgroundColor: '#243447' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{fine.member_name}</p>
                      <p className="text-gray-500 text-xs">
                        {fineTypeLabels[fine.fine_type] || fine.fine_type}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${status.bg} ${status.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {fine.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`font-bold ${fine.status === 'pending' ? 'text-red-400' : 'text-green-400'}`}>
                      KES {(fine.amount || 0).toLocaleString()}
                    </p>
                    {fine.reason && (
                      <p className="text-gray-500 text-xs truncate max-w-[50%]">{fine.reason}</p>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-xs mt-2">
                    {fine.auto_generated ? '🤖 Auto-generated' : '✍️ Manual'} • {format(new Date(fine.created_date), 'MMM d, yyyy')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}