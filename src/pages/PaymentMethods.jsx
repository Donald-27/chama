import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function PaymentMethods() {
    const [methods, setMethods] = useState([]);
    const [cardNumber, setCardNumber] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [mobileType, setMobileType] = useState('mpesa');

    useEffect(() => {
        try {
            const raw = localStorage.getItem('chama_payment_methods');
            setMethods(raw ? JSON.parse(raw) : []);
        } catch (e) {
            setMethods([]);
        }
    }, []);

    const persist = (list) => {
        setMethods(list);
        localStorage.setItem('chama_payment_methods', JSON.stringify(list));
    };

    const addCard = () => {
        if (!cardNumber || cardNumber.length < 4) return toast.error('Enter a valid card number');
        const last4 = cardNumber.slice(-4);
        const newMethods = [...methods, { id: Date.now(), type: 'card', last4 }];
        persist(newMethods);
        setCardNumber('');
        toast.success('Card added');
    };

    const addMobile = () => {
        if (!mobileNumber) return toast.error('Enter a mobile number');
        const newMethods = [...methods, { id: Date.now(), type: mobileType, phone: mobileNumber }];
        persist(newMethods);
        setMobileNumber('');
        toast.success(`${mobileType.toUpperCase()} number added`);
    };

    const removeMethod = (id) => {
        const newMethods = methods.filter(m => m.id !== id);
        persist(newMethods);
        toast.success('Removed');
    };

    return (
        <div className="min-h-screen p-4" style={{ background: '#0b1720' }}>
            <header className="flex items-center gap-3 mb-4">
                <Link to={createPageUrl('Settings')} className="p-2 rounded-xl" style={{ backgroundColor: '#243447' }}>
                    <ArrowLeft className="w-5 h-5 text-cyan-400" />
                </Link>
                <h2 className="text-2xl font-bold text-white">Payment methods</h2>
            </header>

            <div className="space-y-4 max-w-xl">
                <div>
                    <label className="text-gray-300 text-sm">Add card</label>
                    <div className="flex gap-2 mt-2">
                        <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card number" />
                        <Button onClick={addCard}>Add</Button>
                    </div>
                </div>

                <div>
                    <label className="text-gray-300 text-sm">Add mobile money / bank</label>
                    <div className="flex gap-2 mt-2 items-center">
                        <select value={mobileType} onChange={(e) => setMobileType(e.target.value)} className="p-2 rounded bg-[#243447] text-white">
                            <option value="mpesa">M-PESA</option>
                            <option value="airtel">Airtel Money</option>
                            <option value="bank">Bank Account</option>
                        </select>
                        <Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder={mobileType === 'bank' ? 'Account number' : 'Phone number'} />
                        <Button onClick={addMobile}>Add</Button>
                    </div>
                </div>

                <div>
                    <h3 className="text-white font-semibold">Saved methods</h3>
                    <div className="mt-2 space-y-2">
                        {methods.length === 0 && <p className="text-gray-400">No payment methods added</p>}
                        {methods.map(m => (
                            <div key={m.id} className="flex items-center justify-between bg-[#243447] p-3 rounded">
                                <div className="text-white">{m.type === 'card' ? `Card •••• ${m.last4}` : `${m.type.toUpperCase()} • ${m.phone || ''}`}</div>
                                <Button variant="ghost" onClick={() => removeMethod(m.id)}>Remove</Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
