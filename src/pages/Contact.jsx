import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { t } from '@/lib/i18n';

export default function Contact() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const submit = async () => {
        if (!name || !email || !message) return toast.error('Please fill all fields');
        // No backend configured — fallback to mailto
        try {
            const subject = encodeURIComponent('ChamaPro Support: ' + name);
            const body = encodeURIComponent(`${message}\n\nFrom: ${name} <${email}>`);
            window.location.href = `mailto:support@chama.example?subject=${subject}&body=${body}`;
        } catch (e) {
            toast.success('Message prepared — please send via your email client');
        }
    };

    return (
        <div className="min-h-screen p-4" style={{ background: '#0b1720' }}>
            <header className="flex items-center gap-3 mb-4">
                <Link to={createPageUrl('Settings')} className="p-2 rounded-xl" style={{ backgroundColor: '#243447' }}>
                    <ArrowLeft className="w-5 h-5 text-cyan-400" />
                </Link>
                <h2 className="text-2xl font-bold text-white">{t('contact_us')}</h2>
            </header>

            <div className="max-w-xl space-y-3">
                <label className="text-gray-300 text-sm">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />

                <label className="text-gray-300 text-sm">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />

                <label className="text-gray-300 text-sm">Message</label>
                <textarea className="w-full p-2 rounded bg-transparent text-foreground border border-input" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />

                <div className="flex gap-2">
                    <Button onClick={submit}>{t('contact_us')}</Button>
                </div>
            </div>
        </div>
    );
}
