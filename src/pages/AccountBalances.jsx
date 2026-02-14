import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountBalances() {
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

    const isLoading = loadingMemberships || loadingChamas;

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#1a2332' }}>
            <header className="px-4 pt-12 pb-4">
                <div className="flex items-center gap-4">
                    <Link to={createPageUrl('Reports')} className="p-2 rounded-xl" style={{ backgroundColor: '#243447' }}>
                        <ArrowLeft className="w-5 h-5 text-cyan-400" />
                    </Link>
                    <h1 className="text-lg font-bold text-white">Account Balances</h1>
                </div>
            </header>

            <main className="px-4">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-20 rounded-xl" style={{ backgroundColor: '#243447' }} />
                        ))}
                    </div>
                ) : chamas.length === 0 ? (
                    <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#243447' }}>
                        <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No groups found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {chamas.map((chama) => (
                            <div key={chama.id} className="rounded-xl p-4" style={{ backgroundColor: '#243447' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="text-white font-medium">{chama.name}</p>
                                        <p className="text-gray-500 text-xs">{chama.description || '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">KES {(chama.total_balance || 0).toLocaleString()}</p>
                                        <p className="text-gray-400 text-xs">Total Balance</p>
                                    </div>
                                </div>
                                <Link to={createPageUrl(`ChamaDetail?id=${chama.id}`)} className="text-cyan-400 text-sm">View details →</Link>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
