import React from 'react';

export default function Legal() {
    return (
        <div className="min-h-screen p-4" style={{ background: '#0b1720' }}>
            <header className="flex items-center gap-3 mb-4">
                <a href="/settings" className="p-2 rounded-xl" style={{ backgroundColor: '#243447' }}>
                    <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </a>
                <h2 className="text-2xl font-bold text-white">Terms & Privacy</h2>
            </header>

            <div className="prose max-w-none text-gray-300">
                <h3>Privacy</h3>
                <p>We respect your privacy. This demo stores minimal profile data locally or in your configured authentication provider.</p>

                <h3>Terms</h3>
                <p>ChamaPro is provided as-is for demonstration purposes. For production use, integrate payment providers and secure backend services.</p>
            </div>
        </div>
    );
}
