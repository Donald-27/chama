import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

export default function Language() {
    const [lang, setLang] = useState('en');

    useEffect(() => {
        setLang(localStorage.getItem('chama_lang') || 'en');
    }, []);

    const apply = (l) => {
        setLang(l);
        localStorage.setItem('chama_lang', l);
        toast.success(l === 'en' ? t('language_selected_en') : t('language_selected_sw'));
        // reload to let pages pick up translations on mount
        try { window.location.reload(); } catch (e) { }
    };

    return (
        <div className="min-h-screen p-4" style={{ background: '#0b1720' }}>
            <header className="flex items-center gap-3 mb-4">
                <a href="/settings" className="p-2 rounded-xl" style={{ backgroundColor: '#243447' }}>
                    <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </a>
                <h2 className="text-2xl font-bold text-white">{t('language_label')}</h2>
            </header>
            <div className="flex gap-2">
                <Button onClick={() => apply('en')} variant={lang === 'en' ? undefined : 'ghost'}>English</Button>
                <Button onClick={() => apply('sw')} variant={lang === 'sw' ? undefined : 'ghost'}>Kiswahili</Button>
            </div>
        </div>
    );
}
