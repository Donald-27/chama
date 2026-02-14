import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft, User, Bell, Shield, HelpCircle, 
  LogOut, ChevronRight, Moon, Globe, Phone,
  CreditCard, FileText, MessageCircle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error(e);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

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
        { icon: Bell, label: 'Notifications', desc: 'Manage notifications', toggle: true, value: notifications, onChange: setNotifications },
        { icon: Moon, label: 'Dark Mode', desc: 'Always on', toggle: true, value: darkMode, onChange: setDarkMode },
        { icon: Globe, label: 'Language', desc: 'English', page: 'Language' },
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
          <h1 className="text-xl font-bold text-white">Settings</h1>
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
              {section.items.map((item) => (
                <div key={item.label} style={{ borderColor: '#2a3f55' }}>
                  {item.toggle ? (
                    <div className="flex items-center gap-4 p-4">
                      <div className="p-2 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                        <item.icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-500 text-xs">{item.desc}</p>
                      </div>
                      <Switch checked={item.value} onCheckedChange={item.onChange} />
                    </div>
                  ) : (
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
                  )}
                </div>
              ))}
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
          Log Out
        </Button>

        <p className="text-gray-600 text-xs text-center">
          ChamaPro v1.0.0
        </p>
      </main>
    </div>
  );
}