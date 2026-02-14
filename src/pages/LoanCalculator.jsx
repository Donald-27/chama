import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Calculator, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState(50000);
  const [interestRate, setInterestRate] = useState(10);
  const [duration, setDuration] = useState(6);

  const monthlyInterest = interestRate / 12 / 100;
  const totalPayments = duration;
  
  const monthlyPayment = principal * (monthlyInterest * Math.pow(1 + monthlyInterest, totalPayments)) / 
                         (Math.pow(1 + monthlyInterest, totalPayments) - 1);
  const totalAmount = monthlyPayment * totalPayments;
  const totalInterest = totalAmount - principal;

  const flatInterest = (principal * interestRate * duration) / (12 * 100);
  const flatTotal = principal + flatInterest;
  const flatMonthly = flatTotal / duration;

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
            <ArrowLeft className="w-5 h-5 text-purple-400" />
          </Link>
          <h1 className="text-xl font-bold text-white">Loan Calculator</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#243447' }}>
            <Calculator className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Plan your loan</p>
            <p className="text-lg font-semibold text-white">Know Before You Borrow</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* Input Section */}
        <div className="rounded-2xl p-5 space-y-6" style={{ backgroundColor: '#243447' }}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-400">Loan Amount</Label>
              <span className="font-bold text-cyan-400">KES {principal.toLocaleString()}</span>
            </div>
            <Slider
              value={[principal]}
              onValueChange={(value) => setPrincipal(value[0])}
              max={500000}
              min={5000}
              step={5000}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>KES 5,000</span>
              <span>KES 500,000</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-400">Interest Rate (Annual)</Label>
              <span className="font-bold text-cyan-400">{interestRate}%</span>
            </div>
            <Slider
              value={[interestRate]}
              onValueChange={(value) => setInterestRate(value[0])}
              max={30}
              min={5}
              step={0.5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5%</span>
              <span>30%</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-400">Repayment Period</Label>
              <span className="font-bold text-cyan-400">{duration} months</span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={(value) => setDuration(value[0])}
              max={24}
              min={1}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 month</span>
              <span>24 months</span>
            </div>
          </div>
        </div>

        {/* Flat Rate Calculation */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#243447' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: '#2a3f55', backgroundColor: '#2a3f55' }}>
            <h3 className="font-semibold text-amber-400">Flat Interest Rate</h3>
            <p className="text-xs text-gray-400">Common in chama loans</p>
          </div>
          
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">Principal</span>
              <span className="font-medium text-white">KES {principal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">Total Interest</span>
              <span className="font-medium text-amber-400">KES {flatInterest.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t" style={{ borderColor: '#2a3f55' }}>
              <span className="text-gray-400">Total Repayment</span>
              <span className="font-bold text-lg text-white">KES {flatTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3 rounded-xl mt-4" style={{ backgroundColor: '#2a3f55' }}>
              <span className="text-white font-medium pl-3">Monthly Payment</span>
              <span className="font-bold text-xl text-amber-400 pr-3">
                KES {flatMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Reducing Balance Calculation */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#243447' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: '#2a3f55', backgroundColor: '#2a3f55' }}>
            <h3 className="font-semibold text-green-400">Reducing Balance</h3>
            <p className="text-xs text-gray-400">Common in bank loans</p>
          </div>
          
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">Principal</span>
              <span className="font-medium text-white">KES {principal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">Total Interest</span>
              <span className="font-medium text-green-400">
                KES {totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-t" style={{ borderColor: '#2a3f55' }}>
              <span className="text-gray-400">Total Repayment</span>
              <span className="font-bold text-lg text-white">
                KES {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 rounded-xl mt-4" style={{ backgroundColor: '#2a3f55' }}>
              <span className="text-white font-medium pl-3">Monthly Payment</span>
              <span className="font-bold text-xl text-green-400 pr-3">
                KES {monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          to={createPageUrl('LoanRequest')}
          className="block w-full h-14 rounded-xl bg-purple-500 text-white font-medium flex items-center justify-center hover:bg-purple-600 transition-colors mb-8"
        >
          Apply for a Loan
        </Link>
      </main>
    </div>
  );
}