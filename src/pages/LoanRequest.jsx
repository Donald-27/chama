import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, HandCoins, Check, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function LoanRequest() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedChamaId = urlParams.get('chamaId');
  
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    chama_id: preselectedChamaId || '',
    loan_type: 'general',
    principal_amount: '',
    duration_months: '3',
    reason: '',
  });

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

  const { data: memberships = [] } = useQuery({
    queryKey: ['memberships', user?.email],
    queryFn: () => base44.entities.ChamaMember.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const chamaIds = memberships.map(m => m.chama_id);

  const { data: chamas = [] } = useQuery({
    queryKey: ['chamas', chamaIds],
    queryFn: async () => {
      if (chamaIds.length === 0) return [];
      const allChamas = await base44.entities.Chama.list();
      return allChamas.filter(c => chamaIds.includes(c.id));
    },
    enabled: chamaIds.length > 0,
  });

  const selectedChama = chamas.find(c => c.id === formData.chama_id);
  const membership = memberships.find(m => m.chama_id === formData.chama_id);

  const principal = parseFloat(formData.principal_amount) || 0;
  const interestRate = 10;
  const duration = parseInt(formData.duration_months) || 3;
  const interest = (principal * interestRate * duration) / (12 * 100);
  const totalAmount = principal + interest;
  const monthlyRepayment = totalAmount / duration;
  const maxLoan = (membership?.total_contributions || 0) * 3;

  const createLoanMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Loan.create({
        chama_id: formData.chama_id,
        borrower_email: user.email,
        borrower_name: user.full_name,
        loan_type: formData.loan_type,
        principal_amount: principal,
        interest_rate: interestRate,
        total_amount: totalAmount,
        amount_paid: 0,
        outstanding_balance: totalAmount,
        duration_months: duration,
        monthly_repayment: monthlyRepayment,
        status: 'pending',
        application_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      setStep(3);
    },
  });

  const loanTypes = [
    { value: 'emergency', label: 'Emergency Loan' },
    { value: 'business', label: 'Business Loan' },
    { value: 'school_fees', label: 'School Fees' },
    { value: 'medical', label: 'Medical Expenses' },
    { value: 'general', label: 'General Purpose' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a2332' }}>
      {/* Header */}
      <header className="px-4 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to={createPageUrl('Home')}
            className="p-2 rounded-xl"
            style={{ backgroundColor: '#243447' }}
          >
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <h1 className="text-xl font-bold text-white">Request Loan</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#243447' }}>
            <HandCoins className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Quick access to funds</p>
            <p className="text-lg font-semibold text-white">Low Interest Rates</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-400">Select Group</Label>
              <Select 
                value={formData.chama_id} 
                onValueChange={(value) => setFormData({ ...formData, chama_id: value })}
              >
                <SelectTrigger className="h-14 rounded-xl border-0 text-white" style={{ backgroundColor: '#243447' }}>
                  <SelectValue placeholder="Choose a chama" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                  {chamas.map((chama) => (
                    <SelectItem key={chama.id} value={chama.id} className="text-white">
                      {chama.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.chama_id && membership && (
              <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: '#243447' }}>
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-cyan-400 font-medium">Loan Eligibility</p>
                  <p className="text-sm text-gray-400">
                    Based on your contributions of KES {(membership.total_contributions || 0).toLocaleString()}, 
                    you can borrow up to <strong className="text-white">KES {maxLoan.toLocaleString()}</strong>
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-400">Loan Type</Label>
              <Select 
                value={formData.loan_type} 
                onValueChange={(value) => setFormData({ ...formData, loan_type: value })}
              >
                <SelectTrigger className="h-14 rounded-xl border-0 text-white" style={{ backgroundColor: '#243447' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                  {loanTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Loan Amount (KES)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={formData.principal_amount}
                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                className="h-14 rounded-xl border-0 text-lg text-white"
                style={{ backgroundColor: '#243447' }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Repayment Period</Label>
              <Select 
                value={formData.duration_months} 
                onValueChange={(value) => setFormData({ ...formData, duration_months: value })}
              >
                <SelectTrigger className="h-14 rounded-xl border-0 text-white" style={{ backgroundColor: '#243447' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#243447', border: '1px solid #2a3f55' }}>
                  <SelectItem value="1" className="text-white">1 Month</SelectItem>
                  <SelectItem value="3" className="text-white">3 Months</SelectItem>
                  <SelectItem value="6" className="text-white">6 Months</SelectItem>
                  <SelectItem value="12" className="text-white">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!formData.chama_id || !principal || principal <= 0}
              className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-lg font-semibold"
            >
              Review Loan
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#243447' }}>
              <div className="bg-amber-500 p-5 text-white">
                <p className="text-amber-100 text-sm mb-1">Loan Amount</p>
                <p className="text-3xl font-bold">KES {principal.toLocaleString()}</p>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: '#2a3f55' }}>
                  <span className="text-gray-400">Interest Rate</span>
                  <span className="font-semibold text-white">{interestRate}% flat</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: '#2a3f55' }}>
                  <span className="text-gray-400">Duration</span>
                  <span className="font-semibold text-white">{duration} months</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: '#2a3f55' }}>
                  <span className="text-gray-400">Total Interest</span>
                  <span className="font-semibold text-amber-400">KES {interest.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: '#2a3f55' }}>
                  <span className="text-gray-400">Total Repayment</span>
                  <span className="font-bold text-lg text-white">KES {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-3 rounded-xl" style={{ backgroundColor: '#2a3f55' }}>
                  <span className="text-white font-medium pl-3">Monthly Payment</span>
                  <span className="font-bold text-xl text-amber-400 pr-3">
                    KES {monthlyRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-14 rounded-xl border-gray-600 text-white hover:bg-gray-700"
              >
                Back
              </Button>
              <Button
                onClick={() => createLoanMutation.mutate()}
                disabled={createLoanMutation.isPending}
                className="flex-1 h-14 rounded-xl bg-amber-500 hover:bg-amber-600"
              >
                {createLoanMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
            <p className="text-gray-400 mb-8">
              Your loan request has been sent for review.
            </p>

            <div className="rounded-2xl p-5 mb-8 text-left" style={{ backgroundColor: '#243447' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Amount</span>
                <span className="font-semibold text-white">KES {principal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Duration</span>
                <span className="font-medium text-white">{duration} months</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                  Pending Approval
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link 
                to={createPageUrl('Home')}
                className="flex-1 h-12 rounded-xl flex items-center justify-center font-medium text-white"
                style={{ backgroundColor: '#243447' }}
              >
                Go Home
              </Link>
              <Link
                to={createPageUrl(`ChamaDetail?id=${formData.chama_id}`)}
                className="flex-1 h-12 rounded-xl bg-amber-500 flex items-center justify-center font-medium text-white hover:bg-amber-600"
              >
                View Group
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}