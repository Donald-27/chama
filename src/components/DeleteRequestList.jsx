import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44, serverApi } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DeleteRequestList({ chamaId, currentUserEmail, groupSettings = {} }) {
    const queryClient = useQueryClient();

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['delete-requests', chamaId],
        queryFn: async () => {
            try {
                // Prefer serverApi (Edge Function) if available
                if (typeof serverApi !== 'undefined' && serverApi.getDeleteRequests) {
                    const res = await serverApi.getDeleteRequests(chamaId);
                    if (res && res.ok) return res.data || res.data?.data || [];
                }
            } catch (e) {
                console.warn('serverApi.getDeleteRequests failed', e);
            }

            // Fallback to base44 entities (dev/mock)
            try {
                if (base44 && base44.entities && base44.entities.DeleteRequest) {
                    return await base44.entities.DeleteRequest.filter({ chama_id: chamaId });
                }
            } catch (e) {
                console.warn('DeleteRequest fetch fallback', e);
            }

            return [];
        },
        enabled: !!chamaId,
    });

    const voteMutation = useMutation({
        mutationFn: async ({ id, approve }) => {
            const res = await serverApi.voteDeleteRequest({ delete_request_id: id, voter_email: currentUserEmail, approve });
            if (!res.ok) throw new Error(res.data?.error || 'Vote failed');
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['delete-requests', chamaId]);
            toast.success('Vote recorded');
        },
        onError: (err) => {
            toast.error(err.message || 'Vote error');
        }
    });

    if (isLoading) return <p className="text-gray-400 text-sm">Loading requests...</p>;
    if (!requests || requests.length === 0) return <p className="text-gray-400 text-sm">No active delete requests</p>;

    return (
        <div className="space-y-3">
            {requests.map((r) => {
                const myVote = (r.votes || []).find(v => v.voter_email === currentUserEmail);
                const approvals = (r.votes || []).filter(v => v.approve).length;
                const required = groupSettings.delete_approval_required || Math.ceil((groupSettings.members_count || 1) * ((groupSettings.delete_approval_threshold_percent || 66) / 100));
                const isArchived = r.status === 'archived' || (r.approvals_count && r.approvals_count >= required);

                return (
                    <div key={r.id} className="p-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{r.requester_email} {groupSettings.reveal_votes ? `• ${r.requester_email}` : ''}</p>
                                <p className="text-gray-400 text-sm mt-1">{r.reason}</p>
                                <p className="text-xs text-gray-500 mt-2">Approvals: {approvals} / {required}</p>
                            </div>
                            <div className="ml-3 flex items-center gap-2">
                                {!isArchived && (
                                    <>
                                        <Button size="sm" onClick={() => voteMutation.mutate({ id: r.id, approve: true })} disabled={!!myVote} className="bg-green-500 hover:bg-green-600">Approve</Button>
                                        <Button size="sm" variant="outline" onClick={() => voteMutation.mutate({ id: r.id, approve: false })} disabled={!!myVote}>Reject</Button>
                                    </>
                                )}
                                {isArchived && (
                                    <span className="text-xs text-cyan-400">Archived</span>
                                )}
                            </div>
                        </div>
                        {groupSettings.reveal_votes && r.votes && r.votes.length > 0 && (
                            <div className="mt-3 text-xs text-gray-400">
                                Votes: {r.votes.map(v => `${v.voter_email}:${v.approve ? 'Y' : 'N'}`).join(', ')}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
