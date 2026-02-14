import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Camera, Upload, Check, MessageSquare } from 'lucide-react';
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

export default function ManualPayment() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const chamaId = urlParams.get('chamaId');
  
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    payment_type: 'contribution',
    amount: '',
    mpesa_code: '',
    mpesa_message: '',
    screenshot_url: '',
  });
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const { data: chama } = useQuery({
    queryKey: ['chama', chamaId],
    queryFn: async () => {
      const chamas = await base44.entities.Chama.filter({ id: chamaId });
      return chamas[0];
    },
    enabled: !!chamaId,
  });

  const submitPaymentMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.PaymentApproval.create({
        chama_id: chamaId,
        member_email: user.email,
        member_name: user.full_name,
        amount: parseFloat(formData.amount),
        payment_type: formData.payment_type,
        mpesa_code: formData.mpesa_code,
        mpesa_message: formData.mpesa_message,
        screenshot_url: formData.screenshot_url,
        status: 'pending',
      });
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, screenshot_url: file_url });
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#1a2332' }}>
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Submitted!</h2>
          <p className="text-gray-400 mb-8">
            Your payment is pending approval from the group leaders.
          </p>
          <Link
            to={createPageUrl(`ChamaDetail?id=${chamaId}`)}
            className="inline-block px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium"
          >
            Back to Group
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a2332' }}>
      {/* Header */}
      <header className="px-4 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link 
            to={createPageUrl(`Contribute?chamaId=${chamaId}`)}
            className="p-2 rounded-xl"
            style={{ backgroundColor: '#243447' }}
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
          </Link>
          <h1 className="text-xl font-bold text-white">Manual Payment</h1>
        </div>
        <p className="text-gray-400 text-sm ml-12">Submit payment for manual approval</p>
      </header>

      <main className="px-4 space-y-6">
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#243447' }}>
          <p className="text-amber-400 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Use this if M-Pesa STK push failed
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Submit your M-Pesa confirmation details for manual verification
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-400">Payment Type</Label>
            <Select 
              value={formData.payment_type}
              onValueChange={(value) => setFormData({ ...formData, payment_type: value })}
            >
              <SelectTrigger className="h-12 rounded-xl border-0 text-white" style={{ backgroundColor: '#243447' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                <SelectItem value="contribution" className="text-white">Contribution</SelectItem>
                <SelectItem value="loan_repayment" className="text-white">Loan Repayment</SelectItem>
                <SelectItem value="fine" className="text-white">Fine Payment</SelectItem>
                <SelectItem value="registration" className="text-white">Registration Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400">Amount (KES) *</Label>
            <Input
              type="number"
              placeholder="Enter amount paid"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="h-14 rounded-xl border-0 text-white text-lg"
              style={{ backgroundColor: '#243447' }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400">M-Pesa Code *</Label>
            <Input
              placeholder="e.g., QK7HGTY890"
              value={formData.mpesa_code}
              onChange={(e) => setFormData({ ...formData, mpesa_code: e.target.value.toUpperCase() })}
              className="h-12 rounded-xl border-0 text-white font-mono tracking-wider"
              style={{ backgroundColor: '#243447' }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400">M-Pesa Message (Optional)</Label>
            <Textarea
              placeholder="Paste the full M-Pesa confirmation message..."
              value={formData.mpesa_message}
              onChange={(e) => setFormData({ ...formData, mpesa_message: e.target.value })}
              className="rounded-xl border-0 text-white h-24 resize-none"
              style={{ backgroundColor: '#243447' }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400">Screenshot (Optional)</Label>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="rounded-xl p-6 border-2 border-dashed flex flex-col items-center justify-center" 
                   style={{ backgroundColor: '#243447', borderColor: formData.screenshot_url ? '#06b6d4' : '#2a3f55' }}>
                {uploading ? (
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : formData.screenshot_url ? (
                  <img src={formData.screenshot_url} alt="Screenshot" className="max-h-32 rounded-lg" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-500 mb-2" />
                    <p className="text-gray-400 text-sm">Tap to upload screenshot</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        <Button
          onClick={() => submitPaymentMutation.mutate()}
          disabled={!formData.amount || !formData.mpesa_code || submitPaymentMutation.isPending}
          className="w-full h-14 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-lg"
        >
          {submitPaymentMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
        </Button>

        <p className="text-gray-500 text-xs text-center pb-8">
          Your payment will be reviewed by group leaders before being confirmed.
        </p>
      </main>
    </div>
  );
}