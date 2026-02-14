import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    ArrowLeft, Settings, Users, Wallet, Bell, Shield,
    QrCode, Copy, Calendar, AlertTriangle, UserPlus,
    UserMinus, Check, ChevronRight, Gavel, Clock,
    CreditCard, FileText, Percent, Hash
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function ChamaSettings() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const chamaId = urlParams.get('id');

    const [user, setUser] = useState(null);

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

    const { data: chama, refetch: refetchChama } = useQuery({
        queryKey: ['chama', chamaId],
        queryFn: async () => {
            const chamas = await base44.entities.Chama.filter({ id: chamaId });
            return chamas[0];
        },
        enabled: !!chamaId,
    });

    const { data: members = [], refetch: refetchMembers } = useQuery({
        queryKey: ['chama-members', chamaId],
        queryFn: () => base44.entities.ChamaMember.filter({ chama_id: chamaId }),
        enabled: !!chamaId,
    });

    const { data: settings, refetch: refetchSettings } = useQuery({
        queryKey: ['chama-settings', chamaId],
        queryFn: async () => {
            const allSettings = await base44.entities.ChamaSettings.filter({ chama_id: chamaId });
            return allSettings[0];
        },
        enabled: !!chamaId,
    });

    const { data: joinRequests = [], refetch: refetchRequests } = useQuery({
        queryKey: ['join-requests', chamaId],
        queryFn: () => base44.entities.JoinRequest.filter({ chama_id: chamaId, status: 'pending' }),
        enabled: !!chamaId,
    });

    const { data: paymentApprovals = [], refetch: refetchPayments } = useQuery({
        queryKey: ['payment-approvals', chamaId],
        queryFn: () => base44.entities.PaymentApproval.filter({ chama_id: chamaId, status: 'pending' }),
        enabled: !!chamaId,
    });

    const currentMember = members.find(m => m.user_email === user?.email);
    const isLeader = ['admin', 'chairperson'].includes(currentMember?.role);

    const [generalSettings, setGeneralSettings] = useState({
        name: '',
        description: '',
        contribution_amount: 0,
        contribution_frequency: 'monthly',
        registration_fee: 0,
        welfare_amount: 0,
    });

    const [fineSettings, setFineSettings] = useState({
        late_fine_enabled: true,
        late_fine_amount: 500,
        late_fine_grace_days: 3,
        missed_meeting_fine: 200,
        late_loan_fine_percent: 5,
    });

    const [loanSettings, setLoanSettings] = useState({
        max_loan_multiplier: 3,
        loan_interest_rate: 10,
        require_guarantors: true,
        min_guarantors: 2,
    });

    const [scheduleSettings, setScheduleSettings] = useState({
        contribution_day: 1,
        meeting_day: 'saturday',
        meeting_frequency: 'monthly',
        auto_reminders: true,
        reminder_days_before: 3,
    });

    const [deleteSettings, setDeleteSettings] = useState({
        allow_delete_requests: true,
        delete_request_initiators: 'leaders', // 'leaders' or 'any'
        delete_approval_threshold_percent: 66,
        reveal_votes: false,
        hide_admin_votes: true,
        auto_archive_on_threshold: true,
    });

    useEffect(() => {
        if (chama) {
            setGeneralSettings({
                name: chama.name || '',
                description: chama.description || '',
                contribution_amount: chama.contribution_amount || 0,
                contribution_frequency: chama.contribution_frequency || 'monthly',
                registration_fee: chama.registration_fee || 0,
                welfare_amount: chama.welfare_amount || 0,
            });
        }
    }, [chama]);

    useEffect(() => {
        if (settings) {
            setFineSettings({
                late_fine_enabled: settings.late_fine_enabled ?? true,
                late_fine_amount: settings.late_fine_amount || 500,
                late_fine_grace_days: settings.late_fine_grace_days || 3,
                missed_meeting_fine: settings.missed_meeting_fine || 200,
                late_loan_fine_percent: settings.late_loan_fine_percent || 5,
            });
            setLoanSettings({
                max_loan_multiplier: settings.max_loan_multiplier || 3,
                loan_interest_rate: settings.loan_interest_rate || 10,
                require_guarantors: settings.require_guarantors ?? true,
                min_guarantors: settings.min_guarantors || 2,
            });
            setScheduleSettings({
                contribution_day: settings.contribution_day || 1,
                meeting_day: settings.meeting_day || 'saturday',
                meeting_frequency: settings.meeting_frequency || 'monthly',
                auto_reminders: settings.auto_reminders ?? true,
                reminder_days_before: settings.reminder_days_before || 3,
            });
            setDeleteSettings({
                allow_delete_requests: settings.allow_delete_requests ?? true,
                delete_request_initiators: settings.delete_request_initiators || 'leaders',
                delete_approval_threshold_percent: settings.delete_approval_threshold_percent || 66,
                reveal_votes: settings.reveal_votes ?? false,
                hide_admin_votes: settings.hide_admin_votes ?? true,
                auto_archive_on_threshold: settings.auto_archive_on_threshold ?? true,
            });
        }
    }, [settings]);

    const generateJoinCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const saveGeneralSettings = async () => {
        await base44.entities.Chama.update(chamaId, generalSettings);
        toast.success('Settings saved!');
        refetchChama();
    };

    const saveFineSettings = async () => {
        if (settings) {
            await base44.entities.ChamaSettings.update(settings.id, fineSettings);
        } else {
            await base44.entities.ChamaSettings.create({ chama_id: chamaId, ...fineSettings });
        }
        toast.success('Fine settings saved!');
        refetchSettings();
    };

    const saveLoanSettings = async () => {
        if (settings) {
            await base44.entities.ChamaSettings.update(settings.id, loanSettings);
        } else {
            await base44.entities.ChamaSettings.create({ chama_id: chamaId, ...loanSettings });
        }
        toast.success('Loan settings saved!');
        refetchSettings();
    };

    const saveScheduleSettings = async () => {
        if (settings) {
            await base44.entities.ChamaSettings.update(settings.id, scheduleSettings);
        } else {
            await base44.entities.ChamaSettings.create({ chama_id: chamaId, ...scheduleSettings });
        }
        toast.success('Schedule settings saved!');
        refetchSettings();
    };

    const saveDeleteSettings = async () => {
        if (settings) {
            await base44.entities.ChamaSettings.update(settings.id, deleteSettings);
        } else {
            await base44.entities.ChamaSettings.create({ chama_id: chamaId, ...deleteSettings });
        }
        toast.success('Delete settings saved!');
        refetchSettings();
    };

    const regenerateJoinCode = async () => {
        const newCode = generateJoinCode();
        await base44.entities.Chama.update(chamaId, { join_code: newCode });
        toast.success('New join code generated!');
        refetchChama();
    };

    const copyJoinCode = () => {
        navigator.clipboard.writeText(chama?.join_code || '');
        toast.success('Code copied!');
    };

    const approveJoinRequest = async (request) => {
        // Create member
        await base44.entities.ChamaMember.create({
            chama_id: chamaId,
            user_email: request.requester_email,
            full_name: request.requester_name,
            phone_number: request.requester_phone,
            role: 'member',
            total_contributions: 0,
            status: 'active',
            joined_date: new Date().toISOString().split('T')[0],
        });

        // Update request status
        await base44.entities.JoinRequest.update(request.id, { status: 'approved' });

        // Update member count
        await base44.entities.Chama.update(chamaId, {
            member_count: (chama?.member_count || 1) + 1,
        });

        toast.success(`${request.requester_name} approved!`);
        refetchRequests();
        refetchMembers();
        refetchChama();
    };

    const rejectJoinRequest = async (request) => {
        await base44.entities.JoinRequest.update(request.id, { status: 'rejected' });
        toast.success('Request rejected');
        refetchRequests();
    };

    const approvePayment = async (payment) => {
        // Create transaction
        await base44.entities.Transaction.create({
            chama_id: chamaId,
            member_email: payment.member_email,
            member_name: payment.member_name,
            type: payment.payment_type,
            amount: payment.amount,
            status: 'completed',
            payment_method: 'mpesa',
            mpesa_reference: payment.mpesa_code,
            description: `Manual approval - ${payment.mpesa_code}`,
            transaction_date: new Date().toISOString(),
        });

        // Update member contributions
        const member = members.find(m => m.user_email === payment.member_email);
        if (member && payment.payment_type === 'contribution') {
            await base44.entities.ChamaMember.update(member.id, {
                total_contributions: (member.total_contributions || 0) + payment.amount,
            });
        }

        // Update chama balance
        await base44.entities.Chama.update(chamaId, {
            total_balance: (chama?.total_balance || 0) + payment.amount,
        });

        // Update approval status
        await base44.entities.PaymentApproval.update(payment.id, {
            status: 'approved',
            approved_by: user.email,
        });

        toast.success('Payment approved!');
        refetchPayments();
        refetchMembers();
        refetchChama();
    };

    const rejectPayment = async (payment) => {
        await base44.entities.PaymentApproval.update(payment.id, {
            status: 'rejected',
            rejection_reason: 'Invalid payment details',
        });
        toast.success('Payment rejected');
        refetchPayments();
    };

    const updateMemberRole = async (memberId, newRole) => {
        await base44.entities.ChamaMember.update(memberId, { role: newRole });
        toast.success('Role updated!');
        refetchMembers();
    };

    const removeMember = async (member) => {
        if (member.user_email === user?.email) {
            toast.error("You can't remove yourself");
            return;
        }

        await base44.entities.ChamaMember.update(member.id, { status: 'inactive' });
        await base44.entities.Chama.update(chamaId, {
            member_count: Math.max(1, (chama?.member_count || 1) - 1),
        });
        toast.success('Member removed');
        refetchMembers();
        refetchChama();
    };

    if (!isLeader) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a2332' }}>
                <div className="text-center px-4">
                    <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400 mb-6">Only group leaders can access settings.</p>
                    <Link
                        to={createPageUrl(`ChamaDetail?id=${chamaId}`)}
                        className="text-cyan-400"
                    >
                        Go back
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-8" style={{ backgroundColor: '#1a2332' }}>
            {/* Header */}
            <header className="px-4 pt-12 pb-4">
                <div className="flex items-center gap-4 mb-2">
                    <Link
                        to={createPageUrl(`ChamaDetail?id=${chamaId}`)}
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: '#243447' }}
                    >
                        <ArrowLeft className="w-5 h-5 text-cyan-400" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">Group Settings</h1>
                </div>
                <p className="text-gray-400 text-sm ml-12">{chama?.name}</p>
            </header>

            <main className="px-4">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full rounded-xl p-1 mb-4 grid grid-cols-5" style={{ backgroundColor: '#243447' }}>
                        <TabsTrigger value="general" className="text-xs rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            General
                        </TabsTrigger>
                        <TabsTrigger value="members" className="text-xs rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            Members
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="text-xs rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            Finance
                        </TabsTrigger>
                        <TabsTrigger value="approvals" className="text-xs rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            Approvals
                            {(joinRequests.length + paymentApprovals.length) > 0 && (
                                <span className="ml-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                    {joinRequests.length + paymentApprovals.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="delete" className="text-xs rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            Delete
                        </TabsTrigger>
                    </TabsList>

                    {/* General Settings */}
                    <TabsContent value="general" className="space-y-4">
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-cyan-400" />
                                Basic Information
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-gray-400 text-sm">Group Name</Label>
                                    <Input
                                        value={generalSettings.name}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, name: e.target.value })}
                                        className="h-12 rounded-xl border-0 text-white mt-1"
                                        style={{ backgroundColor: '#2a3f55' }}
                                    />
                                </div>

                                <div>
                                    <Label className="text-gray-400 text-sm">Description</Label>
                                    <Input
                                        value={generalSettings.description}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, description: e.target.value })}
                                        className="h-12 rounded-xl border-0 text-white mt-1"
                                        style={{ backgroundColor: '#2a3f55' }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-gray-400 text-sm">Contribution (KES)</Label>
                                        <Input
                                            type="number"
                                            value={generalSettings.contribution_amount}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, contribution_amount: parseFloat(e.target.value) || 0 })}
                                            className="h-12 rounded-xl border-0 text-white mt-1"
                                            style={{ backgroundColor: '#2a3f55' }}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-400 text-sm">Frequency</Label>
                                        <Select
                                            value={generalSettings.contribution_frequency}
                                            onValueChange={(value) => setGeneralSettings({ ...generalSettings, contribution_frequency: value })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-0 text-white mt-1" style={{ backgroundColor: '#2a3f55' }}>
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
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-gray-400 text-sm">Registration Fee</Label>
                                        <Input
                                            type="number"
                                            value={generalSettings.registration_fee}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, registration_fee: parseFloat(e.target.value) || 0 })}
                                            className="h-12 rounded-xl border-0 text-white mt-1"
                                            style={{ backgroundColor: '#2a3f55' }}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-400 text-sm">Welfare Amount</Label>
                                        <Input
                                            type="number"
                                            value={generalSettings.welfare_amount}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, welfare_amount: parseFloat(e.target.value) || 0 })}
                                            className="h-12 rounded-xl border-0 text-white mt-1"
                                            style={{ backgroundColor: '#2a3f55' }}
                                        />
                                    </div>
                                </div>

                                <Button onClick={saveGeneralSettings} className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600">
                                    Save Changes
                                </Button>
                            </div>
                        </div>

                        {/* Join Code */}
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Hash className="w-5 h-5 text-cyan-400" />
                                Join Code
                            </h3>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 h-14 rounded-xl flex items-center justify-center text-2xl font-mono tracking-widest text-cyan-400" style={{ backgroundColor: '#2a3f55' }}>
                                    {chama?.join_code || 'Not set'}
                                </div>
                                <Button onClick={copyJoinCode} size="icon" className="h-14 w-14 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <Copy className="w-5 h-5 text-cyan-400" />
                                </Button>
                            </div>

                            <Button onClick={regenerateJoinCode} variant="outline" className="w-full h-12 rounded-xl border-cyan-500 text-cyan-400">
                                Generate New Code
                            </Button>
                        </div>

                        {/* Schedule Settings */}
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-cyan-400" />
                                Schedule & Reminders
                            </h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-gray-400 text-sm">Contribution Day</Label>
                                        <Select
                                            value={scheduleSettings.contribution_day.toString()}
                                            onValueChange={(value) => setScheduleSettings({ ...scheduleSettings, contribution_day: parseInt(value) })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-0 text-white mt-1" style={{ backgroundColor: '#2a3f55' }}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                                                {Array.from({ length: 28 }, (_, i) => (
                                                    <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white">
                                                        {i + 1}{['st', 'nd', 'rd'][i] || 'th'} of month
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-gray-400 text-sm">Meeting Day</Label>
                                        <Select
                                            value={scheduleSettings.meeting_day}
                                            onValueChange={(value) => setScheduleSettings({ ...scheduleSettings, meeting_day: value })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-0 text-white mt-1" style={{ backgroundColor: '#2a3f55' }}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                                    <SelectItem key={day} value={day} className="text-white capitalize">{day}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <div>
                                        <p className="text-white font-medium">Auto Reminders</p>
                                        <p className="text-gray-400 text-xs">Send payment reminders</p>
                                    </div>
                                    <Switch
                                        checked={scheduleSettings.auto_reminders}
                                        onCheckedChange={(checked) => setScheduleSettings({ ...scheduleSettings, auto_reminders: checked })}
                                    />
                                </div>

                                <Button onClick={saveScheduleSettings} className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600">
                                    Save Schedule
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Delete & Voting Settings Tab */}
                    <TabsContent value="delete" className="space-y-4">
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Gavel className="w-5 h-5 text-amber-400" />
                                Delete & Voting Settings
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <div>
                                        <p className="text-white font-medium">Allow Delete Requests</p>
                                        <p className="text-gray-400 text-xs">Allow members to initiate group archive/delete requests</p>
                                    </div>
                                    <Switch checked={deleteSettings.allow_delete_requests} onCheckedChange={(v) => setDeleteSettings({ ...deleteSettings, allow_delete_requests: v })} />
                                </div>

                                <div>
                                    <Label className="text-gray-400 text-sm">Who can initiate</Label>
                                    <Select value={deleteSettings.delete_request_initiators} onValueChange={(v) => setDeleteSettings({ ...deleteSettings, delete_request_initiators: v })}>
                                        <SelectTrigger className="h-12 rounded-xl border-0 text-white mt-1" style={{ backgroundColor: '#2a3f55' }}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                                            <SelectItem value="leaders" className="text-white">Group Leaders Only</SelectItem>
                                            <SelectItem value="any" className="text-white">Any Member</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-gray-400 text-sm">Approval Threshold (%)</Label>
                                    <Input type="number" value={deleteSettings.delete_approval_threshold_percent} onChange={(e) => setDeleteSettings({ ...deleteSettings, delete_approval_threshold_percent: parseInt(e.target.value) || 50 })} className="h-12 rounded-xl border-0 text-white mt-1" style={{ backgroundColor: '#2a3f55' }} />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <div>
                                        <p className="text-white font-medium">Reveal Votes</p>
                                        <p className="text-gray-400 text-xs">Show who voted publicly when enabled</p>
                                    </div>
                                    <Switch checked={deleteSettings.reveal_votes} onCheckedChange={(v) => setDeleteSettings({ ...deleteSettings, reveal_votes: v })} />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <div>
                                        <p className="text-white font-medium">Hide Admin Votes</p>
                                        <p className="text-gray-400 text-xs">Do not reveal admin votes even when votes are revealed</p>
                                    </div>
                                    <Switch checked={deleteSettings.hide_admin_votes} onCheckedChange={(v) => setDeleteSettings({ ...deleteSettings, hide_admin_votes: v })} />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <div>
                                        <p className="text-white font-medium">Auto-archive on threshold</p>
                                        <p className="text-gray-400 text-xs">Automatically archive the group when the threshold is met</p>
                                    </div>
                                    <Switch checked={deleteSettings.auto_archive_on_threshold} onCheckedChange={(v) => setDeleteSettings({ ...deleteSettings, auto_archive_on_threshold: v })} />
                                </div>

                                <Button onClick={saveDeleteSettings} className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600">Save Delete Settings</Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Members Tab */}
                    <TabsContent value="members" className="space-y-4">
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-cyan-400" />
                                Officials & Members ({members.filter(m => m.status === 'active').length})
                            </h3>

                            <div className="space-y-3">
                                {members.filter(m => m.status === 'active').map((member) => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1a2332' }}>
                                            <span className="text-cyan-400 font-semibold">
                                                {member.full_name?.charAt(0)?.toUpperCase() || 'M'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{member.full_name}</p>
                                            <p className="text-gray-400 text-xs truncate">{member.user_email}</p>
                                        </div>
                                        <Select
                                            value={member.role}
                                            onValueChange={(value) => updateMemberRole(member.id, value)}
                                        >
                                            <SelectTrigger className="w-28 h-8 rounded-lg border-0 text-xs" style={{ backgroundColor: '#1a2332' }}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                                                <SelectItem value="admin" className="text-white text-xs">Admin</SelectItem>
                                                <SelectItem value="chairperson" className="text-white text-xs">Chairperson</SelectItem>
                                                <SelectItem value="treasurer" className="text-white text-xs">Treasurer</SelectItem>
                                                <SelectItem value="secretary" className="text-white text-xs">Secretary</SelectItem>
                                                <SelectItem value="member" className="text-white text-xs">Member</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {member.user_email !== user?.email && (
                                            <button
                                                onClick={() => removeMember(member)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                            >
                                                <UserMinus className="w-4 h-4 text-red-400" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Link
                            to={createPageUrl(`InviteMembers?chamaId=${chamaId}`)}
                            className="flex items-center justify-center gap-2 p-4 rounded-2xl text-cyan-400 font-medium"
                            style={{ backgroundColor: '#243447' }}
                        >
                            <UserPlus className="w-5 h-5" />
                            Invite New Members
                        </Link>
                    </TabsContent>

                    {/* Finance Tab */}
                    <TabsContent value="finance" className="space-y-4">
                        {/* Fine Settings */}
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Gavel className="w-5 h-5 text-amber-400" />
                                Fine Settings
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <div>
                                        <p className="text-white font-medium">Late Payment Fines</p>
                                        <p className="text-gray-400 text-xs">Auto-charge for late contributions</p>
                                    </div>
                                    <Switch
                                        checked={fineSettings.late_fine_enabled}
                                        onCheckedChange={(checked) => setFineSettings({ ...fineSettings, late_fine_enabled: checked })}
                                    />
                                </div>

                                {fineSettings.late_fine_enabled && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-gray-400 text-sm">Late Fine (KES)</Label>
                                                <Input
                                                    type="number"
                                                    value={fineSettings.late_fine_amount}
                                                    onChange={(e) => setFineSettings({ ...fineSettings, late_fine_amount: parseFloat(e.target.value) || 0 })}
                                                    className="h-12 rounded-xl border-0 text-white mt-1"
                                                    style={{ backgroundColor: '#2a3f55' }}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-gray-400 text-sm">Grace Days</Label>
                                                <Input
                                                    type="number"
                                                    value={fineSettings.late_fine_grace_days}
                                                    onChange={(e) => setFineSettings({ ...fineSettings, late_fine_grace_days: parseInt(e.target.value) || 0 })}
                                                    className="h-12 rounded-xl border-0 text-white mt-1"
                                                    style={{ backgroundColor: '#2a3f55' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-gray-400 text-sm">Missed Meeting Fine</Label>
                                                <Input
                                                    type="number"
                                                    value={fineSettings.missed_meeting_fine}
                                                    onChange={(e) => setFineSettings({ ...fineSettings, missed_meeting_fine: parseFloat(e.target.value) || 0 })}
                                                    className="h-12 rounded-xl border-0 text-white mt-1"
                                                    style={{ backgroundColor: '#2a3f55' }}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-gray-400 text-sm">Late Loan Fine %</Label>
                                                <Input
                                                    type="number"
                                                    value={fineSettings.late_loan_fine_percent}
                                                    onChange={(e) => setFineSettings({ ...fineSettings, late_loan_fine_percent: parseFloat(e.target.value) || 0 })}
                                                    className="h-12 rounded-xl border-0 text-white mt-1"
                                                    style={{ backgroundColor: '#2a3f55' }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Button onClick={saveFineSettings} className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600">
                                    Save Fine Settings
                                </Button>
                            </div>
                        </div>

                        {/* Loan Settings */}
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-400" />
                                Loan Settings
                            </h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-gray-400 text-sm">Max Loan Multiplier</Label>
                                        <Input
                                            type="number"
                                            value={loanSettings.max_loan_multiplier}
                                            onChange={(e) => setLoanSettings({ ...loanSettings, max_loan_multiplier: parseFloat(e.target.value) || 3 })}
                                            className="h-12 rounded-xl border-0 text-white mt-1"
                                            style={{ backgroundColor: '#2a3f55' }}
                                        />
                                        <p className="text-gray-500 text-xs mt-1">× contributions</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-400 text-sm">Interest Rate %</Label>
                                        <Input
                                            type="number"
                                            value={loanSettings.loan_interest_rate}
                                            onChange={(e) => setLoanSettings({ ...loanSettings, loan_interest_rate: parseFloat(e.target.value) || 10 })}
                                            className="h-12 rounded-xl border-0 text-white mt-1"
                                            style={{ backgroundColor: '#2a3f55' }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <div>
                                        <p className="text-white font-medium">Require Guarantors</p>
                                        <p className="text-gray-400 text-xs">Loans need guarantor approval</p>
                                    </div>
                                    <Switch
                                        checked={loanSettings.require_guarantors}
                                        onCheckedChange={(checked) => setLoanSettings({ ...loanSettings, require_guarantors: checked })}
                                    />
                                </div>

                                {loanSettings.require_guarantors && (
                                    <div>
                                        <Label className="text-gray-400 text-sm">Minimum Guarantors</Label>
                                        <Input
                                            type="number"
                                            value={loanSettings.min_guarantors}
                                            onChange={(e) => setLoanSettings({ ...loanSettings, min_guarantors: parseInt(e.target.value) || 2 })}
                                            className="h-12 rounded-xl border-0 text-white mt-1"
                                            style={{ backgroundColor: '#2a3f55' }}
                                        />
                                    </div>
                                )}

                                <Button onClick={saveLoanSettings} className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600">
                                    Save Loan Settings
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Approvals Tab */}
                    <TabsContent value="approvals" className="space-y-4">
                        {/* Join Requests */}
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-cyan-400" />
                                Join Requests ({joinRequests.length})
                            </h3>

                            {joinRequests.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">No pending requests</p>
                            ) : (
                                <div className="space-y-3">
                                    {joinRequests.map((request) => (
                                        <div key={request.id} className="p-4 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1a2332' }}>
                                                    <span className="text-cyan-400 font-semibold">
                                                        {request.requester_name?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">{request.requester_name}</p>
                                                    <p className="text-gray-400 text-xs">{request.requester_email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => approveJoinRequest(request)}
                                                    className="flex-1 h-10 rounded-xl bg-green-500 hover:bg-green-600"
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    onClick={() => rejectJoinRequest(request)}
                                                    variant="outline"
                                                    className="flex-1 h-10 rounded-xl border-red-500 text-red-400 hover:bg-red-500/20"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment Approvals */}
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-green-400" />
                                Payment Approvals ({paymentApprovals.length})
                            </h3>

                            {paymentApprovals.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">No pending payments</p>
                            ) : (
                                <div className="space-y-3">
                                    {paymentApprovals.map((payment) => (
                                        <div key={payment.id} className="p-4 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-white font-medium">{payment.member_name}</p>
                                                <p className="text-green-400 font-bold">KES {payment.amount?.toLocaleString()}</p>
                                            </div>
                                            <p className="text-gray-400 text-xs mb-1">M-Pesa: {payment.mpesa_code}</p>
                                            <p className="text-gray-500 text-xs mb-3 truncate">{payment.mpesa_message}</p>
                                            {payment.screenshot_url && (
                                                <img src={payment.screenshot_url} alt="Payment proof" className="w-full h-32 object-cover rounded-lg mb-3" />
                                            )}
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => approvePayment(payment)}
                                                    className="flex-1 h-10 rounded-xl bg-green-500 hover:bg-green-600"
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    onClick={() => rejectPayment(payment)}
                                                    variant="outline"
                                                    className="flex-1 h-10 rounded-xl border-red-500 text-red-400 hover:bg-red-500/20"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            )}


                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}