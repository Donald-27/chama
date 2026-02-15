import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Apple } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';


export default function SignIn() {
    const { signInWithEmail, signInWithOAuth, signInWithPin, hasSupabase } = useAuth();
    // Email/password sign-in removed — OAuth only
    const [loading, setLoading] = useState(false);
    const [pin, setPin] = useState('');
    const [hasLocalPin, setHasLocalPin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setHasLocalPin(Boolean(window.localStorage.getItem('chama_pin_hash')));
        }
    }, []);

    const handleOAuth = async (provider) => {
        if (!hasSupabase) {
            toast.error('Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env and restart the dev server');
            return;
        }

        setLoading(true);
        try {
            const res = await signInWithOAuth(provider);
            if (res && res.error) throw res.error;
            // Most providers redirect — show a friendly message in case it doesn't
            toast.success('Redirecting to provider to complete sign-in...');
        } catch (err) {
            console.error('OAuth sign-in error:', err);
            toast.error(err.message || 'OAuth sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    // Magic link sign-in removed — use password or OAuth

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg,#0f1724,#12263a)' }}>
            <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: '#0b1720' }}>
                <h2 className="text-2xl font-bold text-white mb-2">{t('sign_in_welcome')}</h2>
                <p className="text-gray-400 mb-6">{t('sign_in_sub')}</p>


                <div className="text-center text-gray-400 my-2">{t('sign_in_with')}</div>

                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-black" disabled={loading || !hasSupabase}>
                        <span className="w-4 h-4 inline-flex items-center justify-center font-bold text-sm">G</span> Google
                    </Button>
                    <Button onClick={() => handleOAuth('apple')} className="flex items-center justify-center gap-2 h-12 rounded-xl bg-black text-white" disabled={loading || !hasSupabase}>
                        <Apple className="w-4 h-4" /> Apple
                    </Button>
                </div>
                {hasLocalPin && (
                    <div className="mt-4">
                        <div className="text-gray-400 text-sm mb-2">{t('or_unlock_with_pin')}</div>
                        <div className="flex gap-2">
                            <Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder={t('enter_pin')} />
                            <Button onClick={async () => {
                                if (!pin) return toast.error('Enter your PIN');
                                setLoading(true);
                                try {
                                    const res = await signInWithPin(pin);
                                    if (res?.error) throw res.error;
                                    toast.success(t('signed_in_with_pin'));
                                    navigate('/');
                                } catch (err) {
                                    console.error('PIN sign-in error', err);
                                    toast.error(err?.message || 'Invalid PIN');
                                } finally {
                                    setLoading(false);
                                }
                            }}>Unlock</Button>
                        </div>
                    </div>
                )}
                {/* OAuth-only flow — email/password removed */}
                {!hasSupabase && (
                    <p className="text-amber-400 text-sm mt-3">Authentication is not configured for this build — please set Supabase env vars to enable sign-in.</p>
                )}
            </div>
        </div>
    );
}
