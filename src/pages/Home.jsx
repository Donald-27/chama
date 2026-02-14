import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bell, Settings, Plus, ChevronRight, BarChart3, Clock } from 'lucide-react';
import BottomNav from '@/components/ui/BottomNav';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function Home() {
  const [user, setUser] = useState(null);

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

  const { data: memberships = [], isLoading: loadingMemberships } = useQuery({
    queryKey: ['memberships', user?.email],
    queryFn: () => base44.entities.ChamaMember.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const chamaIds = memberships.map(m => m.chama_id);

  const { data: chamas = [], isLoading: loadingChamas } = useQuery({
    queryKey: ['chamas', chamaIds],
    queryFn: async () => {
      if (chamaIds.length === 0) return [];
      const allChamas = await base44.entities.Chama.list();
      return allChamas.filter(c => chamaIds.includes(c.id));
    },
    enabled: chamaIds.length > 0,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', user?.email],
    queryFn: () => base44.entities.Transaction.filter({ member_email: user?.email }, '-created_date', 10),
    enabled: !!user?.email,
  });

  const { data: fines = [] } = useQuery({
    queryKey: ['user-fines', user?.email],
    queryFn: () => base44.entities.Fine.filter({ member_email: user?.email, status: 'pending' }),
    enabled: !!user?.email,
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['user-loans', user?.email],
    queryFn: () => base44.entities.Loan.filter({ borrower_email: user?.email }),
    enabled: !!user?.email,
  });

  const totalContributions = memberships.reduce((sum, m) => sum + (m.total_contributions || 0), 0);
  const totalFines = fines.reduce((sum, f) => sum + (f.amount || 0), 0);
  const activeLoans = loans.filter(l => ['disbursed', 'repaying'].includes(l.status));
  const totalLoanBalance = activeLoans.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0);
  
  const activeChama = chamas[0];
  const activeMembership = memberships[0];

  const isLoading = loadingMemberships || loadingChamas;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#1a2332' }}>
      {/* Header */}
      <header className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to={chamas.length > 0 ? createPageUrl(`ChamaDetail?id=${activeChama?.id}`) : createPageUrl('MyGroups')}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: '#2a3f55' }}
            >
              <span className="text-white font-semibold text-sm">
                {activeChama?.name || 'CHAMAPRO'}
              </span>
            </Link>
            <Link 
              to={createPageUrl('CreateChama')}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#4a5568' }}
            >
              <Plus className="w-4 h-4 text-white" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 relative">
              <Bell className="w-5 h-5 text-gray-400" />
              {(fines.length > 0 || loans.filter(l => l.status === 'pending').length > 0) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <Link to={createPageUrl('Settings')} className="p-2">
              <Settings className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>
        <p className="text-cyan-400 text-xs mt-2 text-center">
          {activeMembership?.role 
            ? `Group ${activeMembership.role.charAt(0).toUpperCase() + activeMembership.role.slice(1)} | Member` 
            : 'Welcome to ChamaPro'}
        </p>
      </header>

      <main className="px-4 space-y-6">
        {/* Total Balances Card */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
          <h3 className="text-gray-300 font-medium mb-4">Total Balances</h3>
          
          <div className="space-y-3">
            <Link 
              to={createPageUrl('Reports')}
              className="flex items-center justify-between"
            >
              <span className="text-gray-400 text-sm">Your Contribution Balance</span>
              <div className="flex items-center gap-1">
                <span className="text-white font-semibold">
                  KES {totalContributions.toLocaleString()}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </Link>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Fines</span>
              <div className="flex items-center gap-1">
                <span className={`font-semibold ${totalFines > 0 ? 'text-red-400' : 'text-white'}`}>
                  KES {totalFines.toLocaleString()}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Loans</span>
              <div className="flex items-center gap-1">
                <span className={`font-semibold ${totalLoanBalance > 0 ? 'text-amber-400' : 'text-white'}`}>
                  KES {totalLoanBalance.toLocaleString()}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Active Groups</span>
              <div className="flex items-center gap-1">
                <span className="text-white font-semibold">{chamas.length}</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Summary */}
        {chamas.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium">Contribution Summary</h3>
              <button className="text-gray-500">•••</button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {chamas.map((chama, idx) => {
                const membership = memberships.find(m => m.chama_id === chama.id);
                const contributed = membership?.total_contributions || 0;
                const expected = chama.contribution_amount || 0;
                const balance = expected - contributed;
                
                return (
                  <Link
                    key={chama.id}
                    to={createPageUrl(`ChamaDetail?id=${chama.id}`)}
                    className={`flex-shrink-0 w-40 rounded-2xl p-4 ${idx === 0 ? 'bg-cyan-500' : ''}`}
                    style={idx !== 0 ? { backgroundColor: '#2a3f55' } : {}}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className={`w-5 h-5 ${idx === 0 ? 'text-white' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium truncate ${idx === 0 ? 'text-white' : 'text-gray-300'}`}>
                        {chama.name?.split(' ')[0]}
                      </span>
                    </div>
                    <p className={`text-xl font-bold ${idx === 0 ? 'text-white' : 'text-white'}`}>
                      KES {contributed.toLocaleString()}
                    </p>
                    <p className={`text-xs mt-1 ${idx === 0 ? 'text-cyan-100' : 'text-gray-500'}`}>Amount Due</p>
                    <p className={`text-sm font-semibold ${balance > 0 ? (idx === 0 ? 'text-red-200' : 'text-red-400') : (idx === 0 ? 'text-white' : 'text-green-400')}`}>
                      KES {balance.toLocaleString()}
                    </p>
                    <p className={`text-xs mt-2 ${idx === 0 ? 'text-cyan-100' : 'text-gray-500'}`}>
                      {format(new Date(), 'EEE, do MMM yyyy')}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Pay Now Button */}
        <Link
          to={createPageUrl('Contribute')}
          className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-cyan-400 text-cyan-400 font-semibold hover:bg-cyan-400/10 transition-colors"
        >
          PAY NOW
          <ChevronRight className="w-5 h-5" />
        </Link>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">Recent Transactions</h3>
            <Link to={createPageUrl('Transactions')} className="text-gray-500 text-sm">See all</Link>
          </div>
          
          {isLoading ? (
            <div className="flex gap-3 overflow-x-auto">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="flex-shrink-0 w-40 h-32 rounded-2xl" style={{ backgroundColor: '#2a3f55' }} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#2a3f55' }}>
              <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No transactions yet</p>
              <p className="text-gray-500 text-sm">Make your first contribution</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex-shrink-0 w-40 rounded-2xl p-4" style={{ backgroundColor: '#2a3f55' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1a2332' }}>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-xs truncate">
                        {tx.type === 'contribution' ? 'Contribution' : tx.type?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-cyan-400 text-xs">payment</p>
                    </div>
                  </div>
                  <p className="text-white font-bold">KES {tx.amount?.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {tx.payment_method === 'mpesa' ? 'M-Pesa' : tx.payment_method}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {format(new Date(tx.transaction_date || tx.created_date), 'do MMM, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions for empty state */}
        {chamas.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#243447' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#2a3f55' }}>
              <Plus className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Get Started</h3>
            <p className="text-gray-400 text-sm mb-4">Create or join a chama to start saving together</p>
            <div className="flex gap-3">
              <Link 
                to={createPageUrl('CreateChama')}
                className="flex-1 py-3 bg-cyan-500 text-white rounded-xl font-medium"
              >
                Create Group
              </Link>
              <Link 
                to={createPageUrl('MyGroups')}
                className="flex-1 py-3 rounded-xl font-medium text-white"
                style={{ backgroundColor: '#2a3f55' }}
              >
                Join Group
              </Link>
            </div>
          </div>
        )}
      </main>

      <BottomNav currentPage="Home" />
    </div>
  );
}