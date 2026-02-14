import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Apple } from 'lucide-react';


export default function SignIn() {
    const { signInWithEmail, signInWithOAuth, hasSupabase } = useAuth();
    // Email/password sign-in removed — OAuth only
    const [loading, setLoading] = useState(false);

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
                <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                <p className="text-gray-400 mb-6">Sign in to continue to ChamaManager</p>


                <div className="text-center text-gray-400 my-2">Sign in with</div>

                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-black" disabled={loading || !hasSupabase}>
                        <span className="w-4 h-4 inline-flex items-center justify-center font-bold text-sm">G</span> Google
                    </Button>
                    <Button onClick={() => handleOAuth('apple')} className="flex items-center justify-center gap-2 h-12 rounded-xl bg-black text-white" disabled={loading || !hasSupabase}>
                        <Apple className="w-4 h-4" /> Apple
                    </Button>
                </div>
                {/* OAuth-only flow — email/password removed */}
                {!hasSupabase && (
                    <p className="text-amber-400 text-sm mt-3">Authentication is not configured for this build — please set Supabase env vars to enable sign-in.</p>
                )}
            </div>
        </div>
    );
}
