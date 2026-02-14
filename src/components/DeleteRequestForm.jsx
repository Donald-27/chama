import React, { useState } from 'react';
import { serverApi } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function DeleteRequestForm({ chamaId, currentUserEmail, onCreated, defaultOpen = false }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(defaultOpen);

    const submit = async () => {
        if (!reason.trim()) {
            toast.error('Please provide a reason');
            return;
        }
        setLoading(true);
        try {
            const idempotency_key = `dr-${chamaId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const res = await serverApi.createDeleteRequest({ chama_id: chamaId, requester_email: currentUserEmail, reason, idempotency_key });
            if (!res.ok) throw new Error(res.data?.error || 'Request failed');
            toast.success('Delete request submitted');
            setReason('');
            setOpen(false);
            onCreated && onCreated(res.data || res);
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {!open ? (
                <Button onClick={() => setOpen(true)} className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600">Request Archive</Button>
            ) : (
                <div className="space-y-3 p-3 rounded-xl" style={{ backgroundColor: '#243447' }}>
                    <div>
                        <Label className="text-gray-400 text-sm">Reason for archiving</Label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 h-24 w-full rounded-xl text-white p-3 bg-[#2a3f55] border-0" />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={submit} disabled={loading} className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600">{loading ? 'Submitting...' : 'Submit'}</Button>
                        <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 h-12 rounded-xl">Cancel</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
