import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

async function sha256(text) {
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Security() {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [hasPin, setHasPin] = useState(false);

    useEffect(() => {
        setHasPin(Boolean(localStorage.getItem('chama_pin_hash')));
    }, []);

    const setNewPin = async () => {
        if (!pin || pin.length < 4) return toast.error('PIN must be at least 4 digits');
        if (pin !== confirmPin) return toast.error('PINs do not match');
        const h = await sha256(pin);
        localStorage.setItem('chama_pin_hash', h);
        setHasPin(true);
        setPin(''); setConfirmPin('');
        toast.success(t('save_pin'));
    };

    const clearPin = () => {
        localStorage.removeItem('chama_pin_hash');
        setHasPin(false);
        toast.success(t('remove_pin'));
    };

    return (
        <div className="min-h-screen p-4" style={{ background: '#0b1720' }}>
            <header className="flex items-center gap-3 mb-4">
                <a href="/settings" className="p-2 rounded-xl" style={{ backgroundColor: '#243447' }}>
                    <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </a>
                <h2 className="text-2xl font-bold text-white">Security</h2>
            </header>

            <div className="max-w-xl space-y-4">
                <div>
                    <h3 className="text-white font-semibold">Local PIN</h3>
                    <p className="text-gray-400 text-sm">Set a 4-digit PIN to protect actions in-app (stored locally).</p>
                    <Input placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
                    <Input placeholder="Confirm PIN" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} />
                    <div className="flex gap-2 mt-2">
                        <Button onClick={setNewPin}>Save PIN</Button>
                        {hasPin && <Button variant="ghost" onClick={clearPin}>Remove PIN</Button>}
                    </div>
                </div>

                <div>
                    <h3 className="text-white font-semibold">Biometrics</h3>
                    <p className="text-gray-400 text-sm">Biometric authentication requires a native mobile app (Capacitor/TWA). Use native features when packaging for Android/iOS.</p>
                </div>
            </div>
        </div>
    );
}
