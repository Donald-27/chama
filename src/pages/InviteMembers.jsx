import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, UserPlus, Mail, Phone, Copy, Share2, Check, Users, Send, QrCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function InviteMembers() {
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const chamaId = urlParams.get('chamaId');

    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('member');
    const [inviteSent, setInviteSent] = useState(false);

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

    // Direct add member mutation
    const addMemberMutation = useMutation({
        mutationFn: async () => {
            await base44.entities.ChamaMember.create({
                chama_id: chamaId,
                user_email: email,
                full_name: fullName,
                phone_number: phone,
                role: role,
                total_contributions: 0,
                status: 'active',
                joined_date: new Date().toISOString().split('T')[0],
            });

            if (chama) {
                await base44.entities.Chama.update(chamaId, {
                    member_count: (chama.member_count || 1) + 1,
                });
            }

            try {
                await base44.users.inviteUser(email, 'user');
            } catch (e) {
                console.log('User may already exist');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['chama-members']);
            setInviteSent(true);
            setEmail('');
            setFullName('');
            setPhone('');
            setRole('member');
            refetchChama();
            setTimeout(() => setInviteSent(false), 3000);
        },
    });

    // Send invite (creates JoinRequest with is_direct_invite=true)
    const sendInviteMutation = useMutation({
        mutationFn: async () => {
            await base44.entities.JoinRequest.create({
                chama_id: chamaId,
                requester_email: email,
                requester_name: fullName,
                requester_phone: phone,
                status: 'approved', // Auto-approved since leader sent it
                is_direct_invite: true,
                invited_by: user.email,
            });

            // Create the member directly
            await base44.entities.ChamaMember.create({
                chama_id: chamaId,
                user_email: email,
                full_name: fullName,
                phone_number: phone,
                role: role,
                total_contributions: 0,
                status: 'active',
                joined_date: new Date().toISOString().split('T')[0],
            });

            if (chama) {
                await base44.entities.Chama.update(chamaId, {
                    member_count: (chama.member_count || 1) + 1,
                });
            }

            try {
                await base44.users.inviteUser(email, 'user');
            } catch (e) {
                console.log('User may already exist');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['chama-members']);
            toast.success(`Invite sent to ${fullName}!`);
            setEmail('');
            setFullName('');
            setPhone('');
            refetchChama();
        },
    });

    const copyJoinCode = () => {
        navigator.clipboard.writeText(chama?.join_code || '');
        toast.success('Join code copied!');
    };

    const shareInvite = async () => {
        const message = `Join ${chama?.name} on ChamaPro! Use code: ${chama?.join_code}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join ${chama?.name}`,
                    text: message,
                });
            } catch (e) {
                navigator.clipboard.writeText(message);
                toast.success('Invite message copied!');
            }
        } else {
            navigator.clipboard.writeText(message);
            toast.success('Invite message copied!');
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#1a2332' }}>
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
                    <h1 className="text-xl font-bold text-white">Invite Members</h1>
                </div>
                <p className="text-gray-400 text-sm ml-12">{chama?.name}</p>
            </header>

            <main className="px-4">
                {inviteSent && (
                    <div className="rounded-2xl p-4 flex items-center gap-3 mb-4" style={{ backgroundColor: '#243447', borderLeft: '4px solid #10b981' }}>
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="font-medium text-white">Member Added!</p>
                            <p className="text-sm text-gray-400">They can now access the group</p>
                        </div>
                    </div>
                )}

                <Tabs defaultValue="add" className="w-full">
                    <TabsList className="w-full rounded-xl p-1 mb-4" style={{ backgroundColor: '#243447' }}>
                        <TabsTrigger value="add" className="flex-1 rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            Add Directly
                        </TabsTrigger>
                        <TabsTrigger value="share" className="flex-1 rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500">
                            Share Code
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="add" className="space-y-4">
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <UserPlus className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Add Member</h3>
                                    <p className="text-gray-400 text-xs">Add them directly to the group</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-400">Full Name *</Label>
                                    <Input
                                        placeholder="Enter full name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="h-12 rounded-xl border-0 text-white"
                                        style={{ backgroundColor: '#2a3f55' }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-400">Email *</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <Input
                                            type="email"
                                            placeholder="email@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-12 rounded-xl pl-12 border-0 text-white"
                                            style={{ backgroundColor: '#2a3f55' }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-400">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <Input
                                            type="tel"
                                            placeholder="0712345678"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="h-12 rounded-xl pl-12 border-0 text-white"
                                            style={{ backgroundColor: '#2a3f55' }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-400">Role</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger className="h-12 rounded-xl border-0 text-white" style={{ backgroundColor: '#2a3f55' }}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                                            <SelectItem value="member" className="text-white">Member</SelectItem>
                                            <SelectItem value="treasurer" className="text-white">Treasurer</SelectItem>
                                            <SelectItem value="secretary" className="text-white">Secretary</SelectItem>
                                            <SelectItem value="chairperson" className="text-white">Chairperson</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    onClick={() => addMemberMutation.mutate()}
                                    disabled={!email || !fullName || addMemberMutation.isPending}
                                    className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600"
                                >
                                    {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="share" className="space-y-4">
                        {/* Join Code */}
                        <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <QrCode className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Group Join Code</h3>
                                    <p className="text-gray-400 text-xs">Share this code with new members</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 h-16 rounded-xl flex items-center justify-center text-3xl font-mono tracking-widest text-cyan-400" style={{ backgroundColor: '#2a3f55' }}>
                                    {chama?.join_code || '------'}
                                </div>
                                <Button onClick={copyJoinCode} size="icon" className="h-16 w-16 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                                    <Copy className="w-6 h-6 text-cyan-400" />
                                </Button>
                            </div>

                            <Button onClick={shareInvite} className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600">
                                <Share2 className="w-5 h-5 mr-2" />
                                Share Invite
                            </Button>
                        </div>

                        {/* How it works */}
                        <div className="rounded-xl p-4" style={{ backgroundColor: '#243447' }}>
                            <p className="text-white font-medium mb-3">How it works</p>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">1</span>
                                    <p className="text-gray-400">Share the join code with the person you want to invite</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">2</span>
                                    <p className="text-gray-400">They enter the code in the "Join Group" tab</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">3</span>
                                    <p className="text-gray-400">You'll receive a notification to approve their request</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}