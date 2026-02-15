import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Upload, Check, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

export default function CreateChama() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        contribution_amount: '',
        contribution_frequency: 'monthly',
        registration_fee: '',
        welfare_amount: '',
        image_url: '',
    });
    const [isUploading, setIsUploading] = useState(false);

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

    const generateJoinCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const createChamaMutation = useMutation({
        mutationFn: async () => {
            try {
                const joinCode = generateJoinCode();

                // determine creator (fallback to local profile)
                let creator = user;
                try {
                    if (!creator) {
                        const raw = localStorage.getItem('chama_profile');
                        creator = raw ? JSON.parse(raw) : null;
                    }
                } catch (e) { creator = null; }

                const creatorEmail = creator?.email || 'local@local';
                const creatorName = creator?.full_name || creator?.fullName || 'You';

                // Create chama
                const chama = await base44.entities.Chama.create({
                    name: formData.name,
                    description: formData.description,
                    contribution_amount: parseFloat(formData.contribution_amount) || 0,
                    contribution_frequency: formData.contribution_frequency,
                    registration_fee: parseFloat(formData.registration_fee) || 0,
                    welfare_amount: parseFloat(formData.welfare_amount) || 0,
                    image_url: formData.image_url,
                    total_balance: 0,
                    member_count: 1,
                    status: 'active',
                    join_code: joinCode,
                });

                // Add creator as admin
                await base44.entities.ChamaMember.create({
                    chama_id: chama.id,
                    user_email: creatorEmail,
                    full_name: creatorName,
                    role: 'admin',
                    total_contributions: 0,
                    status: 'active',
                    joined_date: new Date().toISOString().split('T')[0],
                });

                // Create default settings
                await base44.entities.ChamaSettings.create({
                    chama_id: chama.id,
                    join_code: joinCode,
                    contribution_day: 1,
                    late_fine_enabled: true,
                    late_fine_amount: 500,
                    late_fine_grace_days: 3,
                    missed_meeting_fine: 200,
                    late_loan_fine_percent: 5,
                    max_loan_multiplier: 3,
                    loan_interest_rate: 10,
                    require_guarantors: true,
                    min_guarantors: 2,
                    allow_partial_payments: true,
                    meeting_day: 'saturday',
                    meeting_frequency: 'monthly',
                    notifications_enabled: true,
                    auto_reminders: true,
                    reminder_days_before: 3,
                });

                return chama;
            } catch (err) {
                console.error('Create chama failed', err);
                throw err;
            }
        },
        onSuccess: (chama) => {
            navigate(createPageUrl(`ChamaDetail?id=${chama.id}`));
        },
    });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, image_url: file_url });
        } catch (error) {
            console.error('Upload failed:', error);
        }
        setIsUploading(false);
    };

    const steps = [
        { num: 1, label: 'Basic Info' },
        { num: 2, label: 'Contributions' },
        { num: 3, label: 'Review' },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#1a2332' }}>
            {/* Header */}
            <header className="px-4 pt-12 pb-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        to={createPageUrl('MyGroups')}
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: '#243447' }}
                    >
                        <ArrowLeft className="w-5 h-5 text-cyan-400" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">Create New Chama</h1>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.num}>
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s.num ? 'bg-cyan-500 text-white' : 'text-gray-500'
                                    }`} style={step < s.num ? { backgroundColor: '#243447' } : {}}>
                                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                                </div>
                                <span className={`text-xs ${step >= s.num ? 'text-cyan-400 font-medium' : 'text-gray-500'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 rounded-full ${step > s.num ? 'bg-cyan-500' : ''
                                    }`} style={step <= s.num ? { backgroundColor: '#243447' } : {}} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </header>

            {/* Form Content */}
            <main className="px-4 py-4">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center border-2 border-dashed overflow-hidden`}
                                    style={{ borderColor: formData.image_url ? '#06b6d4' : '#2a3f55' }}>
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Chama" className="w-full h-full object-cover" />
                                    ) : isUploading ? (
                                        <div className="animate-pulse w-full h-full" style={{ backgroundColor: '#243447' }} />
                                    ) : (
                                        <Upload className="w-8 h-8 text-gray-500" />
                                    )}
                                </div>
                            </label>
                            <p className="text-sm text-gray-400 mt-2">Add group photo</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Group Name *</Label>
                            <Input
                                placeholder="e.g., Chebaibai Investment Group"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-12 rounded-xl border-0 text-white"
                                style={{ backgroundColor: '#243447' }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Description</Label>
                            <Textarea
                                placeholder="What's the purpose of this group?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="rounded-xl resize-none h-24 border-0 text-white"
                                style={{ backgroundColor: '#243447' }}
                            />
                        </div>

                        <Button
                            onClick={() => setStep(2)}
                            disabled={!formData.name}
                            className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600"
                        >
                            Continue
                            <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: '#243447' }}>
                            <div className="p-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                <span className="text-2xl">💰</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Contribution Settings</h3>
                                <p className="text-sm text-gray-400">Set up how members will contribute</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Monthly Contribution (KES) *</Label>
                            <Input
                                type="number"
                                placeholder="e.g., 5000"
                                value={formData.contribution_amount}
                                onChange={(e) => setFormData({ ...formData, contribution_amount: e.target.value })}
                                className="h-12 rounded-xl border-0 text-white"
                                style={{ backgroundColor: '#243447' }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Contribution Frequency</Label>
                            <Select
                                value={formData.contribution_frequency}
                                onValueChange={(value) => setFormData({ ...formData, contribution_frequency: value })}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-0 text-white" style={{ backgroundColor: '#243447' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                                    <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                                    <SelectItem value="bi-weekly" className="text-white">Bi-Weekly</SelectItem>
                                    <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                                    <SelectItem value="quarterly" className="text-white">Quarterly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-gray-400">Registration Fee</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={formData.registration_fee}
                                    onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value })}
                                    className="h-12 rounded-xl border-0 text-white"
                                    style={{ backgroundColor: '#243447' }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400">Welfare Amount</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={formData.welfare_amount}
                                    onChange={(e) => setFormData({ ...formData, welfare_amount: e.target.value })}
                                    className="h-12 rounded-xl border-0 text-white"
                                    style={{ backgroundColor: '#243447' }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="flex-1 h-12 rounded-xl border-gray-600 text-white hover:bg-gray-700"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!formData.contribution_amount}
                                className="flex-1 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#243447' }}>
                            <div className="bg-cyan-500 p-6 text-white">
                                <div className="flex items-center gap-4">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Chama" className="w-16 h-16 rounded-xl object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                                            <span className="text-2xl font-bold">{formData.name?.charAt(0)?.toUpperCase()}</span>
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-xl font-bold">{formData.name}</h2>
                                        <p className="text-cyan-100 text-sm">1 member (you)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {formData.description && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Description</p>
                                        <p className="text-white">{formData.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl p-4" style={{ backgroundColor: '#2a3f55' }}>
                                        <p className="text-xs text-gray-500 mb-1">Contribution</p>
                                        <p className="font-semibold text-white">
                                            KES {parseFloat(formData.contribution_amount || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="rounded-xl p-4" style={{ backgroundColor: '#2a3f55' }}>
                                        <p className="text-xs text-gray-500 mb-1">Frequency</p>
                                        <p className="font-semibold text-white capitalize">
                                            {formData.contribution_frequency}
                                        </p>
                                    </div>
                                </div>

                                {(parseFloat(formData.registration_fee) > 0 || parseFloat(formData.welfare_amount) > 0) && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {parseFloat(formData.registration_fee) > 0 && (
                                            <div className="rounded-xl p-4" style={{ backgroundColor: '#2a3f55' }}>
                                                <p className="text-xs text-gray-500 mb-1">Registration</p>
                                                <p className="font-semibold text-white">
                                                    KES {parseFloat(formData.registration_fee).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        {parseFloat(formData.welfare_amount) > 0 && (
                                            <div className="rounded-xl p-4" style={{ backgroundColor: '#2a3f55' }}>
                                                <p className="text-xs text-gray-500 mb-1">Welfare</p>
                                                <p className="font-semibold text-white">
                                                    KES {parseFloat(formData.welfare_amount).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-4 border-t" style={{ borderColor: '#2a3f55' }}>
                                    <p className="text-xs text-gray-500 mb-2">You'll be added as:</p>
                                    <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                                        Admin (Group Leader)
                                    </span>
                                </div>

                                <div className="rounded-xl p-3" style={{ backgroundColor: '#2a3f55' }}>
                                    <p className="text-gray-400 text-xs">
                                        ✨ A unique join code will be generated for your group. You can share it with members to join.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setStep(2)}
                                className="flex-1 h-12 rounded-xl border-gray-600 text-white hover:bg-gray-700"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={() => createChamaMutation.mutate()}
                                disabled={createChamaMutation.isLoading}
                                className="flex-1 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600"
                            >
                                {createChamaMutation.isLoading ? 'Creating...' : 'Create Chama'}
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}