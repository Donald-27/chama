import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import {
    ArrowLeft, User, Bell, Shield, HelpCircle,
    LogOut, ChevronRight, Moon, Globe, Phone,
    CreditCard, FileText, MessageCircle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { requestPermission, sendNotification, initSchedules, scheduleAt } from '@/lib/notifications';
import { pagesConfig } from '@/pages.config';

export default function Settings() {
    const { user: authUser, logout } = useAuth();
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState(() => {
        try { return JSON.parse(localStorage.getItem('chama_notifications_enabled')) ?? false; } catch { return false; }
    });
    const [darkMode, setDarkMode] = useState(() => {
        try { return JSON.parse(localStorage.getItem('chama_dark_mode')) ?? true; } catch { return true; }
    });

    useEffect(() => {
        // Prefer authenticated user from AuthContext (works for Supabase)
        if (authUser) {
            setUser(authUser);
            return;
        }

        // Fallback to base44 SDK if available
        const loadUser = async () => {
            try {
                const userData = await base44.auth.me();
                setUser(userData);
            } catch (e) {
                console.error(e);
            }
        };
        loadUser();
    }, [authUser]);

    // Also listen for local profile updates (when running without backend)
    useEffect(() => {
        const tryLocal = () => {
            try {
                const raw = localStorage.getItem('chama_profile');
                if (raw) {
                    const p = JSON.parse(raw);
                    setUser({ full_name: p.fullName, email: p.email, phone: p.phone });
                }
            } catch (e) { }
        };

        tryLocal();
        const handler = (e) => {
            try { const p = e.detail; setUser({ full_name: p.fullName, email: p.email, phone: p.phone }); } catch (err) { }
        };
        window.addEventListener('chama_profile_updated', handler);
        return () => window.removeEventListener('chama_profile_updated', handler);
    }, []);

    const handleLogout = () => {
        // Use AuthContext logout when available (handles Supabase)
        try {
            if (logout) return logout();
        } catch (e) {
            // fallback
        }
        try { base44.auth.logout(); } catch (e) { console.error('Logout failed', e); }
    };

    // Apply dark mode to document element and persist
    useEffect(() => {
        try {
            if (darkMode) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
        } catch (e) { }
    }, [darkMode]);

    const settingSections = [
        {
            title: 'Account',
            items: [
                { icon: User, label: 'Profile', desc: 'Manage your profile', page: 'Profile' },
                { icon: Phone, label: 'Phone Number', desc: user?.phone || 'Add phone number', page: 'Profile' },
                { icon: CreditCard, label: 'Payment Methods', desc: 'Manage M-Pesa & cards', page: 'PaymentMethods' },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: Bell, label: t('notifications_label'), desc: t('notifications_desc'), toggle: true, value: notifications, onChange: setNotifications },
                { icon: Moon, label: 'Dark Mode', desc: 'Always on', toggle: true, value: darkMode, onChange: setDarkMode },
                { icon: Globe, label: t('language_label'), desc: 'English', page: 'Language' },
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: HelpCircle, label: 'Help Center', desc: 'Get help with ChamaPro', page: 'Help' },
                { icon: MessageCircle, label: 'Contact Us', desc: 'Send us a message', page: 'Contact' },
                { icon: FileText, label: 'Terms & Privacy', desc: 'Legal documents', page: 'Legal' },
            ]
        },
        {
            title: 'Security',
            items: [
                { icon: Shield, label: 'Security', desc: 'PIN & biometrics', page: 'Security' },
            ]
        },
    ];

    return (
        <div className="min-h-screen pb-8" style={{ backgroundColor: '#1a2332' }}>
            {/* Header */}
            <header className="px-4 pt-12 pb-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        to={createPageUrl('Home')}
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: '#243447' }}
                    >
                        <ArrowLeft className="w-5 h-5 text-cyan-400" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">{t('settings_title')}</h1>
                </div>

                {/* Profile Card */}
                <div className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: '#243447' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2a3f55' }}>
                        <span className="text-cyan-400 font-bold text-2xl">
                            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-semibold">{user?.full_name || 'User'}</p>
                        <p className="text-gray-400 text-sm">{user?.email}</p>
                    </div>
                    <Link to={createPageUrl('Profile')}>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </Link>
                </div>
            </header>

            <main className="px-4 space-y-6">
                {settingSections.map((section) => (
                    <div key={section.title}>
                        <p className="text-gray-500 text-xs font-medium mb-2 ml-1">{section.title}</p>
                        <div className="rounded-2xl divide-y" style={{ backgroundColor: '#243447', borderColor: '#2a3f55' }}>
                            {section.items.map((item) => {
                                const isToggle = Boolean(item.toggle);
                                const targetPage = item.page;
                                const pageExists = targetPage && Object.keys(pagesConfig.Pages || {}).includes(targetPage);
                                return (
                                    <div key={item.label} style={{ borderColor: '#2a3f55' }}>
                                        {isToggle ? (
                                            <div className="flex items-center gap-4 p-4">
                                                <div className="p-2 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                                    <item.icon className="w-5 h-5 text-cyan-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">{item.label}</p>
                                                    <p className="text-gray-500 text-xs">{item.desc}</p>
                                                </div>
                                                <Switch checked={item.value} onCheckedChange={(v) => {
                                                    item.onChange(v);
                                                    // persist toggles to localStorage
                                                    if (item.label === t('notifications_label') || item.label === 'Notifications') {
                                                        localStorage.setItem('chama_notifications_enabled', JSON.stringify(v));
                                                        if (v) {
                                                            // request permission and initialize schedules
                                                            (async () => {
                                                                const p = await requestPermission();
                                                                if (p.granted) {
                                                                    toast.success(t('notifications_enabled'));
                                                                    // initialize persisted schedules and send a test
                                                                    initSchedules();
                                                                    sendNotification('ChamaManager', { body: 'Notifications enabled' });
                                                                    // schedule a daily morning reminder at 9:00 next occurrence
                                                                    const now = new Date();
                                                                    const next = new Date(now);
                                                                    next.setHours(9, 0, 0, 0);
                                                                    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
                                                                    scheduleAt('daily-reminder', next, t('daily_reminder_title'), t('daily_reminder_body'));
                                                                } else {
                                                                    toast.error('Notification permission denied');
                                                                    localStorage.setItem('chama_notifications_enabled', JSON.stringify(false));
                                                                    setNotifications(false);
                                                                }
                                                            })();
                                                        } else {
                                                            toast.success(t('notifications_disabled'));
                                                            // clear persisted schedules
                                                            try { localStorage.removeItem('chama_notification_schedules'); } catch (e) { }
                                                        }
                                                    }
                                                    if (item.label === 'Dark Mode') {
                                                        localStorage.setItem('chama_dark_mode', JSON.stringify(v));
                                                        toast.success(v ? 'Dark mode enabled' : 'Dark mode disabled');
                                                    }
                                                }} />
                                            </div>
                                        ) : (
                                            pageExists ? (
                                                <Link
                                                    to={createPageUrl(item.page || 'Settings')}
                                                    className="flex items-center gap-4 p-4"
                                                >
                                                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                                        <item.icon className="w-5 h-5 text-cyan-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium">{item.label}</p>
                                                        <p className="text-gray-500 text-xs">{item.desc}</p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => toast('This feature is not available yet', { icon: 'ℹ️' })}
                                                    className="flex items-center gap-4 p-4 w-full text-left"
                                                >
                                                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                                        <item.icon className="w-5 h-5 text-cyan-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium">{item.label}</p>
                                                        <p className="text-gray-500 text-xs">{item.desc}</p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                                </button>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Logout Button */}
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full h-14 rounded-xl border-red-500/50 text-red-400 hover:bg-red-500/20"
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    {t('logout')}
                </Button>

                <p className="text-gray-600 text-xs text-center">
                    ChamaPro v1.0.0
                </p>
            </main>
        </div>
    );
}