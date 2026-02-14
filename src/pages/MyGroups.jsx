import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Plus, Users, ChevronRight, Settings, QrCode, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/ui/BottomNav';

export default function MyGroups() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

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

  const { data: memberships = [], isLoading: loadingMemberships, refetch: refetchMemberships } = useQuery({
    queryKey: ['memberships', user?.email],
    queryFn: () => base44.entities.ChamaMember.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const chamaIds = memberships.map(m => m.chama_id);

  const { data: chamas = [], isLoading: loadingChamas } = useQuery({
    queryKey: ['chamas', chamaIds],
    queryFn: async () => {
      if (chamaIds.length === 0) return [];
      const allChamas = await base44.entities.Chama.list();
      return allChamas.filter(c => chamaIds.includes(c.id));
    },
    enabled: chamaIds.length > 0,
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-requests', user?.email],
    queryFn: () => base44.entities.JoinRequest.filter({ requester_email: user?.email, status: 'pending' }),
    enabled: !!user?.email,
  });

  const filteredChamas = chamas.filter(chama => 
    chama.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = loadingMemberships || loadingChamas;

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) return;
    
    setJoining(true);
    setJoinError('');
    
    try {
      // Find chama with this join code
      const allChamas = await base44.entities.Chama.list();
      const targetChama = allChamas.find(c => c.join_code?.toUpperCase() === joinCode.toUpperCase().trim());
      
      if (!targetChama) {
        setJoinError('Invalid code. Please check and try again.');
        setJoining(false);
        return;
      }

      // Check if already a member
      const existingMembership = memberships.find(m => m.chama_id === targetChama.id);
      if (existingMembership) {
        setJoinError('You are already a member of this group.');
        setJoining(false);
        return;
      }

      // Check if already requested
      const existingRequest = await base44.entities.JoinRequest.filter({
        chama_id: targetChama.id,
        requester_email: user.email,
        status: 'pending'
      });
      
      if (existingRequest.length > 0) {
        setJoinError('You already have a pending request for this group.');
        setJoining(false);
        return;
      }

      // Create join request
      await base44.entities.JoinRequest.create({
        chama_id: targetChama.id,
        requester_email: user.email,
        requester_name: user.full_name,
        join_code: joinCode.toUpperCase().trim(),
        status: 'pending',
        is_direct_invite: false
      });

      setJoinCode('');
      setJoinError('');
      alert(`Request sent to join ${targetChama.name}. Waiting for approval.`);
      refetchMemberships();
    } catch (error) {
      setJoinError('Something went wrong. Please try again.');
    }
    
    setJoining(false);
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#1a2332' }}>
      {/* Header */}
      <header className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">My Groups</h1>
          <div className="flex items-center gap-2">
            <Link 
              to={createPageUrl('CreateChama')}
              className="w-10 h-10 rounded-xl flex items-center justify-center" 
              style={{ backgroundColor: '#243447' }}
            >
              <Plus className="w-5 h-5 text-cyan-400" />
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4">
        <Tabs defaultValue="my-groups" className="w-full">
          <TabsList className="w-full rounded-xl p-1 mb-4" style={{ backgroundColor: '#243447' }}>
            <TabsTrigger 
              value="my-groups" 
              className="flex-1 rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500"
            >
              My Groups
            </TabsTrigger>
            <TabsTrigger 
              value="join" 
              className="flex-1 rounded-lg text-gray-400 data-[state=active]:text-white data-[state=active]:bg-cyan-500"
            >
              Join Group
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups" className="mt-0 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-0 text-white placeholder:text-gray-500"
                style={{ backgroundColor: '#243447' }}
              />
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#243447' }}>
                <p className="text-amber-400 text-sm font-medium mb-2">Pending Requests</p>
                <p className="text-gray-400 text-xs">
                  You have {pendingRequests.length} pending join request(s)
                </p>
              </div>
            )}

            {/* Groups List */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 rounded-2xl" style={{ backgroundColor: '#243447' }} />
                ))}
              </div>
            ) : filteredChamas.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#243447' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#2a3f55' }}>
                  <Users className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  {searchQuery ? 'No groups found' : 'No Chamas Yet'}
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  {searchQuery ? 'Try a different search term' : 'Create or join an investment group'}
                </p>
                <Link 
                  to={createPageUrl('CreateChama')}
                  className="inline-flex items-center gap-2 bg-cyan-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                  <Plus className="w-5 h-5" /> Create New Chama
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChamas.map((chama) => {
                  const membership = memberships.find(m => m.chama_id === chama.id);
                  const isLeader = ['admin', 'chairperson'].includes(membership?.role);
                  
                  return (
                    <Link
                      key={chama.id}
                      to={createPageUrl(`ChamaDetail?id=${chama.id}`)}
                      className="block rounded-2xl p-4 transition-all duration-300"
                      style={{ backgroundColor: '#243447' }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2a3f55' }}>
                          {chama.image_url ? (
                            <img src={chama.image_url} alt={chama.name} className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <span className="text-cyan-400 font-bold text-xl">
                              {chama.name?.charAt(0)?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{chama.name}</h3>
                            {isLeader && (
                              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">Leader</span>
                            )}
                          </div>
                          <p className="text-cyan-400 text-xs">
                            {membership?.role?.charAt(0).toUpperCase() + membership?.role?.slice(1)} | {chama.member_count || 1} members
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            KES {(membership?.total_contributions || 0).toLocaleString()} contributed
                          </p>
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="join" className="mt-0 space-y-6">
            {/* Join with Code */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                  <Hash className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Join with Code</h3>
                  <p className="text-gray-400 text-xs">Enter the group's invite code</p>
                </div>
              </div>
              
              <Input
                placeholder="Enter code (e.g., ABC123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="h-14 rounded-xl border-0 text-white text-center text-lg font-mono tracking-wider mb-3"
                style={{ backgroundColor: '#2a3f55' }}
                maxLength={8}
              />
              
              {joinError && (
                <p className="text-red-400 text-sm mb-3">{joinError}</p>
              )}
              
              <Button
                onClick={handleJoinWithCode}
                disabled={!joinCode.trim() || joining}
                className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600"
              >
                {joining ? 'Sending Request...' : 'Request to Join'}
              </Button>
            </div>

            {/* Scan QR Code */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#243447' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                  <QrCode className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Scan QR Code</h3>
                  <p className="text-gray-400 text-xs">Scan a group's QR code to join</p>
                </div>
              </div>
              
              <Link
                to={createPageUrl('ScanQR')}
                className="w-full h-12 rounded-xl flex items-center justify-center font-medium text-white transition-colors"
                style={{ backgroundColor: '#2a3f55' }}
              >
                <QrCode className="w-5 h-5 mr-2" />
                Open Scanner
              </Link>
            </div>

            {/* Info */}
            <div className="rounded-xl p-4 border border-dashed" style={{ borderColor: '#2a3f55' }}>
              <p className="text-gray-400 text-sm text-center">
                💡 Ask the group leader for the invite code or QR code. Your request will be reviewed before approval.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav currentPage="MyGroups" />
    </div>
  );
}