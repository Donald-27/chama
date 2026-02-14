import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Filter, Search, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import BottomNav from '@/components/ui/BottomNav';

export default function Transactions() {
    const [user, setUser] = useState(null);
    // Initialize filterType from URL query param `type` (supports 'deposit' -> 'contribution')
    const urlParams = new URLSearchParams(window.location.search);
    const urlType = urlParams.get('type');
    const mapUrlType = (t) => {
        if (!t) return 'all';
        if (t === 'deposit') return 'contribution';
        return t;
    };
    const [filterType, setFilterType] = useState(mapUrlType(urlType));

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

    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['all-transactions', user?.email],
        queryFn: () => base44.entities.Transaction.filter({ member_email: user?.email }, '-created_date'),
        enabled: !!user?.email,
    });

    const filteredTransactions = filterType === 'all'
        ? transactions
        : transactions.filter(tx => tx.type === filterType);

    const formatType = (type) => {
        return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Group transactions by date
    const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
        const date = format(new Date(tx.transaction_date || tx.created_date), 'yyyy-MM-dd');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(tx);
        return groups;
    }, {});

    const totalInflow = transactions
        .filter(tx => ['contribution', 'loan_repayment'].includes(tx.type) && tx.status === 'completed')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const totalOutflow = transactions
        .filter(tx => ['loan_disbursement', 'withdrawal'].includes(tx.type) && tx.status === 'completed')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: '#1a2332' }}>
            {/* Header */}
            <header className="px-4 pt-12 pb-4">
                <h1 className="text-xl font-bold text-white mb-4">Transactions</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#243447' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/20">
                                <ArrowDownLeft className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="text-sm text-gray-400">Inflow</span>
                        </div>
                        <p className="text-lg font-bold text-green-400">KES {totalInflow.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#243447' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20">
                                <ArrowUpRight className="w-4 h-4 text-red-400" />
                            </div>
                            <span className="text-sm text-gray-400">Outflow</span>
                        </div>
                        <p className="text-lg font-bold text-red-400">KES {totalOutflow.toLocaleString()}</p>
                    </div>
                </div>

                {/* Filter */}
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-12 rounded-xl border-0 text-white" style={{ backgroundColor: '#243447' }}>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <SelectValue placeholder="Filter" />
                        </div>
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                        <SelectItem value="all" className="text-white">All Types</SelectItem>
                        <SelectItem value="contribution" className="text-white">Contributions</SelectItem>
                        <SelectItem value="loan_disbursement" className="text-white">Loans</SelectItem>
                        <SelectItem value="loan_repayment" className="text-white">Repayments</SelectItem>
                        <SelectItem value="withdrawal" className="text-white">Withdrawals</SelectItem>
                    </SelectContent>
                </Select>
            </header>

            {/* Transactions List */}
            <main className="px-4">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className="h-20 rounded-2xl" style={{ backgroundColor: '#243447' }} />
                        ))}
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#243447' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#2a3f55' }}>
                            <Clock className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="font-semibold text-white mb-2">No Transactions</h3>
                        <p className="text-gray-400 text-sm">
                            Your transaction history will appear here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedTransactions).map(([date, txs]) => (
                            <div key={date}>
                                <p className="text-sm font-medium text-gray-500 mb-2 px-1">
                                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                </p>
                                <div className="rounded-2xl divide-y divide-gray-700" style={{ backgroundColor: '#243447' }}>
                                    {txs.map((tx) => {
                                        const isInflow = ['contribution', 'loan_repayment'].includes(tx.type);

                                        return (
                                            <div key={tx.id} className="flex items-center gap-4 p-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isInflow ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                    {isInflow ? (
                                                        <ArrowDownLeft className="w-5 h-5 text-green-400" />
                                                    ) : (
                                                        <ArrowUpRight className="w-5 h-5 text-red-400" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-white text-sm">
                                                        {formatType(tx.type)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {tx.mpesa_reference || 'No reference'}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className={`font-bold ${isInflow ? 'text-green-400' : 'text-red-400'}`}>
                                                        {isInflow ? '+' : '-'}KES {tx.amount?.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {tx.status}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav currentPage="Transactions" />
        </div>
    );
}