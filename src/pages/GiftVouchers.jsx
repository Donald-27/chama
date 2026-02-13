import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle2, Loader2 } from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp';

const AMOUNTS = [50, 75, 100, 150, 200, 250];

export default function GiftVouchers() {
    const [selectedAmount, setSelectedAmount] = useState(100);
    const [customAmount, setCustomAmount] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [form, setForm] = useState({
        purchaser_name: '',
        purchaser_email: '',
        recipient_name: '',
        recipient_email: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const createVoucher = useMutation({
        mutationFn: (data) => base44.entities.GiftVoucher.create(data),
        onSuccess: (data, variables) => {
            setSubmitted(true);
            try {
                const phone = '61468231108';
                const messageLines = [
                    `Gift Voucher Purchase`,
                    `Amount: ${variables.amount}`,
                    `Purchaser: ${variables.purchaser_name}`,
                    `Recipient: ${variables.recipient_name}`,
                    `Voucher Code: ${variables.code}`,
                    `Message: ${variables.message || ''}`,
                ];
                openWhatsApp(phone, messageLines.join('\n'));
            } catch (e) {
                // ignore
            }
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const amount = useCustom ? parseFloat(customAmount) : selectedAmount;
        const code = 'TSE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        createVoucher.mutate({ ...form, amount, code });
    };

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div>
            {/* Hero */}
            <section className="relative py-20 md:py-28 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1800&q=80"
                        alt="Gift"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>
                <div className="relative z-10 text-center text-white px-6">
                    <p className="text-[11px] tracking-[0.3em] uppercase text-white/60 mb-4">
                        The Perfect Gift
                    </p>
                    <h1 className="font-serif text-5xl md:text-6xl">Gift Vouchers</h1>
                </div>
            </section>

            <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
                {submitted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                        <h2 className="font-serif text-3xl text-neutral-900 mb-3">Voucher Created!</h2>
                        <p className="text-neutral-500 max-w-md mx-auto">
                            We'll send the gift voucher details to your email shortly.
                        </p>
                        <Button
                            onClick={() => { setSubmitted(false); setForm({ purchaser_name: '', purchaser_email: '', recipient_name: '', recipient_email: '', message: '' }); }}
                            variant="outline"
                            className="mt-8"
                        >
                            Purchase Another
                        </Button>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Amount */}
                        <div>
                            <h2 className="font-serif text-2xl text-neutral-900 mb-6">Select Amount</h2>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                                {AMOUNTS.map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => { setSelectedAmount(amt); setUseCustom(false); }}
                                        className={`py-4 text-center transition-all ${!useCustom && selectedAmount === amt
                                                ? 'bg-neutral-900 text-white'
                                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                            }`}
                                    >
                                        ${amt}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setUseCustom(true)}
                                    className={`px-4 py-2 text-sm transition-all ${useCustom ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
                                        }`}
                                >
                                    Custom
                                </button>
                                {useCustom && (
                                    <Input
                                        type="number"
                                        min="10"
                                        placeholder="Enter amount"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        className="w-40 border-neutral-200"
                                        required
                                    />
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div>
                            <h2 className="font-serif text-2xl text-neutral-900 mb-6">Your Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Your Name *</Label>
                                    <Input
                                        value={form.purchaser_name}
                                        onChange={(e) => updateField('purchaser_name', e.target.value)}
                                        required
                                        className="border-neutral-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Your Email *</Label>
                                    <Input
                                        type="email"
                                        value={form.purchaser_email}
                                        onChange={(e) => updateField('purchaser_email', e.target.value)}
                                        required
                                        className="border-neutral-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Recipient */}
                        <div>
                            <h2 className="font-serif text-2xl text-neutral-900 mb-6">Recipient Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Recipient Name</Label>
                                    <Input
                                        value={form.recipient_name}
                                        onChange={(e) => updateField('recipient_name', e.target.value)}
                                        className="border-neutral-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Recipient Email</Label>
                                    <Input
                                        type="email"
                                        value={form.recipient_email}
                                        onChange={(e) => updateField('recipient_email', e.target.value)}
                                        className="border-neutral-200"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 space-y-2">
                                <Label className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Personal Message</Label>
                                <Textarea
                                    value={form.message}
                                    onChange={(e) => updateField('message', e.target.value)}
                                    rows={3}
                                    placeholder="Add a personal message..."
                                    className="border-neutral-200"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={createVoucher.isPending}
                            className="bg-neutral-900 text-white px-12 py-6 text-[11px] tracking-[0.25em] uppercase font-medium hover:bg-neutral-800 transition-all w-full sm:w-auto"
                        >
                            {createVoucher.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Gift className="w-4 h-4 mr-2" />
                            )}
                            Purchase Gift Voucher — ${useCustom ? customAmount || '0' : selectedAmount}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}