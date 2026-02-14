import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    ArrowLeft, Users, MessageCircle, Wallet, Settings,
    ChevronRight, TrendingUp, Clock, Plus, Send, HandCoins,
    Bell, QrCode, Copy, FileText, Gavel
} from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import BottomNav from '@/components/ui/BottomNav';
import DeleteRequestForm from '@/components/DeleteRequestForm';
import DeleteRequestList from '@/components/DeleteRequestList';

export default function ChamaDetail() {
    const [user, setUser] = useState(null);
    const urlParams = new URLSearchParams(window.location.search);
    const chamaId = urlParams.get('id');

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

    const { data: chama, isLoading: loadingChama } = useQuery({
        queryKey: ['chama', chamaId],
        queryFn: async () => {
            const chamas = await base44.entities.Chama.filter({ id: chamaId });
            return chamas[0];
        },
        enabled: !!chamaId,
    });

    const { data: members = [] } = useQuery({
        queryKey: ['chama-members', chamaId],
        queryFn: () => base44.entities.ChamaMember.filter({ chama_id: chamaId }),
        enabled: !!chamaId,
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['chama-transactions', chamaId],
        queryFn: () => base44.entities.Transaction.filter({ chama_id: chamaId }, '-created_date', 20),
        enabled: !!chamaId,
    });

    const { data: messages = [] } = useQuery({
        queryKey: ['chama-messages', chamaId],
        queryFn: () => base44.entities.ChatMessage.filter({ chama_id: chamaId }, '-created_date', 5),
        enabled: !!chamaId,
    });

    const { data: fines = [] } = useQuery({
        queryKey: ['chama-fines', chamaId],
        queryFn: () => base44.entities.Fine.filter({ chama_id: chamaId }),
        enabled: !!chamaId,
    });

    const { data: loans = [] } = useQuery({
        queryKey: ['chama-loans', chamaId],
        queryFn: () => base44.entities.Loan.filter({ chama_id: chamaId }),
        enabled: !!chamaId,
    });

    const currentMember = members.find(m => m.user_email === user?.email);
    const isLeader = ['admin', 'chairperson'].includes(currentMember?.role);
    const activeMembers = members.filter(m => m.status === 'active');

    const { data: settings } = useQuery({
        queryKey: ['chama-settings', chamaId],
        queryFn: async () => {
            try {
                const allSettings = await base44.entities.ChamaSettings.filter({ chama_id: chamaId });
                return allSettings[0] || {};
            } catch (e) {
                return {};
            }
        },
        enabled: !!chamaId,
    });

    const roleColors = {
        admin: 'text-purple-400',
        chairperson: 'text-cyan-400',
        treasurer: 'text-amber-400',
        secretary: 'text-teal-400',
        member: 'text-gray-400',
        observer: 'text-gray-500',
    };

    const copyJoinCode = () => {
        navigator.clipboard.writeText(chama?.join_code || '');
        toast.success('Join code copied!');
    };

    const myFines = fines.filter(f => f.member_email === user?.email && f.status === 'pending');
    const myLoans = loans.filter(l => l.borrower_email === user?.email && ['disbursed', 'repaying'].includes(l.status));

    if (loadingChama) {
        return (
            <div className="min-h-screen p-4 pt-12" style={{ backgroundColor: '#1a2332' }}>
                <Skeleton className="h-64 rounded-2xl mb-4" style={{ backgroundColor: '#243447' }} />
                <Skeleton className="h-40 rounded-2xl" style={{ backgroundColor: '#243447' }} />
            </div>
        );
    }

    if (!chama) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a2332' }}>
                <div className="text-center">
                    <p className="text-gray-400">Chama not found</p>
                    <Link to={createPageUrl('MyGroups')} className="text-cyan-400 mt-2 inline-block">
                        Go back
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: '#1a2332' }}>
            {/* Header */}
            <header className="px-4 pt-12 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <Link
                        to={createPageUrl('MyGroups')}
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: '#243447' }}
                    >
                        <ArrowLeft className="w-5 h-5 text-cyan-400" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <button className="p-2">
                            <Bell className="w-5 h-5 text-gray-400" />
                        </button>
                        {isLeader && (
                            <Link
                                to={createPageUrl(`ChamaSettings?id=${chamaId}`)}
                                className="p-2 rounded-xl"
                                style={{ backgroundColor: '#243447' }}
                            >
                                <Settings className="w-5 h-5 text-cyan-400" />
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {chama.image_url ? (
                        <img src={chama.image_url} alt={chama.name} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2a3f55' }}>
                            <span className="text-cyan-400 font-bold text-2xl">
                                {chama.name?.charAt(0)?.toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white">{chama.name}</h1>
                        <p className="text-cyan-400 text-sm">{activeMembers.length} members</p>
                    </div>
                </div>

                {/* Join Code Display */}
                {isLeader && chama.join_code && (
                    <div className="mt-4 flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#243447' }}>
                        <QrCode className="w-5 h-5 text-cyan-400" />
                        <div className="flex-1">
                            <p className="text-gray-400 text-xs">Join Code</p>
                            <p className="text-white font-mono tracking-wider">{chama.join_code}</p>
                        </div>
                        <Button onClick={copyJoinCode} size="sm" variant="ghost" className="text-cyan-400">
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </header>

            {/* Stats Card */}
            <div className="px-4 mb-4">
                <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xl font-bold text-white">
                                KES {(chama.total_balance || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">Group Balance</p>
                        </div>
                        <div className="border-x" style={{ borderColor: '#2a3f55' }}>
                            <p className="text-xl font-bold text-cyan-400">
                                KES {(currentMember?.total_contributions || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">My Contribution</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white">
                                {activeMembers.length > 0
                                    ? Math.round(((currentMember?.total_contributions || 0) / Math.max(chama.total_balance || 1, 1)) * 100)
                                    : 0}%
                            </p>
                            <p className="text-xs text-gray-400">My Share</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {(myFines.length > 0 || myLoans.length > 0) && (
                <div className="px-4 mb-4 space-y-2">
                    {myFines.length > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/20">
                            <Gavel className="w-5 h-5 text-red-400" />
                            <div className="flex-1">
                                <p className="text-red-400 text-sm font-medium">Pending Fines</p>
                                <p className="text-red-300 text-xs">
                                    KES {myFines.reduce((sum, f) => sum + (f.amount || 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}
                    {myLoans.length > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/20">
                            <HandCoins className="w-5 h-5 text-amber-400" />
                            <div className="flex-1">
                                <p className="text-amber-400 text-sm font-medium">Active Loan</p>
                                <p className="text-amber-300 text-xs">
                                    Outstanding: KES {myLoans.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions */}
            <div className="px-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        to={createPageUrl(`Contribute?chamaId=${chamaId}`)}
                        className="bg-cyan-500 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium hover:bg-cyan-600 transition-colors"
                    >
                        <Wallet className="w-5 h-5" />
                        Contribute
                    </Link>
                    <Link
                        to={createPageUrl(`LoanRequest?chamaId=${chamaId}`)}
                        className="rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium text-white transition-colors"
                        style={{ backgroundColor: '#243447' }}
                    >
                        <HandCoins className="w-5 h-5" />
                        Request Loan
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4">
                <Tabs defaultValue="members" className="w-full">
                    <TabsList className="w-full rounded-xl p-1 mb-4 grid grid-cols-4" style={{ backgroundColor: '#243447' }}>
                        <TabsTrigger value="members" className="text-xs rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            Members
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="text-xs rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            Chat
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="text-xs rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            Activity
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="text-xs rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            Reports
                        </TabsTrigger>
                    </TabsList>

                    {/* Members Tab */}
                    <TabsContent value="members" className="mt-0">
                        <div className="rounded-2xl divide-y" style={{ backgroundColor: '#243447', borderColor: '#2a3f55' }}>
                            {activeMembers.map((member) => (
                                <div key={member.id} className="flex items-center gap-4 p-4" style={{ borderColor: '#2a3f55' }}>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2a3f55' }}>
                                        <span className="text-cyan-400 font-semibold">
                                            {member.full_name?.charAt(0)?.toUpperCase() || 'M'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-white truncate">{member.full_name || 'Member'}</p>
                                            {member.user_email === user?.email && (
                                                <span className="text-xs text-cyan-400">(You)</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            KES {(member.total_contributions || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-medium ${roleColors[member.role]}`}>
                                        {member.role?.charAt(0).toUpperCase() + member.role?.slice(1)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {isLeader && (
                            <Link
                                to={createPageUrl(`InviteMembers?chamaId=${chamaId}`)}
                                className="flex items-center justify-center gap-2 mt-4 p-4 border-2 border-dashed rounded-2xl text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                                style={{ borderColor: '#2a3f55' }}
                            >
                                <Plus className="w-5 h-5" />
                                Invite Members
                            </Link>
                        )}
                    </TabsContent>

                    {/* Chat Tab */}
                    <TabsContent value="chat" className="mt-0">
                        <div className="rounded-2xl min-h-[250px] flex flex-col" style={{ backgroundColor: '#243447' }}>
                            <div className="flex-1 p-4 space-y-3">
                                {messages.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No messages yet</p>
                                    </div>
                                ) : (
                                    messages.slice().reverse().map((msg) => {
                                        const isMe = msg.sender_email === user?.email;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-cyan-500 text-white' : 'text-white'
                                                    }`} style={!isMe ? { backgroundColor: '#2a3f55' } : {}}>
                                                    {!isMe && (
                                                        <p className="text-xs font-medium mb-1 text-cyan-400">{msg.sender_name}</p>
                                                    )}
                                                    {msg.attachment_url && (
                                                        <img src={msg.attachment_url} alt="" className="rounded-lg max-w-full mb-2" />
                                                    )}
                                                    <p className="text-sm">{msg.message}</p>
                                                    <p className={`text-xs mt-1 ${isMe ? 'text-cyan-100' : 'text-gray-500'}`}>
                                                        {format(new Date(msg.created_date), 'h:mm a')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <Link
                                to={createPageUrl(`Chat?chamaId=${chamaId}`)}
                                className="p-4 border-t flex items-center justify-center gap-2 text-cyan-400 font-medium hover:bg-cyan-500/10 transition-colors"
                                style={{ borderColor: '#2a3f55' }}
                            >
                                <Send className="w-4 h-4" />
                                Open Chat
                            </Link>
                        </div>
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="mt-0">
                        <div className="rounded-2xl divide-y" style={{ backgroundColor: '#243447', borderColor: '#2a3f55' }}>
                            {transactions.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No recent activity</p>
                                </div>
                            ) : (
                                transactions.slice(0, 10).map((tx) => (
                                    <div key={tx.id} className="flex items-center gap-4 p-4" style={{ borderColor: '#2a3f55' }}>
                                        <div className={`p-2.5 rounded-xl ${['contribution', 'loan_repayment'].includes(tx.type)
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {['contribution', 'loan_repayment'].includes(tx.type)
                                                ? <TrendingUp className="w-5 h-5" />
                                                : <Wallet className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white text-sm truncate">
                                                {tx.member_name || 'Member'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {tx.type?.replace(/_/g, ' ')} • {format(new Date(tx.created_date), 'MMM d')}
                                            </p>
                                        </div>
                                        <p className={`font-semibold text-sm ${['contribution', 'loan_repayment'].includes(tx.type)
                                                ? 'text-green-400'
                                                : 'text-red-400'
                                            }`}>
                                            KES {tx.amount?.toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Reports Tab */}
                    <TabsContent value="reports" className="mt-0 space-y-3">
                        <Link
                            to={createPageUrl(`ContributionSummary?chamaId=${chamaId}`)}
                            className="flex items-center gap-4 p-4 rounded-xl"
                            style={{ backgroundColor: '#243447' }}
                        >
                            <div className="p-2 rounded-xl bg-cyan-500/20">
                                <FileText className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium">Contribution Summary</p>
                                <p className="text-gray-400 text-xs">View all member contributions</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </Link>

                        <Link
                            to={createPageUrl(`LoanSummary?chamaId=${chamaId}`)}
                            className="flex items-center gap-4 p-4 rounded-xl"
                            style={{ backgroundColor: '#243447' }}
                        >
                            <div className="p-2 rounded-xl bg-amber-500/20">
                                <HandCoins className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium">Loan Summary</p>
                                <p className="text-gray-400 text-xs">View all loans and status</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </Link>

                        <Link
                            to={createPageUrl(`FineSummary?chamaId=${chamaId}`)}
                            className="flex items-center gap-4 p-4 rounded-xl"
                            style={{ backgroundColor: '#243447' }}
                        >
                            <div className="p-2 rounded-xl bg-red-500/20">
                                <Gavel className="w-5 h-5 text-red-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium">Fine Summary</p>
                                <p className="text-gray-400 text-xs">View all fines and penalties</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </Link>

                        {/* Delete Requests */}
                        <div className="rounded-2xl p-4" style={{ backgroundColor: '#243447' }}>
                            <h3 className="text-white font-medium mb-3">Archive Requests</h3>
                            {/* Only show form when allowed by settings */}
                            {settings && (settings.allow_delete_requests ?? true) && (
                                <DeleteRequestForm chamaId={chamaId} currentUserEmail={user?.email} onCreated={() => { toast.success('Request created'); }} />
                            )}

                            <div className="mt-4">
                                <DeleteRequestList chamaId={chamaId} currentUserEmail={user?.email} groupSettings={{
                                    delete_approval_threshold_percent: settings?.delete_approval_threshold_percent || 66,
                                    delete_approval_required: settings?.delete_approval_required,
                                    members_count: activeMembers.length,
                                    reveal_votes: settings?.reveal_votes ?? false,
                                }} />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <BottomNav currentPage="MyGroups" />
        </div>
    );
}