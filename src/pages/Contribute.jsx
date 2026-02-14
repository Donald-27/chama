import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Wallet, Smartphone, CreditCard, Check, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

export default function Contribute() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedChamaId = urlParams.get('chamaId');

    const [user, setUser] = useState(null);
    const [selectedChama, setSelectedChama] = useState(preselectedChamaId || '');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('mpesa');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [step, setStep] = useState(1);

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

    const selectedChamaData = chamas.find(c => c.id === selectedChama);
    const membership = memberships.find(m => m.chama_id === selectedChama);

    const contributeMutation = useMutation({
        mutationFn: async () => {
            const contributionAmount = parseFloat(amount);

            await base44.entities.Transaction.create({
                chama_id: selectedChama,
                member_email: user.email,
                member_name: user.full_name,
                type: 'contribution',
                amount: contributionAmount,
                status: 'completed',
                payment_method: paymentMethod,
                mpesa_reference: `MP${Date.now()}`,
                description: `Contribution to ${selectedChamaData?.name}`,
                transaction_date: new Date().toISOString(),
            });

            if (membership) {
                await base44.entities.ChamaMember.update(membership.id, {
                    total_contributions: (membership.total_contributions || 0) + contributionAmount,
                });
            }

            if (selectedChamaData) {
                await base44.entities.Chama.update(selectedChama, {
                    total_balance: (selectedChamaData.total_balance || 0) + contributionAmount,
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['memberships']);
            queryClient.invalidateQueries(['transactions']);
            setStep(3);
        },
    });

    const quickAmounts = [1000, 2000, 5000, 10000];

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#1a2332' }}>
            {/* Header */}
            <header className="px-4 pt-12 pb-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        to={createPageUrl('Home')}
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: '#243447' }}
                    >
                        <ArrowLeft className="w-5 h-5 text-cyan-400" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">Contribute</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: '#243447' }}>
                        <Wallet className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Make a contribution</p>
                        <p className="text-lg font-semibold text-white">Secure & Instant</p>
                    </div>
                </div>
            </header>

            <main className="px-4 py-4">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-gray-400">Select Group</Label>
                            <Select value={selectedChama} onValueChange={setSelectedChama}>
                                <SelectTrigger className="h-14 rounded-xl border-0 text-white" style={{ backgroundColor: '#243447' }}>
                                    <SelectValue placeholder="Choose a chama" />
                                </SelectTrigger>
                                <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                                    {chamas.map((chama) => (
                                        <SelectItem key={chama.id} value={chama.id} className="text-white">
                                            {chama.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedChama && selectedChamaData && (
                            <div className="rounded-2xl p-4" style={{ backgroundColor: '#243447' }}>
                                <p className="text-sm text-gray-400 mb-1">Suggested contribution</p>
                                <p className="text-2xl font-bold text-cyan-400">
                                    KES {(selectedChamaData.contribution_amount || 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500 capitalize">
                                    {selectedChamaData.contribution_frequency} contribution
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label className="text-gray-400">Amount (KES)</Label>
                            <Input
                                type="number"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-14 rounded-xl border-0 text-xl font-semibold text-center text-white"
                                style={{ backgroundColor: '#243447' }}
                            />

                            <div className="flex gap-2">
                                {quickAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setAmount(amt.toString())}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${amount === amt.toString()
                                            ? 'bg-cyan-500 text-white'
                                            : 'text-gray-300'
                                            }`}
                                        style={amount !== amt.toString() ? { backgroundColor: '#243447' } : {}}
                                    >
                                        {amt.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={() => setStep(2)}
                            disabled={!selectedChama || !amount || parseFloat(amount) <= 0}
                            className="w-full h-14 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-lg font-semibold"
                        >
                            Continue
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <p className="text-sm text-gray-400 mb-1">You're contributing to</p>
                            <h3 className="font-semibold text-white mb-4">{selectedChamaData?.name}</h3>

                            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#2a3f55' }}>
                                <span className="text-gray-400">Amount</span>
                                <span className="text-2xl font-bold text-cyan-400">
                                    KES {parseFloat(amount).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-gray-400">Payment Method</Label>

                            <button
                                onClick={() => setPaymentMethod('mpesa')}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors`}
                                style={{
                                    backgroundColor: '#243447',
                                    borderColor: paymentMethod === 'mpesa' ? '#06b6d4' : '#2a3f55'
                                }}
                            >
                                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                    <Smartphone className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-white">M-Pesa</p>
                                    <p className="text-sm text-gray-400">Pay via Lipa na M-Pesa</p>
                                </div>
                                {paymentMethod === 'mpesa' && (
                                    <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </button>
                        </div>

                        {paymentMethod === 'mpesa' && (
                            <div className="space-y-2">
                                <Label className="text-gray-400">M-Pesa Phone Number</Label>
                                <Input
                                    type="tel"
                                    placeholder="e.g., 0712345678"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="h-14 rounded-xl border-0 text-white"
                                    style={{ backgroundColor: '#243447' }}
                                />
                            </div>
                        )}

                        {/* Manual Payment Option */}
                        <Link
                            to={createPageUrl(`ManualPayment?chamaId=${selectedChama}`)}
                            className="flex items-center gap-3 p-4 rounded-xl"
                            style={{ backgroundColor: '#2a3f55' }}
                        >
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                            <div className="flex-1">
                                <p className="text-white text-sm font-medium">Having issues?</p>
                                <p className="text-gray-400 text-xs">Submit payment manually for approval</p>
                            </div>
                        </Link>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="flex-1 h-14 rounded-xl border-gray-600 text-white hover:bg-gray-700"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={() => contributeMutation.mutate()}
                                disabled={contributeMutation.isPending || (paymentMethod === 'mpesa' && !phoneNumber)}
                                className="flex-1 h-14 rounded-xl bg-cyan-500 hover:bg-cyan-600"
                            >
                                {contributeMutation.isPending ? 'Processing...' : 'Pay Now'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-green-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                        <p className="text-gray-400 mb-8">
                            Your contribution of KES {parseFloat(amount).toLocaleString()} has been received.
                        </p>

                        <div className="rounded-2xl p-5 mb-8 text-left" style={{ backgroundColor: '#243447' }}>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400">Group</span>
                                <span className="font-medium text-white">{selectedChamaData?.name}</span>
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400">Amount</span>
                                <span className="font-semibold text-cyan-400">
                                    KES {parseFloat(amount).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Reference</span>
                                <span className="font-mono text-sm text-white">MP{Date.now().toString().slice(-8)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                to={createPageUrl('Home')}
                                className="flex-1 h-12 rounded-xl flex items-center justify-center font-medium text-white"
                                style={{ backgroundColor: '#243447' }}
                            >
                                Go Home
                            </Link>
                            <Link
                                to={createPageUrl(`ChamaDetail?id=${selectedChama}`)}
                                className="flex-1 h-12 rounded-xl bg-cyan-500 flex items-center justify-center font-medium text-white hover:bg-cyan-600"
                            >
                                View Group
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}