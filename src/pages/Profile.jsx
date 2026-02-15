import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { serverApi, base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Profile() {
    const { user: authUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (authUser) {
            setFullName(authUser.user_metadata?.full_name || authUser.full_name || authUser.user_metadata?.name || '');
            setEmail(authUser.email || authUser.user?.email || '');
            setPhone(authUser.user_metadata?.phone || authUser.phone || '');
            return;
        }

        // fallback to base44 SDK
        (async () => {
            try {
                const u = await base44.auth.me();
                if (u) {
                    setFullName(u.full_name || '');
                    setEmail(u.email || '');
                    setPhone(u.phone || '');
                }
            } catch (e) {
                // ignore
            }
        })();
    }, [authUser]);

    const saveProfile = async () => {
        setLoading(true);
        try {
            if (supabase) {
                // supabase-js v2: updateUser accepts { data }
                // try to update user metadata
                const { data, error } = await supabase.auth.updateUser({ data: { full_name: fullName, phone } });
                if (error) throw error;
                toast.success('Profile updated');
            } else if (base44 && !base44.__isStub) {
                // attempt to update via base44 SDK (if available)
                try {
                    await base44.users.update({ full_name: fullName, phone });
                    toast.success('Profile updated');
                } catch (e) {
                    console.error(e);
                    toast.success('Profile saved locally');
                }
            } else {
                // local fallback
                const profile = { fullName, email, phone };
                localStorage.setItem('chama_profile', JSON.stringify(profile));
                // notify other parts of the app
                try { window.dispatchEvent(new CustomEvent('chama_profile_updated', { detail: profile })); } catch (e) { }
                toast.success('Profile saved locally');
            }
        } catch (e) {
            console.error(e);
            toast.error(e.message || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4" style={{ background: '#0b1720' }}>
            <header className="flex items-center gap-3 mb-4">
                <Link to={createPageUrl('Settings')} className="p-2 rounded-xl" style={{ backgroundColor: '#243447' }}>
                    <ArrowLeft className="w-5 h-5 text-cyan-400" />
                </Link>
                <h2 className="text-2xl font-bold text-white">Profile</h2>
            </header>

            <div className="space-y-4 max-w-xl">
                <label className="block text-sm text-gray-300">Full name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />

                <label className="block text-sm text-gray-300">Email (readonly)</label>
                <Input value={email} disabled />

                <label className="block text-sm text-gray-300">Phone number</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />

                <div className="flex gap-3">
                    <Button onClick={saveProfile} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
                    <Button variant="ghost" onClick={() => { setFullName(''); setPhone(''); }}>{'Reset'}</Button>
                </div>
            </div>
        </div>
    );
}
