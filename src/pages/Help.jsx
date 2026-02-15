import React from 'react';

export default function Help() {
    return (
        <div className="min-h-screen p-4" style={{ background: '#0b1720' }}>
            <header className="flex items-center gap-3 mb-4">
                <a href="/settings" className="p-2 rounded-xl" style={{ backgroundColor: '#243447' }}>
                    <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </a>
                <h2 className="text-2xl font-bold text-white">Help Center</h2>
            </header>

            <div className="max-w-2xl space-y-4 text-gray-300">
                <section>
                    <h3 className="font-semibold text-white">Getting started</h3>
                    <p className="text-sm">Use the Create button to create or join a Chama group. Use the Contribute flow to record contributions.</p>
                </section>

                <section>
                    <h3 className="font-semibold text-white">Payments</h3>
                    <p className="text-sm">Payment methods are managed in Settings → Payment Methods. Link the payment method you want to use for collections.</p>
                </section>

                <section>
                    <h3 className="font-semibold text-white">Security</h3>
                    <p className="text-sm">You can set a local PIN in Settings → Security. For biometric login you need the native mobile app.</p>
                </section>
            </div>
        </div>
    );
}
