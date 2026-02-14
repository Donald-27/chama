import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function SignUp() {
    const { signUpWithEmail, hasSupabase } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!hasSupabase) {
            toast.error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env and restart the dev server.');
            return;
        }

        setLoading(true);
        try {
            const res = await signUpWithEmail(email, password);
            if (res.error) throw res.error;
            toast.success('Sign-up successful — check your email to verify');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Sign-up failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg,#041127,#0b1e2b)' }}>
            <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: '#071425' }}>
                <h2 className="text-2xl font-bold text-white mb-2">Create an account</h2>
                <p className="text-gray-400 mb-6">Sign up for ChamaManager — free and fast</p>

                <div className="space-y-3 mb-4">
                    <Label className="text-gray-400">Email</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
                </div>

                <div className="space-y-3 mb-4">
                    <Label className="text-gray-400">Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" />
                </div>

                <Button onClick={submit} className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600" disabled={loading || !hasSupabase}>Create account</Button>

                {!hasSupabase && (
                    <p className="text-yellow-300 mt-4 text-sm">Supabase not configured — set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in a local <code>.env</code> and restart the dev server.</p>
                )}

                <p className="text-gray-400 mt-6 text-sm">Already have an account? <Link to="/signin" className="text-cyan-400">Sign in</Link></p>
            </div>
        </div>
    );
}
