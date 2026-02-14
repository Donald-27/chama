import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VerifyEmail() {
    const { resendVerification } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Try to infer email from query string (supabase magic link redirect includes e.g. ?email=)
        const params = new URLSearchParams(window.location.search);
        const e = params.get('email');
        if (e) setEmail(e);
    }, []);

    const resend = async () => {
        setLoading(true);
        try {
            await resendVerification(email);
            toast.success('Verification link sent');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg,#071427,#071a2a)' }}>
            <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: '#071425' }}>
                <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
                <p className="text-gray-400 mb-4">Check your inbox for a verification link. Once verified, you can sign in and use secure features.</p>

                <div className="mb-4">
                    <input placeholder="your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl bg-[#0b2430] text-white" />
                </div>

                <Button onClick={resend} className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600" disabled={loading}>Resend verification</Button>
            </div>
        </div>
    );
}
