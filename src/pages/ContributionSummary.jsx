import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContributionSummary() {
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

  const urlParams = new URLSearchParams(window.location.search);
  const chamaId = urlParams.get('chamaId');

  const { data: memberships = [], isLoading: loadingMemberships } = useQuery({
    queryKey: ['memberships', user?.email],
    queryFn: () => base44.entities.ChamaMember.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const targetChamaId = chamaId || memberships[0]?.chama_id;

  const { data: allMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['chama-members', targetChamaId],
    queryFn: () => base44.entities.ChamaMember.filter({ chama_id: targetChamaId }),
    enabled: !!targetChamaId,
  });

  const { data: chama } = useQuery({
    queryKey: ['chama', targetChamaId],
    queryFn: async () => {
      const chamas = await base44.entities.Chama.filter({ id: targetChamaId });
      return chamas[0];
    },
    enabled: !!targetChamaId,
  });

  const totalContributions = allMembers.reduce((sum, m) => sum + (m.total_contributions || 0), 0);
  const expectedContribution = (chama?.contribution_amount || 0) * allMembers.length;

  const isLoading = loadingMemberships || loadingMembers;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a2332' }}>
      {/* Header */}
      <header className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-4">
          <Link 
            to={createPageUrl('Reports')}
            className="p-2 rounded-xl"
            style={{ backgroundColor: '#243447' }}
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
          </Link>
          <h1 className="text-lg font-bold text-white">Contribution Summary</h1>
        </div>
      </header>

      <main className="px-4">
        {/* Summary Header */}
        <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: '#243447' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Total Contributions</h2>
              <p className="text-cyan-400 text-sm">{allMembers.length} Members</p>
            </div>
            <p className="text-white font-bold text-xl">KES {totalContributions.toLocaleString()}</p>
          </div>
        </div>

        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-gray-500 flex-1"></span>
          <span className="text-gray-400 w-24 text-right">Paid</span>
          <span className="text-gray-400 w-24 text-right">Balance</span>
        </div>

        {/* Members List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-14 rounded-xl" style={{ backgroundColor: '#243447' }} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {allMembers.map((member) => {
              const paid = member.total_contributions || 0;
              const expected = chama?.contribution_amount || 0;
              const balance = expected - paid;
              
              return (
                <div 
                  key={member.id} 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: '#243447' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2a3f55' }}>
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-white flex-1 truncate">{member.full_name || 'Member'}</span>
                  <span className="text-white w-24 text-right font-medium">
                    KES {paid.toLocaleString()}
                  </span>
                  <span className={`w-24 text-right font-medium ${balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    KES {balance.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}