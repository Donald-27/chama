import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    FileText,
    Receipt,
    CreditCard,
    Wallet,
    Settings,
    Bell,
    Plus,
    DollarSign,
    Users,
    PiggyBank,
    Scale
} from 'lucide-react';
import BottomNav from '@/components/ui/BottomNav';

export default function Reports() {
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

    const { data: memberships = [] } = useQuery({
        queryKey: ['memberships', user?.email],
        queryFn: () => base44.entities.ChamaMember.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });

    const chamaIds = memberships.map(m => m.chama_id);

    const { data: chamas = [] } = useQuery({
        queryKey: ['chamas', chamaIds],
        queryFn: async () => {
            if (chamaIds.length === 0) return [];
            const allChamas = await base44.entities.Chama.list();
            return allChamas.filter(c => chamaIds.includes(c.id));
        },
        enabled: chamaIds.length > 0,
    });

    const activeChama = chamas[0];
    const activeMembership = memberships[0];

    const yourReports = [
        { name: 'CONTRIBUTION', subtitle: 'STATEMENT', icon: '📊', active: true, page: 'ContributionSummary' },
        { name: 'FINE', subtitle: 'STATEMENT', icon: '📋', page: 'FineSummary' },
        { name: 'LOAN', subtitle: 'SUMMARY', icon: '📄', page: 'LoanSummary' },
    ];

    // Reuse Transactions page with a `type` query param for deposits/withdrawals
    const transactionReports = [
        { name: 'DEPOSIT', subtitle: 'RECEIPTS', icon: '💵', page: 'Transactions?type=deposit' },
        { name: 'WITHDRAWAL', subtitle: 'RECEIPTS', icon: '🧾', page: 'Transactions?type=withdrawal' },
    ];

    const groupReports = [
        { name: 'ACCOUNT', subtitle: 'BALANCES', icon: '💳', page: 'AccountBalances' },
        { name: 'CONTRIBUTION', subtitle: 'SUMMARY', icon: '💰', page: 'ContributionSummary' },
        { name: 'FINE', subtitle: 'SUMMARY', icon: '📝', page: 'FineSummary' },
    ];

    const ReportCard = ({ report, active = false }) => (
        <Link
            to={createPageUrl(report.page || 'Reports')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${active ? 'bg-cyan-500' : ''
                }`}
            style={!active ? { backgroundColor: '#2a3f55' } : {}}
        >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${active ? 'bg-white/20' : ''
                }`} style={!active ? { backgroundColor: '#3d5a73' } : {}}>
                <span className="text-2xl">{report.icon}</span>
            </div>
            <p className={`text-xs font-bold ${active ? 'text-white' : 'text-cyan-400'}`}>{report.name}</p>
            <p className={`text-xs ${active ? 'text-cyan-100' : 'text-gray-500'}`}>{report.subtitle}</p>
        </Link>
    );

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: '#1a2332' }}>
            {/* Header */}
            <header className="px-4 pt-12 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-full" style={{ backgroundColor: '#2a3f55' }}>
                            <span className="text-white font-semibold text-sm">
                                {activeChama?.name || 'CHAMAPRO'}
                            </span>
                        </div>
                        <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4a5568' }}>
                            <Plus className="w-4 h-4 text-white" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2">
                            <Bell className="w-5 h-5 text-gray-400" />
                        </button>
                        <button className="p-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>
                <p className="text-cyan-400 text-xs mt-2 text-center">
                    {activeMembership?.role ? `Group ${activeMembership.role.charAt(0).toUpperCase() + activeMembership.role.slice(1)} | Member` : 'Member'}
                </p>
            </header>

            <main className="px-4 space-y-6">
                {/* Your Reports */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium">Your Reports</h3>
                        <button className="text-gray-500">•••</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {yourReports.map((report, i) => (
                            <ReportCard key={report.name + i} report={report} active={report.active} />
                        ))}
                    </div>
                </div>

                {/* Transaction Reports */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium">Transaction Reports</h3>
                        <button className="text-gray-500">•••</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {transactionReports.map((report, i) => (
                            <ReportCard key={report.name + i} report={report} />
                        ))}
                    </div>
                </div>

                {/* Group Reports */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium">Group Reports</h3>
                        <button className="text-gray-500">•••</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {groupReports.map((report, i) => (
                            <ReportCard key={report.name + i} report={report} />
                        ))}
                    </div>
                </div>
            </main>

            <BottomNav currentPage="Reports" />
        </div>
    );
}